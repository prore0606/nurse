"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Lecture, VideoSection as VideoSectionData } from "../../types";
import { extractVimeoId, buildVimeoUrl } from "../../utils/vimeo";
import {
  fetchSectionsWithLectures,
  createSection as dbCreateSection,
  updateSection as dbUpdateSection,
  deleteSection as dbDeleteSection,
  createLecture as dbCreateLecture,
  updateLecture as dbUpdateLecture,
  deleteLecture as dbDeleteLecture,
  renumberLectures as dbRenumberLectures,
  renumberSections as dbRenumberSections,
} from "../../lib/videoService";
import ConfirmModal from "../ConfirmModal";
import {
  Video, Loader2, CheckCircle, AlertCircle, Link, ArrowRight, ArrowLeft,
  X, Save, Plus, ChevronDown, ChevronUp, Pencil, Trash2, GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";

// ── Form ──

interface LectureForm {
  title: string;
  instructor: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  description: string;
}

const emptyForm: LectureForm = {
  title: "", instructor: "", videoUrl: "", thumbnailUrl: "",
  duration: "", description: "",
};

const toForm = (l: Lecture): LectureForm => ({
  title: l.title, instructor: l.instructor, videoUrl: l.videoUrl,
  thumbnailUrl: l.thumbnailUrl, duration: l.duration, description: l.description,
});

type FetchStatus = "idle" | "loading" | "success" | "error";

// ── Props ──

interface Props {
  subjectId?: string;
  createTrigger?: number;
  initialSections?: VideoSectionData[];
}

// ── Component ──

export default function VideoSection({ subjectId, createTrigger = 0, initialSections }: Props) {
  // ── 섹션 상태 ──
  const [sections, setSections] = useState<VideoSectionData[]>(initialSections ?? []);
  const [expandedId, setExpandedId] = useState<string | null>(
    () => (initialSections ?? [])[0]?.id ?? null,
  );

  // ── Supabase에서 섹션/강의 로드 ──
  useEffect(() => {
    if (!subjectId) return;
    fetchSectionsWithLectures(subjectId)
      .then((data) => {
        setSections(data);
        if (data.length > 0) setExpandedId(data[0].id);
      })
      .catch((err) => {
        console.error("섹션 로드 실패:", err);
        toast.error("강의 목록을 불러오지 못했습니다");
      });
  }, [subjectId]);

  // ── 강의 모달 상태 ──
  const [lectureModal, setLectureModal] = useState<{
    open: boolean;
    sectionId: string | null;
    editing: Lecture | null;
  }>({ open: false, sectionId: null, editing: null });
  const [form, setForm] = useState<LectureForm>(emptyForm);
  const [step, setStep] = useState<1 | 2>(1);
  const [vimeoInput, setVimeoInput] = useState("");
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vimeoReady = fetchStatus === "success" && !!form.videoUrl;

  // ── 섹션 모달 상태 ──
  const [sectionModal, setSectionModal] = useState<{
    open: boolean;
    editing: VideoSectionData | null;
  }>({ open: false, editing: null });
  const [sectionTitle, setSectionTitle] = useState("");

  // ── 삭제 확인 ──
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "section"; section: VideoSectionData }
    | { type: "lecture"; sectionId: string; lecture: Lecture }
    | null
  >(null);

  // ── 전역 강의 수 (number 자동 계산용) ──
  const totalLectureCount = sections.reduce((sum, s) => sum + s.lectures.length, 0);

  // ── 드래그 앤 드롭 상태 ──
  const dragItem = useRef<{ type: "section" | "lecture"; sectionId?: string; index: number } | null>(null);
  const dragOverItem = useRef<{ type: "section" | "lecture"; sectionId?: string; index: number } | null>(null);

  const handleSectionDragStart = (index: number) => {
    dragItem.current = { type: "section", index };
  };

  const handleSectionDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = { type: "section", index };
  };

  const handleSectionDrop = async () => {
    if (!dragItem.current || !dragOverItem.current) return;
    if (dragItem.current.type !== "section" || dragOverItem.current.type !== "section") return;

    const from = dragItem.current.index;
    const to = dragOverItem.current.index;
    if (from === to) return;

    const updated = [...sections];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    const renumbered = renumberAll(updated);
    setSections(renumbered);

    if (subjectId) {
      try {
        await dbRenumberSections(updated.map((s, i) => ({ id: s.id, orderNum: i })));
        // 전역 번호도 DB에 반영
        const allLectures = renumbered.flatMap((s) =>
          s.lectures.map((l, li) => ({ id: l.id, number: l.number, orderNum: li })),
        );
        if (allLectures.length > 0) await dbRenumberLectures(allLectures);
      } catch (err) {
        console.error(err);
        toast.error("순서 저장 실패");
      }
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleLectureDragStart = (sectionId: string, index: number) => {
    dragItem.current = { type: "lecture", sectionId, index };
  };

  const handleLectureDragOver = (e: React.DragEvent, sectionId: string, index: number) => {
    e.preventDefault();
    dragOverItem.current = { type: "lecture", sectionId, index };
  };

  const handleLectureDrop = async (targetSectionId: string) => {
    if (!dragItem.current || !dragOverItem.current) return;
    if (dragItem.current.type !== "lecture" || dragOverItem.current.type !== "lecture") return;

    const fromSection = dragItem.current.sectionId!;
    const toSection = dragOverItem.current.sectionId!;
    const fromIdx = dragItem.current.index;
    const toIdx = dragOverItem.current.index;

    if (fromSection === toSection && fromIdx === toIdx) return;

    let updated = [...sections];

    if (fromSection === toSection) {
      // 같은 섹션 내 이동
      updated = updated.map((s) => {
        if (s.id !== fromSection) return s;
        const lecs = [...s.lectures];
        const [moved] = lecs.splice(fromIdx, 1);
        lecs.splice(toIdx, 0, moved);
        return { ...s, lectures: lecs };
      });
    } else {
      // 섹션 간 이동
      let movedLecture: Lecture | null = null;
      updated = updated.map((s) => {
        if (s.id === fromSection) {
          const lecs = [...s.lectures];
          [movedLecture] = lecs.splice(fromIdx, 1);
          return { ...s, lectures: lecs };
        }
        return s;
      });
      if (movedLecture) {
        updated = updated.map((s) => {
          if (s.id === toSection) {
            const lecs = [...s.lectures];
            lecs.splice(toIdx, 0, movedLecture!);
            return { ...s, lectures: lecs };
          }
          return s;
        });
      }
    }

    const renumbered = renumberAll(updated);
    setSections(renumbered);

    if (subjectId) {
      try {
        const allLectures = renumbered.flatMap((s) =>
          s.lectures.map((l, li) => ({ id: l.id, number: l.number, orderNum: li })),
        );
        if (allLectures.length > 0) await dbRenumberLectures(allLectures);
      } catch (err) {
        console.error(err);
        toast.error("순서 저장 실패");
      }
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // ────────────────────── 섹션 CRUD ──────────────────────

  const openCreateSection = () => {
    setSectionModal({ open: true, editing: null });
    setSectionTitle("");
  };

  const openEditSection = (section: VideoSectionData) => {
    setSectionModal({ open: true, editing: section });
    setSectionTitle(section.title);
  };

  const saveSection = async () => {
    const title = sectionTitle.trim();
    if (!title) { toast.error("섹션 이름을 입력하세요"); return; }
    try {
      if (sectionModal.editing) {
        if (subjectId) await dbUpdateSection(sectionModal.editing.id, title);
        setSections((prev) => prev.map((s) => s.id === sectionModal.editing!.id ? { ...s, title } : s));
        toast.success("섹션 수정 완료");
      } else {
        const newSection: VideoSectionData = { id: crypto.randomUUID(), title, lectures: [] };
        if (subjectId) await dbCreateSection(subjectId, newSection.id, title, sections.length);
        setSections((prev) => [...prev, newSection]);
        setExpandedId(newSection.id);
        toast.success("섹션 추가 완료");
      }
    } catch (err) {
      console.error(err);
      toast.error("섹션 저장 실패");
      return;
    }
    setSectionModal({ open: false, editing: null });
  };

  const confirmDeleteHandler = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "section") {
        if (subjectId) await dbDeleteSection(deleteTarget.section.id);
        setSections((prev) => prev.filter((s) => s.id !== deleteTarget.section.id));
        toast.success("섹션 삭제 완료");
      } else {
        if (subjectId) await dbDeleteLecture(deleteTarget.lecture.id);
        setSections((prev) => prev.map((s) => {
          if (s.id !== deleteTarget.sectionId) return s;
          const filtered = s.lectures.filter((l) => l.id !== deleteTarget.lecture.id);
          return { ...s, lectures: renumber(filtered) };
        }));
        toast.success("강의 삭제 완료");
      }
    } catch (err) {
      console.error(err);
      toast.error("삭제 실패");
    }
    setDeleteTarget(null);
  };

  // ────────────────────── 강의 CRUD ──────────────────────

  const openCreateLecture = (sectionId: string) => {
    setLectureModal({ open: true, sectionId, editing: null });
    setForm(emptyForm);
    setVimeoInput("");
    setFetchStatus("idle");
    setStep(1);
  };

  const openEditLecture = (sectionId: string, lecture: Lecture) => {
    setLectureModal({ open: true, sectionId, editing: lecture });
    setForm(toForm(lecture));
    setVimeoInput(lecture.videoUrl || "");
    setFetchStatus(lecture.videoUrl ? "success" : "idle");
    setStep(lecture.videoUrl ? 2 : 1);
  };

  const closeLectureModal = () => {
    setLectureModal({ open: false, sectionId: null, editing: null });
    setVimeoInput("");
    setFetchStatus("idle");
    setStep(1);
  };

  /** createTrigger로 외부에서 모달 열기 */
  useEffect(() => {
    if (createTrigger > 0) {
      const firstSection = sections[0];
      if (firstSection) {
        openCreateLecture(firstSection.id);
      } else {
        openCreateSection();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createTrigger]);

  /** 전역 번호 재계산 */
  function renumber(lectures: Lecture[], globalOffset = 0): Lecture[] {
    return lectures.map((l, i) => ({ ...l, number: globalOffset + i + 1 }));
  }

  /** 모든 섹션의 number를 전역으로 재정렬 */
  function renumberAll(secs: VideoSectionData[]): VideoSectionData[] {
    let counter = 0;
    return secs.map((s) => ({
      ...s,
      lectures: s.lectures.map((l) => ({ ...l, number: ++counter })),
    }));
  }

  const saveLecture = async () => {
    if (!form.title.trim()) { toast.error("강의 제목을 입력하세요"); return; }
    const sectionId = lectureModal.sectionId!;

    try {
      if (lectureModal.editing) {
        // 수정
        if (subjectId) {
          await dbUpdateLecture(lectureModal.editing.id, {
            title: form.title, instructor: form.instructor,
            videoUrl: form.videoUrl, thumbnailUrl: form.thumbnailUrl,
            duration: form.duration, description: form.description,
          });
        }
        setSections((prev) => prev.map((s) => {
          if (s.id !== sectionId) return s;
          return {
            ...s,
            lectures: s.lectures.map((l) =>
              l.id === lectureModal.editing!.id
                ? { ...l, title: form.title, instructor: form.instructor, videoUrl: form.videoUrl, thumbnailUrl: form.thumbnailUrl, duration: form.duration, description: form.description }
                : l,
            ),
          };
        }));
        toast.success("강의 수정 완료");
      } else {
        // 추가
        const newLecture: Lecture = {
          id: crypto.randomUUID(),
          number: totalLectureCount + 1,
          title: form.title,
          instructor: form.instructor,
          videoUrl: form.videoUrl,
          thumbnailUrl: form.thumbnailUrl,
          duration: form.duration,
          description: form.description,
        };
        const section = sections.find((s) => s.id === sectionId);
        if (subjectId) {
          await dbCreateLecture(sectionId, newLecture, section ? section.lectures.length : 0);
        }
        setSections((prev) => {
          const updated = prev.map((s) =>
            s.id === sectionId ? { ...s, lectures: [...s.lectures, newLecture] } : s,
          );
          return renumberAll(updated);
        });
        toast.success("강의 추가 완료");
      }
    } catch (err) {
      console.error(err);
      toast.error("강의 저장 실패");
      return;
    }
    closeLectureModal();
  };

  /** 등록 후 계속 추가 */
  const saveLectureAndContinue = async () => {
    if (!form.title.trim()) { toast.error("강의 제목을 입력하세요"); return; }
    const sectionId = lectureModal.sectionId!;
    const newLecture: Lecture = {
      id: crypto.randomUUID(),
      number: totalLectureCount + 1,
      title: form.title,
      instructor: form.instructor,
      videoUrl: form.videoUrl,
      thumbnailUrl: form.thumbnailUrl,
      duration: form.duration,
      description: form.description,
    };
    try {
      const section = sections.find((s) => s.id === sectionId);
      if (subjectId) {
        await dbCreateLecture(sectionId, newLecture, section ? section.lectures.length : 0);
      }
    } catch (err) {
      console.error(err);
      toast.error("강의 저장 실패");
      return;
    }
    setSections((prev) => {
      const updated = prev.map((s) =>
        s.id === sectionId ? { ...s, lectures: [...s.lectures, newLecture] } : s,
      );
      return renumberAll(updated);
    });
    toast.success("영상이 등록되었습니다");
    // 폼 리셋 (모달 유지)
    setForm(emptyForm);
    setVimeoInput("");
    setFetchStatus("idle");
    setStep(1);
  };

  // ────────────────────── Vimeo API ──────────────────────

  const fetchVimeoInfo = useCallback(async (videoId: string) => {
    setFetchStatus("loading");
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      const dur = data.duration as number | undefined;
      const durationStr = dur
        ? `${String(Math.floor(dur / 60)).padStart(2, "0")}:${String(dur % 60).padStart(2, "0")}`
        : "";
      setForm((f) => ({
        ...f,
        videoUrl: buildVimeoUrl(videoId),
        thumbnailUrl: (data.thumbnail_url as string) || f.thumbnailUrl,
        title: (data.title as string) || f.title || "",
        duration: durationStr || f.duration || "",
        description: (data.description as string)?.slice(0, 200) || f.description || "",
        instructor: (data.author_name as string) || f.instructor || "",
      }));
      setFetchStatus("success");
    } catch {
      setFetchStatus("error");
      setForm((f) => ({ ...f, videoUrl: "" }));
    }
  }, []);

  const handleVimeoInput = (value: string) => {
    setVimeoInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const id = extractVimeoId(value);
    if (id) {
      setFetchStatus("loading");
      debounceRef.current = setTimeout(() => fetchVimeoInfo(id), 600);
    } else {
      setFetchStatus("idle");
      setForm((f) => ({ ...f, videoUrl: "", thumbnailUrl: "" }));
    }
  };

  // ────────────────────── 렌더링 ──────────────────────

  return (
    <>
      {/* ── 섹션 목록 ── */}
      <div className="space-y-3">
        {sections.length === 0 && (
          <div className="py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
              <Video size={28} className="text-purple-400" />
            </div>
            <p className="text-sm text-gray-500 mb-3">등록된 섹션이 없습니다</p>
            <button
              onClick={openCreateSection}
              className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors"
            >
              + 섹션 추가
            </button>
          </div>
        )}

        {sections.map((section, sectionIdx) => {
          const isExpanded = expandedId === section.id;
          return (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              draggable
              onDragStart={() => handleSectionDragStart(sectionIdx)}
              onDragOver={(e) => handleSectionDragOver(e, sectionIdx)}
              onDrop={handleSectionDrop}
              onDragEnd={() => { dragItem.current = null; dragOverItem.current = null; }}
            >
              {/* 섹션 헤더 */}
              <div
                className="flex items-center justify-between px-5 py-3.5 bg-gray-50/80 cursor-pointer hover:bg-gray-100/80 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : section.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 -ml-2 text-gray-300 hover:text-gray-500"
                    onMouseDown={(e) => e.stopPropagation()}
                    title="드래그하여 순서 변경"
                  >
                    <GripVertical size={16} />
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
                  <span className="text-xs text-gray-400 bg-gray-200/60 px-2 py-0.5 rounded-full">
                    {section.lectures.length}개 강의
                  </span>
                </div>
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditSection(section)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    title="섹션 수정"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ type: "section", section })}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="섹션 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    onClick={() => openCreateLecture(section.id)}
                    className="flex items-center gap-1 ml-2 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Plus size={12} />
                    강의 추가
                  </button>
                </div>
              </div>

              {/* 강의 리스트 (펼침) */}
              {isExpanded && (
                <div className="divide-y divide-gray-100">
                  {section.lectures.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-gray-400">
                      강의가 없습니다. &apos;강의 추가&apos; 버튼을 눌러 등록하세요.
                    </div>
                  ) : (
                    section.lectures.map((lecture, lectureIdx) => (
                      <div
                        key={lecture.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors group"
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); handleLectureDragStart(section.id, lectureIdx); }}
                        onDragOver={(e) => { e.stopPropagation(); handleLectureDragOver(e, section.id, lectureIdx); }}
                        onDrop={(e) => { e.stopPropagation(); handleLectureDrop(section.id); }}
                        onDragEnd={() => { dragItem.current = null; dragOverItem.current = null; }}
                      >
                        {/* 드래그 핸들 */}
                        <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0">
                          <GripVertical size={14} />
                        </div>

                        {/* 순서 번호 */}
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {lecture.number}
                        </span>

                        {/* 썸네일 */}
                        {lecture.thumbnailUrl ? (
                          <div className="w-16 h-10 rounded bg-gray-100 overflow-hidden shrink-0">
                            <img src={lecture.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-10 rounded bg-purple-50 flex items-center justify-center shrink-0">
                            <Video size={14} className="text-purple-400" />
                          </div>
                        )}

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-900 truncate block">{lecture.title}</span>
                          <p className="text-xs text-gray-400">
                            {lecture.instructor && <>{lecture.instructor} · </>}
                            {lecture.duration}
                          </p>
                        </div>

                        {/* 액션 */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditLecture(section.id, lecture)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: "lecture", sectionId: section.id, lecture })}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* 섹션 추가 버튼 */}
        {sections.length > 0 && (
          <button
            onClick={openCreateSection}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-400 hover:text-primary hover:border-primary transition-colors"
          >
            + 섹션 추가
          </button>
        )}
      </div>

      {/* ── 강의 추가/수정 모달 (2단계 위저드) ── */}
      {lectureModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeLectureModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {lectureModal.editing ? "강의 수정" : "강의 추가"}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${step === 1 ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                    1. URL 입력
                  </span>
                  <span className="text-gray-300">→</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${step === 2 ? "bg-primary text-white" : "bg-gray-100 text-gray-400"}`}>
                    2. 정보 확인
                  </span>
                </div>
              </div>
              <button onClick={closeLectureModal} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* 본문 */}
            <div className="px-6 py-5">
              {step === 1 ? (
                <div className="space-y-4">
                  <div className="text-center py-3">
                    <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto mb-3">
                      <Video size={28} className="text-purple-500" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">비메오 영상 URL을 입력하세요</p>
                    <p className="text-xs text-gray-400 mt-1">썸네일, 제목, 재생시간을 자동으로 불러옵니다</p>
                  </div>

                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Link size={16} /></div>
                    <input
                      type="text"
                      value={vimeoInput}
                      onChange={(e) => handleVimeoInput(e.target.value)}
                      className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://vimeo.com/123456789"
                      autoFocus
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {fetchStatus === "loading" && <Loader2 size={16} className="text-primary animate-spin" />}
                      {fetchStatus === "success" && <CheckCircle size={16} className="text-green-500" />}
                      {fetchStatus === "error" && <AlertCircle size={16} className="text-red-500" />}
                    </div>
                  </div>

                  {fetchStatus === "error" && (
                    <p className="text-xs text-red-500">영상을 찾을 수 없습니다. URL을 확인해주세요.</p>
                  )}

                  {fetchStatus === "loading" && (
                    <div className="flex items-center justify-center gap-2 py-2 text-gray-400">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-xs">비메오에서 불러오는 중...</span>
                    </div>
                  )}

                  {vimeoReady && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      {form.thumbnailUrl && (
                        <img src={form.thumbnailUrl} alt="" className="w-24 h-14 rounded object-cover shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{form.title}</p>
                        <p className="text-xs text-gray-500">{form.instructor} · {form.duration}</p>
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                          <CheckCircle size={10} /> 영상 정보를 불러왔습니다
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {form.thumbnailUrl && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">썸네일 (비메오에서 가져옴)</label>
                      <img src={form.thumbnailUrl} alt="썸네일" className="w-full h-40 rounded-lg object-cover border border-gray-200" />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">강의 제목 <span className="text-red-500">*</span></label>
                    <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">강의 설명</label>
                    <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={3} placeholder="강의 내용 설명" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">강사</label>
                      <input type="text" value={form.instructor} onChange={(e) => setForm((f) => ({ ...f, instructor: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="강사명" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">재생 시간</label>
                      <input type="text" value={form.duration} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              {step === 1 ? (
                <>
                  <button onClick={closeLectureModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    취소
                  </button>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!vimeoReady}
                    className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    다음 <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <ArrowLeft size={14} /> 이전
                  </button>
                  <div className="flex items-center gap-2">
                    {!lectureModal.editing && (
                      <button
                        onClick={saveLectureAndContinue}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors"
                      >
                        <Plus size={14} /> 등록 후 계속 추가
                      </button>
                    )}
                    <button
                      onClick={saveLecture}
                      className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors"
                    >
                      <Save size={14} /> {lectureModal.editing ? "수정 완료" : "강의 등록"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 섹션 추가/수정 모달 ── */}
      {sectionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSectionModal({ open: false, editing: null })} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {sectionModal.editing ? "섹션 수정" : "섹션 추가"}
              </h2>
              <button onClick={() => setSectionModal({ open: false, editing: null })} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">섹션 이름 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveSection()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예: 01. 약물계산 기초"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200">
              <button onClick={() => setSectionModal({ open: false, editing: null })} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                취소
              </button>
              <button onClick={saveSection} className="px-5 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors">
                {sectionModal.editing ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 ── */}
      <ConfirmModal
        visible={!!deleteTarget}
        message={
          deleteTarget?.type === "section"
            ? `"${deleteTarget.section.title}" 섹션과 포함된 ${deleteTarget.section.lectures.length}개 강의를 모두 삭제하시겠습니까?`
            : `"${deleteTarget?.type === "lecture" ? deleteTarget.lecture.title : ""}" 강의를 삭제하시겠습니까?`
        }
        onConfirm={confirmDeleteHandler}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
