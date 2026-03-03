"use client";

import PageHeader from "@/components/PageHeader";
import {
  GraduationCap,
  BookOpen,
  HelpCircle,
  Video,
  ShoppingBag,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";

const stats = [
  { label: "과목", value: "8", icon: GraduationCap, href: "/subjects", color: "bg-indigo-50 text-indigo-600" },
  { label: "전체 이론", value: "78", icon: BookOpen, href: "/subjects", color: "bg-blue-50 text-blue-600" },
  { label: "전체 문제", value: "263", icon: HelpCircle, href: "/subjects", color: "bg-green-50 text-green-600" },
  { label: "전체 영상", value: "26", icon: Video, href: "/subjects", color: "bg-purple-50 text-purple-600" },
  { label: "쇼핑 상품", value: "38", icon: ShoppingBag, href: "/shopping", color: "bg-orange-50 text-orange-600" },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="대시보드"
        description="프로레 앱 콘텐츠 관리 현황"
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium text-gray-500">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </Link>
          );
        })}
      </div>

      {/* 빠른 액션 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 액션</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href="/subjects"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <GraduationCap size={20} className="text-indigo-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">과목 관리</p>
              <p className="text-xs text-gray-500">과목별 이론/문제/영상/패키지 관리</p>
            </div>
          </Link>
          <Link
            href="/excel-upload"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <FileSpreadsheet size={20} className="text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">엑셀 대량 업로드</p>
              <p className="text-xs text-gray-500">이론, 문제 일괄 등록</p>
            </div>
          </Link>
          <Link
            href="/shopping"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ShoppingBag size={20} className="text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">쇼핑 상품 관리</p>
              <p className="text-xs text-gray-500">상품 등록 및 재고 관리</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
