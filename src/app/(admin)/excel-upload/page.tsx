"use client";

import { useState, useCallback } from "react";
import PageHeader from "@/components/PageHeader";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import type { UploadType, ParsedRow, UploadResult } from "@/types";
import { UPLOAD_TYPES } from "@/data/excelConfig";

export default function ExcelUploadPage() {
  const [selectedType, setSelectedType] = useState<UploadType>("theory");
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const currentType = UPLOAD_TYPES.find((t) => t.id === selectedType)!;

  // 엑셀 템플릿 다운로드
  const handleDownloadTemplate = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([currentType.templateColumns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "데이터");

    // 컬럼 너비 설정
    ws["!cols"] = currentType.templateColumns.map(() => ({ wch: 20 }));

    XLSX.writeFile(wb, `${currentType.label}_템플릿.xlsx`);
    toast.success("템플릿이 다운로드되었습니다");
  }, [currentType]);

  // 엑셀 파일 파싱
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileName(file.name);
      setUploadResult(null);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet);

        setParsedData(jsonData);
        toast.success(`${jsonData.length}개 행을 읽었습니다`);
      };
      reader.readAsBinaryString(file);

      // input 초기화 (같은 파일 재선택 허용)
      e.target.value = "";
    },
    []
  );

  // 업로드 실행 (목업)
  const handleUpload = useCallback(async () => {
    if (parsedData.length === 0) {
      toast.error("업로드할 데이터가 없습니다");
      return;
    }

    setIsUploading(true);

    // 목업: 실제로는 Supabase에 배치 인서트
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const result: UploadResult = {
      total: parsedData.length,
      success: parsedData.length - 1,
      failed: 1,
      errors: [{ row: 3, message: "필수 항목 누락 (챕터)" }],
    };

    setUploadResult(result);
    setIsUploading(false);

    if (result.failed === 0) {
      toast.success(`${result.success}개 데이터가 업로드되었습니다`);
    } else {
      toast(`${result.success}개 성공, ${result.failed}개 실패`, {
        icon: "⚠️",
      });
    }
  }, [parsedData]);

  // 초기화
  const handleReset = () => {
    setParsedData([]);
    setFileName("");
    setUploadResult(null);
  };

  return (
    <div>
      <PageHeader
        title="엑셀 대량 업로드"
        description="엑셀 파일로 데이터를 일괄 등록합니다"
      />

      {/* 업로드 타입 선택 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {UPLOAD_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => {
              setSelectedType(type.id);
              handleReset();
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedType === type.id
                ? "border-primary bg-indigo-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
            }`}
          >
            <p className={`text-sm font-semibold ${selectedType === type.id ? "text-primary" : "text-gray-900"}`}>
              {type.label}
            </p>
            <p className="text-xs text-gray-500 mt-1">{type.description}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 업로드 영역 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* 템플릿 다운로드 */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-gray-900">
                1. 템플릿 다운로드
              </h3>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Download size={16} />
                {currentType.label} 템플릿
              </button>
            </div>

            {/* 파일 업로드 */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                2. 엑셀 파일 선택
              </h3>
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
                <FileSpreadsheet size={40} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  {fileName || "클릭하여 엑셀 파일 선택 (.xlsx, .xls)"}
                </p>
                {fileName && (
                  <p className="text-xs text-primary mt-1">{parsedData.length}개 행</p>
                )}
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {/* 미리보기 */}
            {parsedData.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  3. 데이터 미리보기 (상위 5개)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-gray-500 font-medium">#</th>
                        {Object.keys(parsedData[0]).map((key) => (
                          <th key={key} className="px-3 py-2 text-left text-gray-500 font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {parsedData.slice(0, 5).map((row, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-3 py-2 text-gray-700 max-w-[200px] truncate">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {parsedData.length > 5 && (
                  <p className="text-xs text-gray-400 mt-2">
                    ... 외 {parsedData.length - 5}개 행
                  </p>
                )}
              </div>
            )}

            {/* 업로드 버튼 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleUpload}
                disabled={parsedData.length === 0 || isUploading}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {isUploading ? "업로드 중..." : `${parsedData.length}개 데이터 업로드`}
              </button>
              {parsedData.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 결과 / 안내 */}
        <div className="space-y-4">
          {/* 업로드 결과 */}
          {uploadResult && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">업로드 결과</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-sm text-gray-700">성공: {uploadResult.success}개</span>
                </div>
                {uploadResult.failed > 0 && (
                  <div className="flex items-center gap-2">
                    <XCircle size={18} className="text-red-500" />
                    <span className="text-sm text-gray-700">실패: {uploadResult.failed}개</span>
                  </div>
                )}
              </div>

              {/* 에러 상세 */}
              {uploadResult.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs font-medium text-red-700 mb-2">오류 상세</p>
                  {uploadResult.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600">
                      행 {err.row}: {err.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 사용 안내 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">사용 안내</h3>
            <div className="space-y-3 text-xs text-gray-600">
              <div className="flex gap-2">
                <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                <p>템플릿의 열 순서와 이름을 변경하지 마세요</p>
              </div>
              <div className="flex gap-2">
                <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                <p>첫 번째 행은 헤더로 사용됩니다</p>
              </div>
              <div className="flex gap-2">
                <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                <p>지원 형식: .xlsx, .xls, .csv</p>
              </div>
              <div className="flex gap-2">
                <AlertTriangle size={14} className="text-yellow-500 shrink-0 mt-0.5" />
                <p>한 번에 최대 500개 행까지 업로드 가능합니다</p>
              </div>
            </div>
          </div>

          {/* 컬럼 안내 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {currentType.label} 컬럼 안내
            </h3>
            <div className="space-y-2">
              {currentType.templateColumns.map((col, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded text-xs flex items-center justify-center text-gray-500 font-mono shrink-0 mt-0.5">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <div>
                    <span className="text-xs font-medium text-gray-800">{col}</span>
                    {currentType.columnDescriptions?.[i] && (
                      <p className="text-xs text-gray-400 mt-0.5">{currentType.columnDescriptions[i]}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
