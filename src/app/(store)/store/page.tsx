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

const TYPE_SUBTITLE: Record<string, string> = {
  theory: "탄탄한 기초부터 심화까지, 체계적인 이론 학습",
  problems: "기출 분석과 실전 문제로 실력을 완성하세요",
  videos: "명강사의 핵심 강의를 언제 어디서든",
  packages: "올인원 패키지로 합격까지 한 번에",
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
  const title = filterType ? TYPE_TITLE[filterType] : "당신의 합격을 위한 맞춤형 학습";
  const subtitle = filterType
    ? TYPE_SUBTITLE[filterType]
    : "간호사 국가고시 합격률 1위, 프로리 솔루션과 함께하세요";

  return (
    <>
      {/* 히어로 배너 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-600">
        {/* 메시 패턴 배경 */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-400/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-violet-400/10 blur-3xl" />
        </div>
        {/* 기하학적 패턴 */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        <div className="relative max-w-[1200px] mx-auto px-6 py-20 md:py-28">
          <div className="flex items-center justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-sm font-medium text-white/90 tracking-tight">2026 국가고시 대비 콘텐츠 업데이트</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
                {title}
              </h1>
              <p className="text-lg md:text-xl text-white/70 font-medium leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* 우측 장식 에셋 */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative">
                {/* 글로우 효과 */}
                <div className="absolute inset-0 blur-2xl bg-white/5 rounded-3xl scale-110" />
                {/* 카드 스택 */}
                <div className="relative space-y-3">
                  <div className="w-56 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 px-4 translate-x-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300 text-lg">A+</div>
                    <div>
                      <div className="text-sm font-bold text-white/90">합격률 96.8%</div>
                      <div className="text-[11px] text-white/50">2025 국시 기준</div>
                    </div>
                  </div>
                  <div className="w-56 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 px-4 -translate-x-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-400/20 flex items-center justify-center text-blue-300 text-lg font-bold">8K</div>
                    <div>
                      <div className="text-sm font-bold text-white/90">수강생 8,000+</div>
                      <div className="text-[11px] text-white/50">누적 수강생</div>
                    </div>
                  </div>
                  <div className="w-56 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center gap-3 px-4 translate-x-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-400/20 flex items-center justify-center text-violet-300 text-lg font-bold">4.9</div>
                    <div>
                      <div className="text-sm font-bold text-white/90">평균 만족도</div>
                      <div className="text-[11px] text-white/50">5점 만점</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리 필터 (Sticky) */}
      <CategoryFilter currentType={filterType} />

      {/* 콘텐츠 영역 */}
      <div className="max-w-[1200px] mx-auto px-6 pb-20">
        {/* 결과 카운트 */}
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-500">
            총 <span className="font-bold text-gray-900">{subjects.length}</span>개의 학습 콘텐츠
          </p>
        </div>

        {/* 카드 그리드 */}
        <CatalogGrid subjects={subjects} />
      </div>
    </>
  );
}
