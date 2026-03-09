"use client";

import { useState, useEffect, useRef } from "react";
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
  FileUp, File, X, Eye, Replace, Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── 파일 아이콘 ───
const FILE_ICONS: Record<string, string> = {
  pdf: "PDF", xml: "XML", png: "PNG", jpg: "JPG", jpeg: "JPG",
  gif: "GIF", hwp: "HWP", hwpx: "HWP", docx: "DOC",
};

function getFileExt(url: string): string {
  return url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
}

function getFileIcon(url: string): string {
  return FILE_ICONS[getFileExt(url)] ?? "FILE";
}

function getFileName(url: string): string {
  const decoded = decodeURIComponent(url.split("/").pop() ?? "");
  // UUID prefix 제거 (uuid.ext → ext file)
  const parts = decoded.split(".");
  if (parts.length >= 2) {
    return decoded.length > 40 ? `...${decoded.slice(-30)}` : decoded;
  }
  return decoded;
}

// ─── 메인 컴포넌트 ───
interface TheorySectionProps {
  subjectId: string;
  createTrigger?: number;
}

export default function TheorySection({ subjectId, createTrigger = 0 }: TheorySectionProps) {
  const [chapters, setChapters] = useState<TheoryChapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);

  // 챕터 모달
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<TheoryChapter | null>(null);
  const [chapterForm, setChapterForm] = useState({ number: "", title: "" });

  // 토픽 모달
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TheoryTopic | null>(null);
  const [topicChapterId, setTopicChapterId] = useState<string>("");
  const [topicForm, setTopicForm] = useState({ title: "", body: "", hasNote: false });
  const [topicFiles, setTopicFiles] = useState<string[]>([]); // 기존 URL
  const [newFiles, setNewFiles] = useState<File[]>([]); // 새로 선택한 파일
  const [uploading, setUploading] = useState(false);

  // 삭제 확인
  const [deleteTarget, setDeleteTarget] = useState<{ type: "chapter" | "topic"; id: string; title: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── 데이터 로드 ──
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchChaptersWithTopics(subjectId);
      setChapters(data);
      if (data.length > 0 && !expandedChapterId) {
        setExpandedChapterId(data[0].id);
      }
    } catch (err) {
      console.error("이론 데이터 로드 실패:", err);
      toast.error("이론 데이터를 불러오지 못했습니다");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subjectId) loadData();
  }, [subjectId]);

  // createTrigger → 챕터 추가 모달
  useEffect(() => {
    if (createTrigger > 0) openCreateChapter();
  }, [createTrigger]);

  // ── 챕터 CRUD ──
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
    if (!chapterForm.title.trim()) {
      toast.error("챕터 제목을 입력하세요");
      return;
    }
    try {
      if (editingChapter) {
        await updateChapter(editingChapter.id, {
          number: Number(chapterForm.number),
          title: chapterForm.title.trim(),
        });
        toast.success("챕터가 수정되었습니다");
      } else {
        const id = crypto.randomUUID();
        await createChapter(
          subjectId, id,
          Number(chapterForm.number),
          chapterForm.title.trim(),
          chapters.length,
        );
        toast.success("챕터가 추가되었습니다");
      }
      setShowChapterModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("챕터 저장에 실패했습니다");
    }
  };

  // ── 토픽 CRUD ──
  const openCreateTopic = (chapterId: string) => {
    setEditingTopic(null);
    setTopicChapterId(chapterId);
    setTopicForm({ title: "", body: "", hasNote: false });
    setTopicFiles([]);
    setNewFiles([]);
    setShowTopicModal(true);
  };

  const openEditTopic = (chapterId: string, topic: TheoryTopic) => {
    setEditingTopic(topic);
    setTopicChapterId(chapterId);
    setTopicForm({ title: topic.title, body: topic.body, hasNote: topic.hasNote });
    setTopicFiles([...topic.contentUrls]);
    setNewFiles([]);
    setShowTopicModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    const added: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}: 20MB 이하 파일만 가능합니다`);
        continue;
      }
      added.push(file);
    }
    if (added.length > 0) {
      setNewFiles((prev) => [...prev, ...added]);
    }
    e.target.value = "";
  };

  const removeExistingFile = async (url: string) => {
    try {
      await deleteTheoryFile(url);
      setTopicFiles((prev) => prev.filter((u) => u !== url));
      toast.success("파일이 삭제되었습니다");
    } catch {
      toast.error("파일 삭제에 실패했습니다");
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTopic = async () => {
    if (!topicForm.title.trim()) {
      toast.error("토픽 제목을 입력하세요");
      return;
    }
    try {
      setUploading(true);

      // 새 파일 업로드
      const uploadedUrls: string[] = [];
      for (const file of newFiles) {
        const url = await uploadTheoryFile(file, subjectId, topicChapterId);
        uploadedUrls.push(url);
      }

      const allUrls = [...topicFiles, ...uploadedUrls];
      const hasText = topicForm.body.trim().length > 0;
      const hasFiles = allUrls.length > 0;
      const contentType: TheoryTopic["contentType"] =
        hasText && hasFiles ? "mixed" : hasFiles ? "file" : "text";

      if (editingTopic) {
        await updateTopic(editingTopic.id, {
          title: topicForm.title.trim(),
          contentType,
          contentUrls: allUrls,
          body: topicForm.body,
          hasNote: topicForm.hasNote,
        });
        toast.success("토픽이 수정되었습니다");
      } else {
        const chapter = chapters.find((c) => c.id === topicChapterId);
        const id = crypto.randomUUID();
        await createTopic(topicChapterId, {
          id,
          title: topicForm.title.trim(),
          contentType,
          contentUrls: allUrls,
          body: topicForm.body,
          hasNote: topicForm.hasNote,
          orderNum: chapter?.topics.length ?? 0,
        });
        toast.success("토픽이 추가되었습니다");
      }

      setShowTopicModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("토픽 저장에 실패했습니다");
    } finally {
      setUploading(false);
    }
  };

  // ── 삭제 ──
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "chapter") {
        await deleteChapter(deleteTarget.id);
        toast.success("챕터가 삭제되었습니다");
      } else {
        await deleteTopic(deleteTarget.id);
        toast.success("토픽이 삭제되었습니다");
      }
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error("삭제에 실패했습니다");
    }
  };

  // ── 로딩 ──
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin mr-2" size={20} />
        이론 데이터를 불러오는 중...
      </div>
    );
  }

  // ── 빈 상태 ──
  if (chapters.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 mb-4">등록된 챕터가 없습니다</p>
        <button
          onClick={openCreateChapter}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          첫 챕터 추가
        </button>
      </div>
    );
  }

  return (
    <>
      {/* 챕터 추가 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={openCreateChapter}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          챕터 추가
        </button>
      </div>

      {/* 챕터 목록 */}
      <div className="space-y-3">
        {chapters.map((chapter) => {
          const isExpanded = expandedChapterId === chapter.id;
          return (
            <div
              key={chapter.id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              {/* 챕터 헤더 */}
              <div
                className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  isExpanded ? "border-b border-gray-100" : ""
                }`}
                onClick={() =>
                  setExpandedChapterId(isExpanded ? null : chapter.id)
                }
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isExpanded ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                  }`}>
                    {String(chapter.number).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="font-semibold text-gray-900 text-sm">
                      {chapter.title}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      이론 {chapter.topics.length}개
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditChapter(chapter); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                    title="챕터 수정"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: "chapter", id: chapter.id, title: chapter.title });
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    title="챕터 삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400 ml-1" /> : <ChevronDown size={16} className="text-gray-400 ml-1" />}
                </div>
              </div>

              {/* 토픽 목록 (펼침) */}
              {isExpanded && (
                <div className="bg-gray-50/60">
                  {chapter.topics.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      등록된 이론이 없습니다
                    </div>
                  ) : (
                    chapter.topics.map((topic, tIdx) => (
                      <div
                        key={topic.id}
                        className={`flex items-center justify-between px-4 py-3 ${
                          tIdx < chapter.topics.length - 1 ? "border-b border-gray-100" : ""
                        }`}
                        style={{ paddingLeft: 56 }}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{topic.title}</span>
                          {topic.hasNote && (
                            <span className="shrink-0 bg-amber-100 text-amber-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                              필기
                            </span>
                          )}
                          {topic.contentUrls.length > 0 && (
                            <span className="shrink-0 bg-blue-50 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                              파일 {topic.contentUrls.length}
                            </span>
                          )}
                          {topic.body && (
                            <span className="shrink-0 bg-green-50 text-green-600 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                              텍스트
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditTopic(chapter.id, topic)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="토픽 수정"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({ type: "topic", id: topic.id, title: topic.title })
                            }
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            title="토픽 삭제"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* 토픽 추가 버튼 */}
                  <div className="px-4 py-3 border-t border-gray-100">
                    <button
                      onClick={() => openCreateTopic(chapter.id)}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      <Plus size={14} />
                      이론 추가
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 챕터 모달 ── */}
      <FormModal
        visible={showChapterModal}
        title={editingChapter ? "챕터 수정" : "챕터 추가"}
        onClose={() => setShowChapterModal(false)}
        onSubmit={handleSaveChapter}
        submitLabel={editingChapter ? "수정" : "추가"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-[100px_1fr] gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                챕터 번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={chapterForm.number}
                onChange={(e) => setChapterForm((f) => ({ ...f, number: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                챕터 제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={chapterForm.title}
                onChange={(e) => setChapterForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="예: 두경부"
              />
            </div>
          </div>
        </div>
      </FormModal>

      {/* ── 토픽 모달 ── */}
      <FormModal
        visible={showTopicModal}
        title={editingTopic ? "이론 수정" : "이론 추가"}
        onClose={() => setShowTopicModal(false)}
        onSubmit={handleSaveTopic}
        submitLabel={uploading ? "업로드 중..." : editingTopic ? "수정" : "추가"}
        submitDisabled={uploading}
      >
        <div className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={topicForm.title}
              onChange={(e) => setTopicForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="예: 두개골 구조와 봉합"
            />
          </div>

          {/* 본문 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">본문 내용 (선택)</label>
            <textarea
              value={topicForm.body}
              onChange={(e) => setTopicForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              rows={4}
              placeholder="텍스트 본문을 입력하거나 아래에서 파일을 업로드하세요"
            />
          </div>

          {/* 파일 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              콘텐츠 파일 (PDF, 이미지 등)
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors"
            >
              <FileUp size={20} />
              <span className="text-sm">파일 선택 (각 20MB 이하)</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.bmp,.svg,.webp,.hwp,.hwpx,.docx,.xml"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* 기존 파일 (수정 시) */}
            {topicFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">업로드된 파일</p>
                {topicFiles.map((url, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
                    <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-blue-600">{getFileIcon(url)}</span>
                    </div>
                    <span className="text-sm text-gray-600 truncate flex-1">{getFileName(url)}</span>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="미리보기"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(url)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                      title="삭제"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 새로 선택한 파일 */}
            {newFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                <p className="text-xs text-gray-500 font-medium">새 파일 (저장 시 업로드)</p>
                {newFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="w-7 h-7 rounded bg-green-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-green-600">
                        {FILE_ICONS[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "FILE"}
                      </span>
                    </div>
                    <span className="text-sm text-gray-600 truncate flex-1">{file.name}</span>
                    <span className="text-xs text-gray-400">
                      {file.size < 1024 * 1024
                        ? `${(file.size / 1024).toFixed(0)}KB`
                        : `${(file.size / (1024 * 1024)).toFixed(1)}MB`}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNewFile(i)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 필기 여부 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={topicForm.hasNote}
              onChange={(e) => setTopicForm((f) => ({ ...f, hasNote: e.target.checked }))}
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
            />
            <span className="text-sm text-gray-700">필기 포함</span>
          </label>
        </div>
      </FormModal>

      {/* ── 삭제 확인 모달 ── */}
      <ConfirmModal
        visible={!!deleteTarget}
        message={
          deleteTarget
            ? `"${deleteTarget.title}" ${deleteTarget.type === "chapter" ? "챕터를 삭제하시겠습니까? 하위 이론도 모두 삭제됩니다." : "이론을 삭제하시겠습니까?"}`
            : ""
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
