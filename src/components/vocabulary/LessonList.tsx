import React from 'react';
import { Lesson } from '../../types';
import { ChevronRight, Sparkles, Layers } from 'lucide-react';

interface LessonListProps {
  lessons: Lesson[];
  onSelectLesson: (lesson: Lesson) => void;
}

export const LessonList: React.FC<LessonListProps> = ({ lessons, onSelectLesson }) => {
  const totalAllWords = lessons.reduce(
    (acc, l) => acc + l.sections.reduce((sAcc, s) => sAcc + s.words.length, 0),
    0
  );

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 space-y-5 animate-fadeIn justify-start">
      {/* 학습 가이드 배너 */}
      <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-red-200/60 flex items-center justify-between">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs md:text-base font-bold bg-white/20 px-2.5 py-1 rounded-full mb-1">
            <Sparkles size={13} /> 정규 교과 과정
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">생활중국어</h3>
          <p className="text-xs md:text-base sm:text-sm text-red-100 font-medium">
            제5과 핵심 어휘 총 <strong className="text-white font-bold">{totalAllWords}단어</strong> 수록
          </p>
        </div>
      </div>

      {/* 과 목록 카드 리스트 */}
      <div className="space-y-4 pt-1">
        <h3 className="text-sm md:text-lg font-bold text-slate-700 px-1 flex items-center gap-1.5">
          <Layers size={16} className="text-slate-400" />
          단원 목록
        </h3>

        <div className="grid grid-cols-1 gap-4">
          {lessons.map((lesson) => {
            const totalWords = lesson.sections.reduce((acc, sec) => acc + sec.words.length, 0);

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => onSelectLesson(lesson)}
                className="w-full text-left bg-white hover:bg-slate-50/90 active:scale-[0.99] border-2 border-slate-200/90 hover:border-red-400 rounded-3xl p-5 sm:p-6 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-between group relative overflow-hidden"
              >
                {/* 좌측 레드 포인트 액센트 라인 */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 group-hover:bg-red-600 transition-colors" />

                <div className="flex items-center gap-4 sm:gap-5 min-w-0 pl-1">
                  {/* 단원 번호 뱃지 */}
                  <div className="px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-red-100/70 text-red-700 group-hover:bg-red-600 group-hover:text-white transition-all duration-200 flex items-center justify-center shrink-0 font-bold shadow-2xs whitespace-nowrap border border-red-200/60 group-hover:border-transparent">
                    <span className="text-xs md:text-base sm:text-sm font-bold mr-0.5">제</span>
                    <span className="text-lg md:text-2xl sm:text-xl font-black leading-none">{lesson.lessonNumber}</span>
                    <span className="text-xs md:text-base sm:text-sm font-bold ml-0.5">과</span>
                  </div>

                  {/* 단원 정보 */}
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <h4 className="text-lg md:text-2xl sm:text-xl font-bold text-slate-900 font-hanzi tracking-wide group-hover:text-red-600 transition-colors">
                        {lesson.titleZh}
                      </h4>
                      <span className="text-xs md:text-base sm:text-sm text-slate-500 font-semibold">
                        ({lesson.titleKo})
                      </span>
                    </div>

                    <p className="text-xs md:text-base sm:text-sm text-slate-600 mt-1 leading-normal line-clamp-1 font-medium">
                      {lesson.description}
                    </p>

                    <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                      <span className="text-xs md:text-base font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60">
                        총 {totalWords}개 단어
                      </span>
                      <span className="text-xs md:text-base text-slate-500 font-medium">
                        본문 1 · 본문 2 · 심화
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 group-hover:scale-105 transition-all shrink-0 ml-3 flex items-center justify-center border border-slate-200/60">
                  <ChevronRight size={20} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
