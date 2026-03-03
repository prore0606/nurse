import type { UploadTypeConfig } from "../types";

export const UPLOAD_TYPES: UploadTypeConfig[] = [
  {
    id: "theory",
    label: "이론",
    description: "과목, 챕터, 제목, 본문 내용을 일괄 등록",
    templateColumns: ["과목명", "챕터", "제목", "본문내용", "이미지URL(여러개는;구분)", "콘텐츠유형(text/image/mixed)"],
    columnDescriptions: ["해당 과목 이름", "챕터 번호 또는 이름", "이론 제목", "본문 텍스트 내용", "이미지 URL (여러 개면 세미콜론으로 구분)", "text, image, mixed 중 택 1"],
  },
  {
    id: "problems",
    label: "문제풀이",
    description: "문제, 선택지(텍스트/이미지), 정답, 해설을 일괄 등록",
    templateColumns: ["과목명", "챕터", "문제내용", "문제이미지URL", "선택지1", "선택지1_이미지URL", "선택지2", "선택지2_이미지URL", "선택지3", "선택지3_이미지URL", "선택지4", "선택지4_이미지URL", "선택지5", "선택지5_이미지URL", "정답번호", "해설", "해설이미지URL", "난이도(easy/medium/hard)"],
    columnDescriptions: ["해당 과목 이름", "챕터 번호 또는 이름", "문제 텍스트", "문제 이미지 URL (없으면 비워두기)", "선택지1 텍스트", "선택지1 이미지 URL", "선택지2 텍스트", "선택지2 이미지 URL", "선택지3 텍스트", "선택지3 이미지 URL", "선택지4 텍스트", "선택지4 이미지 URL", "선택지5 텍스트", "선택지5 이미지 URL", "정답 번호 (1~5)", "해설 텍스트", "해설 이미지 URL", "easy, medium, hard 중 택 1"],
  },
  {
    id: "videos",
    label: "영상",
    description: "영상 강의 정보를 섹션별로 일괄 등록",
    templateColumns: ["과목명", "섹션명", "순서번호", "강의제목", "설명", "강사", "비메오URL", "썸네일URL", "재생시간(MM:SS)"],
    columnDescriptions: ["해당 과목 이름", "섹션 이름 (예: 01. 약물계산 기초)", "전역 강의 순서 (1, 2, 3...)", "강의 제목", "강의 설명 텍스트", "강사 이름", "Vimeo 전체 URL (예: https://vimeo.com/123456789)", "썸네일 이미지 URL", "재생시간 (MM:SS 형식)"],
  },
  {
    id: "packages",
    label: "패키지",
    description: "패키지 상품 정보를 일괄 등록",
    templateColumns: ["과목명", "패키지명", "설명", "이미지URL", "가격", "할인가격", "포함항목(이론/문제/영상 ;구분)"],
    columnDescriptions: ["해당 과목 이름", "패키지 이름", "패키지 설명", "패키지 이미지 URL", "정가 (원)", "할인가 (없으면 비워두기)", "포함되는 콘텐츠 (이론, 문제, 영상을 세미콜론으로 구분)"],
  },
];
