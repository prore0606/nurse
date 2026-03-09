import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchSubjectById } from "@/lib/catalogService";
import { formatPrice } from "@/utils/format";
import type { SubjectType } from "@/types";
import PurchaseButton from "./PurchaseButton";

const TYPE_LABEL: Record<SubjectType, string> = {
  theory: "이론",
  problems: "문제풀이",
  videos: "영상 강의",
  packages: "패키지",
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
  const discountPercent = hasDiscount
    ? Math.round((1 - subject.discountPrice! / subject.price) * 100)
    : 0;

  return (
    <>
      {/* 히어로 배너 */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-primary to-blue-600">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-blue-400/15 blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-[1200px] mx-auto px-6 py-14 text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{subject.name}</h1>
          <p className="text-white/60 mt-2 font-medium">{subject.description}</p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* 브레드크럼 */}
        <nav className="text-sm text-gray-400 mb-10 font-medium">
          <Link
            href="/store"
            className="hover:text-primary transition-colors"
          >
            스토어
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span className="text-gray-700">{subject.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* 왼쪽: 이미지 */}
          <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 shadow-sm">
            {subject.imageUrl ? (
              <img
                src={subject.imageUrl}
                alt={subject.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center">
                  <span className="text-6xl opacity-50">📚</span>
                </div>
              </div>
            )}
          </div>

          {/* 오른쪽: 정보 */}
          <div>
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-primary/8 text-primary mb-5">
              {TYPE_LABEL[subject.type]}
            </span>
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight leading-tight">
              {subject.name}
            </h2>
            <p className="text-gray-500 mb-10 leading-relaxed text-base">
              {subject.description}
            </p>

            {/* 가격 블록 */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-7 mb-8">
              {hasDiscount ? (
                <div>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-500/10 text-rose-500 mb-3">
                    {discountPercent}% 할인
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                      {formatPrice(subject.discountPrice!)}
                    </span>
                    <span className="text-lg text-gray-300 line-through font-medium">
                      {formatPrice(subject.price)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                  {formatPrice(subject.price)}
                </span>
              )}
            </div>

            {/* 구매 버튼 */}
            <PurchaseButton
              subjectId={subject.id}
              subjectName={subject.name}
            />
          </div>
        </div>

        {/* 상세 설명 이미지 */}
        {subject.descriptionImages && subject.descriptionImages.length > 0 && (
          <div className="mt-20 space-y-4">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-8 tracking-tight">상세 정보</h2>
            {subject.descriptionImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`상세 이미지 ${i + 1}`}
                className="w-full rounded-2xl"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
