"use client";

import Link from "next/link";
import type { Subject, SubjectType } from "@/types";
import { formatPrice } from "@/utils/format";

const TYPE_CONFIG: Record<SubjectType, { label: string; bg: string; color: string }> = {
  theory:   { label: "이론",    bg: "#eff6ff", color: "#3b82f6" },
  problems: { label: "문제풀이", bg: "#f0fdf4", color: "#16a34a" },
  videos:   { label: "영상",    bg: "#faf5ff", color: "#9333ea" },
  packages: { label: "패키지",  bg: "#fff7ed", color: "#ea580c" },
};

function SubjectCard({ subject }: { subject: Subject }) {
  const cfg = TYPE_CONFIG[subject.type];
  const hasDiscount = subject.discountPrice != null && subject.discountPrice < subject.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - subject.discountPrice! / subject.price) * 100)
    : 0;

  return (
    <Link href={`/store/${subject.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          border: "1px solid #f0f0f5",
          overflow: "hidden",
          transition: "transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease",
          cursor: "pointer",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
        onMouseEnter={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "translateY(-6px)";
          el.style.boxShadow = "0 20px 52px rgba(0,0,0,0.09)";
          el.style.borderColor = "#dde0f5";
        }}
        onMouseLeave={e => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.transform = "none";
          el.style.boxShadow = "none";
          el.style.borderColor = "#f0f0f5";
        }}
      >
        {/* 썸네일 */}
        <div style={{
          position: "relative",
          aspectRatio: "16/9",
          overflow: "hidden",
          flexShrink: 0,
          background: `linear-gradient(135deg, ${cfg.bg}, #f9fafb)`,
        }}>
          {subject.imageUrl ? (
            <img
              src={subject.imageUrl}
              alt={subject.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 40, opacity: 0.5 }}>📚</span>
            </div>
          )}

          {hasDiscount && (
            <span style={{
              position: "absolute", top: 10, right: 10,
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff", fontSize: 11, fontWeight: 800,
              padding: "4px 9px", borderRadius: 8,
              boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
            }}>
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* 정보 */}
        <div style={{ padding: "16px 18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
          {/* 타입 뱃지 */}
          <span style={{
            display: "inline-block", marginBottom: 10, alignSelf: "flex-start",
            padding: "3px 10px", borderRadius: 20,
            background: cfg.bg, color: cfg.color,
            fontSize: 11, fontWeight: 700,
          }}>
            {cfg.label}
          </span>

          {/* 상품명 */}
          <p style={{
            fontSize: 15, fontWeight: 700, color: "#111827",
            margin: "0 0 6px", lineHeight: 1.45, letterSpacing: "-0.02em",
          }}>
            {subject.name}
          </p>

          {/* 설명 */}
          <p style={{
            fontSize: 13, color: "#9ca3af", margin: "0 0 16px", lineHeight: 1.6, flex: 1,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          } as React.CSSProperties}>
            {subject.description}
          </p>

          {/* 가격 */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginTop: "auto" }}>
            {hasDiscount ? (
              <>
                <span style={{ fontSize: 19, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
                  {formatPrice(subject.discountPrice!)}
                </span>
                <span style={{ fontSize: 13, color: "#d1d5db", textDecoration: "line-through", fontWeight: 500 }}>
                  {formatPrice(subject.price)}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 19, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
                {formatPrice(subject.price)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CatalogGrid({ subjects }: { subjects: Subject[] }) {
  if (subjects.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.35 }}>📦</div>
        <p style={{ color: "#9ca3af", fontSize: 15, fontWeight: 500 }}>등록된 상품이 없습니다</p>
        <p style={{ color: "#d1d5db", fontSize: 13, marginTop: 6, fontWeight: 400 }}>다른 카테고리를 선택해보세요</p>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: 20,
    }}>
      {subjects.map((s) => <SubjectCard key={s.id} subject={s} />)}
    </div>
  );
}
