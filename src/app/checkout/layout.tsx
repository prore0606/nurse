// 결제 페이지 전용 레이아웃 — 어드민 사이드바 없이 단독 렌더링
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: "#fff", fontFamily: "sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
