import { supabase } from "./supabase";
import type {
  ProblemSection,
  ProblemQuestion,
  ProblemQuestionChoice,
  Difficulty,
} from "../types";

// ─── DB 행 → 프론트엔드 타입 변환 ───

function toQuestion(row: Record<string, unknown>): ProblemQuestion {
  return {
    id: row.id as string,
    number: (row.number as number) ?? 0,
    text: (row.text as string) ?? "",
    textImage: (row.text_image as string) ?? "",
    choices: (row.choices as ProblemQuestionChoice[]) ?? [],
    correctAnswer: (row.correct_answer as string) ?? "",
    explanation: (row.explanation as string) ?? "",
    explanationImage: (row.explanation_image as string) ?? "",
    difficulty: ((row.difficulty as string) ?? "medium") as Difficulty,
    orderNum: (row.order_num as number) ?? 0,
  };
}

function toSection(
  row: Record<string, unknown>,
  questions: ProblemQuestion[],
): ProblemSection {
  return {
    id: row.id as string,
    title: (row.title as string) ?? "",
    orderNum: (row.order_num as number) ?? 0,
    questions,
  };
}

// ─── 섹션 + 문제 전체 로드 (과목별) ───

export async function fetchSectionsWithQuestions(
  subjectId: string,
): Promise<ProblemSection[]> {
  const { data: sectionRows, error: sErr } = await supabase
    .from("problem_sections")
    .select("*")
    .eq("subject_id", subjectId)
    .order("order_num", { ascending: true });

  if (sErr) throw sErr;
  if (!sectionRows || sectionRows.length === 0) return [];

  const sectionIds = sectionRows.map((s) => s.id);
  const { data: questionRows, error: qErr } = await supabase
    .from("problem_questions")
    .select("*")
    .in("section_id", sectionIds)
    .order("order_num", { ascending: true });

  if (qErr) throw qErr;

  const questionMap = new Map<string, ProblemQuestion[]>();
  for (const row of questionRows ?? []) {
    const sectionId = row.section_id as string;
    if (!questionMap.has(sectionId)) questionMap.set(sectionId, []);
    questionMap.get(sectionId)!.push(toQuestion(row));
  }

  return sectionRows.map((row) =>
    toSection(row, questionMap.get(row.id as string) ?? []),
  );
}

// ─── problem_sections CRUD ───

export async function createSection(
  subjectId: string,
  id: string,
  title: string,
  orderNum: number,
): Promise<void> {
  const { error } = await supabase.from("problem_sections").insert({
    id,
    subject_id: subjectId,
    title,
    order_num: orderNum,
  });
  if (error) throw error;
}

export async function updateSection(
  id: string,
  updates: Partial<{ title: string }>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  const { error } = await supabase
    .from("problem_sections")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSection(id: string): Promise<void> {
  const { error } = await supabase
    .from("problem_sections")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function renumberSections(
  sections: { id: string; orderNum: number }[],
): Promise<void> {
  for (const s of sections) {
    const { error } = await supabase
      .from("problem_sections")
      .update({ order_num: s.orderNum })
      .eq("id", s.id);
    if (error) throw error;
  }
}

// ─── problem_questions CRUD ───

export async function createQuestion(
  sectionId: string,
  question: {
    id: string;
    number: number;
    text: string;
    textImage: string;
    choices: ProblemQuestionChoice[];
    correctAnswer: string;
    explanation: string;
    explanationImage: string;
    difficulty: Difficulty;
    orderNum: number;
  },
): Promise<void> {
  const { error } = await supabase.from("problem_questions").insert({
    id: question.id,
    section_id: sectionId,
    number: question.number,
    text: question.text,
    text_image: question.textImage,
    choices: question.choices,
    correct_answer: question.correctAnswer,
    explanation: question.explanation,
    explanation_image: question.explanationImage,
    difficulty: question.difficulty,
    order_num: question.orderNum,
  });
  if (error) throw error;
}

export async function updateQuestion(
  id: string,
  updates: Partial<{
    number: number;
    text: string;
    textImage: string;
    choices: ProblemQuestionChoice[];
    correctAnswer: string;
    explanation: string;
    explanationImage: string;
    difficulty: Difficulty;
  }>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.number !== undefined) dbUpdates.number = updates.number;
  if (updates.text !== undefined) dbUpdates.text = updates.text;
  if (updates.textImage !== undefined) dbUpdates.text_image = updates.textImage;
  if (updates.choices !== undefined) dbUpdates.choices = updates.choices;
  if (updates.correctAnswer !== undefined) dbUpdates.correct_answer = updates.correctAnswer;
  if (updates.explanation !== undefined) dbUpdates.explanation = updates.explanation;
  if (updates.explanationImage !== undefined) dbUpdates.explanation_image = updates.explanationImage;
  if (updates.difficulty !== undefined) dbUpdates.difficulty = updates.difficulty;

  const { error } = await supabase
    .from("problem_questions")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from("problem_questions")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function renumberQuestions(
  questions: { id: string; orderNum: number; number: number }[],
): Promise<void> {
  for (const q of questions) {
    const { error } = await supabase
      .from("problem_questions")
      .update({ order_num: q.orderNum, number: q.number })
      .eq("id", q.id);
    if (error) throw error;
  }
}

// ─── 엑셀 대량 등록 ───

export async function bulkInsertProblems(
  subjectId: string,
  rows: {
    sectionTitle: string;
    questionText: string;
    questionImage?: string;
    choices: { id: string; text: string; image?: string }[];
    correctAnswer: string;
    explanation?: string;
    explanationImage?: string;
    difficulty?: Difficulty;
  }[],
): Promise<{ success: number; failed: number; errors: { row: number; message: string }[] }> {
  const result = { success: 0, failed: 0, errors: [] as { row: number; message: string }[] };

  // 기존 섹션 로드
  const { data: existingSections } = await supabase
    .from("problem_sections")
    .select("*")
    .eq("subject_id", subjectId)
    .order("order_num", { ascending: true });

  const sectionMap = new Map<string, string>(); // title → id
  let nextSectionOrder = (existingSections?.length ?? 0);
  for (const s of existingSections ?? []) {
    sectionMap.set(s.title as string, s.id as string);
  }

  // 섹션별 현재 문제 수 추적
  const questionCountMap = new Map<string, number>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      // 섹션 가져오기 또는 생성
      let sectionId = sectionMap.get(row.sectionTitle);
      if (!sectionId) {
        sectionId = crypto.randomUUID();
        await createSection(subjectId, sectionId, row.sectionTitle, nextSectionOrder++);
        sectionMap.set(row.sectionTitle, sectionId);
      }

      // 문제 번호 계산
      const currentCount = questionCountMap.get(sectionId) ?? 0;
      const questionNumber = currentCount + 1;
      questionCountMap.set(sectionId, questionNumber);

      // 문제 생성
      await createQuestion(sectionId, {
        id: crypto.randomUUID(),
        number: questionNumber,
        text: row.questionText,
        textImage: row.questionImage ?? "",
        choices: row.choices.map((c) => ({
          id: c.id,
          text: c.text,
          image: c.image,
        })),
        correctAnswer: row.correctAnswer,
        explanation: row.explanation ?? "",
        explanationImage: row.explanationImage ?? "",
        difficulty: row.difficulty ?? "medium",
        orderNum: questionNumber - 1,
      });

      result.success++;
    } catch (err) {
      result.failed++;
      result.errors.push({
        row: i + 1,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return result;
}

// ─── 문제 과목 통계 ───

export async function fetchProblemSubjectCounts(subjectId: string) {
  const { count: sectionCount } = await supabase
    .from("problem_sections")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subjectId);

  const sectionIds =
    (
      await supabase
        .from("problem_sections")
        .select("id")
        .eq("subject_id", subjectId)
    ).data?.map((s) => s.id) ?? [];

  let questionCount = 0;
  if (sectionIds.length > 0) {
    const { count } = await supabase
      .from("problem_questions")
      .select("id", { count: "exact", head: true })
      .in("section_id", sectionIds);
    questionCount = count ?? 0;
  }

  return { sectionCount: sectionCount ?? 0, questionCount };
}
