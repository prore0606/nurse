import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, userId, subjectId } =
      await req.json();

    // ── 필수 파라미터 검증 ──────────────────────────────────
    if (!paymentKey || !orderId || !amount || !userId || !subjectId) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    // ── 1. 토스페이먼츠 결제 승인 API 호출 ─────────────────
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "서버 설정 오류: TOSS_SECRET_KEY 미설정" },
        { status: 500 }
      );
    }

    const basicAuth = Buffer.from(`${secretKey}:`).toString("base64");

    const tossRes = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey,
          orderId,
          amount: Number(amount),
        }),
      }
    );

    if (!tossRes.ok) {
      const tossError = await tossRes.json();
      console.error("[토스 승인 실패]", tossError);
      return NextResponse.json(
        { error: tossError.message ?? "결제 승인 실패" },
        { status: 400 }
      );
    }

    const payment = await tossRes.json();
    console.log("[토스 결제 승인 완료]", payment.orderId, payment.method);

    // ── 2. Supabase service_role 클라이언트 (RLS 우회) ─────
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json(
        { error: "서버 설정 오류: SUPABASE_SERVICE_ROLE_KEY 미설정" },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey
    );

    // ── 3. orders 테이블에 주문 기록 저장 ─────────────────
    const { error: orderError } = await supabase.from("orders").upsert({
      id: orderId,
      user_id: userId,
      subject_id: subjectId,
      amount: Number(amount),
      payment_key: paymentKey,
      status: "paid",
      paid_at: new Date().toISOString(),
    });

    if (orderError) {
      console.error("[orders 저장 실패]", orderError);
      throw orderError;
    }

    // ── 4. user_video_access에 강의 접근 권한 부여 ──────────
    const { error: accessError } = await supabase
      .from("user_video_access")
      .upsert(
        {
          user_id: userId,
          subject_id: subjectId,
          source: "direct",
        },
        { onConflict: "user_id,subject_id" }
      );

    if (accessError) {
      console.error("[user_video_access 저장 실패]", accessError);
      throw accessError;
    }

    return NextResponse.json({ success: true, orderId, subjectId });
  } catch (err: unknown) {
    console.error("[결제 승인 오류]", err);
    const message = err instanceof Error ? err.message : "서버 내부 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
