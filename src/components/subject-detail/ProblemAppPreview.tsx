"use client";

import { useState } from "react";
import type { ProblemSection, ProblemQuestion } from "../../types";

/**
 * prore-app의 ProblemDetailScreen과 동일한 모습을 보여주는
 * 폰 프레임 미리보기 컴포넌트
 */
interface ProblemAppPreviewProps {
  bookTitle: string;
  sections: ProblemSection[];
}

function flattenQuestions(sections: ProblemSection[]): { sectionTitle: string; question: ProblemQuestion }[] {
  const all: { sectionTitle: string; question: ProblemQuestion }[] = [];
  sections.forEach((s) =>
    s.questions.forEach((q) => all.push({ sectionTitle: s.title, question: q }))
  );
  return all;
}

export default function ProblemAppPreview({ bookTitle, sections }: ProblemAppPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);

  const allQuestions = flattenQuestions(sections);
  const totalCount = allQuestions.length;

  if (totalCount === 0) {
    return (
      <div className="w-[400px] shrink-0 sticky top-4 self-start">
        <div className="text-sm font-medium text-gray-400 mb-2 text-center">앱 미리보기</div>
        <div className="bg-black rounded-[2.5rem] p-3 shadow-2xl">
          <div className="bg-white rounded-[2rem] overflow-hidden h-[720px] flex items-center justify-center">
            <div className="text-center text-gray-300">
              <div className="text-4xl mb-3">📝</div>
              <p className="text-sm">문제를 추가하면 여기에 표시됩니다</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const current = allQuestions[currentIndex];
  const q = current.question;
  const selectedAnswer = answers[q.id];
  const isAnswered = !!selectedAnswer;
  const progress = ((currentIndex + 1) / totalCount) * 100;

  const selectAnswer = (choiceId: string) => {
    if (isAnswered) return;
    setAnswers((prev) => ({ ...prev, [q.id]: choiceId }));
    setShowExplanation(true);
  };

  const goTo = (idx: number) => {
    setCurrentIndex(idx);
    setShowExplanation(!!answers[allQuestions[idx].question.id]);
  };

  const goPrev = () => currentIndex > 0 && goTo(currentIndex - 1);
  const goNext = () => currentIndex < totalCount - 1 && goTo(currentIndex + 1);

  const isCorrect = selectedAnswer === q.correctAnswer;

  return (
    <div className="w-[400px] shrink-0 sticky top-4 self-start">
      <div className="text-sm font-medium text-gray-400 mb-2 text-center">앱 미리보기</div>
      {/* 폰 프레임 */}
      <div className="bg-black rounded-[2.5rem] p-3 shadow-2xl">
        <div className="bg-white rounded-[2rem] overflow-hidden h-[720px] flex flex-col">
          {/* 상태바 */}
          <div className="h-7 bg-gray-50 flex items-center justify-center shrink-0">
            <div className="w-20 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* ── 헤더 (prore-app QuestionHeader) ── */}
          <div className="border-b border-gray-100 shrink-0">
            <div className="flex items-center px-4 py-3">
              <div className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-sm font-semibold mr-3">←</div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold text-gray-900 truncate">{current.sectionTitle}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{bookTitle || "과목명"}</div>
              </div>
            </div>
            {/* 타이머 + 진행상황 */}
            <div className="flex items-center px-4 pb-3 gap-2">
              <div className="bg-indigo-50 px-3 py-1.5 rounded-xl flex items-center">
                <span className="text-[14px] font-bold text-indigo-500">00:00</span>
              </div>
              <div className="bg-gray-100 px-3 py-1.5 rounded-xl flex items-center">
                <span className="text-[14px] font-bold text-gray-900">{currentIndex + 1}</span>
                <span className="text-[11px] text-gray-500 mx-1">/</span>
                <span className="text-[11px] text-gray-500">{totalCount}</span>
              </div>
            </div>
            {/* 진행 바 */}
            <div className="h-0.5 bg-gray-100">
              <div className="h-0.5 bg-indigo-500 rounded-r-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* ── 문제 영역 (스크롤) ── */}
          <div className="flex-1 overflow-y-auto px-4 pt-4 pb-3">
            {/* 문제 번호 + 제안/별 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-indigo-500 w-9 h-9 rounded-xl flex items-center justify-center mr-2">
                  <span className="text-[14px] font-bold text-white">{currentIndex + 1}</span>
                </div>
                <span className="text-[11px] text-gray-400">{current.sectionTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-gray-100 px-2.5 py-1.5 rounded-lg">
                  <span className="text-[11px] font-semibold text-gray-600">제안하기</span>
                </div>
                <span className="text-lg text-gray-200">★</span>
              </div>
            </div>

            {/* 문제 텍스트 */}
            <p className="text-[17px] leading-7 text-gray-900 font-semibold mb-5">{q.text}</p>

            {/* 선택지 (prore-app QuestionChoiceList) */}
            <div className="space-y-2 mb-4">
              {q.choices.map((choice, ci) => {
                const isSel = selectedAnswer === choice.id;
                const isCor = choice.id === q.correctAnswer;

                let containerStyle = "border-gray-100 bg-white";
                let numBg = "bg-gray-100";
                let numText = "text-gray-500";
                let textStyle = "text-gray-800";

                if (isAnswered) {
                  if (isCor) {
                    containerStyle = "border-indigo-500 bg-indigo-50/50";
                    numBg = "bg-indigo-500";
                    numText = "text-white";
                    textStyle = "text-gray-900 font-bold";
                  } else if (isSel) {
                    containerStyle = "border-gray-300 bg-gray-50";
                    numBg = "bg-gray-300";
                    numText = "text-white";
                    textStyle = "text-gray-400";
                  } else {
                    containerStyle = "border-gray-50 bg-gray-50/50";
                    numBg = "bg-gray-100";
                    numText = "text-gray-300";
                    textStyle = "text-gray-300";
                  }
                } else if (isSel) {
                  containerStyle = "border-indigo-500 bg-indigo-50/50";
                  numBg = "bg-indigo-500";
                  numText = "text-white";
                  textStyle = "text-gray-900 font-semibold";
                }

                return (
                  <button
                    key={choice.id}
                    onClick={() => selectAnswer(choice.id)}
                    className={`w-full flex items-center rounded-xl border-2 px-3.5 py-2.5 transition-all ${containerStyle}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 shrink-0 ${numBg}`}>
                      <span className={`text-[13px] font-bold ${numText}`}>{ci + 1}</span>
                    </div>
                    <span className={`text-[13px] flex-1 text-left leading-5 ${textStyle}`}>{choice.text}</span>
                    {isAnswered && isCor && (
                      <div className="bg-indigo-50 px-2 py-1 rounded-md ml-2 shrink-0">
                        <span className="text-[10px] font-bold text-indigo-500">정답</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* 해설 (prore-app ExplanationSection) */}
            {isAnswered && showExplanation && (
              <div className="mb-4">
                {/* 결과 배너 */}
                <div className={`rounded-xl px-3.5 py-3 mb-3 flex items-center ${isCorrect ? "bg-indigo-50" : "bg-gray-50"}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center mr-3 ${isCorrect ? "bg-indigo-500" : "bg-gray-300"}`}>
                    <span className="text-white text-sm font-bold">{isCorrect ? "O" : "X"}</span>
                  </div>
                  <div>
                    <span className={`text-[14px] font-bold ${isCorrect ? "text-indigo-500" : "text-gray-600"}`}>
                      {isCorrect ? "정답입니다!" : "틀렸습니다"}
                    </span>
                    {!isCorrect && <p className="text-[11px] text-gray-400 mt-0.5">오답노트에 자동 저장됨</p>}
                  </div>
                </div>

                {/* 탭 */}
                <div className="flex border-b-2 border-gray-100 mb-3">
                  {["해설", "심화", "관련개념", "필기"].map((tab, i) => (
                    <div key={tab} className={`flex-1 pb-2.5 text-center ${i === 0 ? "border-b-2 border-indigo-500 -mb-[2px]" : ""}`}>
                      <span className={`text-[12px] font-bold ${i === 0 ? "text-indigo-500" : "text-gray-300"}`}>{tab}</span>
                    </div>
                  ))}
                </div>

                {/* 해설 내용 */}
                <div className="bg-gray-50 rounded-xl p-3.5">
                  <p className="text-[12px] text-gray-700 leading-5">
                    {q.explanation || "해설이 준비되어 있지 않습니다."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── 하단 네비게이션 (prore-app ProblemBottomNav) ── */}
          <div className="border-t border-gray-100 shrink-0">
            <div className="flex items-center px-3 py-2 gap-1.5">
              <button onClick={goPrev}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold text-center ${currentIndex > 0 ? "bg-gray-100 text-gray-700" : "bg-gray-50 text-gray-300"}`}>
                ← 이전
              </button>
              <div className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-center bg-gray-100 text-gray-600">
                문제저장
              </div>
              <div className="flex-1 py-2.5 rounded-xl text-[12px] font-bold text-center bg-gray-100 text-gray-600">
                풀이현황
              </div>
              <button onClick={goNext}
                className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold text-center ${currentIndex < totalCount - 1 ? "bg-indigo-500 text-white" : "bg-gray-50 text-gray-300"}`}>
                다음 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
