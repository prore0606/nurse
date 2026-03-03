"use client";

import { useEffect } from "react";
import type { Problem } from "../../types";
import { mockProblems } from "../../data/subjectContent";
import { DIFFICULTY_OPTIONS } from "../../constants/subjectConfig";
import { useCRUD } from "../../hooks/useCRUD";
import { useImageUpload } from "../../hooks/useImageUpload";
import DataTable, { Column } from "../DataTable";
import FormModal from "../FormModal";
import ConfirmModal from "../ConfirmModal";
import ImagePreview from "../ImagePreview";
import ImageAddButton from "../ImageAddButton";
import { Trash2, CirclePlus, ImagePlus } from "lucide-react";
import toast from "react-hot-toast";

const problemColumns: Column<Problem>[] = [
  {
    key: "chapter", label: "챕터", width: "100px",
    render: (item) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">{item.chapter}</span>,
  },
  {
    key: "question", label: "문제",
    render: (item) => (
      <div className="flex items-center gap-2">
        {item.questionImage && <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden shrink-0"><img src={item.questionImage} alt="" className="w-full h-full object-cover" /></div>}
        <span className="font-medium text-gray-900 line-clamp-1">{item.question}</span>
      </div>
    ),
  },
  { key: "choiceCount", label: "선택지", width: "70px", render: (item) => <span className="text-xs">{item.choices.length}개</span> },
  {
    key: "difficulty", label: "난이도", width: "80px",
    render: (item) => {
      const m = { easy: { l: "쉬움", c: "text-green-600" }, medium: { l: "보통", c: "text-yellow-600" }, hard: { l: "어려움", c: "text-red-600" } };
      return <span className={`text-xs font-medium ${m[item.difficulty].c}`}>{m[item.difficulty].l}</span>;
    },
  },
];

interface ProblemForm {
  chapter: string;
  question: string;
  questionImage: string;
  choices: { text: string; image: string }[];
  answer: number;
  explanation: string;
  explanationImage: string;
  difficulty: Problem["difficulty"];
}

const emptyForm: ProblemForm = {
  chapter: "", question: "", questionImage: "",
  choices: [{ text: "", image: "" }, { text: "", image: "" }, { text: "", image: "" }, { text: "", image: "" }],
  answer: 0, explanation: "", explanationImage: "", difficulty: "medium",
};

const toForm = (item: Problem): ProblemForm => ({
  chapter: item.chapter, question: item.question, questionImage: item.questionImage,
  choices: item.choices.map((c) => ({ ...c })), answer: item.answer,
  explanation: item.explanation, explanationImage: item.explanationImage, difficulty: item.difficulty,
});

export default function ProblemSection({ createTrigger = 0, initialData }: { createTrigger?: number; initialData?: Problem[] }) {
  const {
    items, form, setForm,
    showModal, editing, deleteTarget,
    openCreate, openEdit, closeModal,
    saveItem, requestDelete, confirmDelete, cancelDelete,
  } = useCRUD<Problem, ProblemForm>(initialData ?? mockProblems, emptyForm, toForm, "문제");
  const { pickImage } = useImageUpload();

  useEffect(() => { if (createTrigger > 0) openCreate(); }, [createTrigger]);

  const handleSubmit = () => {
    if (!form.chapter.trim() || !form.question.trim()) { toast.error("챕터와 문제를 입력하세요"); return; }
    const validChoices = form.choices.filter((c) => c.text.trim() || c.image);
    if (validChoices.length < 2) { toast.error("선택지를 2개 이상 입력하세요"); return; }
    saveItem({
      chapter: form.chapter, question: form.question, questionImage: form.questionImage,
      choices: form.choices, answer: form.answer,
      explanation: form.explanation, explanationImage: form.explanationImage,
      difficulty: form.difficulty, isActive: editing?.isActive ?? true,
    });
  };

  const updateChoice = (index: number, field: "text" | "image", value: string) => {
    setForm((f) => {
      const choices = [...f.choices];
      choices[index] = { ...choices[index], [field]: value };
      return { ...f, choices };
    });
  };

  const addChoice = () => {
    if (form.choices.length < 6) setForm((f) => ({ ...f, choices: [...f.choices, { text: "", image: "" }] }));
  };

  const removeChoice = (index: number) => {
    setForm((f) => ({
      ...f,
      choices: f.choices.filter((_, i) => i !== index),
      answer: f.answer >= index && f.answer > 0 ? f.answer - 1 : f.answer,
    }));
  };

  return (
    <>
      <DataTable
        columns={problemColumns} data={items} keyField="id"
        onEdit={openEdit} onDelete={requestDelete}
        emptyMessage="등록된 문제가 없습니다. '문제 추가' 버튼을 눌러 문제를 등록하세요."
      />

      <FormModal
        visible={showModal} title={editing ? "문제 수정" : "문제 추가"}
        onClose={closeModal} onSubmit={handleSubmit}
        submitLabel={editing ? "수정" : "추가"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">챕터 <span className="text-red-500">*</span></label>
            <input type="text" value={form.chapter} onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 머리뼈" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">문제 <span className="text-red-500">*</span></label>
            <textarea value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={3} placeholder="문제를 입력하세요" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">문제 이미지 (선택)</label>
            {form.questionImage ? (
              <ImagePreview src={form.questionImage} onRemove={() => setForm((f) => ({ ...f, questionImage: "" }))} />
            ) : (
              <ImageAddButton onClick={() => pickImage((url) => setForm((f) => ({ ...f, questionImage: url })))} size="sm" />
            )}
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
              {form.choices.map((choice, index) => (
                <div key={index} className="flex items-start gap-2">
                  <button type="button" onClick={() => setForm((f) => ({ ...f, answer: index }))} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border-2 shrink-0 mt-1.5 transition-colors ${form.answer === index ? "border-primary bg-primary text-white" : "border-gray-300 text-gray-400"}`}>
                    {index + 1}
                  </button>
                  <div className="flex-1 space-y-1.5">
                    <input type="text" value={choice.text} onChange={(e) => updateChoice(index, "text", e.target.value)} className="w-full px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder={`선택지 ${index + 1}`} />
                    {choice.image ? (
                      <div className="w-24"><ImagePreview src={choice.image} size="sm" onRemove={() => updateChoice(index, "image", "")} /></div>
                    ) : (
                      <button type="button" onClick={() => pickImage((url) => updateChoice(index, "image", url))} className="text-xs text-gray-400 hover:text-primary flex items-center gap-1">
                        <ImagePlus size={12} /> 이미지 첨부
                      </button>
                    )}
                  </div>
                  {form.choices.length > 2 && (
                    <button type="button" onClick={() => removeChoice(index)} className="p-1 text-gray-300 hover:text-red-500 mt-1.5">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">번호 클릭 = 정답 선택 | 선택지에 텍스트 또는 이미지 첨부 가능</p>
          </div>

          {/* 해설 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">해설</label>
            <textarea value={form.explanation} onChange={(e) => setForm((f) => ({ ...f, explanation: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} placeholder="정답 해설" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">해설 이미지 (선택)</label>
            {form.explanationImage ? (
              <ImagePreview src={form.explanationImage} onRemove={() => setForm((f) => ({ ...f, explanationImage: "" }))} size="sm" />
            ) : (
              <ImageAddButton onClick={() => pickImage((url) => setForm((f) => ({ ...f, explanationImage: url })))} size="sm" />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
            <div className="flex gap-2">
              {DIFFICULTY_OPTIONS.map(({ value, label, activeClass }) => (
                <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, difficulty: value }))} className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${form.difficulty === value ? activeClass : "bg-white text-gray-400 border-gray-200"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        visible={!!deleteTarget}
        message="이 문제를 삭제하시겠습니까?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
