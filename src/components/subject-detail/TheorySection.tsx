"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TheoryChapter, TheoryTopic } from "../../types";
import {
  fetchChaptersWithTopics,
  createChapter,
  updateChapter,
  deleteChapter,
  createTopic,
  updateTopic,
  deleteTopic,
  uploadTheoryFile,
  deleteTheoryFile,
} from "../../lib/theoryService";
import ConfirmModal from "../ConfirmModal";
import FormModal from "../FormModal";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  FileUp, X, Eye, Loader2, Upload, Image, FileText, GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── 유틸 ───
function getFileExt(name: string): string {
  return name.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
}
function isImageFile(name: string): boolean {
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(getFileExt(name));
}
function cleanFileName(name: string): string {
  // 확장자 제거 → 특수문자를 공백으로 → 앞뒤 공백 제거
  return name.replace(/\.[^.]+$/, "").replace(/[_\-\.]+/g, " ").trim();
}

// ─── 메인 컴포넌트 ───
interface TheorySectionProps {
  subjectId: string;
  createTrigger?: number;
  onChaptersChange?: (chapters: TheoryChapter[]) => void;
}

export default function TheorySection({ subjectId, createTrigger = 0, onChaptersChange }: TheorySectionProps) {
  const [chapters, setChapters] = useState<TheoryChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // 미리보기
  const [previewTopic, setPreviewTopic] = useState<TheoryTopic | null>(null);

  // 챕터 모달
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<TheoryChapter | null>(null);
  const [chapterForm, setChapterForm] = useState({ number: "", title: "" });

  // 토픽 모달
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TheoryTopic | null>(null);
  const [topicChapterId, setTopicChapterId] = useState<string>("");
  const [topicForm, setTopicForm] = useState({ title: "", body: "", hasNote: false });
  const [topicFiles, setTopicFiles] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // 대량 업로드
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkChapterId, setBulkChapterId] = useState<string>("");
  const [bulkFiles, setBulkFiles] = useState<{ file: File; title: string; preview?: string }[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<{ type: "chapter" | "topic"; id: string; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  // ── 데이터 로드 ──
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchChaptersWithTopics(subjectId);
      setChapters(data);
      onChaptersChange?.(data);
      if (data.length > 0 && !expandedChapterId) {
        setExpandedChapterId(data[0].id);
      }
    } catch (err) {
      console.error("이론 데이터 로드 실패:", err);
      toast.error("이론 데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { if (subjectId) loadData(); }, [subjectId, loadData]);
  useEffect(() => { if (createTrigger > 0) openCreateChapter(); }, [createTrigger]);

  // ══════════════════════════════════════
  // 챕터 CRUD
  // ══════════════════════════════════════
  const openCreateChapter = () => {
    setEditingChapter(null);
    setChapterForm({ number: String(chapters.length + 1), title: "" });
    setShowChapterModal(true);
  };
  const openEditChapter = (ch: TheoryChapter) => {
    setEditingChapter(ch);
    setChapterForm({ number: String(ch.number), title: ch.title });
    setShowChapterModal(true);
  };
  const handleSaveChapter = async () => {
    if (!chapterForm.title.trim()) { toast.error("챕터 제목을 입력하세요"); return; }
    try {
      if (editingChapter) {
        await updateChapter(editingChapter.id, { number: Number(chapterForm.number), title: chapterForm.title.trim() });
        toast.success("챕터가 수정되었습니다");
      } else {
        await createChapter(subjectId, crypto.randomUUID(), Number(chapterForm.number), chapterForm.title.trim(), chapters.length);
        toast.success("챕터가 추가되었습니다");
      }
      setShowChapterModal(false);
      await loadData();
    } catch { toast.error("챕터 저장에 실패했습니다"); }
  };

  // ══════════════════════════════════════
  // 토픽 수동 등록
  // ══════════════════════════════════════
  const openCreateTopic = (chapterId: string) => {
    setEditingTopic(null);
    setTopicChapterId(chapterId);
    setTopicForm({ title: "", body: "", hasNote: false });
    setTopicFiles([]); setNewFiles([]);
    setShowTopicModal(true);
  };
  const openEditTopic = (chapterId: string, topic: TheoryTopic) => {
    setEditingTopic(topic);
    setTopicChapterId(chapterId);
    setTopicForm({ title: topic.title, body: topic.body, hasNote: topic.hasNote });
    setTopicFiles([...topic.contentUrls]); setNewFiles([]);
    setShowTopicModal(true);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = e.target.files;
    if (!fl) return;
    const added: File[] = [];
    for (let i = 0; i < fl.length; i++) {
      if (fl[i].size > 20 * 1024 * 1024) { toast.error(`${fl[i].name}: 20MB 초과`); continue; }
      added.push(fl[i]);
    }
    if (added.length) setNewFiles((p) => [...p, ...added]);
    e.target.value = "";
  };
  const handleSaveTopic = async () => {
    if (!topicForm.title.trim()) { toast.error("제목을 입력하세요"); return; }
    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        uploadedUrls.push(await uploadTheoryFile(file, subjectId, topicChapterId));
      }
      const allUrls = [...topicFiles, ...uploadedUrls];
      const hasText = topicForm.body.trim().length > 0;
      const hasFiles = allUrls.length > 0;
      const contentType: TheoryTopic["contentType"] = hasText && hasFiles ? "mixed" : hasFiles ? "file" : "text";

      if (editingTopic) {
        await updateTopic(editingTopic.id, { title: topicForm.title.trim(), contentType, contentUrls: allUrls, body: topicForm.body, hasNote: topicForm.hasNote });
        toast.success("수정되었습니다");
      } else {
        const chapter = chapters.find((c) => c.id === topicChapterId);
        await createTopic(topicChapterId, { id: crypto.randomUUID(), title: topicForm.title.trim(), contentType, contentUrls: allUrls, body: topicForm.body, hasNote: topicForm.hasNote, orderNum: chapter?.topics.length ?? 0 });
        toast.success("추가되었습니다");
      }
      setShowTopicModal(false);
      await loadData();
    } catch { toast.error("저장에 실패했습니다"); }
    finally { setUploading(false); }
  };

  // ══════════════════════════════════════
  // 대량 업로드
  // ══════════════════════════════════════
  const openBulkUpload = (chapterId: string) => {
    setBulkChapterId(chapterId);
    setBulkFiles([]);
    setShowBulkUpload(true);
  };

  const addBulkFiles = (files: FileList | File[]) => {
    const items: { file: File; title: string; preview?: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files instanceof FileList ? files[i] : files[i];
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name}: 20MB 초과`); continue; }
      const item: { file: File; title: string; preview?: string } = { file: f, title: cleanFileName(f.name) };
      if (isImageFile(f.name)) {
        item.preview = URL.createObjectURL(f);
      }
      items.push(item);
    }
    if (items.length) {
      setBulkFiles((p) => [...p, ...items]);
      toast.success(`${items.length}개 파일 추가됨`);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files.length) addBulkFiles(e.dataTransfer.files);
  }, []);

  const handleBulkSave = async () => {
    if (bulkFiles.length === 0) { toast.error("파일을 추가하세요"); return; }
    try {
      setBulkUploading(true);
      const chapter = chapters.find((c) => c.id === bulkChapterId);
      let orderBase = chapter?.topics.length ?? 0;

      for (const item of bulkFiles) {
        const url = await uploadTheoryFile(item.file, subjectId, bulkChapterId);
        await createTopic(bulkChapterId, {
          id: crypto.randomUUID(),
          title: item.title,
          contentType: "file",
          contentUrls: [url],
          body: "",
          hasNote: false,
          orderNum: orderBase++,
        });
      }
      toast.success(`${bulkFiles.length}개 이론이 등록되었습니다`);
      // cleanup preview URLs
      bulkFiles.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
      setShowBulkUpload(false);
      await loadData();
    } catch { toast.error("대량 업로드에 실패했습니다"); }
    finally { setBulkUploading(false); }
  };

  // ══════════════════════════════════════
  // 삭제
  // ══════════════════════════════════════
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "chapter") { await deleteChapter(deleteTarget.id); }
      else { await deleteTopic(deleteTarget.id); }
      toast.success("삭제되었습니다");
      setDeleteTarget(null);
      if (previewTopic?.id === deleteTarget.id) setPreviewTopic(null);
      await loadData();
    } catch { toast.error("삭제에 실패했습니다"); }
  };

  const removeExistingFile = async (url: string) => {
    try { await deleteTheoryFile(url); setTopicFiles((p) => p.filter((u) => u !== url)); toast.success("파일 삭제됨"); }
    catch { toast.error("파일 삭제 실패"); }
  };

  // ══════════════════════════════════════
  // 렌더링
  // ══════════════════════════════════════

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="animate-spin mr-2" size={20} />이론 데이터를 불러오는 중...</div>;
  }

  const totalTopics = chapters.reduce((s, c) => s + c.topics.length, 0);

  return (
    <>
      {/* ── 상단 요약 + 버튼 ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-500">
          {chapters.length}개 챕터 · 이론 {totalTopics}개
        </div>
        <button onClick={openCreateChapter} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus size={14} /> 챕터 추가
        </button>
      </div>

      {/* ── 2단 레이아웃: 왼쪽(챕터/토픽 목록) + 오른쪽(미리보기) ── */}
      <div className="flex gap-4">
        {/* ═══ 왼쪽: prore-app 스타일 챕터 목록 ═══ */}
        <div className={`space-y-3 ${previewTopic ? "w-1/2" : "w-full"} transition-all`}>
          {chapters.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <FileText size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-400 mb-4">등록된 챕터가 없습니다</p>
              <button onClick={openCreateChapter} className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Plus size={16} /> 첫 챕터 추가
              </button>
            </div>
          ) : (
            chapters.map((chapter, cIdx) => {
              const isExpanded = expandedChapterId === chapter.id;
              return (
                <div key={chapter.id} className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${isExpanded ? "border-primary/30 shadow-md shadow-primary/5" : "border-gray-200 shadow-sm"}`}>
                  {/* ── 챕터 헤더 (prore-app 동일) ── */}
                  <div
                    className={`flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-gray-50/80 transition-colors ${isExpanded ? "border-b border-gray-100" : ""}`}
                    onClick={() => setExpandedChapterId(isExpanded ? null : chapter.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${isExpanded ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                        {String(chapter.number).padStart(2, "0")}
                      </div>
                      <div>
                        <div className="text-[15px] font-bold text-gray-900">{chapter.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">이론 {chapter.topics.length}개</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* 대량 업로드 */}
                      <button onClick={(e) => { e.stopPropagation(); openBulkUpload(chapter.id); }}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors" title="대량 업로드">
                        <Upload size={15} />
                      </button>
                      {/* 수정 */}
                      <button onClick={(e) => { e.stopPropagation(); openEditChapter(chapter); }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="챕터 수정">
                        <Pencil size={14} />
                      </button>
                      {/* 삭제 */}
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "chapter", id: chapter.id, title: chapter.title }); }}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="챕터 삭제">
                        <Trash2 size={14} />
                      </button>
                      {/* 화살표 */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isExpanded ? "bg-primary/10" : "bg-gray-100"}`}>
                        {isExpanded ? <ChevronUp size={14} className="text-primary" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {/* ── 토픽 리스트 (prore-app 동일 스타일) ── */}
                  {isExpanded && (
                    <div className="bg-gray-50/50">
                      {chapter.topics.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">
                          <Image size={28} className="mx-auto text-gray-300 mb-2" />
                          이론이 없습니다. 아래에서 추가하세요.
                        </div>
                      ) : (
                        chapter.topics.map((topic, tIdx) => {
                          const isSelected = previewTopic?.id === topic.id;
                          return (
                            <div
                              key={topic.id}
                              onClick={() => setPreviewTopic(isSelected ? null : topic)}
                              className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                                tIdx < chapter.topics.length - 1 ? "border-b border-gray-100" : ""
                              } ${isSelected ? "bg-primary/5" : "hover:bg-white/80"}`}
                              style={{ paddingLeft: 56 }}
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSelected ? "bg-primary" : "bg-primary/40"}`} />
                                <span className="text-sm text-gray-700 truncate">{topic.title}</span>
                                {topic.hasNote && (
                                  <span className="shrink-0 bg-amber-100 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">필기</span>
                                )}
                                {topic.contentUrls.length > 0 && (
                                  <span className="shrink-0 bg-blue-50 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                    {topic.contentUrls.length}개 파일
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {/* 미리보기 버튼 (prore-app의 "이론 보기" 스타일) */}
                                <button onClick={(e) => { e.stopPropagation(); setPreviewTopic(isSelected ? null : topic); }}
                                  className={`border rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                                    isSelected ? "border-primary bg-primary text-white" : "border-primary/30 text-primary hover:bg-primary/5"
                                  }`}>
                                  {isSelected ? "닫기" : "미리보기"}
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); openEditTopic(chapter.id, topic); }}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title="수정">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget({ type: "topic", id: topic.id, title: topic.title }); }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" title="삭제">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* 하단 추가 버튼 */}
                      <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100">
                        <button onClick={() => openCreateTopic(chapter.id)}
                          className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
                          <Plus size={14} /> 수동 추가
                        </button>
                        <span className="text-gray-300">|</span>
                        <button onClick={() => openBulkUpload(chapter.id)}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-500 font-medium transition-colors">
                          <Upload size={14} /> 대량 업로드
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ═══ 오른쪽: 미리보기 패널 ═══ */}
        {previewTopic && (
          <div className="w-1/2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden sticky top-4 self-start max-h-[80vh] flex flex-col">
            {/* 미리보기 헤더 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{previewTopic.title}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {previewTopic.contentUrls.length}개 파일
                  {previewTopic.hasNote && " · 필기 포함"}
                </p>
              </div>
              <button onClick={() => setPreviewTopic(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* 미리보기 본문 */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {previewTopic.body && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap">{previewTopic.body}</div>
              )}
              {previewTopic.contentUrls.length === 0 && !previewTopic.body && (
                <div className="text-center py-12 text-gray-400 text-sm">콘텐츠가 없습니다</div>
              )}
              {previewTopic.contentUrls.map((url, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-gray-100">
                  {isImageFile(url) ? (
                    // 이미지: 바로 표시
                    <img src={url} alt={`${previewTopic.title} ${i + 1}`} className="w-full" loading="lazy" />
                  ) : getFileExt(url) === "pdf" ? (
                    // PDF: iframe 미리보기
                    <div>
                      <iframe src={url} className="w-full h-[500px] border-0" title={`PDF ${i + 1}`} />
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        className="block text-center py-2 text-xs text-primary hover:bg-primary/5 transition-colors border-t border-gray-100">
                        새 탭에서 열기
                      </a>
                    </div>
                  ) : (
                    // 기타 파일: 다운로드 링크
                    <a href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                      <FileText size={20} className="text-blue-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{decodeURIComponent(url.split("/").pop() ?? "")}</p>
                        <p className="text-xs text-gray-400">{getFileExt(url).toUpperCase()} 파일</p>
                      </div>
                      <Eye size={16} className="text-gray-400" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════ */}
      {/* 챕터 모달 */}
      {/* ══════════════════════════════════════ */}
      <FormModal visible={showChapterModal} title={editingChapter ? "챕터 수정" : "챕터 추가"} onClose={() => setShowChapterModal(false)} onSubmit={handleSaveChapter} submitLabel={editingChapter ? "수정" : "추가"}>
        <div className="space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">번호 <span className="text-red-500">*</span></label>
              <input type="number" value={chapterForm.number} onChange={(e) => setChapterForm((f) => ({ ...f, number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" min={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
              <input type="text" value={chapterForm.title} onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 두경부" />
            </div>
          </div>
        </div>
      </FormModal>

      {/* ══════════════════════════════════════ */}
      {/* 토픽 수동 등록 모달 */}
      {/* ══════════════════════════════════════ */}
      <FormModal visible={showTopicModal} title={editingTopic ? "이론 수정" : "이론 추가"} onClose={() => setShowTopicModal(false)} onSubmit={handleSaveTopic}
        submitLabel={uploading ? "업로드 중..." : editingTopic ? "수정" : "추가"} submitDisabled={uploading}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목 <span className="text-red-500">*</span></label>
            <input type="text" value={topicForm.title} onChange={(e) => setTopicForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="예: 두개골 구조와 봉합" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">본문 (선택)</label>
            <textarea value={topicForm.body} onChange={(e) => setTopicForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary" rows={3} placeholder="텍스트 본문 또는 아래에서 파일 업로드" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">파일 (PDF, 이미지 등)</label>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary transition-colors">
              <FileUp size={18} /> <span className="text-sm">파일 선택 (각 20MB 이하)</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.hwp,.hwpx,.docx,.xml" multiple onChange={handleFileSelect} className="hidden" />

            {/* 기존 파일 */}
            {topicFiles.map((url, i) => (
              <div key={i} className="flex items-center gap-2 mt-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                {isImageFile(url) ? <img src={url} className="w-8 h-8 object-cover rounded" alt="" /> : <FileText size={16} className="text-blue-500" />}
                <span className="text-sm text-gray-600 truncate flex-1">{decodeURIComponent(url.split("/").pop() ?? "").slice(-30)}</span>
                <a href={url} target="_blank" rel="noopener noreferrer" className="p-1 text-gray-400 hover:text-blue-500"><Eye size={14} /></a>
                <button type="button" onClick={() => removeExistingFile(url)} className="p-1 text-gray-300 hover:text-red-500"><X size={14} /></button>
              </div>
            ))}
            {/* 새 파일 */}
            {newFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                <FileText size={16} className="text-green-500" />
                <span className="text-sm text-gray-600 truncate flex-1">{f.name}</span>
                <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                <button type="button" onClick={() => setNewFiles((p) => p.filter((_, idx) => idx !== i))} className="p-1 text-gray-300 hover:text-red-500"><X size={14} /></button>
              </div>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={topicForm.hasNote} onChange={(e) => setTopicForm((f) => ({ ...f, hasNote: e.target.checked }))}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary" />
            <span className="text-sm text-gray-700">필기 포함</span>
          </label>
        </div>
      </FormModal>

      {/* ══════════════════════════════════════ */}
      {/* 대량 업로드 모달 */}
      {/* ══════════════════════════════════════ */}
      {showBulkUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => { if (!bulkUploading) setShowBulkUpload(false); }} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">대량 업로드</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {chapters.find((c) => c.id === bulkChapterId)?.title} · 파일을 드래그하거나 선택하세요
                </p>
              </div>
              <button onClick={() => { if (!bulkUploading) setShowBulkUpload(false); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* 드래그앤드롭 영역 */}
            <div className="p-6 overflow-y-auto flex-1">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => bulkFileInputRef.current?.click()}
                className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5 text-primary" : "border-gray-300 text-gray-400 hover:border-primary hover:text-primary"
                }`}
              >
                <FileUp size={32} />
                <span className="text-sm font-medium">여러 파일을 드래그하거나 클릭해서 선택</span>
                <span className="text-xs">PDF, 이미지 등 · 각 20MB 이하 · 파일명이 이론 제목이 됩니다</span>
              </div>
              <input ref={bulkFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.hwp,.hwpx,.docx,.xml" multiple
                onChange={(e) => { if (e.target.files) addBulkFiles(e.target.files); e.target.value = ""; }} className="hidden" />

              {/* 파일 목록 + 미리보기 + 제목 편집 */}
              {bulkFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{bulkFiles.length}개 파일</span>
                    <button onClick={() => setBulkFiles([])} className="text-xs text-red-500 hover:text-red-600">전체 삭제</button>
                  </div>
                  {bulkFiles.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      {/* 미리보기 썸네일 */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                        {item.preview ? (
                          <img src={item.preview} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <FileText size={20} className="text-blue-400 mx-auto" />
                            <span className="text-[9px] text-gray-400 mt-0.5 block">{getFileExt(item.file.name).toUpperCase()}</span>
                          </div>
                        )}
                      </div>
                      {/* 제목 편집 */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => setBulkFiles((p) => p.map((f, idx) => idx === i ? { ...f, title: e.target.value } : f))}
                          className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="이론 제목"
                        />
                        <p className="text-xs text-gray-400 mt-1 truncate">{item.file.name} · {(item.file.size / 1024).toFixed(0)}KB</p>
                      </div>
                      {/* 삭제 */}
                      <button onClick={() => { if (item.preview) URL.revokeObjectURL(item.preview); setBulkFiles((p) => p.filter((_, idx) => idx !== i)); }}
                        className="p-1 text-gray-300 hover:text-red-500 shrink-0 mt-1"><X size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 푸터 */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 shrink-0 bg-gray-50">
              <span className="text-xs text-gray-400">{bulkFiles.length}개 파일 → 각각 1개 이론으로 등록됩니다</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setShowBulkUpload(false)} disabled={bulkUploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                  취소
                </button>
                <button onClick={handleBulkSave} disabled={bulkUploading || bulkFiles.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {bulkUploading ? <><Loader2 size={14} className="animate-spin" /> 업로드 중...</> : <><Upload size={14} /> {bulkFiles.length}개 일괄 등록</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 */}
      <ConfirmModal visible={!!deleteTarget}
        message={deleteTarget ? `"${deleteTarget.title}" ${deleteTarget.type === "chapter" ? "챕터를 삭제하시겠습니까? 하위 이론도 모두 삭제됩니다." : "이론을 삭제하시겠습니까?"}` : ""}
        onConfirm={handleConfirmDelete} onCancel={() => setDeleteTarget(null)} />
    </>
  );
}
