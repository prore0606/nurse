"use client";

import { useState, useCallback } from "react";
import {
  FileSpreadsheet, Upload, Download,
  CheckCircle2, XCircle, AlertTriangle, Loader2, X,
} from "lucide-react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import type { SubjectType, ParsedRow, UploadResult, Difficulty } from "../types";
import { UPLOAD_TYPES } from "../data/excelConfig";
import {
  createChapter,
  createTopic,
} from "../lib/theoryService";
import { bulkInsertProblems } from "../lib/problemService";
import {
  createSection as createVideoSection,
  createLecture,
} from "../lib/videoService";

interface ExcelUploadModalProps {
  visible: boolean;
  onClose: () => void;
  subjectType: SubjectType;
  /** 업로드 대상 과목 ID — 없으면 업로드 불가 */
  subjectId?: string;
  subjectName: string;
  /** 업로드 성공 후 콜백 (목록 새로고침용) */
  onUploaded?: () => void;
}

const CHOICE_KEYS = ["a", "b", "c", "d", "e"] as const;

// ── 문자열 추출 유틸 (XLSX는 string|number|boolean 반환) ──
function asString(v: unknown): string {
  if (v == null) return "";
  return String(v).trim();
}

/** 이론 엑셀 → theory_chapters + theory_topics 로 인서트 */
async function uploadTheoryRows(subjectId: string, rows: ParsedRow[]): Promise<UploadResult> {
  const result: UploadResult = { total: rows.length, success: 0, failed: 0, errors: [] };
  const chapterMap = new Map<string, string>(); // 챕터명 → chapterId

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const chapterTitle = asString(row["챕터"]);
      const title = asString(row["제목"]);
      if (!chapterTitle || !title) throw new Error("챕터·제목 필수");

      let chapterId = chapterMap.get(chapterTitle);
      if (!chapterId) {
        chapterId = crypto.randomUUID();
        await createChapter(subjectId, chapterId, chapterMap.size + 1, chapterTitle, chapterMap.size);
        chapterMap.set(chapterTitle, chapterId);
      }

      const imageStr = asString(row["이미지URL(여러개는;구분)"] ?? row["이미지URL"]);
      const contentUrls = imageStr ? imageStr.split(";").map((s) => s.trim()).filter(Boolean) : [];
      const body = asString(row["본문내용"]);
      const rawType = asString(row["콘텐츠유형(text/image/mixed)"] ?? row["콘텐츠유형"]).toLowerCase();
      const contentType: "file" | "text" | "mixed" =
        body && contentUrls.length > 0 ? "mixed"
        : contentUrls.length > 0 ? "file"
        : rawType === "image" || rawType === "file" ? "file"
        : rawType === "mixed" ? "mixed"
        : "text";

      await createTopic(chapterId, {
        id: crypto.randomUUID(),
        title,
        contentType,
        contentUrls,
        body,
        hasNote: false,
        orderNum: result.success,
      });
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push({ row: i + 1, message: err instanceof Error ? err.message : String(err) });
    }
  }
  return result;
}

/** 문제 엑셀 → problem_sections + problem_questions 로 인서트 (problemService.bulkInsertProblems 재사용) */
async function uploadProblemRows(subjectId: string, rows: ParsedRow[]): Promise<UploadResult> {
  const parsed: Parameters<typeof bulkInsertProblems>[1] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const sectionTitle = asString(row["챕터"]);
      const questionText = asString(row["문제내용"]);
      if (!sectionTitle || !questionText) throw new Error("챕터·문제내용 필수");

      const choices = CHOICE_KEYS
        .map((id, idx) => ({
          id: id as string,
          text: asString(row[`선택지${idx + 1}`]),
          image: asString(row[`선택지${idx + 1}_이미지URL`]) || undefined,
        }))
        .filter((c) => c.text || c.image);

      if (choices.length < 2) throw new Error("선택지 2개 이상 필요");

      const ansNum = Number(asString(row["정답번호"]));
      const correctAnswer = CHOICE_KEYS[Math.max(0, Math.min(ansNum - 1, choices.length - 1))];

      const diffRaw = asString(row["난이도(easy/medium/hard)"] ?? row["난이도"]).toLowerCase();
      const difficulty: Difficulty = (["easy", "medium", "hard"].includes(diffRaw) ? diffRaw : "medium") as Difficulty;

      parsed.push({
        sectionTitle,
        questionText,
        questionImage: asString(row["문제이미지URL"]) || undefined,
        choices,
        correctAnswer,
        explanation: asString(row["해설"]) || undefined,
        explanationImage: asString(row["해설이미지URL"]) || undefined,
        difficulty,
      });
    } catch (err) {
      errors.push({ row: i + 1, message: err instanceof Error ? err.message : String(err) });
    }
  }

  const insertResult = parsed.length > 0
    ? await bulkInsertProblems(subjectId, parsed)
    : { success: 0, failed: 0, errors: [] };

  return {
    total: rows.length,
    success: insertResult.success,
    failed: insertResult.failed + errors.length,
    errors: [...errors, ...insertResult.errors],
  };
}

/** 영상 엑셀 → video_sections + video_lectures 로 인서트.
 *
 * 컬럼 누락 허용 규칙:
 * - 비메오URL: 필수
 * - 강의제목 비어있으면 → 섹션명을 강의제목으로 사용 + 기본 섹션으로 그룹핑
 * - 섹션명·강의제목 둘 다 비어있으면 → 비메오 URL의 ID로 임시 제목
 */
async function uploadVideoRows(subjectId: string, rows: ParsedRow[]): Promise<UploadResult> {
  const result: UploadResult = { total: rows.length, success: 0, failed: 0, errors: [] };
  const sectionMap = new Map<string, string>();
  // 섹션별 강의 개수 (orderNum 계산용)
  const sectionLectureCount = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const rawSection = asString(row["섹션명"]);
      const rawTitle = asString(row["강의제목"]);
      const videoUrl = asString(row["비메오URL"]);
      if (!videoUrl) throw new Error("비메오URL 필수");

      // 강의제목이 비어있으면 → 섹션명을 강의제목으로, 섹션은 "기본 섹션"으로
      const title = rawTitle || rawSection || `강의 ${i + 1}`;
      const sectionTitle = rawTitle ? (rawSection || "기본 섹션") : "기본 섹션";

      let sectionId = sectionMap.get(sectionTitle);
      if (!sectionId) {
        sectionId = crypto.randomUUID();
        await createVideoSection(subjectId, sectionId, sectionTitle, sectionMap.size);
        sectionMap.set(sectionTitle, sectionId);
        sectionLectureCount.set(sectionId, 0);
      }

      const orderInSection = sectionLectureCount.get(sectionId) ?? 0;
      sectionLectureCount.set(sectionId, orderInSection + 1);

      await createLecture(
        sectionId,
        {
          id: crypto.randomUUID(),
          number: Number(asString(row["순서번호"])) || (result.success + 1),
          title,
          duration: asString(row["재생시간(MM:SS)"] ?? row["재생시간"]),
          videoUrl,
          thumbnailUrl: asString(row["썸네일URL"]),
          instructor: asString(row["강사"]),
          description: asString(row["설명"]),
        },
        orderInSection,
      );
      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push({ row: i + 1, message: err instanceof Error ? err.message : String(err) });
    }
  }
  return result;
}

export default function ExcelUploadModal({ visible, onClose, subjectType, subjectId, subjectName, onUploaded }: ExcelUploadModalProps) {
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
    if (!subjectId) { toast.error("업로드 대상 과목이 선택되지 않았습니다"); return; }
    setIsUploading(true);

    let result: UploadResult;
    try {
      if (subjectType === "theory") {
        result = await uploadTheoryRows(subjectId, parsedData);
      } else if (subjectType === "problems") {
        result = await uploadProblemRows(subjectId, parsedData);
      } else if (subjectType === "videos") {
        result = await uploadVideoRows(subjectId, parsedData);
      } else {
        result = {
          total: parsedData.length,
          success: 0,
          failed: parsedData.length,
          errors: [{ row: 1, message: "패키지 대량 업로드는 아직 지원되지 않습니다" }],
        };
      }
    } catch (err) {
      result = {
        total: parsedData.length,
        success: 0,
        failed: parsedData.length,
        errors: [{ row: 0, message: err instanceof Error ? err.message : String(err) }],
      };
    }

    setUploadResult(result);
    setIsUploading(false);

    if (result.failed === 0) {
      toast.success(`${result.success}개 데이터가 업로드되었습니다`);
      onUploaded?.();
    } else if (result.success > 0) {
      toast(`${result.success}개 성공, ${result.failed}개 실패`, { icon: "⚠️" });
      onUploaded?.();
    } else {
      toast.error(`업로드 실패 (${result.failed}개)`);
    }
  }, [parsedData, subjectId, subjectType, onUploaded]);

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
