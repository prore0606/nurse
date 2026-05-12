import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSubjectById } from "@/lib/catalogService";
import { formatPrice } from "@/utils/format";
import type { SubjectType } from "@/types";
import PurchaseButton from "./PurchaseButton";
import HtmlDetailView from "./HtmlDetailView";

const TYPE_CONFIG: Record<SubjectType, { label: string; bg: string; color: string }> = {
  theory:   { label: "이론",    bg: "#eff6ff", color: "#3b82f6" },
  problems: { label: "문제풀이", bg: "#f0fdf4", color: "#16a34a" },
  videos:   { label: "영상 강의", bg: "#faf5ff", color: "#9333ea" },
  packages: { label: "패키지",  bg: "#fff7ed", color: "#ea580c" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await fetchSubjectById(id);
  if (!subject) return { title: "상품을 찾을 수 없습니다" };
  return {
    title: `${subject.name} - 프로리 솔루션`,
    description: subject.description,
  };
}

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await fetchSubjectById(id);
  if (!subject) notFound();

  const hasDiscount =
    subject.discountPrice != null && subject.discountPrice < subject.price;
  const finalPrice = hasDiscount ? subject.discountPrice! : subject.price;

  const cfg = TYPE_CONFIG[subject.type];
  const discountPercent = hasDiscount
    ? Math.round((1 - subject.discountPrice! / subject.price) * 100)
    : 0;

  const hasHtmlDetail =
    !!subject.descriptionHtml && subject.descriptionHtml.trim().length > 0;

  return (
    <div style={{ maxWidth: 1080, margin: "0 auto", padding: "32px 24px 80px" }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 32 }}>
        <Link href="/store" style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none", fontWeight: 500, transition: "color 0.15s" }}>
          스토어
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
          <path d="M9 18l6-6-6-6" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 13, color: "#374151", fontWeight: 600 }}>{subject.name}</span>
      </nav>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: 48,
        alignItems: "start",
      }}>
        <div>
          <div style={{
            borderRadius: 24,
            overflow: "hidden",
            aspectRatio: "16/9",
            background: `linear-gradient(135deg, ${cfg.bg}, #f3f4f6)`,
            border: "1px solid #f0f0f5",
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
                <div style={{
                  width: 120, height: 120, borderRadius: 28,
                  background: `linear-gradient(135deg, ${cfg.bg}, #e0e7ff)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `1px solid ${cfg.bg}`,
                }}>
                  <span style={{ fontSize: 52, opacity: 0.5 }}>📚</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: "sticky", top: 100 }}>
          <div style={{
            background: "#fff",
            borderRadius: 24,
            border: "1px solid #f0f0f5",
            padding: "28px 24px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.05)",
          }}>
            <span style={{
              display: "inline-block", marginBottom: 14,
              padding: "4px 12px", borderRadius: 20,
              background: cfg.bg, color: cfg.color,
              fontSize: 12, fontWeight: 700,
            }}>
              {cfg.label}
            </span>

            <h1 style={{
              fontSize: 22, fontWeight: 800, color: "#111827",
              lineHeight: 1.35, letterSpacing: "-0.03em",
              margin: "0 0 10px",
            }}>
              {subject.name}
            </h1>

            <p style={{
              fontSize: 14, color: "#6b7280", lineHeight: 1.7,
              margin: "0 0 24px",
            }}>
              {subject.description}
            </p>

            <div style={{ height: 1, background: "#f3f4f6", marginBottom: 24 }} />

            <div style={{ marginBottom: 24 }}>
              {hasDiscount && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{
                    padding: "3px 8px", borderRadius: 8,
                    background: "#fef2f2", color: "#ef4444",
                    fontSize: 12, fontWeight: 800,
                  }}>
                    {discountPercent}% 할인
                  </span>
                  <span style={{ fontSize: 14, color: "#d1d5db", textDecoration: "line-through", fontWeight: 500 }}>
                    {formatPrice(subject.price)}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 800, color: "#111827", letterSpacing: "-0.04em" }}>
                  {formatPrice(finalPrice)}
                </span>
              </div>
            </div>

            <PurchaseButton
              subjectId={subject.id}
              subjectName={subject.name}
              price={finalPrice}
            />
          </div>
        </div>
      </div>

      {hasHtmlDetail && (
        <section style={{ marginTop: 56 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 800, color: "#111827",
            letterSpacing: "-0.02em",
            margin: "0 0 16px",
          }}>
            상품 상세
          </h2>
          <div style={{
            borderRadius: 24,
            overflow: "hidden",
            border: "1px solid #f0f0f5",
            background: "#fff",
          }}>
            <HtmlDetailView
              html={subject.descriptionHtml!}
              subjectId={subject.id}
              subjectName={subject.name}
              price={finalPrice}
            />
          </div>
        </section>
      )}
    </div>
  );
}
