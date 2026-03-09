"use client";

import { useState } from "react";
import type { TheoryChapter, TheoryTopic } from "../../types";

/**
 * prore-app의 TheoryDetailScreen과 동일한 모습을 보여주는
 * 폰 프레임 미리보기 컴포넌트
 */
interface TheoryAppPreviewProps {
  bookTitle: string;
  chapters: TheoryChapter[];
}

function isImageFile(url: string): boolean {
  const ext = url.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
}

export default function TheoryAppPreview({ bookTitle, chapters }: TheoryAppPreviewProps) {
  const [expandedChapter, setExpandedChapter] = useState<string | null>(
    chapters[0]?.id ?? null
  );
  const [viewingTopic, setViewingTopic] = useState<TheoryTopic | null>(null);

  const totalTopics = chapters.reduce((s, c) => s + c.topics.length, 0);

  // 이론 보기 화면
  if (viewingTopic) {
    return (
      <div className="w-[400px] shrink-0 sticky top-4 self-start">
        <div className="text-sm font-medium text-gray-400 mb-2 text-center">앱 미리보기</div>
        <div className="bg-black rounded-[2.5rem] p-3 shadow-2xl">
          <div className="bg-white rounded-[2rem] overflow-hidden h-[720px] flex flex-col">
            {/* 상태바 */}
            <div className="h-7 bg-gray-50 flex items-center justify-center">
              <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
            </div>
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 shrink-0">
              <button onClick={() => setViewingTopic(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm font-semibold hover:bg-gray-200">
                ←
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold text-gray-900 truncate">{viewingTopic.title}</div>
              </div>
            </div>
            {/* 콘텐츠 */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {viewingTopic.body && (
                <div className="p-4 text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap bg-white border-b border-gray-100">
                  {viewingTopic.body}
                </div>
              )}
              {viewingTopic.contentUrls.map((url, i) => (
                <div key={i} className="p-3">
                  {isImageFile(url) ? (
                    <img src={url} alt="" className="w-full rounded-lg" loading="lazy" />
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-[10px] font-bold text-blue-500">
                          {url.split(".").pop()?.toUpperCase() ?? "FILE"}
                        </span>
                      </div>
                      <span className="text-[13px] text-gray-600 truncate flex-1">
                        {decodeURIComponent(url.split("/").pop() ?? "").slice(-30)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {viewingTopic.contentUrls.length === 0 && !viewingTopic.body && (
                <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                  콘텐츠 없음
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[400px] shrink-0 sticky top-4 self-start">
      <div className="text-sm font-medium text-gray-400 mb-2 text-center">앱 미리보기</div>
      {/* 폰 프레임 */}
      <div className="bg-black rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden h-[720px] flex flex-col">
          {/* 상태바 */}
          <div className="h-7 bg-gray-50 flex items-center justify-center">
            <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm font-semibold">←</div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-bold text-gray-900 truncate">{bookTitle || "과목명"}</div>
              <div className="text-xs text-gray-400">{chapters.length}개 챕터 · 이론 {totalTopics}개</div>
            </div>
          </div>

          {/* 챕터 리스트 */}
          <div className="flex-1 overflow-y-auto bg-gray-50 px-4 pt-4 pb-5">
            {chapters.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-300 text-sm">
                챕터를 추가하면 여기에 표시됩니다
              </div>
            ) : (
              <div className="space-y-2.5">
                {chapters.map((chapter) => {
                  const isExpanded = expandedChapter === chapter.id;
                  return (
                    <div key={chapter.id}
                      className={`bg-white rounded-xl border overflow-hidden transition-shadow ${
                        isExpanded ? "border-indigo-200 shadow-sm shadow-indigo-100" : "border-gray-200"
                      }`}
                    >
                      {/* 챕터 헤더 */}
                      <div
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                          isExpanded ? "border-b border-gray-100" : ""
                        }`}
                        onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isExpanded ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-500"
                          }`}>
                            {String(chapter.number).padStart(2, "0")}
                          </div>
                          <div>
                            <div className="text-[14px] font-bold text-gray-900">{chapter.title}</div>
                            <div className="text-[11px] text-gray-400">이론 {chapter.topics.length}개</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">전체보기</span>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                            isExpanded ? "bg-indigo-50" : "bg-gray-100"
                          }`}>
                            <span className={`text-[9px] font-bold ${isExpanded ? "text-indigo-500" : "text-gray-400"}`}>
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 토픽 리스트 */}
                      {isExpanded && (
                        <div className="bg-gray-50/50">
                          {chapter.topics.map((topic, tIdx) => (
                            <div key={topic.id}
                              className={`flex items-center justify-between px-4 py-2.5 ${
                                tIdx < chapter.topics.length - 1 ? "border-b border-gray-100" : ""
                              }`}
                              style={{ paddingLeft: 44 }}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 shrink-0" />
                                <span className="text-[13px] text-gray-700 truncate">{topic.title}</span>
                                {topic.hasNote && (
                                  <span className="shrink-0 bg-amber-100 text-amber-600 text-[9px] font-semibold px-1.5 py-0.5 rounded">필기</span>
                                )}
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); setViewingTopic(topic); }}
                                className="shrink-0 border border-indigo-200 rounded-full px-3 py-1 text-[10px] font-semibold text-indigo-500 hover:bg-indigo-50 transition-colors"
                              >
                                이론 보기
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
