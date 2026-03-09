"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Subject, SubjectType } from "@/types";
import { formatPrice } from "@/utils/format";

const BADGE: Record<SubjectType, { label: string; color: string }> = {
  theory: { label: "이론", color: "text-indigo-600" },
  problems: { label: "문제풀이", color: "text-emerald-600" },
  videos: { label: "영상", color: "text-violet-600" },
  packages: { label: "패키지", color: "text-amber-600" },
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
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/80 hover:-translate-y-1.5 transition-all duration-300"
    >
      {/* 이미지 */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {subject.imageUrl ? (
          <img
            src={subject.imageUrl}
            alt={subject.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-500/10 flex items-center justify-center">
              <span className="text-4xl opacity-60">📚</span>
            </div>
          </div>
        )}

        {/* 카테고리 뱃지 - Glassmorphism */}
        <span
          className={`absolute top-3 left-3 px-3 py-1 rounded-lg text-xs font-bold bg-white/80 backdrop-blur-md border border-white/40 ${badge.color}`}
        >
          {badge.label}
        </span>

        {/* 할인 뱃지 */}
        {hasDiscount && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-rose-500 text-white shadow-lg shadow-rose-500/30">
            {discountPercent}%
          </span>
        )}

        {/* Hover CTA 오버레이 */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <span className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm text-sm font-bold text-gray-900 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
            자세히 보기 <ArrowRight size={14} />
          </span>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="p-5 pt-4">
        <h3 className="font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-primary transition-colors duration-200 tracking-tight">
          {subject.name}
        </h3>
        <p className="text-sm text-gray-400 mb-5 line-clamp-2 leading-relaxed">
          {subject.description}
        </p>

        {/* 가격 */}
        <div className="flex items-baseline gap-2.5">
          {hasDiscount ? (
            <>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight">
                {formatPrice(subject.discountPrice!)}
              </span>
              <span className="text-sm text-gray-300 line-through font-medium">
                {formatPrice(subject.price)}
              </span>
              <span className="text-xs font-extrabold text-rose-500 ml-auto">
                {discountPercent}% OFF
              </span>
            </>
          ) : (
            <span className="text-xl font-extrabold text-gray-900 tracking-tight">
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
      <div className="text-center py-32">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-3xl opacity-40">📦</span>
        </div>
        <p className="text-gray-400 text-lg font-medium">등록된 상품이 없습니다</p>
        <p className="text-gray-300 text-sm mt-1">곧 새로운 콘텐츠가 업데이트됩니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
      {subjects.map((s) => (
        <SubjectCard key={s.id} subject={s} />
      ))}
    </div>
  );
}
