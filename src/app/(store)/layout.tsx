import Link from "next/link";
import { Search } from "lucide-react";

export const metadata = {
  title: "프로리 솔루션",
  description: "프로리 솔루션 스토어",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/60">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* 로고 */}
          <Link href="/store" className="shrink-0">
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              프로리 솔루션
            </span>
          </Link>

          {/* 검색바 */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                placeholder="강의, 문제풀이 검색"
                className="w-full h-10 pl-4 pr-10 bg-gray-100/80 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white transition-all placeholder:text-gray-400"
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
      </header>

      {/* 메인 콘텐츠 */}
      <main className="min-h-screen bg-gray-50/50">{children}</main>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-[1200px] mx-auto px-6 py-16">
          <div className="flex items-start justify-between mb-10">
            <div>
              <span className="text-xl font-extrabold text-white tracking-tight">프로리 솔루션</span>
              <p className="text-sm text-gray-500 mt-2">간호사 국가고시 합격의 시작</p>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-sm text-gray-500">
            <p>&copy; 2026 프로리 솔루션. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}

