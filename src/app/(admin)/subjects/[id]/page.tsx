import { redirect } from "next/navigation";
import type { SubjectType } from "@/types";

export default async function SubjectDetailPage(props: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await props.searchParams;
  const subjectType = (type as SubjectType) || "theory";
  redirect(`/subjects?type=${subjectType}`);
}
