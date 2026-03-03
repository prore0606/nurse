import { BookOpen, HelpCircle, Video, Package, Layers } from "lucide-react";
import type { SubjectType } from "../types";

// ─── 과목 목록 탭 정의 ───
export const SUBJECT_TABS: { id: SubjectType | "all"; label: string; icon: React.ReactNode }[] = [
  { id: "all", label: "전체", icon: <Layers size={16} /> },
  { id: "theory", label: "이론", icon: <BookOpen size={16} /> },
  { id: "problems", label: "문제풀이", icon: <HelpCircle size={16} /> },
  { id: "videos", label: "영상", icon: <Video size={16} /> },
  { id: "packages", label: "패키지", icon: <Package size={16} /> },
];

// ─── 과목 타입별 UI 설정 (목록 페이지) ───
export const SUBJECT_TYPE_CONFIG: Record<SubjectType, {
  label: string;
  badgeColor: string;
  iconColor: string;
  icon: React.ReactNode;
}> = {
  theory: { label: "이론", badgeColor: "bg-blue-50 text-blue-700", iconColor: "bg-blue-100 text-blue-600", icon: <BookOpen size={20} /> },
  problems: { label: "문제풀이", badgeColor: "bg-green-50 text-green-700", iconColor: "bg-green-100 text-green-600", icon: <HelpCircle size={20} /> },
  videos: { label: "영상", badgeColor: "bg-purple-50 text-purple-700", iconColor: "bg-purple-100 text-purple-600", icon: <Video size={20} /> },
  packages: { label: "패키지", badgeColor: "bg-orange-50 text-orange-700", iconColor: "bg-orange-100 text-orange-600", icon: <Package size={20} /> },
};

// ─── 과목 상세 타입별 UI 설정 ───
export const DETAIL_TYPE_CONFIG: Record<SubjectType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  addLabel: string;
}> = {
  theory: { label: "이론", icon: <BookOpen size={20} />, color: "text-blue-600", addLabel: "이론 추가" },
  problems: { label: "문제풀이", icon: <HelpCircle size={20} />, color: "text-green-600", addLabel: "문제 추가" },
  videos: { label: "영상", icon: <Video size={20} />, color: "text-purple-600", addLabel: "영상 추가" },
  packages: { label: "패키지", icon: <Package size={20} />, color: "text-orange-600", addLabel: "패키지 추가" },
};

// ─── 콘텐츠 라벨 ───
export const CONTENT_LABEL: Record<SubjectType, string> = {
  theory: "개 이론",
  problems: "개 문제",
  videos: "개 영상",
  packages: "개 항목",
};

// ─── 난이도 설정 ───
export const DIFFICULTY_OPTIONS = [
  { value: "easy" as const, label: "쉬움", activeClass: "bg-green-50 text-green-700 border-green-200" },
  { value: "medium" as const, label: "보통", activeClass: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  { value: "hard" as const, label: "어려움", activeClass: "bg-red-50 text-red-700 border-red-200" },
];

// ─── 쇼핑 카테고리 ───
export const PRODUCT_CATEGORIES = ["학습자료", "도서", "실습용품", "의료기기", "문구류", "기타"];
