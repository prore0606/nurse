import { fetchActiveSubjects } from "@/lib/catalogService";
import type { SubjectType } from "@/types";
import CategoryFilter from "./CategoryFilter";
import CatalogGrid from "./CatalogGrid";

export const metadata = { title: "스토어 - 프로리 솔루션" };

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filterType = ["theory", "problems", "videos", "packages"].includes(type ?? "")
    ? (type as SubjectType)
    : undefined;

  const subjects = await fetchActiveSubjects(filterType);

  return (
    <>
      {/* 히어로 */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3b82f6 100%)",
        padding: "56px 24px 48px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
          backgroundSize: "36px 36px",
        }} />
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -40, width: 360, height: 360, borderRadius: "50%", background: "rgba(59,130,246,0.15)" }} />

        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 14px", borderRadius: 20,
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.25)",
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.9)", letterSpacing: "0.02em" }}>
              🎓 국가고시 합격을 위한 최선의 선택
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.04em", lineHeight: 1.2, margin: "0 0 12px" }}>
            프로리 솔루션 스토어
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.72)", fontWeight: 400, margin: 0 }}>
            이론부터 문제풀이까지, 합격을 위한 모든 콘텐츠
          </p>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <CategoryFilter currentType={filterType} />

      {/* 상품 목록 */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "36px 24px 80px" }}>
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: "#9ca3af", fontWeight: 500, margin: 0 }}>
            총 <strong style={{ color: "#374151", fontWeight: 700 }}>{subjects.length}</strong>개의 상품
          </p>
        </div>
        <CatalogGrid subjects={subjects} />
      </div>
    </>
  );
}
