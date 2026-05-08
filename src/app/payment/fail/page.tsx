"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

function FailContent() {
  const params = useSearchParams();
  const message = params.get("message") ?? params.get("code") ?? "결제에 실패했습니다.";

  useEffect(() => {
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "payment_fail", message }));
  }, [message]);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.iconWrap}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M6 18L18 6M6 6l12 12" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 style={s.title}>결제 실패</h1>
        <p style={s.sub}>{message}</p>
        <div style={s.tip}>
          카드 정보 또는 잔액을 확인하신 후<br/>다시 시도해 주세요.
        </div>
        <a href="/store" style={s.btn}>스토어로 돌아가기</a>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f8f9fc" }} />}>
      <FailContent />
    </Suspense>
  );
}

const s = {
  page: {
    minHeight: "100vh", background: "#f8f9fc",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: 24,
  },
  card: {
    background: "#fff", borderRadius: 28,
    border: "1px solid rgba(0,0,0,0.06)",
    padding: "52px 36px",
    maxWidth: 400, width: "100%",
    textAlign: "center" as const,
    boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: "50%",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    boxShadow: "0 8px 24px rgba(239,68,68,0.28)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 24px",
  },
  title: { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.04em" },
  sub: { fontSize: 15, color: "#6b7280", margin: "0 0 16px", fontWeight: 500 },
  tip: {
    fontSize: 13, color: "#9ca3af", lineHeight: 1.7,
    background: "#f9fafb", borderRadius: 12, padding: "12px 16px",
    margin: "0 0 28px",
  },
  btn: {
    display: "inline-block", padding: "13px 32px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff", textDecoration: "none",
    borderRadius: 14, fontWeight: 700, fontSize: 15,
    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
    letterSpacing: "-0.01em",
  },
} as const;
