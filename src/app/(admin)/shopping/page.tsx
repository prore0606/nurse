"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import DataTable, { Column } from "@/components/DataTable";
import FormModal from "@/components/FormModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useCRUD } from "@/hooks/useCRUD";
import { Plus, Package } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { initialProducts } from "@/data/shopping";
import { PRODUCT_CATEGORIES } from "@/constants/subjectConfig";
import { formatPrice } from "@/utils/format";

interface ProductForm {
  name: string;
  category: string;
  price: string;
  discountPrice: string;
  stock: string;
  isFeatured: boolean;
}

const emptyForm: ProductForm = {
  name: "", category: "", price: "", discountPrice: "", stock: "", isFeatured: false,
};

const toForm = (item: Product): ProductForm => ({
  name: item.name, category: item.category, price: String(item.price),
  discountPrice: item.discountPrice ? String(item.discountPrice) : "",
  stock: String(item.stock), isFeatured: item.isFeatured,
});

const columns: Column<Product>[] = [
  {
    key: "name", label: "상품명",
    render: (item) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
          <Package size={18} className="text-gray-400" />
        </div>
        <div>
          <span className="font-medium text-gray-900">{item.name}</span>
          {item.isFeatured && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-50 text-yellow-700">추천</span>}
        </div>
      </div>
    ),
  },
  {
    key: "category", label: "카테고리", width: "110px",
    render: (item) => <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">{item.category}</span>,
  },
  {
    key: "price", label: "가격", width: "150px",
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
    key: "stock", label: "재고", width: "80px",
    render: (item) => (
      <span className={`font-medium ${item.stock === 0 ? "text-red-500" : item.stock < 30 ? "text-yellow-600" : "text-gray-700"}`}>
        {item.stock === 0 ? "품절" : `${item.stock}개`}
      </span>
    ),
  },
  {
    key: "isActive", label: "상태", width: "80px",
    render: (item) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
        {item.isActive ? "판매중" : "중지"}
      </span>
    ),
  },
  { key: "createdAt", label: "등록일", width: "120px" },
];

export default function ShoppingPage() {
  const {
    items, form, setForm,
    showModal, editing, deleteTarget,
    openCreate, openEdit, closeModal,
    saveItem, requestDelete, confirmDelete, cancelDelete,
  } = useCRUD<Product, ProductForm>(initialProducts, emptyForm, toForm, "상품");
  const [filterCategory, setFilterCategory] = useState("");

  const filteredData = filterCategory ? items.filter((d) => d.category === filterCategory) : items;

  const handleSubmit = () => {
    if (!form.name.trim() || !form.category || !form.price) { toast.error("필수 항목을 모두 입력하세요"); return; }
    saveItem({
      name: form.name, category: form.category,
      price: Number(form.price), discountPrice: form.discountPrice ? Number(form.discountPrice) : undefined,
      stock: Number(form.stock) || 0, imageUrl: editing?.imageUrl ?? "",
      isActive: editing?.isActive ?? true, isFeatured: form.isFeatured,
      createdAt: editing?.createdAt ?? new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div>
      <PageHeader
        title="쇼핑 상품 관리"
        description="쇼핑몰 상품을 등록하고 관리합니다"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
            <Plus size={18} />
            상품 추가
          </button>
        }
      />

      <div className="flex items-center gap-3 mb-6">
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">전체 카테고리</option>
          {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-gray-500">총 {filteredData.length}개</span>
      </div>

      <DataTable columns={columns} data={filteredData} keyField="id" onEdit={openEdit} onDelete={requestDelete} emptyMessage="등록된 상품이 없습니다" />

      <FormModal visible={showModal} title={editing ? "상품 수정" : "상품 추가"} onClose={closeModal} onSubmit={handleSubmit} submitLabel={editing ? "수정" : "추가"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상품명 <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 해부학 포스터 세트" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">카테고리 <span className="text-red-500">*</span></label>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">카테고리 선택</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정가 <span className="text-red-500">*</span></label>
              <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="25000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">할인가</label>
              <input type="number" value={form.discountPrice} onChange={(e) => setForm((f) => ({ ...f, discountPrice: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="19900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">재고 수량</label>
            <input type="number" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="100" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isFeatured" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="w-4 h-4 text-primary rounded border-gray-300" />
            <label htmlFor="isFeatured" className="text-sm text-gray-700">추천 상품</label>
          </div>
        </div>
      </FormModal>

      <ConfirmModal
        visible={!!deleteTarget}
        message={`"${deleteTarget?.name}" 상품을 삭제하시겠습니까?`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
