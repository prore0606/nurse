import { useState } from "react";
import toast from "react-hot-toast";

/**
 * 제네릭 CRUD 상태관리 훅
 * S: 단일 책임 - CRUD 상태 + 액션만 담당
 * O: 개방-폐쇄 - 폼/컬럼/유효성검증은 호출부에서 정의
 * D: 의존 역전 - 데이터 소스를 인자로 주입
 */
export function useCRUD<T extends { id: string }, F>(
  initialData: T[],
  emptyForm: F,
  toForm: (item: T) => F,
  entityName: string,
) {
  const [items, setItems] = useState<T[]>(initialData);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [form, setForm] = useState<F>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (item: T) => {
    setEditing(item);
    setForm(toForm(item));
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  /** 호출부에서 form → entity 변환 후 전달 */
  const saveItem = (data: Omit<T, "id">) => {
    if (editing) {
      setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...data } : i)));
      toast.success(`${entityName} 수정 완료`);
    } else {
      setItems((prev) => [...prev, { ...data, id: crypto.randomUUID() } as T]);
      toast.success(`${entityName} 추가 완료`);
    }
    setShowModal(false);
  };

  const requestDelete = (item: T) => setDeleteTarget(item);
  const confirmDelete = () => {
    if (!deleteTarget) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    toast.success("삭제 완료");
    setDeleteTarget(null);
  };
  const cancelDelete = () => setDeleteTarget(null);

  return {
    items, setItems, form, setForm,
    showModal, editing, deleteTarget,
    openCreate, openEdit, closeModal,
    saveItem, requestDelete, confirmDelete, cancelDelete,
  };
}
