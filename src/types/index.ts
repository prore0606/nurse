// ─── Subject Types ───
export type SubjectType = "theory" | "problems" | "videos" | "packages";

export interface Subject {
  id: string;
  type: SubjectType;
  name: string;
  description: string;
  imageUrl: string;
  descriptionImages?: string[];
  price: number;
  discountPrice?: number;
  contentCount: number;
  chapterCount: number;
  isActive: boolean;
  order: number;
  createdAt: string;
}

// ─── Theory (계층 구조: Chapter → Topic, prore-app과 동일) ───
export interface TheoryTopic {
  id: string;
  title: string;
  contentType: "file" | "text" | "mixed";
  contentUrls: string[];   // Supabase Storage URL 배열
  body: string;
  hasNote: boolean;
  orderNum: number;
}

export interface TheoryChapter {
  id: string;
  number: number;
  title: string;
  orderNum: number;
  topics: TheoryTopic[];
}

// 하위 호환용 (기존 flat 구조 - 점진적 제거 예정)
export interface Theory {
  id: string;
  chapter: string;
  title: string;
  body: string;
  images: string[];
  contentType: "text" | "image" | "mixed";
  order: number;
  isActive: boolean;
}

// ─── Problem ───
export interface ProblemChoice {
  text: string;
  image: string;
}

export type Difficulty = "easy" | "medium" | "hard";

export interface Problem {
  id: string;
  chapter: string;
  question: string;
  questionImage: string;
  choices: ProblemChoice[];
  answer: number;
  explanation: string;
  explanationImage: string;
  difficulty: Difficulty;
  isActive: boolean;
}

// ─── Lecture (prore-app 구조와 동일 + admin 전용 필드) ───
export interface Lecture {
  id: string;
  number: number;          // 전역 순서 (1, 2, 3...)
  title: string;
  duration: string;        // "15:30"
  videoUrl: string;        // "https://vimeo.com/123456789"
  // admin 전용 (DB에 저장, 앱에서는 미사용)
  thumbnailUrl: string;
  instructor: string;
  description: string;
}

// ─── VideoSection (prore-app과 동일) ───
export interface VideoSection {
  id: string;
  title: string;           // "01. 약물계산 기초"
  lectures: Lecture[];
}

// ─── ContentPackage ───
export interface ContentPackage {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  discountPrice?: number;
  includesTheory: boolean;
  includesProblems: boolean;
  includesVideos: boolean;
  isActive: boolean;
}

// ─── Shopping ───
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  stock: number;
  imageUrl: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

// ─── Excel Upload ───
export type UploadType = SubjectType;

export interface ParsedRow {
  [key: string]: string | number | boolean;
}

export interface UploadResult {
  total: number;
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export interface UploadTypeConfig {
  id: UploadType;
  label: string;
  description: string;
  templateColumns: string[];
  columnDescriptions: string[];
}
