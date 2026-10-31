import React from 'react';
import { VocabularyWord } from '../../types';
import { ArrowLeft, Volume2, PenTool, Sparkles, CheckCircle2 } from 'lucide-react';

interface WordDetailViewProps {
  word: VocabularyWord;
  isPlaying: boolean;
  onBack: () => void;
  onPlayAudio: (word: VocabularyWord, e: React.MouseEvent) => void;
}

export const WordDetailView: React.FC<WordDetailViewProps> = ({
  word,
  isPlaying,
  onBack,
  onPlayAudio,
}) => {
  return (
    <div className="w-full flex flex-col p-4 space-y-4 animate-fadeIn">
      {/* 상단 뒤로가기 바 */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-red-600 hover:bg-red-50 text-xs md:text-base font-bold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>단어 목록으로</span>
        </button>

        <span className="text-[0.6875rem] md:text-sm font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          {word.sectionTitle}
        </span>
      </div>

      {/* 대형 단어 카드 */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm text-center flex flex-col items-center">
        {/* 대형 한자 */}
        <div className="my-3 text-5xl sm:text-6xl font-black text-slate-900 tracking-wider">
          {word.hanzi}
        </div>

        {/* 병음 */}
        <div className="text-lg md:text-2xl font-bold text-red-600 font-mono tracking-wide">
          [{word.pinyin}]
        </div>

        {/* 뜻 */}
        <div className="text-base md:text-xl font-bold text-slate-700 mt-2 bg-slate-50 px-4 py-1.5 rounded-xl">
          {word.meaning}
        </div>

        {/* 발음 듣기 버튼 */}
        <button
          type="button"
          onClick={(e) => onPlayAudio(word, e)}
          className={`mt-6 px-6 py-3 rounded-2xl flex items-center gap-2 font-bold text-sm md:text-lg transition-all duration-150 shadow-md ${
            isPlaying
              ? 'bg-red-600 text-white shadow-red-200 scale-105'
              : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-slate-200 active:scale-95'
          }`}
        >
          <Volume2 size={20} className={isPlaying ? 'animate-pulse' : ''} />
          <span>{isPlaying ? '발음 재생 중...' : '원어민 발음 듣기'}</span>
        </button>
      </div>

      {/* 3단계 한자 쓰기 화면 준비 중 안내 박스 */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden text-center">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3 text-red-400">
          <PenTool size={24} />
        </div>

        <span className="inline-flex items-center gap-1 text-[0.6875rem] md:text-sm font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-0.5 rounded-full mb-2">
          <Sparkles size={12} /> 다음 단계 준비 중
        </span>

        <h3 className="text-lg md:text-2xl font-bold">
          ‘{word.hanzi}’ 한자 획순 쓰기 연습
        </h3>

        <p className="text-xs md:text-base text-slate-400 mt-2 max-w-[260px] mx-auto leading-relaxed">
          화면 터치와 캔버스를 이용한 실시간 획순 판정 및 필순 쓰기 연습 기능이 3단계에서 추가될 예정입니다.
        </p>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-center gap-4 text-[0.6875rem] md:text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-400" /> 라우팅 연결 완료
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 size={13} className="text-emerald-400" /> 발음 연동 완료
          </span>
        </div>
      </div>
    </div>
  );
};
