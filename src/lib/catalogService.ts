import { supabase } from "./supabase";
import type { Subject, SubjectType } from "../types";

function toPublicSubject(row: Record<string, unknown>): Subject {
  return {
    id: row.id as string,
    type: (row.type as SubjectType) ?? "videos",
    name: row.name as string,
    description: (row.description as string) ?? "",
    imageUrl: (row.image_url as string) ?? "",
    descriptionImages: (row.description_images as string[]) ?? [],
    price: (row.price as number) ?? 0,
    discountPrice: (row.discount_price as number) ?? undefined,
    contentCount: 0,
    chapterCount: 0,
    isActive: true,
    order: (row.order_num as number) ?? 0,
    createdAt: ((row.created_at as string) ?? "").split("T")[0],
  };
}

/** 카탈로그: 활성 과목 전체 조회 (타입 필터 옵션) */
export async function fetchActiveSubjects(
  type?: SubjectType,
): Promise<Subject[]> {
  let query = supabase
    .from("video_subjects")
    .select("*")
    .eq("is_active", true)
    .order("order_num", { ascending: true });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toPublicSubject);
}

/** 카탈로그: 단일 과목 조회 */
export async function fetchSubjectById(
  id: string,
): Promise<Subject | null> {
  const { data, error } = await supabase
    .from("video_subjects")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return toPublicSubject(data);
}
