import type { Subject } from "../types";

export const initialSubjects: Subject[] = [
  // 이론
  { id: "t1", type: "theory", name: "두경부", description: "머리와 목 해부학", imageUrl: "", price: 89000, contentCount: 13, chapterCount: 4, isActive: true, order: 1, createdAt: "2024-01-15" },
  { id: "t2", type: "theory", name: "순환계", description: "심장, 혈관, 혈액순환", imageUrl: "", price: 79000, contentCount: 8, chapterCount: 3, isActive: true, order: 2, createdAt: "2024-01-15" },
  { id: "t3", type: "theory", name: "호흡계", description: "폐, 기관지, 호흡기전", imageUrl: "", price: 69000, contentCount: 6, chapterCount: 2, isActive: true, order: 3, createdAt: "2024-01-16" },
  { id: "t4", type: "theory", name: "소화계", description: "위장관 구조와 기능", imageUrl: "", price: 89000, discountPrice: 69000, contentCount: 10, chapterCount: 4, isActive: true, order: 4, createdAt: "2024-01-16" },
  { id: "t5", type: "theory", name: "근골격계", description: "뼈, 근육, 관절", imageUrl: "", price: 99000, discountPrice: 79000, contentCount: 12, chapterCount: 5, isActive: true, order: 5, createdAt: "2024-01-17" },
  { id: "t6", type: "theory", name: "비뇨계", description: "신장, 방광, 요로", imageUrl: "", price: 59000, contentCount: 5, chapterCount: 2, isActive: false, order: 6, createdAt: "2024-01-20" },
  // 문제풀이
  { id: "p1", type: "problems", name: "두경부 문제", description: "두경부 관련 기출 및 모의", imageUrl: "", price: 49000, contentCount: 45, chapterCount: 4, isActive: true, order: 1, createdAt: "2024-02-01" },
  { id: "p2", type: "problems", name: "순환계 문제", description: "심혈관계 문제 모음", imageUrl: "", price: 49000, discountPrice: 39000, contentCount: 32, chapterCount: 3, isActive: true, order: 2, createdAt: "2024-02-01" },
  { id: "p3", type: "problems", name: "호흡계 문제", description: "호흡기 관련 문제", imageUrl: "", price: 39000, contentCount: 28, chapterCount: 2, isActive: true, order: 3, createdAt: "2024-02-02" },
  { id: "p4", type: "problems", name: "약리학 문제", description: "약물 계산 및 분류", imageUrl: "", price: 59000, contentCount: 40, chapterCount: 5, isActive: true, order: 4, createdAt: "2024-02-03" },
  // 영상
  { id: "v1", type: "videos", name: "약리학 강의", description: "약물 계산 시리즈", imageUrl: "", price: 129000, discountPrice: 99000, contentCount: 5, chapterCount: 0, isActive: true, order: 1, createdAt: "2024-02-01" },
  { id: "v2", type: "videos", name: "기본간호학 강의", description: "활력징후, 기본 처치", imageUrl: "", price: 149000, contentCount: 6, chapterCount: 0, isActive: true, order: 2, createdAt: "2024-02-02" },
  { id: "v3", type: "videos", name: "성인간호학 강의", description: "심혈관계 질환", imageUrl: "", price: 99000, contentCount: 4, chapterCount: 0, isActive: true, order: 3, createdAt: "2024-02-03" },
  // 패키지
  { id: "pk1", type: "packages", name: "두경부 올인원", description: "이론+문제+영상 전체 패키지", imageUrl: "", price: 199000, discountPrice: 149000, contentCount: 3, chapterCount: 0, isActive: true, order: 1, createdAt: "2024-02-10" },
  { id: "pk2", type: "packages", name: "순환계 올인원", description: "이론+문제+영상 전체 패키지", imageUrl: "", price: 199000, discountPrice: 159000, contentCount: 3, chapterCount: 0, isActive: true, order: 2, createdAt: "2024-02-10" },
];

export const SUBJECTS_MAP: Record<string, Subject> = Object.fromEntries(
  initialSubjects.map((s) => [s.id, s])
);
