"use client";

import { useEffect, useRef, useState } from "react";
import { Eye, Code, FileUp } from "lucide-react";

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export default function HtmlEditor({ value, onChange }: Props) {
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedValue(value), 400);
    return () => clearTimeout(t);
  }, [value]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      onChange(text);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Code size={14} />
          <span>HTML 상세페이지</span>
          {value && <span className="text-gray-400">· {(new Blob([value]).size / 1024).toFixed(1)}KB</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.htm,text/html"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            title=".html 파일 업로드"
          >
            <FileUp size={13} /> 파일 업로드
          </button>
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md transition-colors ${showPreview ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Eye size={13} /> 미리보기
          </button>
        </div>
      </div>

      {!showPreview ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder={`<!DOCTYPE html>\n<html lang="ko">\n  ...\n</html>`}
          className="w-full px-3 py-2 text-xs font-mono leading-relaxed text-gray-800 focus:outline-none resize-y"
          style={{ minHeight: 280, maxHeight: 600 }}
        />
      ) : debouncedValue ? (
        <iframe
          ref={iframeRef}
          srcDoc={debouncedValue}
          sandbox="allow-scripts allow-same-origin"
          className="w-full bg-white"
          style={{ height: 600, border: "none" }}
          title="미리보기"
        />
      ) : (
        <div className="flex items-center justify-center text-sm text-gray-400 bg-gray-50" style={{ height: 280 }}>
          HTML이 비어있습니다
        </div>
      )}
    </div>
  );
}
