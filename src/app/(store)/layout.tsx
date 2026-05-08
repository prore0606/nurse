import Link from "next/link";

export const metadata = {
  title: "프로리 솔루션",
  description: "간호사 국가고시 완벽 대비 학습 플랫폼",
};

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8f9fc",
      fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      {/* 헤더 */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 1px 12px rgba(0,0,0,0.04)",
      }}>
        <div style={{
          maxWidth: 1080, margin: "0 auto",
          padding: "0 24px", height: 64,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {/* 로고 */}
          <Link href="/store" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg, #6366f1 0%, #4f8ef7 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3L4 7v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7L12 3z" fill="#fff"/>
              </svg>
            </div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em" }}>
                프로리<span style={{ color: "#6366f1" }}> 솔루션</span>
              </span>
            </div>
          </Link>

        </div>
      </header>

      {/* 콘텐츠 */}
      <main>{children}</main>

      {/* 푸터 */}
      <footer style={{ background: "#0f172a", marginTop: 100 }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "52px 24px 36px" }}>
          {/* 상단 */}
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 40, marginBottom: 48 }}>
            <div style={{ maxWidth: 280 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "linear-gradient(135deg, #6366f1, #4f8ef7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3L4 7v5c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V7L12 3z" fill="#fff"/>
                  </svg>
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>프로리 솔루션</span>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.9, color: "#64748b" }}>
                간호사 국가고시 합격을 위한<br/>최고의 학습 콘텐츠를 제공합니다.
              </p>
            </div>

            <div style={{ display: "flex", gap: 56, flexWrap: "wrap" }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, margin: "0 0 14px" }}>카테고리</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { label: "이론", href: "/store?type=theory" },
                    { label: "문제풀이", href: "/store?type=problems" },
                    { label: "영상 강의", href: "/store?type=videos" },
                    { label: "패키지", href: "/store?type=packages" },
                  ].map(item => (
                    <Link key={item.label} href={item.href} style={{ fontSize: 13, color: "#64748b", textDecoration: "none", transition: "color 0.15s" }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, margin: "0 0 14px" }}>고객지원</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {["공지사항", "자주 묻는 질문", "1:1 문의"].map(label => (
                    <span key={label} style={{ fontSize: 13, color: "#64748b" }}>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 하단 */}
          <div style={{ borderTop: "1px solid #1e293b", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <p style={{ fontSize: 12, color: "#334155" }}>© 2026 프로리 솔루션. All rights reserved.</p>
            <div style={{ display: "flex", gap: 16 }}>
              {["이용약관", "개인정보처리방침"].map(label => (
                <span key={label} style={{ fontSize: 12, color: "#334155", cursor: "pointer" }}>{label}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
