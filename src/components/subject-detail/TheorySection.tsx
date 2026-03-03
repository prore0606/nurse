"use client";

import { useState, useEffect, useRef } from "react";
import type { Theory } from "../../types";
import { mockTheories } from "../../data/subjectContent";
import { useCRUD } from "../../hooks/useCRUD";
import { useImageUpload } from "../../hooks/useImageUpload";
import DataTable, { Column } from "../DataTable";
import FormModal from "../FormModal";
import ConfirmModal from "../ConfirmModal";
import ImagePreview from "../ImagePreview";
import ImageAddButton from "../ImageAddButton";
import { FileUp, File, X } from "lucide-react";
import toast from "react-hot-toast";

const FILE_ICONS: Record<string, string> = {
  "application/xml": "XML",
  "text/xml": "XML",
  "application/pdf": "PDF",
  "image/png": "PNG",
  "image/jpeg": "JPG",
  "image/gif": "GIF",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface AttachedFile {
  name: string;
  type: string;
  size: number;
}

const theoryColumns: Column<Theory>[] = [
  {
    key: "chapter", label: "챕터", width: "120px",
    render: (item) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{item.chapter}</span>,
  },
  {
    key: "title", label: "제목",
    render: (item) => (
      <div>
        <span className="font-medium text-gray-900">{item.title}</span>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.body.substring(0, 60)}...</p>
      </div>
    ),
  },
  {
    key: "contentType", label: "유형", width: "90px",
    render: (item) => {
      const m = { text: "텍스트", image: "이미지", mixed: "복합" };
      return <span className="text-xs text-gray-500">{m[item.contentType]}</span>;
    },
  },
  { key: "images", label: "이미지", width: "70px", render: (item) => <span className="text-xs text-gray-500">{item.images.length}장</span> },
  { key: "order", label: "순서", width: "60px" },
  {
    key: "isActive", label: "상태", width: "70px",
    render: (item) => <span className={`text-xs font-medium ${item.isActive ? "text-green-600" : "text-gray-400"}`}>{item.isActive ? "활성" : "비활성"}</span>,
  },
];

interface TheoryForm {
  chapter: string;
  title: string;
  body: string;
  images: string[];
  files: AttachedFile[];
  contentType: Theory["contentType"];
}

const emptyForm: TheoryForm = { chapter: "", title: "", body: "", images: [], files: [], contentType: "text" };

const toForm = (item: Theory): TheoryForm => ({
  chapter: item.chapter, title: item.title, body: item.body,
  images: [...item.images], files: [], contentType: item.contentType,
});

export default function TheorySection({ createTrigger = 0, initialData }: { createTrigger?: number; initialData?: Theory[] }) {
  const {
    items, form, setForm,
    showModal, editing, deleteTarget,
    openCreate, openEdit, closeModal,
    saveItem, requestDelete, confirmDelete, cancelDelete,
  } = useCRUD<Theory, TheoryForm>(initialData ?? mockTheories, emptyForm, toForm, "이론");
  const { pickImage } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (createTrigger > 0) openCreate(); }, [createTrigger]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const newFiles: AttachedFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: 20MB 이하 파일만 가능합니다`);
        continue;
      }
      newFiles.push({ name: file.name, type: file.type, size: file.size });
    }
    if (newFiles.length > 0) {
      setForm((f) => ({ ...f, files: [...f.files, ...newFiles] }));
      toast.success(`${newFiles.length}개 파일이 첨부되었습니다`);
    }
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setForm((f) => ({ ...f, files: f.files.filter((_, i) => i !== index) }));
  };

  const handleSubmit = () => {
    if (!form.chapter.trim() || !form.title.trim()) { toast.error("소제목과 제목을 입력하세요"); return; }
    if (!form.body.trim() && form.files.length === 0 && form.images.length === 0) {
      toast.error("본문, 파일, 또는 이미지를 하나 이상 등록하세요");
      return;
    }
    const hasText = form.body.trim().length > 0;
    const hasMedia = form.images.length > 0 || form.files.length > 0;
    const contentType = hasText && hasMedia ? "mixed" : hasMedia ? "image" : "text";
    saveItem({
      chapter: form.chapter, title: form.title, body: form.body,
      images: form.images, contentType,
      order: editing?.order ?? items.length + 1,
      isActive: editing?.isActive ?? true,
    });
  };

  return (
    <>
      <DataTable
        columns={theoryColumns} data={items} keyField="id"
        onEdit={openEdit} onDelete={requestDelete}
        emptyMessage="등록된 이론이 없습니다. '이론 추가' 버튼을 눌러 콘텐츠를 등록하세요."
      />

      <FormModal
        visible={showModal} title={editing ? "이론 수정" : "이론 추가"}
        onClose={closeModal} onSubmit={handleSubmit}
        submitLabel={editing ? "수정" : "추가"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">소제목 <span className="text-red-500">*</span></label>
              <input type="text" value={form.chapter} onChange={(e) => setForm((f) => ({ ...f, chapter: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 두경부" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
              <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 두개골 구조와 봉합" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">본문 내용</label>
            <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono" rows={6} placeholder="이론 본문을 입력하거나 아래에서 파일을 업로드하세요" />
            <p className="text-xs text-gray-400 mt-1">{form.body.length}자</p>
          </div>

          {/* 파일 업로드 영역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">콘텐츠 파일 업로드</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <FileUp size={24} />
              <span className="text-sm">XML, PDF, 이미지 등 파일을 선택하세요</span>
              <span className="text-xs">각 파일 20MB 이하</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.pdf,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 첨부된 파일 목록 */}
            {form.files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {form.files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">
                        {FILE_ICONS[file.type] || <File size={14} />}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{file.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 첨부 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">첨부 이미지</label>
            <div className="grid grid-cols-3 gap-2">
              {form.images.map((img, i) => (
                <ImagePreview key={i} src={img} onRemove={() => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))} />
              ))}
              {form.images.length < 10 && (
                <ImageAddButton onClick={() => pickImage((url) => setForm((f) => ({ ...f, images: [...f.images, url] })))} />
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">최대 10장, 각 5MB 이하</p>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        visible={!!deleteTarget}
        message={`"${deleteTarget?.title}" 이론을 삭제하시겠습니까?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
