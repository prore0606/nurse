import { supabase } from "./supabase";
import type { TheoryChapter, TheoryTopic } from "../types";

// ─── DB 행 → 프론트엔드 타입 변환 ───

function toTopic(row: Record<string, unknown>): TheoryTopic {
  return {
    id: row.id as string,
    title: row.title as string,
    contentType: (row.content_type as TheoryTopic["contentType"]) ?? "file",
    contentUrls: (row.content_urls as string[]) ?? [],
    body: (row.body as string) ?? "",
    hasNote: (row.has_note as boolean) ?? false,
    orderNum: (row.order_num as number) ?? 0,
  };
}

function toChapter(
  row: Record<string, unknown>,
  topics: TheoryTopic[],
): TheoryChapter {
  return {
    id: row.id as string,
    number: (row.number as number) ?? 0,
    title: row.title as string,
    orderNum: (row.order_num as number) ?? 0,
    topics,
  };
}

// ─── 챕터 + 토픽 전체 로드 (과목별) ───

export async function fetchChaptersWithTopics(
  subjectId: string,
): Promise<TheoryChapter[]> {
  const { data: chapterRows, error: cErr } = await supabase
    .from("theory_chapters")
    .select("*")
    .eq("subject_id", subjectId)
    .order("order_num", { ascending: true });

  if (cErr) throw cErr;
  if (!chapterRows || chapterRows.length === 0) return [];

  const chapterIds = chapterRows.map((c) => c.id);
  const { data: topicRows, error: tErr } = await supabase
    .from("theory_topics")
    .select("*")
    .in("chapter_id", chapterIds)
    .order("order_num", { ascending: true });

  if (tErr) throw tErr;

  const topicMap = new Map<string, TheoryTopic[]>();
  for (const row of topicRows ?? []) {
    const chapterId = row.chapter_id as string;
    if (!topicMap.has(chapterId)) topicMap.set(chapterId, []);
    topicMap.get(chapterId)!.push(toTopic(row));
  }

  return chapterRows.map((row) =>
    toChapter(row, topicMap.get(row.id as string) ?? []),
  );
}

// ─── theory_chapters CRUD ───

export async function createChapter(
  subjectId: string,
  id: string,
  number: number,
  title: string,
  orderNum: number,
): Promise<void> {
  const { error } = await supabase.from("theory_chapters").insert({
    id,
    subject_id: subjectId,
    number,
    title,
    order_num: orderNum,
  });
  if (error) throw error;
}

export async function updateChapter(
  id: string,
  updates: Partial<{ number: number; title: string }>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.number !== undefined) dbUpdates.number = updates.number;
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  const { error } = await supabase
    .from("theory_chapters")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteChapter(id: string): Promise<void> {
  const { error } = await supabase
    .from("theory_chapters")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function renumberChapters(
  chapters: { id: string; orderNum: number }[],
): Promise<void> {
  for (const c of chapters) {
    const { error } = await supabase
      .from("theory_chapters")
      .update({ order_num: c.orderNum })
      .eq("id", c.id);
    if (error) throw error;
  }
}

// ─── theory_topics CRUD ───

export async function createTopic(
  chapterId: string,
  topic: {
    id: string;
    title: string;
    contentType: TheoryTopic["contentType"];
    contentUrls: string[];
    body: string;
    hasNote: boolean;
    orderNum: number;
  },
): Promise<void> {
  const { error } = await supabase.from("theory_topics").insert({
    id: topic.id,
    chapter_id: chapterId,
    title: topic.title,
    content_type: topic.contentType,
    content_urls: topic.contentUrls,
    body: topic.body,
    has_note: topic.hasNote,
    order_num: topic.orderNum,
  });
  if (error) throw error;
}

export async function updateTopic(
  id: string,
  updates: Partial<{
    title: string;
    contentType: TheoryTopic["contentType"];
    contentUrls: string[];
    body: string;
    hasNote: boolean;
  }>,
): Promise<void> {
  const dbUpdates: Record<string, unknown> = {};
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.contentType !== undefined) dbUpdates.content_type = updates.contentType;
  if (updates.contentUrls !== undefined) dbUpdates.content_urls = updates.contentUrls;
  if (updates.body !== undefined) dbUpdates.body = updates.body;
  if (updates.hasNote !== undefined) dbUpdates.has_note = updates.hasNote;

  const { error } = await supabase
    .from("theory_topics")
    .update(dbUpdates)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTopic(id: string): Promise<void> {
  const { error } = await supabase
    .from("theory_topics")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function renumberTopics(
  topics: { id: string; orderNum: number }[],
): Promise<void> {
  for (const t of topics) {
    const { error } = await supabase
      .from("theory_topics")
      .update({ order_num: t.orderNum })
      .eq("id", t.id);
    if (error) throw error;
  }
}

// ─── Supabase Storage 파일 업로드 ───

const BUCKET = "theory-content";

export async function uploadTheoryFile(
  file: File,
  subjectId: string,
  chapterId: string,
): Promise<string> {
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${subjectId}/${chapterId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteTheoryFile(fileUrl: string): Promise<void> {
  // publicUrl → storage path 추출
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = fileUrl.indexOf(marker);
  if (idx === -1) return;
  const path = fileUrl.substring(idx + marker.length);

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

// ─── 이론 과목 CRUD (video_subjects 테이블 재사용, type='theory') ───

export async function fetchTheorySubjectCounts(subjectId: string) {
  const { count: chapterCount } = await supabase
    .from("theory_chapters")
    .select("id", { count: "exact", head: true })
    .eq("subject_id", subjectId);

  const chapterIds =
    (
      await supabase
        .from("theory_chapters")
        .select("id")
        .eq("subject_id", subjectId)
    ).data?.map((c) => c.id) ?? [];

  let topicCount = 0;
  if (chapterIds.length > 0) {
    const { count } = await supabase
      .from("theory_topics")
      .select("id", { count: "exact", head: true })
      .in("chapter_id", chapterIds);
    topicCount = count ?? 0;
  }

  return { chapterCount: chapterCount ?? 0, topicCount };
}
