import type { Subject } from "../types";

export const initialSubjects: Subject[] = [
  // 이론 - Supabase에서 로드 (video_subjects type='theory')
  // 문제풀이 - Supabase에서 로드 (video_subjects type='problems')
  // 영상 - Supabase에서 로드 (video_subjects type='videos')
  // 패키지
  { id: "pk1", type: "packages", name: "두경부 올인원", description: "이론+문제+영상 전체 패키지", imageUrl: "", price: 199000, discountPrice: 149000, contentCount: 3, chapterCount: 0, isActive: true, order: 1, createdAt: "2024-02-10" },
  { id: "pk2", type: "packages", name: "순환계 올인원", description: "이론+문제+영상 전체 패키지", imageUrl: "", price: 199000, discountPrice: 159000, contentCount: 3, chapterCount: 0, isActive: true, order: 2, createdAt: "2024-02-10" },
];

export const SUBJECTS_MAP: Record<string, Subject> = Object.fromEntries(
  initialSubjects.map((s) => [s.id, s])
);
