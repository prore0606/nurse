"use client";

import { useRouter } from "next/navigation";
import type { SubjectType } from "@/types";

const CATEGORIES: { id: SubjectType | "all"; label: string; emoji: string }[] = [
  { id: "all",      label: "전체",     emoji: "🗂" },
  { id: "theory",   label: "이론",     emoji: "📖" },
  { id: "problems", label: "문제풀이", emoji: "✏️" },
  { id: "videos",   label: "영상 강의", emoji: "🎬" },
  { id: "packages", label: "패키지",   emoji: "📦" },
];

export default function CategoryFilter({ currentType }: { currentType?: SubjectType }) {
  const router = useRouter();

  return (
    <div style={{
      position: "sticky", top: 64, zIndex: 40,
      background: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(0,0,0,0.06)",
    }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px" }}>
        <div style={{
          display: "flex", gap: 6, overflowX: "auto",
          padding: "14px 0", scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}>
          {CATEGORIES.map((cat) => {
            const isActive = cat.id === "all" ? !currentType : currentType === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => router.push(cat.id === "all" ? "/store" : `/store?type=${cat.id}`)}
                style={{
                  flexShrink: 0,
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "8px 16px",
                  borderRadius: 22,
                  border: isActive ? "none" : "1.5px solid #e5e7eb",
                  background: isActive ? "#6366f1" : "#fff",
                  color: isActive ? "#fff" : "#6b7280",
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isActive ? "0 2px 10px rgba(99,102,241,0.3)" : "none",
                  letterSpacing: "-0.01em",
                }}
              >
                <span style={{ fontSize: 13 }}>{cat.emoji}</span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
