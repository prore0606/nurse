"use client";

import { ImagePlus } from "lucide-react";

interface ImageAddButtonProps {
  onClick: () => void;
  size?: "sm" | "md";
}

export default function ImageAddButton({ onClick, size = "md" }: ImageAddButtonProps) {
  const h = size === "sm" ? "h-20" : "h-32";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${h} w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors`}
    >
      <ImagePlus size={size === "sm" ? 18 : 24} />
      <span className="text-xs">이미지 추가</span>
    </button>
  );
}
