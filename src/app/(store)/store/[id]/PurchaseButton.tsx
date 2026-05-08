"use client";

import { ShoppingCart } from "lucide-react";

export default function PurchaseButton({
  subjectId,
  subjectName,
  price,
}: {
  subjectId: string;
  subjectName: string;
  price: number;
}) {
  const handlePurchase = () => {
    // TODO: 웹 스토어 로그인 연동 후 실제 userId 로 교체
    const userId = "guest";
    const orderId = `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const query = new URLSearchParams({
      subjectId,
      amount: String(price),
      orderId,
      userId,
      orderName: subjectName,
    }).toString();

    window.location.href = `/checkout?${query}`;
  };

  return (
    <button
      onClick={handlePurchase}
      className="group w-full py-4 bg-gradient-to-r from-primary to-blue-600 text-white text-lg font-bold rounded-2xl hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
    >
      <ShoppingCart
        size={20}
        className="group-hover:scale-110 transition-transform"
      />
      구매하기
    </button>
  );
}
