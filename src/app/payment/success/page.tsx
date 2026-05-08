"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (msg: string) => void };
  }
}

function SuccessContent() {
  const params = useSearchParams();
  const paymentKey = params.get("paymentKey") ?? "";
  const orderId    = params.get("orderId") ?? "";
  const amount     = params.get("amount") ?? "";
  const userId     = params.get("userId") ?? "";
  const subjectId  = params.get("subjectId") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      return;
    }
    const confirm = async () => {
      try {
        const res = await fetch("/api/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount), userId, subjectId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "결제 확인 실패");
        setStatus("success");
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "payment_success", orderId, subjectId }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "결제 처리 중 오류가 발생했습니다.";
        setStatus("error");
        setErrorMsg(msg);
        window.ReactNativeWebView?.postMessage(JSON.stringify({ type: "payment_error", message: msg }));
      }
    };
    confirm();
  }, []);

  return (
    <div style={s.page}>
      <div style={s.card}>
        {status === "loading" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={s.spinner} />
            <p style={s.sub}>결제를 확인하는 중입니다...</p>
          </div>
        )}

        {status === "success" && (
          <>
            <div style={s.iconWrap}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={s.ripple} />
            <h1 style={s.title}>결제 완료!</h1>
            <p style={s.sub}>강의를 바로 시작할 수 있습니다.</p>
            <a href="/store" style={s.btn}>스토어로 돌아가기</a>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ ...s.iconWrap, background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 8px 24px rgba(239,68,68,0.28)" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M6 18L18 6M6 6l12 12" stroke="#fff" strokeWidth="2.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 style={s.title}>결제 오류</h1>
            <p style={{ ...s.sub, color: "#ef4444" }}>{errorMsg}</p>
            <a href="/store" style={{ ...s.btn, background: "#6b7280" }}>스토어로 돌아가기</a>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#f8f9fc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: 14 }}>로딩 중...</p>
      </div>
    }>
      <SuccessContent />
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
    position: "relative" as const,
    overflow: "hidden",
  },
  iconWrap: {
    width: 68, height: 68, borderRadius: "50%",
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    boxShadow: "0 8px 24px rgba(34,197,94,0.28)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 24px",
    position: "relative" as const, zIndex: 1,
  },
  ripple: {
    position: "absolute" as const,
    top: "50%", left: "50%",
    transform: "translate(-50%, -50%)",
    width: 200, height: 200, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)",
    pointerEvents: "none" as const,
  },
  title: { fontSize: 26, fontWeight: 800, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.04em" },
  sub: { fontSize: 15, color: "#9ca3af", margin: "0 0 32px", fontWeight: 500 },
  btn: {
    display: "inline-block", padding: "13px 32px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff", textDecoration: "none",
    borderRadius: 14, fontWeight: 700, fontSize: 15,
    boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
    letterSpacing: "-0.01em",
  },
  spinner: {
    width: 40, height: 40,
    border: "3px solid #e5e7eb", borderTop: "3px solid #6366f1",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
    margin: "0 auto 20px",
  },
} as const;
