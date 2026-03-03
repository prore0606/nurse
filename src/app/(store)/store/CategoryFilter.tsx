"use client";

import { useRouter } from "next/navigation";
import type { SubjectType } from "@/types";

const CATEGORIES: { id: SubjectType | "all"; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "theory", label: "이론" },
  { id: "problems", label: "문제풀이" },
  { id: "videos", label: "영상 강의" },
  { id: "packages", label: "패키지" },
];

export default function CategoryFilter({
  currentType,
}: {
  currentType?: SubjectType;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
      {CATEGORIES.map((cat) => {
        const isActive =
          cat.id === "all" ? !currentType : currentType === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() =>
              router.push(cat.id === "all" ? "/store" : `/store?type=${cat.id}`)
            }
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
