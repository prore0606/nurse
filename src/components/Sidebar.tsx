"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Video,
  Package,
  ShoppingBag,
  Settings,
} from "lucide-react";

interface MenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** /subjects?type=xxx 매칭용 */
  matchType?: string;
}

interface MenuSection {
  label?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    items: [
      { href: "/", label: "대시보드", icon: LayoutDashboard },
    ],
  },
  {
    label: "과목",
    items: [
      { href: "/subjects?type=theory", label: "이론", icon: BookOpen, matchType: "theory" },
      { href: "/subjects?type=problems", label: "문제풀이", icon: HelpCircle, matchType: "problems" },
      { href: "/subjects?type=videos", label: "영상 강의", icon: Video, matchType: "videos" },
      { href: "/subjects?type=packages", label: "패키지", icon: Package, matchType: "packages" },
    ],
  },
  {
    items: [
      { href: "/shopping", label: "쇼핑 상품", icon: ShoppingBag },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isItemActive = (item: MenuItem) => {
    if (item.matchType) {
      return pathname.startsWith("/subjects") && searchParams.get("type") === item.matchType;
    }
    return pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-sidebar-bg text-sidebar-text flex flex-col z-50">
      {/* 로고 */}
      <div className="h-16 flex items-center px-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-white">프로리 솔루션</h1>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {menuSections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <div className="px-6 pt-5 pb-2">
                <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{section.label}</span>
              </div>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-sidebar-active text-white font-medium"
                      : "text-sidebar-text hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* 설정 */}
      <div className="border-t border-gray-700 py-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-6 py-2.5 text-sm text-sidebar-text hover:bg-gray-700 hover:text-white transition-colors"
        >
          <Settings size={18} />
          <span>설정</span>
        </Link>
      </div>
    </aside>
  );
}
