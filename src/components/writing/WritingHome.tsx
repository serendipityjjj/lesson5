import React, { useState, useEffect } from 'react';
import { WritingMode } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { 
  Layers, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw,
  Play
} from 'lucide-react';

interface WritingHomeProps {
  onStartWriting: (lessonId: number | 'all', mode: WritingMode) => void;
}

export const WritingHome: React.FC<WritingHomeProps> = ({ onStartWriting }) => {
  const { student } = useAuth();
  const studentId = student?.student_id || 'guest';

  // 선택된 단원들 (기본값: [4])
  const [selectedLessons] = useState<number[]>([5]);
  const [selectedMode, setSelectedMode] = useState<WritingMode>('order');

  const getComputedLessonId = (): number | 'all' => {
    if (selectedLessons.includes(4) && selectedLessons.includes(5)) {
      return 'all';
    }
    return selectedLessons[0] || 4;
  };

  const computedLessonId = getComputedLessonId();
  const progressStorageKey = `cn_writing_progress_${studentId}_${computedLessonId}_${selectedMode}`;

  // 진행 중이던 세션 확인
  const [hasSavedProgress, setHasSavedProgress] = useState<boolean>(false);
  const [savedProgressIndex, setSavedProgressIndex] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(progressStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed.currentIndex === 'number' && parsed.currentIndex < 10) {
          setHasSavedProgress(true);
          setSavedProgressIndex(parsed.currentIndex);
          return;
        }
      }
    } catch {
      // ignore
    }
    setHasSavedProgress(false);
    setSavedProgressIndex(0);
  }, [progressStorageKey]);

  const handleResetAndStartNew = () => {
    try {
      localStorage.removeItem(progressStorageKey);
    } catch {
      // ignore
    }
    setHasSavedProgress(false);
    onStartWriting(computedLessonId, selectedMode);
  };

  const MODE_OPTIONS: {
    id: WritingMode;
    label: string;
    description: string;
    tip?: string;
    badge: string;
  }[] = [
    {
      id: 'order',
      label: '어순 배열',
      description: '주어진 단어를 배열하여 문법에 맞는 중국어 문장을 완성합니다.',
      tip: '단어 카드를 터치하여 올바른 어순으로 조립해보세요.',
      badge: '기초 어순 감각 익히기',
    },
    {
      id: 'write',
      label: '직접 작문',
      description: '한어병음 키보드를 이용해 문장을 완성하세요.',
      tip: '화면의 기본 운모(a, e, i, o, u, ü)를 누르면 성조가 있는 운모가 나와 편리하게 입력할 수 있습니다. (컴퓨터 키보드로 a1, ni3 처럼 숫자 입력도 가능)',
      badge: '실전 한어병음 완성',
    },
    {
      id: 'both',
      label: '통합 연습',
      description: '어순 배열과 한어병음 입력하여 문장 완성하기 두 가지 유형이 모두 출제됩니다.',
      tip: '1단계 단어 카드를 순서대로 배열한 후, 2단계 한어병음을 직접 입력하여 하나의 문장을 완벽하게 학습합니다.',
      badge: '마스터 종합 훈련',
    },
  ];

  const currentModeInfo = MODE_OPTIONS.find((m) => m.id === selectedMode)!;

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 space-y-5 animate-fadeIn pb-8 select-none justify-start">
      {/* 가이드 배너 */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-5 sm:p-6 text-white shadow-lg shadow-blue-200/60 flex flex-col justify-center space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 text-xs md:text-base font-bold bg-white/20 px-2.5 py-1 rounded-full">
            <Sparkles size={13} /> 단계별 맞춤 작문
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">작문 연습</h3>
        <p className="text-xs md:text-base sm:text-sm text-blue-100 font-medium leading-normal">
          어순 배열부터 병음 직접 작문까지 실력을 쑥쑥 키워보세요
        </p>
      </div>

      {/* 2. 연습 모드 선택 (어순 배열 / 직접 작문 / 통합 연습 세그먼트 컨트롤러 UI) */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
        <label className="text-sm md:text-lg font-bold text-slate-800 flex items-center gap-2">
          <Layers size={17} className="text-blue-500" />
          연습 모드 선택
        </label>

        {/* 모드 탭 버튼 컨테이너 (모던 세그먼트 바) */}
        <div className="p-1.5 bg-slate-100/90 rounded-2xl grid grid-cols-3 gap-1.5">
          {MODE_OPTIONS.map((opt) => {
            const isSelected = selectedMode === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSelectedMode(opt.id)}
                className={`py-3 px-2 rounded-xl text-xs md:text-base sm:text-sm font-bold transition-all duration-200 flex items-center justify-center active:scale-95 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* 선택된 모드 상세 설명 카드 */}
        <div className="p-4 sm:p-5 bg-blue-50/70 rounded-2xl border border-blue-100/90 text-blue-950 space-y-2 transition-all">
          <div className="flex items-center gap-1.5 font-bold text-xs md:text-base sm:text-sm text-blue-700">
            <CheckCircle2 size={16} className="text-blue-600 shrink-0" />
            <span>{currentModeInfo.badge}</span>
          </div>
          <p className="text-xs md:text-base sm:text-sm text-slate-800 leading-relaxed font-semibold pl-0.5">
            {currentModeInfo.description}
          </p>
          {currentModeInfo.tip && (
            <p className="text-[0.6875rem] md:text-sm sm:text-xs text-blue-900/80 leading-relaxed bg-white/70 p-2.5 rounded-xl border border-blue-100/60 font-medium">
              💡 {currentModeInfo.tip}
            </p>
          )}
        </div>
      </div>

      {/* 3. 작문 연습 시작하기 버튼 (이어서 풀기 지원) */}
      <div className="pt-2">
        {hasSavedProgress ? (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => onStartWriting(computedLessonId, selectedMode)}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-bold text-sm md:text-lg sm:text-base rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <Play size={18} fill="currentColor" />
              <span>이어서 작문하기 (문장 {savedProgressIndex + 1}/10 진행 중)</span>
            </button>

            <button
              type="button"
              onClick={handleResetAndStartNew}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs md:text-base rounded-2xl transition-all flex items-center justify-center gap-1.5 active:scale-98 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>처음부터 새로 시작하기</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onStartWriting(computedLessonId, selectedMode)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-bold text-sm md:text-lg sm:text-base rounded-2xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <span>작문 연습 시작하기</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
