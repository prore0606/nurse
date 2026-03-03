import Link from "next/link";
import { Search } from "lucide-react";

export const metadata = {
  title: "프로레 스토어",
  description: "간호사 학습 콘텐츠 스토어",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        {/* 1행: 로고 + 검색 */}
        <div className="border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
            {/* 로고 */}
            <Link href="/store" className="shrink-0 flex items-center gap-2">
              <span className="text-2xl font-extrabold text-primary">프로레</span>
              <span className="text-xs text-gray-400 hidden sm:block">간호사 학습 플랫폼</span>
            </Link>

            {/* 검색바 */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full h-10 pl-4 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <Search
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            {/* 우측 여백 (로그인 등 나중에 추가) */}
            <div className="shrink-0 w-20" />
          </div>
        </div>

        {/* 2행: 네비게이션 */}
        <nav className="border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-8 h-12">
            <NavLink href="/store?type=theory">이론</NavLink>
            <NavLink href="/store?type=problems">문제풀이</NavLink>
            <NavLink href="/store?type=videos">영상 강의</NavLink>
            <NavLink href="/store?type=packages">패키지</NavLink>
            <NavLink href="/store">전체</NavLink>
          </div>
        </nav>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="min-h-screen bg-white">{children}</main>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-[1200px] mx-auto px-6 text-center text-sm">
          <p>&copy; 2026 프로레. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-gray-600 hover:text-primary transition-colors py-3 border-b-2 border-transparent hover:border-primary"
    >
      {children}
    </Link>
  );
}
