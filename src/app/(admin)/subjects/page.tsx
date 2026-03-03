import SubjectsContent from "./SubjectsContent";
import type { SubjectType } from "@/types";

export default async function SubjectsPage(props: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await props.searchParams;
  const subjectType = (type as SubjectType) || "theory";
  return <SubjectsContent key={subjectType} type={subjectType} />;
}
