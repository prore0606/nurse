"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ProblemSection as ProblemSectionType, ProblemQuestion, ProblemQuestionChoice, Difficulty } from "../../types";
import {
  fetchSectionsWithQuestions,
  createSection,
  updateSection,
  deleteSection,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  bulkInsertProblems,
} from "../../lib/problemService";
import { DIFFICULTY_OPTIONS } from "../../constants/subjectConfig";
import ConfirmModal from "../ConfirmModal";
import FormModal from "../FormModal";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Loader2, Upload, FileText, CirclePlus, ImagePlus, X,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── choice id 생성 유틸 ───
const CHOICE_IDS = "abcdefghijklmnopqrstuvwxyz";
function nextChoiceId(choices: ProblemQuestionChoice[]): string {
  for (const c of CHOICE_IDS) {
    if (!choices.find((ch) => ch.id === c)) return c;
  }
  return crypto.randomUUID().slice(0, 4);
}

// ─── 엑셀 파싱 유틸 ───
function parseExcelRows(text: string): {
  sectionTitle: string;
  questionText: string;
  choices: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
  difficulty?: Difficulty;
}[] {
  const lines = text.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split("\t");
    // 형식: 섹션 | 문제 | 선택지1 | 선택지2 | 선택지3 | 선택지4 | 정답(a~d) | 해설 | 난이도
    const sectionTitle = cols[0]?.trim() ?? "";
    const questionText = cols[1]?.trim() ?? "";
    const choiceTexts = [cols[2], cols[3], cols[4], cols[5]].filter((c) => c?.trim());
    const choices = choiceTexts.map((t, i) => ({ id: CHOICE_IDS[i], text: t?.trim() ?? "" }));
    const correctAnswer = cols[6]?.trim().toLowerCase() ?? "a";
    const explanation = cols[7]?.trim() ?? "";
    const diffRaw = cols[8]?.trim().toLowerCase() ?? "medium";
    const difficulty = (["easy", "medium", "hard"].includes(diffRaw) ? diffRaw : "medium") as Difficulty;

    return { sectionTitle, questionText, choices, correctAnswer, explanation, difficulty };
  });
}

// ─── 문제 편집 폼 ───
interface QuestionForm {
  number: number;
  text: string;
  textImage: string;
  choices: ProblemQuestionChoice[];
  correctAnswer: string;
  explanation: string;
  explanationImage: string;
  difficulty: Difficulty;
}

const emptyQuestionForm = (): QuestionForm => ({
  number: 1,
  text: "",
  textImage: "",
  choices: [
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ],
  correctAnswer: "a",
  explanation: "",
  explanationImage: "",
  difficulty: "medium",
});

// ─── 메인 컴포넌트 ───
interface ProblemSectionProps {
  subjectId: string;
  createTrigger?: number;
  onSectionsChange?: (sections: ProblemSectionType[]) => void;
}

export default function ProblemSectionComponent({ subjectId, createTrigger = 0, onSectionsChange }: ProblemSectionProps) {
  const [sections, setSections] = useState<ProblemSectionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(null);

  // 섹션 모달
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionData, setEditingSectionData] = useState<ProblemSectionType | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: "" });

  // 문제 모달
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<ProblemQuestion | null>(null);
  const [questionSectionId, setQuestionSectionId] = useState<string>("");
  const [questionForm, setQuestionForm] = useState<QuestionForm>(emptyQuestionForm());

  // 엑셀 대량 등록
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [excelText, setExcelText] = useState("");
  const [excelUploading, setExcelUploading] = useState(false);
  const excelFileRef = useRef<HTMLInputElement>(null);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<{ type: "section" | "question"; id: string; title: string } | null>(null);

  // ── 데이터 로드 ──
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchSectionsWithQuestions(subjectId);
      setSections(data);
      onSectionsChange?.(data);
      if (data.length > 0 && !expandedSectionId) {
        setExpandedSectionId(data[0].id);
      }
    } catch (err) {
      console.error("문제 데이터 로드 실패:", err);
      toast.error("문제 데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { if (subjectId) loadData(); }, [subjectId, loadData]);
  useEffect(() => { if (createTrigger > 0) openCreateSection(); }, [createTrigger]);

  // ══════════════════════════════════════
  // 섹션 CRUD
  // ══════════════════════════════════════
  const openCreateSection = () => {
    setEditingSectionData(null);
    setSectionForm({ title: "" });
    setShowSectionModal(true);
  };
  const openEditSection = (sec: ProblemSectionType) => {
    setEditingSectionData(sec);
    setSectionForm({ title: sec.title });
    setShowSectionModal(true);
  };
  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) { toast.error("섹션 제목을 입력하세요"); return; }
    try {
      if (editingSectionData) {
        await updateSection(editingSectionData.id, { title: sectionForm.title.trim() });
        toast.success("섹션이 수정되었습니다");
      } else {
        await createSection(subjectId, crypto.randomUUID(), sectionForm.title.trim(), sections.length);
        toast.success("섹션이 추가되었습니다");
      }
      setShowSectionModal(false);
      await loadData();
    } catch { toast.error("섹션 저장에 실패했습니다"); }
  };

  // ══════════════════════════════════════
  // 문제 CRUD
  // ══════════════════════════════════════
  const openCreateQuestion = (sectionId: string) => {
    setEditingQuestion(null);
    setQuestionSectionId(sectionId);
    const sec = sections.find((s) => s.id === sectionId);
    setQuestionForm({ ...emptyQuestionForm(), number: (sec?.questions.length ?? 0) + 1 });
    setShowQuestionModal(true);
  };
  const openEditQuestion = (sectionId: string, q: ProblemQuestion) => {
    setEditingQuestion(q);
    setQuestionSectionId(sectionId);
    setQuestionForm({
      number: q.number,
      text: q.text,
      textImage: q.textImage,
      choices: q.choices.map((c) => ({ ...c })),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      explanationImage: q.explanationImage,
      difficulty: q.difficulty,
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionForm.text.trim()) { toast.error("문제를 입력하세요"); return; }
    const validChoices = questionForm.choices.filter((c) => c.text.trim());
    if (validChoices.length < 2) { toast.error("선택지를 2개 이상 입력하세요"); return; }
    if (!questionForm.choices.find((c) => c.id === questionForm.correctAnswer)) {
      toast.error("정답을 선택하세요"); return;
    }
    try {
      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, {
          number: questionForm.number,
          text: questionForm.text.trim(),
          textImage: questionForm.textImage,
          choices: questionForm.choices.filter((c) => c.text.trim()),
          correctAnswer: questionForm.correctAnswer,
          explanation: questionForm.explanation,
          explanationImage: questionForm.explanationImage,
          difficulty: questionForm.difficulty,
        });
        toast.success("문제가 수정되었습니다");
      } else {
        const sec = sections.find((s) => s.id === questionSectionId);
        await createQuestion(questionSectionId, {
          id: crypto.randomUUID(),
          number: questionForm.number,
          text: questionForm.text.trim(),
          textImage: questionForm.textImage,
          choices: questionForm.choices.filter((c) => c.text.trim()),
          correctAnswer: questionForm.correctAnswer,
          explanation: questionForm.explanation,
          explanationImage: questionForm.explanationImage,
          difficulty: questionForm.difficulty,
          orderNum: sec?.questions.length ?? 0,
        });
        toast.success("문제가 추가되었습니다");
      }
      setShowQuestionModal(false);
      await loadData();
    } catch { toast.error("문제 저장에 실패했습니다"); }
  };

  // ── 선택지 관리 ──
  const updateChoice = (index: number, field: "text" | "image", value: string) => {
    setQuestionForm((f) => {
      const choices = [...f.choices];
      choices[index] = { ...choices[index], [field]: value };
      return { ...f, choices };
    });
  };
  const addChoice = () => {
    if (questionForm.choices.length < 6) {
      setQuestionForm((f) => ({
        ...f,
        choices: [...f.choices, { id: nextChoiceId(f.choices), text: "" }],
      }));
    }
  };
  const removeChoice = (index: number) => {
    setQuestionForm((f) => {
      const removed = f.choices[index];
      const choices = f.choices.filter((_, i) => i !== index);
      const correctAnswer = f.correctAnswer === removed.id ? (choices[0]?.id ?? "") : f.correctAnswer;
      return { ...f, choices, correctAnswer };
    });
  };

  // ══════════════════════════════════════
  // 엑셀 대량 등록
  // ══════════════════════════════════════
  const handleExcelFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setExcelText(text);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExcelUpload = async () => {
    const rows = parseExcelRows(excelText);
    if (rows.length === 0) { toast.error("유효한 데이터가 없습니다"); return; }
    try {
      setExcelUploading(true);
      const result = await bulkInsertProblems(subjectId, rows);
      toast.success(`${result.success}개 문제 등록 완료${result.failed > 0 ? ` (${result.failed}개 실패)` : ""}`);
      if (result.errors.length > 0) {
        console.error("대량 등록 오류:", result.errors);
      }
      setShowExcelUpload(false);
      setExcelText("");
      await loadData();
    } catch { toast.error("대량 등록에 실패했습니다"); }
    finally { setExcelUploading(false); }
  };

  // ══════════════════════════════════════
  // 삭제
  // ══════════════════════════════════════
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "section") { await deleteSection(deleteTarget.id); }
      else { await deleteQuestion(deleteTarget.id); }
      toast.success("삭제되었습니다");
      setDeleteTarget(null);
      await loadData();
    } catch { toast.error("삭제에 실패했습니다"); }
  };

  // ══════════════════════════════════════
  // 렌더링
  // ══════════════════════════════════════

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin mr-2" size={20} />문제 데이터를 불러오는 중...</div>;
  }

  const totalQuestions = sections.reduce((s, sec) => s + sec.questions.length, 0);

  return (
    <>
      {/* ── 상단 요약 + 버튼 ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {sections.length}개 섹션 · 문제 {totalQuestions}개
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowExcelUpload(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            <Upload size={14} /> 엑셀 대량등록
          </button>
          <button onClick={openCreateSection} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus size={14} /> 섹션 추가
          </button>
        </div>
      </div>

      {/* ── 섹션 목록 ── */}
      <div className="space-y-3">
        {sections.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 mb-4">등록된 문제가 없습니다</p>
            <div className="flex items-center justify-center gap-3">
              <button onClick={openCreateSection} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus size={16} /> 섹션 추가
              </button>
              <button onClick={() => setShowExcelUpload(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                <Upload size={16} /> 엑셀 대량등록
              </button>
            </div>
          </div>
        ) : (
          sections.map((section) => {
            const isExpanded = expandedSectionId === section.id;
            return (
              <div key={section.id} className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${isExpanded ? "border-primary/30 shadow-md shadow-primary/5" : "border-gray-200 shadow-sm"}`}>
                {/* ── 섹션 헤더 ── */}
                <div
                  className={`flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors ${isExpanded ? "border-b border-gray-100" : ""}`}
                  onClick={() => setExpandedSectionId(isExpanded ? null : section.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isExpanded ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                      {String(sections.indexOf(section) + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <div className="text-[15px] font-bold text-gray-900">{section.title}</div>
                      <div className="text-xs text-gray-400 mt-0.5">문제 {section.questions.length}개</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={(e) => { e.stopPropagation(); openEditSection(section); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="섹션 수정">
                      <Pencil size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "section", id: section.id, title: section.title }); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="섹션 삭제">
                      <Trash2 size={14} />
                    </button>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isExpanded ? "bg-primary/10" : "bg-gray-100"}`}>
                      {isExpanded ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </div>
                </div>

                {/* ── 문제 리스트 ── */}
                {isExpanded && (
                  <div className="bg-gray-50/50">
                    {section.questions.length === 0 ? (
                      <div className="text-center py-10 text-gray-400 text-sm">
                        문제가 없습니다. 아래에서 추가하세요.
                      </div>
                    ) : (
                      section.questions.map((q, qIdx) => {
                        const diffMap = { easy: { l: "쉬움", c: "bg-green-50 text-green-600" }, medium: { l: "보통", c: "bg-yellow-50 text-yellow-600" }, hard: { l: "어려움", c: "bg-red-50 text-red-600" } };
                        const diff = diffMap[q.difficulty];
                        return (
                          <div
                            key={q.id}
                            className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/80 ${
                              qIdx < section.questions.length - 1 ? "border-b border-gray-100" : ""
                            }`}
                            style={{ paddingLeft: 56 }}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                                {q.number}
                              </div>
                              <span className="text-sm text-gray-700 truncate flex-1">{q.text}</span>
                              <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${diff.c}`}>
                                {diff.l}
                              </span>
                              <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                                {q.choices.length}지선다
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              <button onClick={() => openEditQuestion(section.id, q)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="수정">
                                <Pencil size={13} />
                              </button>
                              <button onClick={() => setDeleteTarget({ type: "question", id: q.id, title: q.text.slice(0, 20) })}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="삭제">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}

                    {/* 하단 추가 버튼 */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      <button onClick={() => openCreateQuestion(section.id)}
                        className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                        <Plus size={14} /> 문제 추가
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* 섹션 모달 */}
      {/* ══════════════════════════════════════ */}
      <FormModal visible={showSectionModal} title={editingSectionData ? "섹션 수정" : "섹션 추가"} onClose={() => setShowSectionModal(false)} onSubmit={handleSaveSection} submitLabel={editingSectionData ? "수정" : "추가"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
            <input type="text" value={sectionForm.title} onChange={(e) => setSectionForm({ title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 01. 의학용어 기초" />
          </div>
        </div>
      </FormModal>

      {/* ══════════════════════════════════════ */}
      {/* 문제 등록/수정 모달 */}
      {/* ══════════════════════════════════════ */}
      <FormModal
        visible={showQuestionModal}
        title={editingQuestion ? "문제 수정" : "문제 추가"}
        onClose={() => setShowQuestionModal(false)}
        onSubmit={handleSaveQuestion}
        submitLabel={editingQuestion ? "수정" : "추가"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-[80px_1fr] gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">번호</label>
              <input type="number" value={questionForm.number} onChange={(e) => setQuestionForm((f) => ({ ...f, number: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
              <div className="flex gap-2 mt-1">
                {DIFFICULTY_OPTIONS.map(({ value, label, activeClass }) => (
                  <button key={value} type="button" onClick={() => setQuestionForm((f) => ({ ...f, difficulty: value }))}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${questionForm.difficulty === value ? activeClass : "bg-white text-gray-400 border-gray-200"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문제 <span className="text-red-500">*</span></label>
            <textarea value={questionForm.text} onChange={(e) => setQuestionForm((f) => ({ ...f, text: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={3} placeholder="문제를 입력하세요" />
          </div>

          {/* 선택지 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">선택지 <span className="text-red-500">*</span></label>
              <button type="button" onClick={addChoice} className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover">
                <CirclePlus size={14} /> 추가
              </button>
            </div>
            <div className="space-y-3">
              {questionForm.choices.map((choice, index) => (
                <div key={choice.id} className="flex items-start gap-2">
                  <button type="button" onClick={() => setQuestionForm((f) => ({ ...f, correctAnswer: choice.id }))}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 shrink-0 mt-1.5 transition-colors ${
                      questionForm.correctAnswer === choice.id ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-400"
                    }`}>
                    {choice.id.toUpperCase()}
                  </button>
                  <div className="flex-1">
                    <input type="text" value={choice.text} onChange={(e) => updateChoice(index, "text", e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder={`선택지 ${choice.id.toUpperCase()}`} />
                  </div>
                  {questionForm.choices.length > 2 && (
                    <button type="button" onClick={() => removeChoice(index)} className="p-1 text-gray-300 hover:text-red-500 mt-1.5">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">번호 클릭 = 정답 선택</p>
          </div>

          {/* 해설 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">해설</label>
            <textarea value={questionForm.explanation} onChange={(e) => setQuestionForm((f) => ({ ...f, explanation: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} placeholder="정답 해설" />
          </div>
        </div>
      </FormModal>

      {/* ══════════════════════════════════════ */}
      {/* 엑셀 대량 등록 모달 */}
      {/* ══════════════════════════════════════ */}
      {showExcelUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { if (!excelUploading) setShowExcelUpload(false); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">엑셀 대량 등록</h2>
                <p className="text-xs text-gray-400 mt-0.5">TSV(탭 구분) 또는 엑셀에서 복사한 데이터를 붙여넣으세요</p>
              </div>
              <button onClick={() => { if (!excelUploading) setShowExcelUpload(false); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* 본문 */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* 형식 안내 */}
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
                <p className="font-semibold mb-1">형식 안내 (탭으로 구분)</p>
                <code className="block text-xs bg-blue-100 rounded p-2 mt-1 overflow-x-auto whitespace-pre">
                  섹션{"\t"}문제{"\t"}선택지1{"\t"}선택지2{"\t"}선택지3{"\t"}선택지4{"\t"}정답(a~d){"\t"}해설{"\t"}난이도(easy/medium/hard)
                </code>
                <p className="text-xs mt-2 text-blue-600">첫 줄은 헤더로 무시됩니다. 엑셀에서 복사 후 붙여넣기하면 자동으로 탭 구분됩니다.</p>
              </div>

              {/* 파일 업로드 또는 텍스트 붙여넣기 */}
              <div className="flex items-center gap-3">
                <button onClick={() => excelFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  <Upload size={14} /> TSV/CSV 파일 불러오기
                </button>
                <input ref={excelFileRef} type="file" accept=".tsv,.csv,.txt" onChange={handleExcelFileSelect} className="hidden" />
                <span className="text-xs text-gray-400">또는 아래에 직접 붙여넣기</span>
              </div>

              <textarea
                value={excelText}
                onChange={(e) => setExcelText(e.target.value)}
                className="w-full px-3 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                rows={12}
                placeholder={"섹션\t문제\t선택지1\t선택지2\t선택지3\t선택지4\t정답\t해설\t난이도\n01. 의학용어\tCardio의 의미는?\t폐\t심장\t간\t신장\tb\tCardio는 심장을 뜻합니다\tmedium"}
              />

              {/* 미리보기 */}
              {excelText.trim() && (() => {
                const parsed = parseExcelRows(excelText);
                return (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">미리보기: {parsed.length}개 문제 감지</p>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {parsed.slice(0, 10).map((row, i) => (
                        <div key={i} className="text-xs text-gray-600 flex items-center gap-2">
                          <span className="font-medium text-gray-400 w-6">{i + 1}</span>
                          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px]">{row.sectionTitle}</span>
                          <span className="truncate">{row.questionText}</span>
                          <span className="text-gray-400 shrink-0">{row.choices.length}지선다</span>
                        </div>
                      ))}
                      {parsed.length > 10 && <p className="text-xs text-gray-400">... 외 {parsed.length - 10}개</p>}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50">
              <span className="text-xs text-gray-400">같은 섹션명은 자동으로 그룹핑됩니다</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowExcelUpload(false)} disabled={excelUploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  취소
                </button>
                <button onClick={handleExcelUpload} disabled={excelUploading || !excelText.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {excelUploading ? <><Loader2 size={14} className="animate-spin" /> 등록 중...</> : <><Upload size={14} /> 대량 등록</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 */}
      <ConfirmModal visible={!!deleteTarget}
        message={deleteTarget ? `"${deleteTarget.title}" ${deleteTarget.type === "section" ? "섹션을 삭제하시겠습니까? 하위 문제도 모두 삭제됩니다." : "문제를 삭제하시겠습니까?"}` : ""}
        onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}
