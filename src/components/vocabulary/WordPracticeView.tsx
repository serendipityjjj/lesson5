import React, { useState, useEffect, useCallback } from 'react';
import { VocabularyWord } from '../../types';
import { HanziCanvas } from './HanziCanvas';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  Volume2, 
  Sparkles, 
  Trophy, 
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

interface WordPracticeViewProps {
  word: VocabularyWord;
  lessonWords: VocabularyWord[];
  isPlaying: boolean;
  onBack: () => void;
  onPlayAudio: (word: VocabularyWord, e: React.MouseEvent) => void;
  onSelectWord: (word: VocabularyWord) => void;
  onMarkStudied?: (wordId: string) => void;
}

export const WordPracticeView: React.FC<WordPracticeViewProps> = ({
  word,
  lessonWords,
  isPlaying,
  onBack,
  onPlayAudio,
  onSelectWord,
  onMarkStudied,
}) => {
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // 단어가 바뀌면 축하 모달 리셋
  useEffect(() => {
    setShowCelebration(false);
  }, [word.id]);

  // 현재 단어의 인덱스 찾기
  const currentIndex = lessonWords.findIndex((w) => w.id === word.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < lessonWords.length - 1;

  const handlePrevWord = useCallback(() => {
    if (hasPrev) {
      setShowCelebration(false);
      onSelectWord(lessonWords[currentIndex - 1]);
    }
  }, [hasPrev, lessonWords, currentIndex, onSelectWord]);

  const handleNextWord = useCallback(() => {
    if (hasNext) {
      setShowCelebration(false);
      onSelectWord(lessonWords[currentIndex + 1]);
    }
  }, [hasNext, lessonWords, currentIndex, onSelectWord]);

  const handleQuizCompleteAll = useCallback(() => {
    setShowCelebration(true);
    if (onMarkStudied) {
      onMarkStudied(word.id);
    }
  }, [onMarkStudied, word.id]);

  return (
    <div className="w-full flex flex-col p-4 space-y-4 animate-fadeIn relative">
      {/* 상단 네비게이션 바 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-red-600 hover:bg-red-50 text-xs md:text-base font-bold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>단어 리스트</span>
        </button>

        {/* 이전 / 다음 단어 컨트롤 */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevWord}
            disabled={!hasPrev}
            title="이전 단어"
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none text-xs md:text-base font-bold transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-xs md:text-base font-bold text-slate-600 px-2">
            {currentIndex + 1} / {lessonWords.length}
          </span>

          <button
            type="button"
            onClick={handleNextWord}
            disabled={!hasNext}
            title="다음 단어"
            className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none text-xs md:text-base font-bold transition-all shadow-sm active:scale-95"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 단어 기본 정보 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-base font-bold text-red-600 font-pinyin">
              [{word.pinyin}]
            </span>
            <span className="text-[0.6875rem] md:text-sm font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              {word.sectionTitle}
            </span>
          </div>
          <h2 className="text-lg md:text-2xl font-bold text-slate-800 mt-0.5">
            {word.meaning}
          </h2>
        </div>

        {/* 발음 듣기 버튼 */}
        <button
          type="button"
          onClick={(e) => onPlayAudio(word, e)}
          className={`px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs md:text-base transition-all shadow-sm ${
            isPlaying
              ? 'bg-red-600 text-white shadow-red-200 scale-105'
              : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white active:scale-95'
          }`}
        >
          <Volume2 size={16} className={isPlaying ? 'animate-pulse' : ''} />
          <span>{isPlaying ? '재생 중' : '발음 듣기'}</span>
        </button>
      </div>

      {/* 한자 따라쓰기 캔버스 영역 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs md:text-base font-bold text-slate-700 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            한자 획순 따라쓰기
          </span>
          <span className="text-[0.6875rem] md:text-sm text-slate-400">
            손가락으로 격자 위에 직접 써보세요
          </span>
        </div>

        <HanziCanvas
          hanziText={word.hanzi}
          onCompleteAll={handleQuizCompleteAll}
        />
      </div>

      {/* 하단 팁 카드 */}
      <div className="bg-slate-100/80 rounded-2xl p-3.5 text-slate-600 text-xs md:text-base flex items-start gap-2">
        <CheckCircle2 size={16} className="text-red-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          격자 칸 위에 <span className="font-bold text-slate-800">손가락이나 마우스로 첫 획부터 바로 그어보세요.</span> 틀린 획은 자동으로 힌트가 제공됩니다.
        </p>
      </div>

      {/* '참 잘했어요!' 축하 오버레이 */}
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl border border-red-100 flex flex-col items-center animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-lg shadow-amber-200 mb-3 animate-bounce">
              <Trophy size={32} />
            </div>

            <span className="text-xs md:text-base font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full mb-1">
              🎉 획 쓰기 완벽 마스터!
            </span>

            <h3 className="text-xl font-black text-slate-800 mt-1">
              참 잘했어요!
            </h3>

            <p className="text-xs md:text-base text-slate-500 mt-1">
              ‘{word.hanzi}’ 한자를 정확한 획순으로 모두 완성했습니다.
            </p>

            {/* 액션 버튼 */}
            <div className="w-full space-y-2 mt-5">
              {hasNext ? (
                <button
                  type="button"
                  onClick={handleNextWord}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs md:text-base rounded-xl shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>다음 단어 학습하기</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs md:text-base rounded-xl shadow-md shadow-red-200 transition-all"
                >
                  과 단어 목록으로 돌아가기
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowCelebration(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs md:text-base rounded-xl transition-all flex items-center justify-center gap-1"
              >
                <RotateCcw size={14} />
                <span>한 번 더 연습하기</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
