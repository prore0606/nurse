"use client";

import Link from "next/link";
import type { Subject, SubjectType } from "@/types";
import { formatPrice } from "@/utils/format";

const BADGE: Record<SubjectType, { label: string; color: string }> = {
  theory: { label: "이론", color: "bg-blue-50 text-blue-700" },
  problems: { label: "문제풀이", color: "bg-green-50 text-green-700" },
  videos: { label: "영상", color: "bg-purple-50 text-purple-700" },
  packages: { label: "패키지", color: "bg-orange-50 text-orange-700" },
};

function SubjectCard({ subject }: { subject: Subject }) {
  const badge = BADGE[subject.type];
  const hasDiscount =
    subject.discountPrice != null && subject.discountPrice < subject.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - subject.discountPrice! / subject.price) * 100)
    : 0;

  return (
    <Link
      href={`/store/${subject.id}`}
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
    >
      {/* 이미지 */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {subject.imageUrl ? (
          <img
            src={subject.imageUrl}
            alt={subject.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-5xl">📚</span>
          </div>
        )}
        {/* 카테고리 뱃지 */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-medium ${badge.color}`}
        >
          {badge.label}
        </span>
        {/* 할인 뱃지 */}
        {hasDiscount && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
            {discountPercent}%
          </span>
        )}
      </div>

      {/* 콘텐츠 */}
      <div className="p-5">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {subject.name}
        </h3>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {subject.description}
        </p>

        {/* 가격 */}
        <div className="flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-lg font-bold text-gray-900">
                {formatPrice(subject.discountPrice!)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(subject.price)}
              </span>
            </>
          ) : (
            <span className="text-lg font-bold text-gray-900">
              {formatPrice(subject.price)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function CatalogGrid({ subjects }: { subjects: Subject[] }) {
  if (subjects.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-lg">등록된 상품이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((s) => (
        <SubjectCard key={s.id} subject={s} />
      ))}
    </div>
  );
}
