"use client";

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
      className="w-full py-4 bg-primary text-white text-lg font-bold rounded-xl hover:bg-primary-hover transition-colors cursor-pointer"
    >
      구매하기
    </button>
  );
}
