import type { Theory, Problem, Lecture, VideoSection, ContentPackage } from "../types";

export const mockTheories: Theory[] = [
  {
    id: "t1", chapter: "머리뼈", title: "두개골 구조와 봉합",
    body: "두개골은 총 22개의 뼈로 구성되어 있으며, 크게 뇌두개골(8개)과 안면두개골(14개)로 나뉩니다.\n\n뇌두개골은 전두골, 두정골(2), 측두골(2), 후두골, 접형골, 사골로 구성됩니다.",
    images: [], contentType: "text", order: 1, isActive: true,
  },
  {
    id: "t2", chapter: "머리뼈", title: "뇌두개골 8개 뼈",
    body: "1. 전두골 (Frontal bone) - 이마를 형성\n2. 두정골 (Parietal bone) × 2 - 머리 위를 형성\n3. 측두골 (Temporal bone) × 2 - 귀 주변\n4. 후두골 (Occipital bone) - 머리 뒤\n5. 접형골 (Sphenoid bone) - 두개저 중앙\n6. 사골 (Ethmoid bone) - 코 주변",
    images: [], contentType: "text", order: 2, isActive: true,
  },
  {
    id: "t3", chapter: "목뼈", title: "경추 C1~C7 구조",
    body: "경추는 7개의 뼈로 구성되며, C1(환추)과 C2(축추)는 특수한 구조를 가집니다.",
    images: [], contentType: "mixed", order: 1, isActive: true,
  },
];

export const mockProblems: Problem[] = [
  {
    id: "p1", chapter: "머리뼈", question: "두개골을 구성하는 뼈의 총 개수는?",
    questionImage: "",
    choices: [{ text: "20개", image: "" }, { text: "22개", image: "" }, { text: "24개", image: "" }, { text: "26개", image: "" }],
    answer: 1, explanation: "두개골은 총 22개의 뼈로 구성 (뇌두개골 8개 + 안면두개골 14개)",
    explanationImage: "", difficulty: "easy", isActive: true,
  },
  {
    id: "p2", chapter: "머리뼈", question: "접형골(sphenoid bone)의 위치로 올바른 것은?",
    questionImage: "",
    choices: [{ text: "이마 부위", image: "" }, { text: "머리 위", image: "" }, { text: "두개저 중앙", image: "" }, { text: "머리 뒤", image: "" }, { text: "귀 주변", image: "" }],
    answer: 2, explanation: "접형골은 두개저 중앙에 위치하여 나비 모양을 하고 있습니다",
    explanationImage: "", difficulty: "medium", isActive: true,
  },
];

export const mockVideoSections: VideoSection[] = [
  {
    id: "vs1",
    title: "01. 해부학 개요",
    lectures: [
      { id: "v1", number: 1, title: "해부학 개요 1강", duration: "45:30", videoUrl: "https://vimeo.com/123456789", thumbnailUrl: "", instructor: "김교수", description: "해부학 기본 개념과 용어를 학습합니다" },
      { id: "v2", number: 2, title: "해부학 개요 2강", duration: "52:15", videoUrl: "https://vimeo.com/123456790", thumbnailUrl: "", instructor: "김교수", description: "인체 주요 기관의 위치와 기능" },
    ],
  },
  {
    id: "vs2",
    title: "02. 근골격계",
    lectures: [
      { id: "v3", number: 3, title: "근골격계 구조", duration: "38:20", videoUrl: "https://vimeo.com/123456791", thumbnailUrl: "", instructor: "김교수", description: "뼈와 근육의 기본 구조" },
      { id: "v4", number: 4, title: "관절과 인대", duration: "41:10", videoUrl: "https://vimeo.com/123456792", thumbnailUrl: "", instructor: "김교수", description: "관절의 종류와 인대의 역할" },
    ],
  },
];

export const mockPackages: ContentPackage[] = [
  { id: "pk1", name: "해부학 올인원", description: "이론+문제+영상 전체 패키지", imageUrl: "", price: 49000, discountPrice: 39000, includesTheory: true, includesProblems: true, includesVideos: true, isActive: true },
];
