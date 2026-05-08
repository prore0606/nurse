"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loadPaymentWidget } from "@tosspayments/payment-widget-sdk";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

function CheckoutContent() {
  const params = useSearchParams();
  const subjectId = params.get("subjectId") ?? "";
  const amount = Number(params.get("amount") ?? 0);
  const orderId = params.get("orderId") ?? "";
  const userId = params.get("userId") ?? "";
  const orderName = params.get("orderName") ?? "과목 구매";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const widgetRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!subjectId || !amount || !orderId || !userId) {
      setError("결제 정보가 올바르지 않습니다.");
      setLoading(false);
      return;
    }
    const init = async () => {
      try {
        const w = await loadPaymentWidget(CLIENT_KEY, userId);
        widgetRef.current = w;
        await w.renderPaymentMethods("#payment-method", { value: amount }, { variantKey: "DEFAULT" });
        await w.renderAgreement("#agreement", { variantKey: "AGREEMENT" });
        setLoading(false);
      } catch {
        setError("결제 수단을 불러오지 못했습니다.");
        setLoading(false);
      }
    };
    init();
  }, []);

  const handlePayment = async () => {
    if (!widgetRef.current || paying) return;
    setPaying(true);
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? window.location.origin;
    try {
      await widgetRef.current.requestPayment({
        orderId,
        orderName,
        successUrl: `${base}/payment/success?userId=${encodeURIComponent(userId)}&subjectId=${encodeURIComponent(subjectId)}`,
        failUrl: `${base}/payment/fail`,
        customerName: "수강생",
      });
    } catch (e: unknown) {
      // 사용자가 결제 취소한 경우 → 상품 페이지로 돌아가기
      const code = (e as { code?: string })?.code;
      const msg = e instanceof Error ? e.message : String(e);
      if (
        code === "PAY_PROCESS_CANCELED" ||
        code === "PAYMENT_CANCELED" ||
        msg.includes("취소") ||
        msg.includes("cancel")
      ) {
        window.location.href = `/store/${subjectId}`;
        return;
      }
      setError(msg || "결제를 완료하지 못했습니다.");
      setPaying(false);
    }
  };

  return (
    <div style={s.page}>
      {/* 헤더 */}
      <header style={s.header}>
        <div style={s.headerInner}>
          <a href={subjectId ? `/store/${subjectId}` : "/store"} style={s.backBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            뒤로
          </a>
          <h1 style={s.headerTitle}>결제하기</h1>
          <div style={{ width: 68 }} />
        </div>
      </header>

      <div style={s.body}>
        {/* 주문 요약 */}
        <div style={s.card}>
          <p style={s.sectionLabel}>주문 상품</p>
          <p style={s.productName}>{orderName}</p>
          <div style={s.divider} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ ...s.sectionLabel, margin: 0 }}>결제 금액</p>
            <p style={s.priceTag}>{amount.toLocaleString()}원</p>
          </div>
        </div>

        {/* 결제 수단 */}
        <div style={s.card}>
          <p style={{ ...s.sectionLabel, marginBottom: 16 }}>결제 수단</p>
          {loading && (
            <div style={s.loadingBox}>
              <div style={s.spinner} />
              <p style={{ color: "#9ca3af", fontSize: 13, marginTop: 14, fontWeight: 500 }}>결제 수단 불러오는 중...</p>
            </div>
          )}
          {error && (
            <div style={s.errorBox}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#ef4444" strokeWidth="2"/>
                <path d="M12 8v4M12 16h.01" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {error}
            </div>
          )}
          <div id="payment-method" />
        </div>

        {/* 약관 */}
        {!loading && !error && (
          <div style={s.card}>
            <div id="agreement" />
          </div>
        )}
      </div>

      {/* 하단 결제 버튼 */}
      {!loading && !error && (
        <div style={s.footer}>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <button
              onClick={handlePayment}
              disabled={paying}
              style={{ ...s.payBtn, opacity: paying ? 0.65 : 1, cursor: paying ? "not-allowed" : "pointer" }}
            >
              {paying ? "처리 중..." : `${amount.toLocaleString()}원 결제하기`}
            </button>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f8f9fc" }}>
        <p style={{ color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>로딩 중...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f8f9fc",
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    paddingBottom: 110,
  },
  header: {
    background: "rgba(255,255,255,0.97)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 1px 8px rgba(0,0,0,0.04)",
    position: "sticky" as const,
    top: 0, zIndex: 50,
  },
  headerInner: {
    maxWidth: 480, margin: "0 auto", padding: "0 20px",
    height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 13, color: "#6b7280", textDecoration: "none",
    fontWeight: 500, width: 68,
  },
  headerTitle: { fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" },
  body: { maxWidth: 480, margin: "0 auto", padding: "20px 16px" },
  card: {
    background: "#fff",
    borderRadius: 20,
    border: "1px solid rgba(0,0,0,0.06)",
    padding: "20px",
    marginBottom: 12,
    boxShadow: "0 1px 6px rgba(0,0,0,0.03)",
  },
  sectionLabel: {
    fontSize: 11, color: "#9ca3af", fontWeight: 700,
    textTransform: "uppercase" as const, letterSpacing: "0.07em",
    margin: "0 0 8px",
  },
  productName: { fontSize: 16, fontWeight: 700, color: "#111827", margin: 0, letterSpacing: "-0.02em" },
  priceTag: { fontSize: 22, fontWeight: 800, color: "#111827", margin: 0, letterSpacing: "-0.03em" },
  divider: { height: 1, background: "#f3f4f6", margin: "16px 0" },
  loadingBox: { display: "flex", flexDirection: "column" as const, alignItems: "center", padding: "36px 0" },
  spinner: {
    width: 32, height: 32,
    border: "3px solid #e5e7eb", borderTop: "3px solid #6366f1",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "11px 14px",
    background: "#fef2f2", borderRadius: 12, border: "1px solid #fecaca",
    color: "#ef4444", fontSize: 13, fontWeight: 500, marginBottom: 8,
  },
  footer: {
    position: "fixed" as const, bottom: 0, left: 0, right: 0,
    background: "rgba(255,255,255,0.97)", backdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(0,0,0,0.06)",
    padding: "12px 16px 28px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.06)",
  },
  payBtn: {
    display: "block", width: "100%", padding: "16px",
    background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
    color: "#fff", fontSize: 16, fontWeight: 700,
    border: "none", borderRadius: 16,
    boxShadow: "0 4px 16px rgba(99,102,241,0.32)",
    letterSpacing: "-0.01em",
  },
} as const;
