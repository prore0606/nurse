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
      <div className="bg-primary">
        <div className="max-w-[1200px] mx-auto px-6 py-12 text-center">
          <h1 className="text-2xl font-bold text-white">{subject.name}</h1>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {/* 브레드크럼 */}
        <nav className="text-sm text-gray-500 mb-8">
          <Link
            href="/store"
            className="hover:text-primary transition-colors"
          >
            스토어
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{subject.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* 왼쪽: 이미지 */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100">
            {subject.imageUrl ? (
              <img
                src={subject.imageUrl}
                alt={subject.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
                📚
              </div>
            )}
          </div>

          {/* 오른쪽: 정보 */}
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-4">
              {TYPE_LABEL[subject.type]}
            </span>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {subject.name}
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              {subject.description}
            </p>

            {/* 가격 블록 */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              {hasDiscount ? (
                <div>
                  <span className="text-sm text-red-500 font-bold mb-1 block">
                    {discountPercent}% 할인
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(subject.discountPrice!)}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      {formatPrice(subject.price)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
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
          <div className="mt-16 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 mb-6">상세 정보</h2>
            {subject.descriptionImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`상세 이미지 ${i + 1}`}
                className="w-full rounded-lg"
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
