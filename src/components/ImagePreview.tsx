"use client";

import { X } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  onRemove: () => void;
  size?: "sm" | "md";
}

export default function ImagePreview({ src, onRemove, size = "md" }: ImagePreviewProps) {
  const h = size === "sm" ? "h-20" : "h-32";

  return (
    <div className={`relative ${h} rounded-lg overflow-hidden border border-gray-200 group`}>
      <img src={src} alt="" className="w-full h-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={12} />
      </button>
    </div>
  );
}
