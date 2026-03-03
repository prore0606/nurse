import { useRef } from "react";
import toast from "react-hot-toast";

const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function useImageUpload() {
  const ref = useRef<HTMLInputElement>(null);

  const pickImage = (callback: (dataUrl: string) => void) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("이미지 파일만 업로드 가능합니다");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`${MAX_SIZE_MB}MB 이하의 이미지만 가능합니다`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => callback(ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return { ref, pickImage };
}
