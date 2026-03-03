import type { Product } from "../types";

export const initialProducts: Product[] = [
  { id: "1", name: "해부학 포스터 세트", category: "학습자료", price: 25000, discountPrice: 19900, stock: 150, imageUrl: "", isActive: true, isFeatured: true, createdAt: "2024-02-01" },
  { id: "2", name: "간호 실습 키트", category: "실습용품", price: 89000, stock: 50, imageUrl: "", isActive: true, isFeatured: true, createdAt: "2024-02-02" },
  { id: "3", name: "의학용어 플래시카드", category: "학습자료", price: 15000, discountPrice: 12000, stock: 300, imageUrl: "", isActive: true, isFeatured: false, createdAt: "2024-02-03" },
  { id: "4", name: "청진기 (리트만 클래식)", category: "의료기기", price: 180000, stock: 30, imageUrl: "", isActive: true, isFeatured: true, createdAt: "2024-02-04" },
  { id: "5", name: "간호학 핵심 요약집", category: "도서", price: 35000, discountPrice: 29000, stock: 200, imageUrl: "", isActive: true, isFeatured: false, createdAt: "2024-02-05" },
  { id: "6", name: "혈압계 디지털", category: "의료기기", price: 45000, stock: 0, imageUrl: "", isActive: false, isFeatured: false, createdAt: "2024-02-06" },
];
