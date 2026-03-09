"use client";

import { useRouter } from "next/navigation";
import { BookOpen, HelpCircle, Video, Package, LayoutGrid } from "lucide-react";
import type { SubjectType } from "@/types";

const CATEGORIES: { id: SubjectType | "all"; label: string; icon: typeof BookOpen }[] = [
  { id: "all", label: "전체", icon: LayoutGrid },
  { id: "theory", label: "이론", icon: BookOpen },
  { id: "problems", label: "문제풀이", icon: HelpCircle },
  { id: "videos", label: "영상 강의", icon: Video },
  { id: "packages", label: "패키지", icon: Package },
];

export default function CategoryFilter({
  currentType,
}: {
  currentType?: SubjectType;
}) {
  const router = useRouter();

  return (
    <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
      <div className="max-w-[1200px] mx-auto px-6 py-4">
        <div className="inline-flex items-center bg-gray-100/80 rounded-2xl p-1.5 gap-1">
          {CATEGORIES.map((cat) => {
            const isActive =
              cat.id === "all" ? !currentType : currentType === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() =>
                  router.push(cat.id === "all" ? "/store" : `/store?type=${cat.id}`)
                }
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-white text-gray-900 shadow-sm shadow-gray-200/50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
