import { supabase } from "./supabase";
import type { Subject, SubjectType, VideoSection, Lecture } from "../types";

// ─── DB 행 ↔ 프론트엔드 타입 변환 ───

function toSubject(row: Record<string, unknown>): Subject {
  return {
    id: row.id as string,
    type: (row.type as SubjectType) ?? "videos",
    name: row.name as string,
    description: (row.description as string) ?? "",
    imageUrl: (row.image_url as string) ?? "",
    price: (row.price as number) ?? 0,
    discountPrice: (row.discount_price as number) ?? undefined,
    isActive: (row.is_active as boolean) ?? true,
    order: (row.order_num as number) ?? 0,
    contentCount: 0,   // 아래에서 별도 계산
    chapterCount: 0,
    createdAt: ((row.created_at as string) ?? "").split("T")[0],
  };
}

function toLecture(row: Record<string, unknown>): Lecture {
  return {
    id: row.id as string,
    number: (row.number as number) ?? 0,
    title: row.title as string,
    duration: (row.duration as string) ?? "",
    videoUrl: (row.video_url as string) ?? "",
    thumbnailUrl: (row.thumbnail_url as string) ?? "",
    instructor: (row.instructor as string) ?? "",
    description: (row.description as string) ?? "",
  };
}

function toVideoSection(
  sectionRow: Record<string, unknown>,
  lectures: Lecture[],
): VideoSection {
  return {
    id: sectionRow.id as string,
    title: sectionRow.title as string,
    lectures,
  };
}

// ─── video_subjects CRUD ───

export async function fetchVideoSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from("video_subjects")
    .select("*")
    .order("order_num", { ascending: true });

  if (error) throw error;
  if (!data) return [];

  // 각 과목별 강의 수 가져오기
  const subjects = data.map(toSubject);
  for (const subject of subjects) {
    const { count } = await supabase
      .from("video_lectures")
      .select("id", { count: "exact", head: true })
      .in(
        "section_id",
        (
          await supabase
            .from("video_sections")
            .select("id")
            .eq("subject_id", subject.id)
        ).data?.map((s) => s.id) ?? [],
      );
    subject.contentCount = count ?? 0;

    const { count: sectionCount } = await supabase
      .from("video_sections")
      .select("id", { count: "exact", head: true })
      .eq("subject_id", subject.id);
    subject.chapterCount = sectionCount ?? 0;
  }

  return subjects;
}

export async function createVideoSubject(
  subject: Omit<Subject, "type" | "contentCount" | "chapterCount" | "createdAt">,
): Promise<Subject> {
  const { data, error } = await supabase
    .from("video_subjects")
    .insert({
      id: subject.id,
      name: subject.name,
      description: subject.description,
      image_url: subject.imageUrl,
      price: subject.price,
      discount_price: subject.discountPrice ?? null,
      is_active: subject.isActive,
      order_num: subject.order,
      type: "videos",
    })
    .select()
    .single();

  if (error) throw error;
  return toSubject(data);
}

export async function updateVideoSubject(
  id: string,
  updates: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    price: number;
    discountPrice: number | null;
    isActive: boolean;
    order: number;
  }>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.discountPrice !== undefined) dbUpdates.discount_price = updates.discountPrice;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.order !== undefined) dbUpdates.order_num = updates.order;

  const { error } = await supabase
    .from("video_subjects")
    .update(dbUpdates)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteVideoSubject(id: string): Promise<void> {
  const { error } = await supabase
    .from("video_subjects")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// ─── video_sections + video_lectures (과목별 전체 로드) ───

export async function fetchSectionsWithLectures(
  subjectId: string,
): Promise<VideoSection[]> {
  const { data: sectionRows, error: sErr } = await supabase
    .from("video_sections")
    .select("*")
    .eq("subject_id", subjectId)
    .order("order_num", { ascending: true });

  if (sErr) throw sErr;
  if (!sectionRows || sectionRows.length === 0) return [];

  const sectionIds = sectionRows.map((s) => s.id);
  const { data: lectureRows, error: lErr } = await supabase
    .from("video_lectures")
    .select("*")
    .in("section_id", sectionIds)
    .order("order_num", { ascending: true });

  if (lErr) throw lErr;

  const lectureMap = new Map<string, Lecture[]>();
  for (const row of lectureRows ?? []) {
    const sectionId = row.section_id as string;
    if (!lectureMap.has(sectionId)) lectureMap.set(sectionId, []);
    lectureMap.get(sectionId)!.push(toLecture(row));
  }

  return sectionRows.map((row) =>
    toVideoSection(row, lectureMap.get(row.id as string) ?? []),
  );
}

// ─── video_sections CRUD ───

export async function createSection(
  subjectId: string,
  id: string,
  title: string,
  orderNum: number,
): Promise<void> {
  const { error } = await supabase.from("video_sections").insert({
    id,
    subject_id: subjectId,
    title,
    order_num: orderNum,
  });
  if (error) throw error;
}

export async function updateSection(
  id: string,
  title: string,
): Promise<void> {
  const { error } = await supabase
    .from("video_sections")
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteSection(id: string): Promise<void> {
  const { error } = await supabase
    .from("video_sections")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ─── video_lectures CRUD ───

export async function createLecture(
  sectionId: string,
  lecture: Lecture,
  orderNum: number,
): Promise<void> {
  const { error } = await supabase.from("video_lectures").insert({
    id: lecture.id,
    section_id: sectionId,
    number: lecture.number,
    title: lecture.title,
    duration: lecture.duration,
    video_url: lecture.videoUrl,
    thumbnail_url: lecture.thumbnailUrl,
    instructor: lecture.instructor,
    description: lecture.description,
    order_num: orderNum,
  });
  if (error) throw error;
}

export async function updateLecture(
  id: string,
  updates: Partial<Lecture>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.number !== undefined) dbUpdates.number = updates.number;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.duration !== undefined) dbUpdates.duration = updates.duration;
  if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
  if (updates.thumbnailUrl !== undefined) dbUpdates.thumbnail_url = updates.thumbnailUrl;
  if (updates.instructor !== undefined) dbUpdates.instructor = updates.instructor;
  if (updates.description !== undefined) dbUpdates.description = updates.description;

  const { error } = await supabase
    .from("video_lectures")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteLecture(id: string): Promise<void> {
  const { error } = await supabase
    .from("video_lectures")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** 섹션 내 강의들의 number를 일괄 업데이트 */
export async function renumberLectures(
  lectures: { id: string; number: number; orderNum: number }[],
): Promise<void> {
  for (const l of lectures) {
    const { error } = await supabase
      .from("video_lectures")
      .update({ number: l.number, order_num: l.orderNum })
      .eq("id", l.id);
    if (error) throw error;
  }
}

/** 섹션들의 order_num을 일괄 업데이트 */
export async function renumberSections(
  sections: { id: string; orderNum: number }[],
): Promise<void> {
  for (const s of sections) {
    const { error } = await supabase
      .from("video_sections")
      .update({ order_num: s.orderNum })
      .eq("id", s.id);
    if (error) throw error;
  }
}
