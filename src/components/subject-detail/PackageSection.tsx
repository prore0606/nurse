"use client";

import { useEffect } from "react";
import type { ContentPackage } from "../../types";
import { mockPackages } from "../../data/subjectContent";
import { useCRUD } from "../../hooks/useCRUD";
import { useImageUpload } from "../../hooks/useImageUpload";
import DataTable, { Column } from "../DataTable";
import FormModal from "../FormModal";
import ConfirmModal from "../ConfirmModal";
import ImagePreview from "../ImagePreview";
import ImageAddButton from "../ImageAddButton";
import { Package } from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "../../utils/format";

const packageColumns: Column<ContentPackage>[] = [
  {
    key: "name", label: "패키지명",
    render: (item) => (
      <div className="flex items-center gap-3">
        {item.imageUrl ? (
          <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0"><img src={item.imageUrl} alt="" className="w-full h-full object-cover" /></div>
        ) : (
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center shrink-0"><Package size={16} className="text-orange-400" /></div>
        )}
        <span className="font-medium text-gray-900">{item.name}</span>
      </div>
    ),
  },
  {
    key: "price", label: "가격", width: "130px",
    render: (item) => (
      <div>
        {item.discountPrice ? (
          <>
            <span className="text-gray-400 line-through text-xs">{formatPrice(item.price)}</span><br />
            <span className="font-medium text-red-600">{formatPrice(item.discountPrice)}</span>
          </>
        ) : (
          <span className="font-medium">{formatPrice(item.price)}</span>
        )}
      </div>
    ),
  },
  {
    key: "includes", label: "포함 항목", width: "160px",
    render: (item) => (
      <div className="flex gap-1.5 flex-wrap">
        {item.includesTheory && <span className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">이론</span>}
        {item.includesProblems && <span className="px-1.5 py-0.5 rounded text-xs bg-green-50 text-green-700">문제</span>}
        {item.includesVideos && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-50 text-purple-700">영상</span>}
      </div>
    ),
  },
  {
    key: "isActive", label: "상태", width: "70px",
    render: (item) => <span className={`text-xs font-medium ${item.isActive ? "text-green-600" : "text-gray-400"}`}>{item.isActive ? "활성" : "비활성"}</span>,
  },
];

interface PackageForm {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  discountPrice: string;
  includesTheory: boolean;
  includesProblems: boolean;
  includesVideos: boolean;
}

const emptyForm: PackageForm = { name: "", description: "", imageUrl: "", price: "", discountPrice: "", includesTheory: true, includesProblems: true, includesVideos: true };

const toForm = (item: ContentPackage): PackageForm => ({
  name: item.name, description: item.description, imageUrl: item.imageUrl,
  price: String(item.price), discountPrice: item.discountPrice ? String(item.discountPrice) : "",
  includesTheory: item.includesTheory, includesProblems: item.includesProblems, includesVideos: item.includesVideos,
});

export default function PackageSection({ createTrigger = 0, initialData }: { createTrigger?: number; initialData?: ContentPackage[] }) {
  const {
    items, form, setForm,
    showModal, editing, deleteTarget,
    openCreate, openEdit, closeModal,
    saveItem, requestDelete, confirmDelete, cancelDelete,
  } = useCRUD<ContentPackage, PackageForm>(initialData ?? mockPackages, emptyForm, toForm, "패키지");
  const { pickImage } = useImageUpload();

  useEffect(() => { if (createTrigger > 0) openCreate(); }, [createTrigger]);

  const handleSubmit = () => {
    if (!form.name.trim() || !form.price) { toast.error("패키지명과 가격을 입력하세요"); return; }
    saveItem({
      name: form.name, description: form.description, imageUrl: form.imageUrl,
      price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      includesTheory: form.includesTheory, includesProblems: form.includesProblems, includesVideos: form.includesVideos,
      isActive: editing?.isActive ?? true,
    });
  };

  return (
    <>
      <DataTable
        columns={packageColumns} data={items} keyField="id"
        onEdit={openEdit} onDelete={requestDelete}
        emptyMessage="등록된 패키지가 없습니다. '패키지 추가' 버튼을 눌러 패키지를 등록하세요."
      />

      <FormModal
        visible={showModal} title={editing ? "패키지 수정" : "패키지 추가"}
        onClose={closeModal} onSubmit={handleSubmit}
        submitLabel={editing ? "수정" : "추가"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">패키지 이미지</label>
            {form.imageUrl ? (
              <ImagePreview src={form.imageUrl} onRemove={() => setForm((f) => ({ ...f, imageUrl: "" }))} />
            ) : (
              <ImageAddButton onClick={() => pickImage((url) => setForm((f) => ({ ...f, imageUrl: url })))} />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">패키지명 <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 해부학 올인원" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} placeholder="패키지 상세 설명" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정가 <span className="text-red-500">*</span></label>
              <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="49000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">할인가</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="39000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">포함 항목</label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.includesTheory} onChange={(e) => setForm((f) => ({ ...f, includesTheory: e.target.checked }))} className="w-4 h-4 text-primary rounded border-gray-300" />
                <span className="text-sm text-gray-700">이론</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.includesProblems} onChange={(e) => setForm((f) => ({ ...f, includesProblems: e.target.checked }))} className="w-4 h-4 text-primary rounded border-gray-300" />
                <span className="text-sm text-gray-700">문제</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.includesVideos} onChange={(e) => setForm((f) => ({ ...f, includesVideos: e.target.checked }))} className="w-4 h-4 text-primary rounded border-gray-300" />
                <span className="text-sm text-gray-700">영상</span>
              </label>
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        visible={!!deleteTarget}
        message={`"${deleteTarget?.name}" 패키지를 삭제하시겠습니까?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </>
  );
}
