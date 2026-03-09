"use client";

import { ShoppingCart } from "lucide-react";

const PAYMENT_BASE_URL =
  process.env.NEXT_PUBLIC_PAYMENT_URL ?? "https://pay.toss.im";

export default function PurchaseButton({
  subjectId,
  subjectName,
}: {
  subjectId: string;
  subjectName: string;
}) {
  const handlePurchase = () => {
    const url = `${PAYMENT_BASE_URL}?orderId=${subjectId}&orderName=${encodeURIComponent(subjectName)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handlePurchase}
      className="group w-full py-4 bg-gradient-to-r from-primary to-blue-600 text-white text-lg font-bold rounded-2xl hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
    >
      <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
      구매하기
    </button>
  );
}
