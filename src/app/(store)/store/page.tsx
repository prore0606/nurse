import { fetchActiveSubjects } from "@/lib/catalogService";
import type { SubjectType } from "@/types";
import CategoryFilter from "./CategoryFilter";
import CatalogGrid from "./CatalogGrid";

const TYPE_TITLE: Record<string, string> = {
  theory: "이론 강의",
  problems: "문제풀이",
  videos: "영상 강의",
  packages: "패키지",
};

export const metadata = {
  title: "프로리 솔루션",
};

export default async function StorePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filterType = ["theory", "problems", "videos", "packages"].includes(
    type ?? "",
  )
    ? (type as SubjectType)
    : undefined;

  const subjects = await fetchActiveSubjects(filterType);
  const title = filterType ? TYPE_TITLE[filterType] : "전체 학습 콘텐츠";

  return (
    <>
      {/* 히어로 배너 */}
      <div className="bg-primary">
        <div className="max-w-[1200px] mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-white">{title}</h1>
          <p className="text-white/70 mt-2">
            프로리 솔루션
          </p>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {/* 카테고리 필터 */}
        <CategoryFilter currentType={filterType} />

        {/* 카드 그리드 */}
        <CatalogGrid subjects={subjects} />
      </div>
    </>
  );
}
