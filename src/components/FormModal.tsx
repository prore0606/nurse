"use client";

import { X } from "lucide-react";

interface FormModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  children: React.ReactNode;
  isLoading?: boolean;
  submitDisabled?: boolean;
}

export default function FormModal({
  visible,
  title,
  onClose,
  onSubmit,
  submitLabel = "저장",
  children,
  isLoading = false,
  submitDisabled = false,
}: FormModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="px-6 py-4">{children}</div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || submitDisabled}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? "처리 중..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
