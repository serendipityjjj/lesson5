import React, { useState } from 'react';
import { LESSONS_DATA } from '../../data/vocabularyData';
import { DIALOGUES_DATA } from '../../data/dialogueData';
import { DialogueItem, CompletedDialogue } from '../../types';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Play, 
  Sparkles
} from 'lucide-react';

interface DialogueListProps {
  completedList: CompletedDialogue[];
  onSelectDialogue: (dialogue: DialogueItem) => void;
}

export const DialogueList: React.FC<DialogueListProps> = ({
  completedList,
  onSelectDialogue,
}) => {
  // 첫 진입 시 첫 번째 과(제4과) 서랍 기본 오픈
  const [openLessons, setOpenLessons] = useState<Record<number, boolean>>({
    5: true,
  });

  const toggleLesson = (lessonId: number) => {
    setOpenLessons((prev) => ({
      ...prev,
      [lessonId]: !prev[lessonId],
    }));
  };

  const completedIds = new Set(completedList.map((c) => c.dialogue_id));

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 space-y-5 animate-fadeIn pb-8 select-none">
      {/* 가이드 배너 */}
      <div className="bg-gradient-to-r from-red-500 via-rose-500 to-red-600 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-red-200/60 flex items-center justify-between">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs md:text-base font-bold bg-white/20 px-2.5 py-1 rounded-full mb-1">
            <Sparkles size={13} /> 1:1 음성 롤플레잉
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight">AI 실전 회화 연습</h3>
          <p className="text-xs md:text-base sm:text-sm text-red-100 font-medium">
            AI와 역할을 번갈아가며(1R/2R) 큰 소리로 대화해보세요
          </p>
        </div>
      </div>

      {/* 과별 서랍식 아코디언 목록 */}
      <div className="space-y-3 pt-1">
        {LESSONS_DATA.map((lesson) => {
          const dialogues = DIALOGUES_DATA[lesson.id] || [];
          const isOpen = Boolean(openLessons[lesson.id]);

          const completedCount = dialogues.filter((d) => completedIds.has(d.id)).length;
          const totalCount = dialogues.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div
              key={lesson.id}
              className="bg-white border-2 border-slate-200/90 rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all"
            >
              {/* 1. 과 카드 헤더 (클릭 시 토글) */}
              <button
                type="button"
                onClick={() => toggleLesson(lesson.id)}
                className="w-full text-left p-4.5 sm:p-5 hover:bg-slate-50/90 active:bg-slate-100 transition-colors flex items-center justify-between group relative overflow-hidden"
              >
                {/* 좌측 레드 액센트 바 */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500 group-hover:bg-red-600 transition-colors" />

                <div className="flex items-center gap-3.5 flex-1 min-w-0 pl-1">
                  <div className="px-3.5 py-2 rounded-2xl bg-red-100/70 text-red-700 flex items-center justify-center shrink-0 font-bold shadow-2xs whitespace-nowrap border border-red-200/60 group-hover:bg-red-600 group-hover:text-white transition-all">
                    <span className="text-xs md:text-base font-bold mr-0.5">제</span>
                    <span className="text-lg md:text-2xl font-black leading-none">{lesson.lessonNumber}</span>
                    <span className="text-xs md:text-base font-bold ml-0.5">과</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base md:text-xl sm:text-lg font-bold text-slate-900 font-hanzi tracking-wide truncate group-hover:text-red-600 transition-colors">
                        {lesson.titleZh}
                      </h4>
                      <span className="text-xs md:text-base sm:text-sm text-slate-500 font-semibold truncate">
                        ({lesson.titleKo})
                      </span>
                    </div>

                    {/* 완료 개수 뱃지 & 진행률 */}
                    <div className="flex items-center gap-2.5 mt-2">
                      <div className="w-24 sm:w-32 bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/60">
                        <div
                          className="bg-red-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className={`text-[0.6875rem] md:text-sm font-bold px-2 py-0.5 rounded-md border ${
                        progressPercent === 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200/60'
                      }`}>
                        {completedCount}/{totalCount} 완료
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-9 h-9 rounded-2xl bg-slate-100 text-slate-400 group-hover:bg-red-50 group-hover:text-red-600 transition-colors shrink-0 ml-2 flex items-center justify-center border border-slate-200/60">
                  {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
              </button>

              {/* 2. 하위 대화 목록 서랍 (본문-응용 시각적 계층화 & 본문 강조) */}
              {isOpen && (
                <div className="border-t border-slate-100 p-3 sm:p-4 bg-slate-50/50 space-y-2.5">
                  {dialogues.map((dialogue) => {
                    const isCompleted = completedIds.has(dialogue.id);
                    const isApplied = dialogue.type === 'applied';

                    return (
                      <div 
                        key={dialogue.id} 
                        className={`w-full transition-all ${isApplied ? 'pl-4 sm:pl-6' : ''}`}
                      >
                        {/* 대화 항목 카드 */}
                        <button
                          type="button"
                          onClick={() => onSelectDialogue(dialogue)}
                          className={`w-full text-left rounded-2xl border-2 transition-all duration-150 flex items-center justify-between active:scale-[0.99] relative overflow-hidden ${
                            isApplied
                              ? `p-3 sm:p-3.5 ${
                                  isCompleted
                                    ? 'bg-emerald-50/50 border-emerald-200/80 hover:bg-emerald-50'
                                    : 'bg-white/95 border-slate-200/80 hover:border-red-300 hover:bg-white shadow-2xs'
                                }`
                              : `p-4 sm:p-4.5 shadow-md ${
                                  isCompleted
                                    ? 'bg-emerald-50/70 border-emerald-300 hover:bg-emerald-100/60 shadow-emerald-100'
                                    : 'bg-gradient-to-r from-red-50 via-rose-50/60 to-white border-red-300/90 hover:border-red-500 hover:shadow-lg shadow-red-100/60 ring-1 ring-red-200/50'
                                }`
                          }`}
                        >
                          {/* 본문 대화 좌측 하이라이트 바 */}
                          {!isApplied && (
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-red-500'
                            }`} />
                          )}

                          <div className={`flex items-center gap-3.5 min-w-0 ${!isApplied ? 'pl-1' : ''}`}>
                            {/* 완료 여부 아이콘 */}
                            <div className={`rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                              isApplied ? 'w-8 h-8' : 'w-10 h-10'
                            } ${
                              isCompleted
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                : isApplied
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : 'bg-red-600 text-white border-red-600 shadow-sm shadow-red-200'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle2 size={isApplied ? 16 : 18} />
                              ) : (
                                <Play size={isApplied ? 14 : 17} fill="currentColor" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[0.625rem] md:text-sm sm:text-[0.6875rem] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
                                  dialogue.type === 'main'
                                    ? 'bg-red-600 text-white shadow-2xs'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200/70'
                                }`}>
                                  {!isApplied && <span className="text-[0.5625rem] md:text-xs bg-white/20 px-1 rounded-sm">필수</span>}
                                  <span>{dialogue.title}</span>
                                </span>

                                {isCompleted ? (
                                  <span className="text-[0.625rem] md:text-sm font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-200">
                                    ✓ 완료
                                  </span>
                                ) : !isApplied && (
                                  <span className="text-[0.625rem] md:text-sm font-bold text-red-600 bg-white px-2 py-0.5 rounded-md border border-red-200 shadow-2xs">
                                    핵심 회화
                                  </span>
                                )}
                              </div>
                              <p className={`font-bold mt-1 truncate font-hanzi tracking-wide ${
                                isApplied 
                                  ? 'text-sm md:text-lg sm:text-base text-slate-700' 
                                  : 'text-base md:text-xl sm:text-lg text-slate-900 font-black'
                              }`}>
                                {dialogue.preview}
                              </p>
                            </div>
                          </div>

                          <div className={`rounded-xl flex items-center justify-center shrink-0 ml-2 ${
                            !isApplied ? 'w-8 h-8 bg-red-100/80 text-red-700' : 'p-1.5 text-slate-400'
                          }`}>
                            <ChevronRight size={isApplied ? 16 : 18} />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
