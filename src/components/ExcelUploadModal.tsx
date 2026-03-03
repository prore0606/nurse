"use client";

import { useState, useCallback } from "react";
import {
  FileSpreadsheet, Upload, Download,
  CheckCircle2, XCircle, AlertTriangle, Loader2, X,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import type { SubjectType, ParsedRow, UploadResult } from "../types";
import { UPLOAD_TYPES } from "../data/excelConfig";

interface ExcelUploadModalProps {
  visible: boolean;
  onClose: () => void;
  subjectType: SubjectType;
  subjectName: string;
}

export default function ExcelUploadModal({ visible, onClose, subjectType, subjectName }: ExcelUploadModalProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const currentType = UPLOAD_TYPES.find((t) => t.id === subjectType)!;

  const handleReset = () => { setParsedData([]); setFileName(""); setUploadResult(null); };
  const handleClose = () => { handleReset(); onClose(); };

  const handleDownloadTemplate = useCallback(() => {
    const ws = XLSX.utils.aoa_to_sheet([currentType.templateColumns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "데이터");
    ws["!cols"] = currentType.templateColumns.map(() => ({ wch: 20 }));
    XLSX.writeFile(wb, `${subjectName}_${currentType.label}_템플릿.xlsx`);
    toast.success("템플릿이 다운로드되었습니다");
  }, [currentType, subjectName]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadResult(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet);
      setParsedData(jsonData);
      toast.success(`${jsonData.length}개 행을 읽었습니다`);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  }, []);

  const handleUpload = useCallback(async () => {
    if (parsedData.length === 0) { toast.error("업로드할 데이터가 없습니다"); return; }
    setIsUploading(true);
    // 목업: 실제로는 Supabase에 배치 인서트
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const result: UploadResult = {
      total: parsedData.length,
      success: parsedData.length,
      failed: 0,
      errors: [],
    };
    setUploadResult(result);
    setIsUploading(false);
    toast.success(`${result.success}개 데이터가 업로드되었습니다`);
  }, [parsedData]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">엑셀 업로드</h2>
            <p className="text-sm text-gray-500">{subjectName} &middot; {currentType.label}</p>
          </div>
          <button onClick={handleClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* 1. 템플릿 다운로드 */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">1. 템플릿 다운로드</h3>
              <p className="text-xs text-gray-500 mt-0.5">컬럼 형식에 맞춰 데이터를 작성하세요</p>
            </div>
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors">
              <Download size={16} />
              템플릿
            </button>
          </div>

          {/* 컬럼 안내 */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-700 mb-2">컬럼 안내</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {currentType.templateColumns.map((col, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-4 h-4 bg-white rounded text-[10px] flex items-center justify-center text-gray-500 font-mono shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="text-xs text-gray-600 truncate">{col}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. 파일 선택 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">2. 파일 선택</h3>
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors">
              <FileSpreadsheet size={28} className="text-gray-300 mb-1" />
              <p className="text-sm text-gray-500">{fileName || "클릭하여 엑셀 파일 선택 (.xlsx, .xls)"}</p>
              {fileName && <p className="text-xs text-primary mt-0.5">{parsedData.length}개 행</p>}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} className="hidden" />
            </label>
          </div>

          {/* 3. 미리보기 */}
          {parsedData.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">3. 미리보기 (상위 3개)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-2 py-1.5 text-left text-gray-500 font-medium">#</th>
                      {Object.keys(parsedData[0]).map((key) => (
                        <th key={key} className="px-2 py-1.5 text-left text-gray-500 font-medium">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedData.slice(0, 3).map((row, i) => (
                      <tr key={i}>
                        <td className="px-2 py-1.5 text-gray-400">{i + 1}</td>
                        {Object.values(row).map((val, j) => (
                          <td key={j} className="px-2 py-1.5 text-gray-700 max-w-[120px] truncate">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedData.length > 3 && <p className="text-xs text-gray-400 mt-1">... 외 {parsedData.length - 3}개 행</p>}
            </div>
          )}

          {/* 업로드 결과 */}
          {uploadResult && (
            <div className="p-3 rounded-lg border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-green-500" />
                  <span className="text-sm text-gray-700">성공 {uploadResult.success}개</span>
                </div>
                {uploadResult.failed > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle size={16} className="text-red-500" />
                    <span className="text-sm text-gray-700">실패 {uploadResult.failed}개</span>
                  </div>
                )}
              </div>
              {uploadResult.errors.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600">
                  {uploadResult.errors.map((err, i) => <p key={i}>행 {err.row}: {err.message}</p>)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <AlertTriangle size={12} />
            <span>템플릿 열 순서를 변경하지 마세요</span>
          </div>
          <div className="flex items-center gap-3">
            {parsedData.length > 0 && (
              <button onClick={handleReset} className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                초기화
              </button>
            )}
            <button
              onClick={handleUpload}
              disabled={parsedData.length === 0 || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              {isUploading ? "업로드 중..." : `${parsedData.length}개 업로드`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
