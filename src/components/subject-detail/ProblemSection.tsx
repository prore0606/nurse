"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProblemSection as ProblemSectionType, ProblemQuestion, ProblemQuestionChoice, Difficulty } from "../../types";
import {
  fetchSectionsWithQuestions,
  createSection,
  updateSection,
  deleteSection,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../../lib/problemService";
import ConfirmModal from "../ConfirmModal";
import FormModal from "../FormModal";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  Loader2, FileText, CirclePlus,
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
    { id: "e", text: "" },
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
            <div className="flex items-center justify-center">
              <button onClick={openCreateSection} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus size={16} /> 섹션 추가
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">번호</label>
            <input type="number" value={questionForm.number} onChange={(e) => setQuestionForm((f) => ({ ...f, number: Number(e.target.value) }))}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" min={1} />
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

      {/* 삭제 확인 */}
      <ConfirmModal visible={!!deleteTarget}
        message={deleteTarget ? `"${deleteTarget.title}" ${deleteTarget.type === "section" ? "섹션을 삭제하시겠습니까? 하위 문제도 모두 삭제됩니다." : "문제를 삭제하시겠습니까?"}` : ""}
        onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}
