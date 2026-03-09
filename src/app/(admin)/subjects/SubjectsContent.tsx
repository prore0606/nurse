"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import PageHeader from "@/components/PageHeader";
import ConfirmModal from "@/components/ConfirmModal";
import ExcelUploadModal from "@/components/ExcelUploadModal";
import ImagePreview from "@/components/ImagePreview";
import ImageAddButton from "@/components/ImageAddButton";
import TheorySection from "@/components/subject-detail/TheorySection";
import TheoryAppPreview from "@/components/subject-detail/TheoryAppPreview";
import ProblemAppPreview from "@/components/subject-detail/ProblemAppPreview";
import ProblemSectionComponent from "@/components/subject-detail/ProblemSection";
import VideoSection from "@/components/subject-detail/VideoSection";
import PackageSection from "@/components/subject-detail/PackageSection";
import { Plus, FileSpreadsheet, Pencil, Trash2, ImagePlus, X, Save, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Check, Video, Loader2, CheckCircle, AlertCircle, Link } from "lucide-react";
import toast from "react-hot-toast";
import type { Subject, SubjectType, Lecture, TheoryChapter, ProblemSection as ProblemSectionType } from "@/types";
import { extractVimeoId, buildVimeoUrl } from "@/utils/vimeo";
import { initialSubjects } from "@/data/subjects";
import { SUBJECT_TYPE_CONFIG, DETAIL_TYPE_CONFIG } from "@/constants/subjectConfig";
import { useImageUpload } from "@/hooks/useImageUpload";
import { formatPrice } from "@/utils/format";
import {
  fetchVideoSubjects,
  createVideoSubject,
  updateVideoSubject,
  deleteVideoSubject,
} from "@/lib/videoService";


type FetchStatus = "idle" | "loading" | "success" | "error";
type ViewMode = "list" | "create";

interface VimeoItem {
  id: string;
  url: string;
  fetchStatus: FetchStatus;
  vimeoId: string;
  title: string;
  instructor: string;
  thumbnailUrl: string;
  duration: string;
  description: string;
}

const createEmptyVimeoItem = (): VimeoItem => ({
  id: crypto.randomUUID(),
  url: "", fetchStatus: "idle", vimeoId: "",
  title: "", instructor: "", thumbnailUrl: "",
  duration: "", description: "",
});

export default function SubjectsContent({ type }: { type: SubjectType }) {
  const cfg = SUBJECT_TYPE_CONFIG[type];
  const detailCfg = DETAIL_TYPE_CONFIG[type];

  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const filtered = subjects.filter((s) => s.type === type);
  const [loading, setLoading] = useState(false);

  // ── 영상/이론 타입인 경우 Supabase에서 과목 목록 로드 ──
  useEffect(() => {
    if (type !== "videos" && type !== "theory" && type !== "problems") return;
    setLoading(true);
    fetchVideoSubjects()
      .then((allSubjects) => {
        setSubjects((prev) => [
          ...prev.filter((s) => s.type !== type),
          ...allSubjects.filter((s) => s.type === type),
        ]);
      })
      .catch((err) => {
        console.error("과목 로드 실패:", err);
        toast.error("과목을 불러오지 못했습니다");
      })
      .finally(() => setLoading(false));
  }, [type]);

  // 뷰 모드: list (목록) | create (과목 추가 위저드)
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // ── 목록 모드 상태 ──
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = filtered.find((s) => s.id === selectedId) ?? null;
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);
  const [createTrigger, setCreateTrigger] = useState(0);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [theoryChapters, setTheoryChapters] = useState<TheoryChapter[]>([]);
  const [problemSections, setProblemSections] = useState<ProblemSectionType[]>([]);

  // 기본정보 수정 폼 (목록에서 선택 시)
  const [editForm, setEditForm] = useState({
    name: "", description: "", imageUrl: "",
    descriptionImages: [] as string[],
    price: "", discountPrice: "",
  });
  const { pickImage } = useImageUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // ── 과목 추가 위저드 상태 ──
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardForm, setWizardForm] = useState({
    name: "", description: "", imageUrl: "",
    descriptionImages: [] as string[],
    price: "", discountPrice: "",
  });
  const [newSubjectId, setNewSubjectId] = useState<string | null>(null);
  const [wizardCreateTrigger, setWizardCreateTrigger] = useState(0);
  const [wizardExcelUpload, setWizardExcelUpload] = useState(false);
  const wizardFileInputRef = useRef<HTMLInputElement>(null);

  // ── 비메오 위저드 상태 (영상 타입 전용) ──
  const [vimeoItems, setVimeoItems] = useState<VimeoItem[]>([createEmptyVimeoItem()]);
  const debounceMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const hasReadyVideo = vimeoItems.some((v) => v.fetchStatus === "success" && !!v.vimeoId);

  const isVideoType = type === "videos";
  const isSupabaseType = type === "videos" || type === "theory" || type === "problems";

  /** Vimeo oEmbed API (개별 아이템) */
  const fetchVimeoItemInfo = useCallback(async (itemId: string, videoId: string) => {
    setVimeoItems((prev) => prev.map((v) => v.id === itemId ? { ...v, fetchStatus: "loading" as FetchStatus } : v));
    try {
      const res = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${videoId}`);
      if (!res.ok) throw new Error("not found");
      const data = await res.json();
      const dur = data.duration as number | undefined;
      const durationStr = dur
        ? `${String(Math.floor(dur / 60)).padStart(2, "0")}:${String(dur % 60).padStart(2, "0")}`
        : "";
      setVimeoItems((prev) => prev.map((v) => v.id === itemId ? {
        ...v, fetchStatus: "success" as FetchStatus, vimeoId: videoId,
        title: (data.title as string) || "", instructor: (data.author_name as string) || "",
        thumbnailUrl: (data.thumbnail_url as string) || "", duration: durationStr,
        description: (data.description as string)?.slice(0, 200) || "",
      } : v));
    } catch {
      setVimeoItems((prev) => prev.map((v) => v.id === itemId ? { ...v, fetchStatus: "error" as FetchStatus, vimeoId: "" } : v));
    }
  }, []);

  const handleVimeoItemInput = (itemId: string, value: string) => {
    setVimeoItems((prev) => prev.map((v) => v.id === itemId ? { ...v, url: value } : v));
    const key = `vimeo_${itemId}`;
    if (debounceMapRef.current.has(key)) clearTimeout(debounceMapRef.current.get(key)!);
    const vid = extractVimeoId(value);
    if (vid) {
      setVimeoItems((prev) => prev.map((v) => v.id === itemId ? { ...v, fetchStatus: "loading" as FetchStatus } : v));
      debounceMapRef.current.set(key, setTimeout(() => fetchVimeoItemInfo(itemId, vid), 600));
    } else {
      setVimeoItems((prev) => prev.map((v) => v.id === itemId ? { ...v, fetchStatus: "idle" as FetchStatus, vimeoId: "", thumbnailUrl: "" } : v));
    }
  };

  const addVimeoItem = () => setVimeoItems((prev) => [...prev, createEmptyVimeoItem()]);

  const removeVimeoItem = (itemId: string) => {
    setVimeoItems((prev) => prev.length <= 1 ? prev : prev.filter((v) => v.id !== itemId));
  };

  /** Step 1 → Step 2 전환 (첫 번째 영상으로 과목 정보 자동 채우기) */
  const goToVideoStep2 = () => {
    if (!hasReadyVideo) return;
    const firstReady = vimeoItems.find((v) => v.fetchStatus === "success");
    if (firstReady) {
      setWizardForm((f) => ({
        ...f,
        name: f.name || firstReady.title,
        imageUrl: f.imageUrl || firstReady.thumbnailUrl,
        description: f.description || firstReady.description,
      }));
    }
    setWizardStep(2);
  };

  // ── 목록 모드 함수 ──
  const toggleSubject = (id: string) => {
    if (selectedId === id) { setSelectedId(null); return; }
    setSelectedId(id);
    const s = subjects.find((s) => s.id === id);
    if (s) {
      setEditForm({
        name: s.name, description: s.description, imageUrl: s.imageUrl,
        descriptionImages: s.descriptionImages ?? [],
        price: String(s.price), discountPrice: s.discountPrice ? String(s.discountPrice) : "",
      });
    }
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "videos" || deleteTarget.type === "theory" || deleteTarget.type === "problems") {
      try {
        await deleteVideoSubject(deleteTarget.id);
      } catch (err) {
        console.error(err);
        toast.error("삭제 실패");
        setDeleteTarget(null);
        return;
      }
    }
    setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(null);
    toast.success("과목이 삭제되었습니다");
    setDeleteTarget(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, target: "edit" | "wizard") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 업로드 가능합니다"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("5MB 이하의 이미지만 업로드 가능합니다"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      if (target === "edit") setEditForm((f) => ({ ...f, imageUrl: url }));
      else setWizardForm((f) => ({ ...f, imageUrl: url }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInfo = async () => {
    if (!editForm.name.trim()) { toast.error("과목명을 입력하세요"); return; }
    if (!editForm.price) { toast.error("가격을 입력하세요"); return; }
    if (!selectedId) return;

    const sel = subjects.find((s) => s.id === selectedId);
    if (sel?.type === "videos" || sel?.type === "theory" || sel?.type === "problems") {
      try {
        await updateVideoSubject(selectedId, {
          name: editForm.name,
          description: editForm.description,
          imageUrl: editForm.imageUrl,
          price: Number(editForm.price),
          discountPrice: editForm.discountPrice ? Number(editForm.discountPrice) : null,
        });
      } catch (err) {
        console.error(err);
        toast.error("저장 실패");
        return;
      }
    }

    setSubjects((prev) => prev.map((s) =>
      s.id === selectedId ? {
        ...s, name: editForm.name, description: editForm.description,
        imageUrl: editForm.imageUrl, descriptionImages: editForm.descriptionImages,
        price: Number(editForm.price),
        discountPrice: editForm.discountPrice ? Number(editForm.discountPrice) : undefined,
      } : s
    ));
    toast.success("과목 정보가 저장되었습니다");
  };

  // ── 위저드 함수 ──
  const startWizard = () => {
    setWizardForm({ name: "", description: "", imageUrl: "", descriptionImages: [], price: "", discountPrice: "" });
    setWizardStep(1);
    setNewSubjectId(null);
    setVimeoItems([createEmptyVimeoItem()]);
    setViewMode("create");
  };

  const handleWizardNext = async () => {
    if (!wizardForm.name.trim()) { toast.error("과목명을 입력하세요"); return; }
    if (!wizardForm.price) { toast.error("가격을 입력하세요"); return; }

    if (!newSubjectId) {
      // 과목 생성
      const id = crypto.randomUUID();
      const newSubject: Subject = {
        id, type, name: wizardForm.name,
        description: wizardForm.description, imageUrl: wizardForm.imageUrl,
        descriptionImages: wizardForm.descriptionImages,
        price: Number(wizardForm.price),
        discountPrice: wizardForm.discountPrice ? Number(wizardForm.discountPrice) : undefined,
        contentCount: 0, chapterCount: 0, isActive: true,
        order: filtered.length + 1,
        createdAt: new Date().toISOString().split("T")[0],
      };

      if (isSupabaseType) {
        try {
          await createVideoSubject(newSubject);
        } catch (err) {
          console.error(err);
          toast.error("과목 생성 실패");
          return;
        }
      }

      setSubjects((prev) => [...prev, newSubject]);
      setNewSubjectId(id);
    } else {
      // 이미 생성된 경우 정보 업데이트
      if (isSupabaseType) {
        try {
          await updateVideoSubject(newSubjectId, {
            name: wizardForm.name,
            description: wizardForm.description,
            imageUrl: wizardForm.imageUrl,
            price: Number(wizardForm.price),
            discountPrice: wizardForm.discountPrice ? Number(wizardForm.discountPrice) : null,
          });
        } catch (err) {
          console.error(err);
          toast.error("과목 업데이트 실패");
          return;
        }
      }
      setSubjects((prev) => prev.map((s) =>
        s.id === newSubjectId ? {
          ...s, name: wizardForm.name, description: wizardForm.description,
          imageUrl: wizardForm.imageUrl, descriptionImages: wizardForm.descriptionImages,
          price: Number(wizardForm.price),
          discountPrice: wizardForm.discountPrice ? Number(wizardForm.discountPrice) : undefined,
        } : s
      ));
    }

    if (isVideoType) {
      // 영상 타입: Step 2 → Step 3 영상 등록
      toast.success("과목이 생성되었습니다. 영상을 등록하세요.");
      setWizardStep(3);
    } else {
      // 기본 타입: Step 1 → Step 2 콘텐츠 등록
      toast.success("과목이 생성되었습니다. 콘텐츠를 등록하세요.");
      setWizardStep(2);
    }
  };

  const finishWizard = () => {
    toast.success("과목 등록이 완료되었습니다");
    setViewMode("list");
    setNewSubjectId(null);
  };

  const cancelWizard = async () => {
    // 이미 생성된 과목 삭제
    if (newSubjectId) {
      if (isSupabaseType) {
        try { await deleteVideoSubject(newSubjectId); } catch { /* 무시 */ }
      }
      setSubjects((prev) => prev.filter((s) => s.id !== newSubjectId));
    }
    setViewMode("list");
    setNewSubjectId(null);
  };

  // ════════════════════════════════════════
  // 과목 추가 위저드 뷰
  // ════════════════════════════════════════
  if (viewMode === "create") {
    return (
      <div>
        <PageHeader
          title={`${cfg.label} 과목 추가`}
          description="새로운 과목의 기본 정보를 입력하고 콘텐츠를 등록합니다"
          action={
            <button onClick={cancelWizard} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ArrowLeft size={16} /> 목록으로
            </button>
          }
        />

        {/* 스텝 인디케이터 */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setWizardStep(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              wizardStep === 1 ? "bg-primary text-white" : (isVideoType ? hasReadyVideo : !!newSubjectId) ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
            }`}
          >
            {(isVideoType ? hasReadyVideo : !!newSubjectId) && wizardStep !== 1
              ? <Check size={14} />
              : <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>}
            {isVideoType ? "URL 입력" : "기본 정보"}
          </button>
          <div className="w-8 h-px bg-gray-300" />
          <button
            onClick={() => { if (isVideoType) { goToVideoStep2(); } else if (newSubjectId) { setWizardStep(2); } }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              wizardStep === 2 ? "bg-primary text-white" : (isVideoType ? !!newSubjectId : false) ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-400"
            }`}
          >
            {isVideoType && !!newSubjectId && wizardStep !== 2
              ? <Check size={14} />
              : <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">2</span>}
            {isVideoType ? "과목 정보" : "콘텐츠 등록"}
          </button>
          {isVideoType && (
            <>
              <div className="w-8 h-px bg-gray-300" />
              <button
                onClick={() => { if (newSubjectId) setWizardStep(3); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  wizardStep === 3 ? "bg-primary text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">3</span>
                영상 등록
              </button>
            </>
          )}
        </div>

        {isVideoType ? (
          /* ════ 영상 타입 위저드 ════ */
          wizardStep === 1 ? (
            /* ── Step 1: 비메오 URL 입력 (복수) ── */
            <div className="space-y-3">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                  <Video size={20} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">비메오 영상 URL을 입력하세요</p>
                  <p className="text-xs text-gray-400">여러 영상을 한번에 등록할 수 있습니다. 순서대로 번호가 부여됩니다.</p>
                </div>
              </div>

              {/* 영상 카드 목록 */}
              {vimeoItems.map((item, index) => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="relative flex-1">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Link size={16} /></div>
                      <input
                        type="text"
                        value={item.url}
                        onChange={(e) => handleVimeoItemInput(item.id, e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://vimeo.com/123456789"
                        autoFocus={index === vimeoItems.length - 1}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {item.fetchStatus === "loading" && <Loader2 size={16} className="text-primary animate-spin" />}
                        {item.fetchStatus === "success" && <CheckCircle size={16} className="text-green-500" />}
                        {item.fetchStatus === "error" && <AlertCircle size={16} className="text-red-500" />}
                      </div>
                    </div>
                    {vimeoItems.length > 1 && (
                      <button onClick={() => removeVimeoItem(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors" title="삭제">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {item.fetchStatus === "error" && (
                    <p className="text-xs text-red-500 ml-10">영상을 찾을 수 없습니다. URL을 확인해주세요.</p>
                  )}

                  {item.fetchStatus === "loading" && (
                    <div className="flex items-center gap-2 py-1 ml-10 text-gray-400">
                      <Loader2 size={14} className="animate-spin" />
                      <span className="text-sm">비메오에서 불러오는 중...</span>
                    </div>
                  )}

                  {/* 미리보기 카드 */}
                  {item.fetchStatus === "success" && item.thumbnailUrl && (
                    <div className="flex gap-4 p-3 ml-10 bg-green-50 rounded-lg border border-green-200">
                      <img src={item.thumbnailUrl} alt="" className="w-56 aspect-video rounded object-cover shrink-0" />
                      <div className="flex-1 min-w-0 py-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.instructor}{item.duration && ` · ${item.duration}`}</p>
                        {item.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{item.description}</p>}
                        <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                          <CheckCircle size={12} /> 영상 정보를 성공적으로 불러왔습니다
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* 영상 추가 버튼 */}
              <button
                onClick={addVimeoItem}
                className="flex items-center gap-2 w-full justify-center py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus size={16} /> 영상 추가
              </button>

              {/* 하단 버튼 */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  {vimeoItems.filter((v) => v.fetchStatus === "success").length}개 영상 준비됨
                </p>
                <button
                  onClick={goToVideoStep2}
                  disabled={!hasReadyVideo}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  다음: 과목 정보 입력
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : wizardStep === 2 ? (
            /* ── Step 2: 과목 정보 (가격, 설명 등) ── */
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="space-y-3">
                {/* 등록 영상 요약 */}
                <div className="flex items-center gap-2 p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                  <Video size={16} className="text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {vimeoItems.filter((v) => v.fetchStatus === "success").length}개 영상이 등록됩니다
                  </span>
                  <button onClick={() => setWizardStep(1)} className="ml-auto text-xs text-primary hover:underline shrink-0">영상 수정</button>
                </div>

                {/* 대표 이미지 + 과목명/가격을 나란히 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">대표 이미지 <span className="text-xs text-gray-400">(비메오 썸네일)</span></label>
                    {wizardForm.imageUrl ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                        <img src={wizardForm.imageUrl} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setWizardForm((f) => ({ ...f, imageUrl: "" })); if (wizardFileInputRef.current) wizardFileInputRef.current.value = ""; }} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => wizardFileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors">
                        <ImagePlus size={24} />
                        <span className="text-xs">이미지 업로드</span>
                      </button>
                    )}
                    <input ref={wizardFileInputRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, "wizard")} className="hidden" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">과목명 <span className="text-red-500">*</span></label>
                      <input type="text" value={wizardForm.name} onChange={(e) => setWizardForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 두경부 영상강의" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">정가 <span className="text-red-500">*</span></label>
                        <input type="number" value={wizardForm.price} onChange={(e) => setWizardForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="100000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">할인가</label>
                        <input type="number" value={wizardForm.discountPrice} onChange={(e) => setWizardForm((f) => ({ ...f, discountPrice: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="79000" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea value={wizardForm.description} onChange={(e) => setWizardForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} placeholder="과목에 대한 간단한 설명" />
                </div>

                {/* 설명 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">설명 이미지</label>
                  <div className="grid grid-cols-5 gap-2">
                    {wizardForm.descriptionImages.map((img, i) => (
                      <ImagePreview key={i} src={img} onRemove={() => setWizardForm((f) => ({ ...f, descriptionImages: f.descriptionImages.filter((_, idx) => idx !== i) }))} size="sm" />
                    ))}
                    <ImageAddButton onClick={() => pickImage((url) => setWizardForm((f) => ({ ...f, descriptionImages: [...f.descriptionImages, url] })))} size="sm" />
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setWizardStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <ArrowLeft size={14} /> URL 입력으로
                </button>
                <button onClick={handleWizardNext} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                  다음: 영상 등록
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 3: 영상 목록 관리 ── */
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  <span className="text-primary">{wizardForm.name}</span> 영상 등록
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWizardExcelUpload(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors">
                    <FileSpreadsheet size={14} /> 엑셀 업로드
                  </button>
                  <button onClick={() => setWizardCreateTrigger((t) => t + 1)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                    <Plus size={14} /> 영상 추가
                  </button>
                </div>
              </div>

              <VideoSection key={newSubjectId} subjectId={newSubjectId ?? undefined} createTrigger={wizardCreateTrigger} initialSections={[
                {
                  id: crypto.randomUUID(),
                  title: "기본 섹션",
                  lectures: vimeoItems
                    .filter((v) => v.fetchStatus === "success" && v.vimeoId)
                    .map((v, i): Lecture => ({
                      id: v.id, number: i + 1, title: v.title,
                      duration: v.duration, videoUrl: buildVimeoUrl(v.vimeoId),
                      thumbnailUrl: v.thumbnailUrl, instructor: v.instructor,
                      description: v.description,
                    })),
                },
              ]} />

              <ExcelUploadModal visible={wizardExcelUpload} onClose={() => setWizardExcelUpload(false)} subjectType={type} subjectName={wizardForm.name} />

              {/* 하단 버튼 */}
              <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setWizardStep(2)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <ArrowLeft size={14} /> 과목 정보 수정
                </button>
                <button onClick={finishWizard} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                  <Check size={16} /> 완료
                </button>
              </div>
            </div>
          )
        ) : (
          /* ════ 기본 타입 위저드 (이론/문제풀이/패키지) ════ */
          wizardStep === 1 ? (
            /* ── Step 1: 기본 정보 ── */
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="space-y-3">
                {/* 대표 이미지 + 과목명/가격 나란히 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">대표 이미지</label>
                    {wizardForm.imageUrl ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                        <img src={wizardForm.imageUrl} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setWizardForm((f) => ({ ...f, imageUrl: "" })); if (wizardFileInputRef.current) wizardFileInputRef.current.value = ""; }} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => wizardFileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors">
                        <ImagePlus size={24} />
                        <span className="text-xs">이미지 업로드</span>
                      </button>
                    )}
                    <input ref={wizardFileInputRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, "wizard")} className="hidden" />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">과목명 <span className="text-red-500">*</span></label>
                      <input type="text" value={wizardForm.name} onChange={(e) => setWizardForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 두경부" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">정가 <span className="text-red-500">*</span></label>
                        <input type="number" value={wizardForm.price} onChange={(e) => setWizardForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="100000" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">할인가</label>
                        <input type="number" value={wizardForm.discountPrice} onChange={(e) => setWizardForm((f) => ({ ...f, discountPrice: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="79000" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                  <textarea value={wizardForm.description} onChange={(e) => setWizardForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} placeholder="과목에 대한 간단한 설명" />
                </div>

                {/* 설명 이미지 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">설명 이미지</label>
                  <div className="grid grid-cols-5 gap-2">
                    {wizardForm.descriptionImages.map((img, i) => (
                      <ImagePreview key={i} src={img} onRemove={() => setWizardForm((f) => ({ ...f, descriptionImages: f.descriptionImages.filter((_, idx) => idx !== i) }))} size="sm" />
                    ))}
                    <ImageAddButton onClick={() => pickImage((url) => setWizardForm((f) => ({ ...f, descriptionImages: [...f.descriptionImages, url] })))} size="sm" />
                  </div>
                </div>
              </div>

              {/* 하단 버튼 */}
              <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
                <button onClick={handleWizardNext} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                  다음: 콘텐츠 등록
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            /* ── Step 2: 콘텐츠 등록 ── */
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  <span className="text-primary">{wizardForm.name}</span> 콘텐츠 등록
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => setWizardExcelUpload(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors">
                    <FileSpreadsheet size={14} /> 엑셀 업로드
                  </button>
                  <button onClick={() => setWizardCreateTrigger((t) => t + 1)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                    <Plus size={14} /> {detailCfg.addLabel}
                  </button>
                </div>
              </div>

              {type === "theory" && newSubjectId && <TheorySection key={newSubjectId} subjectId={newSubjectId} createTrigger={wizardCreateTrigger} />}
              {type === "problems" && newSubjectId && <ProblemSectionComponent key={newSubjectId} subjectId={newSubjectId} createTrigger={wizardCreateTrigger} />}
              {type === "packages" && <PackageSection key={newSubjectId} createTrigger={wizardCreateTrigger} initialData={[]} />}

              <ExcelUploadModal visible={wizardExcelUpload} onClose={() => setWizardExcelUpload(false)} subjectType={type} subjectName={wizardForm.name} />

              {/* 하단 버튼 */}
              <div className="flex justify-between mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setWizardStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  <ArrowLeft size={14} /> 기본 정보 수정
                </button>
                <button onClick={finishWizard} className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
                  <Check size={16} /> 완료
                </button>
              </div>
            </div>
          )
        )}
      </div>
    );
  }

  // ════════════════════════════════════════
  // 과목 목록 뷰
  // ════════════════════════════════════════
  return (
    <div>
      <PageHeader
        title={`${cfg.label} 과목`}
        description={`${cfg.label} 과목을 등록하고 콘텐츠를 관리합니다`}
        action={
          <button onClick={startWizard} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors">
            <Plus size={18} /> 과목 추가
          </button>
        }
      />

      {/* ── 이론/문제풀이: 왼쪽(테이블+상세) + 오른쪽(앱 미리보기) ── */}
      <div className={(type === "theory" || type === "problems") ? "flex gap-6 items-start" : ""}>
      <div className={(type === "theory" || type === "problems") ? "flex-1 min-w-0" : ""}>

      {/* ── 과목 테이블 ── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">과목명</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-28">정가</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-28">할인가</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-24">콘텐츠</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3 w-20">상태</th>
              <th className="text-right text-xs font-medium text-gray-500 px-5 py-3 w-24">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-sm text-gray-400">
                  등록된 과목이 없습니다. &apos;과목 추가&apos; 버튼을 눌러 시작하세요.
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s.id} onClick={() => toggleSubject(s.id)} className={`cursor-pointer transition-colors ${selectedId === s.id ? "bg-primary/5" : "hover:bg-gray-50"}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {s.imageUrl ? (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden shrink-0"><img src={s.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconColor}`}>{cfg.icon}</div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-900">{s.name}</span>
                        {s.description && <p className="text-xs text-gray-400 line-clamp-1">{s.description}</p>}
                      </div>
                      {selectedId === s.id ? <ChevronUp size={14} className="text-primary ml-1" /> : <ChevronDown size={14} className="text-gray-300 ml-1" />}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-700">{formatPrice(s.price)}</td>
                  <td className="px-5 py-3.5 text-sm">
                    {s.discountPrice ? <span className="text-red-500 font-medium">{formatPrice(s.discountPrice)}</span> : <span className="text-gray-300">-</span>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">{s.contentCount}개</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.isActive ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(e) => { e.stopPropagation(); toggleSubject(s.id); }} className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 transition-colors" title="수정"><Pencil size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors" title="삭제"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── 선택된 과목 상세 ── */}
      {selected && (
        <div ref={detailRef} className="mt-4 space-y-4">
          {/* ═══ 왼쪽: 기본 정보 ═══ */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900"><span className="text-primary">{selected.name}</span> 기본 정보</h3>
              <button onClick={() => setSelectedId(null)} className="text-xs text-gray-400 hover:text-gray-600">접기</button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">대표 이미지</label>
                    {editForm.imageUrl ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                        <img src={editForm.imageUrl} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => { setEditForm((f) => ({ ...f, imageUrl: "" })); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"><X size={12} /></button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors"><ImagePlus size={22} /><span className="text-xs">이미지 업로드</span></button>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, "edit")} className="hidden" />
                  </div>
                  <div className="space-y-3">
                    <div><label className="block text-xs font-medium text-gray-500 mb-1">과목명 <span className="text-red-500">*</span></label><input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">정가 <span className="text-red-500">*</span></label><input type="number" value={editForm.price} onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                      <div><label className="block text-xs font-medium text-gray-500 mb-1">할인가</label><input type="number" value={editForm.discountPrice} onChange={(e) => setEditForm((f) => ({ ...f, discountPrice: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                    </div>
                  </div>
                </div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">설명</label><textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={2} placeholder="과목 설명" /></div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">설명 이미지</label>
                <div className="flex flex-wrap gap-2">
                  {editForm.descriptionImages.map((img, i) => (<ImagePreview key={i} src={img} onRemove={() => setEditForm((f) => ({ ...f, descriptionImages: f.descriptionImages.filter((_, idx) => idx !== i) }))} size="sm" />))}
                  <ImageAddButton onClick={() => pickImage((url) => setEditForm((f) => ({ ...f, descriptionImages: [...f.descriptionImages, url] })))} size="sm" />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button onClick={handleSaveInfo} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"><Save size={14} /> 저장</button>
              </div>
            </div>
          </div>

          {/* ═══ 오른쪽: 콘텐츠 관리 ═══ */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900"><span className="text-primary">{selected.name}</span> 콘텐츠 관리</h3>
              <div className="flex items-center gap-2">
                {type !== "theory" && type !== "problems" && <button onClick={() => setShowExcelUpload(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary border border-primary rounded-lg hover:bg-indigo-50 transition-colors"><FileSpreadsheet size={14} /> 엑셀 업로드</button>}
                {type !== "problems" && <button onClick={() => setCreateTrigger((t) => t + 1)} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"><Plus size={14} /> {detailCfg.addLabel}</button>}
              </div>
            </div>
            {type === "theory" && selectedId && <TheorySection key={selectedId} subjectId={selectedId} createTrigger={createTrigger} onChaptersChange={setTheoryChapters} />}
            {type === "problems" && selectedId && <ProblemSectionComponent key={selectedId} subjectId={selectedId} createTrigger={createTrigger} onSectionsChange={setProblemSections} />}
            {type === "videos" && <VideoSection key={selectedId} subjectId={selectedId ?? undefined} createTrigger={createTrigger} />}
            {type === "packages" && <PackageSection key={selectedId} createTrigger={createTrigger} />}
            {type !== "theory" && <ExcelUploadModal visible={showExcelUpload} onClose={() => setShowExcelUpload(false)} subjectType={type} subjectName={editForm.name} />}
          </div>

        </div>
      )}

      <ConfirmModal visible={!!deleteTarget} message={deleteTarget ? `"${deleteTarget.name}" 과목을 삭제하시겠습니까?\n관련 콘텐츠가 모두 삭제됩니다.` : ""} onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />

      </div>{/* end flex-1 left column */}

      {/* ═══ 오른쪽: 앱 미리보기 (이론/문제풀이, 항상 표시) ═══ */}
      {type === "theory" && selectedId && (
        <TheoryAppPreview bookTitle={editForm.name} chapters={theoryChapters} />
      )}
      {type === "problems" && selectedId && (
        <ProblemAppPreview bookTitle={editForm.name} sections={problemSections} />
      )}

      </div>{/* end flex row wrapper */}
    </div>
  );
}
