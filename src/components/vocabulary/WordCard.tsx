import React from 'react';
import { VocabularyWord } from '../../types';
import { Volume2 } from 'lucide-react';

interface WordCardProps {
  word: VocabularyWord;
  isPlaying: boolean;
  isStudied?: boolean;
  onPlayAudio: (word: VocabularyWord, e: React.MouseEvent) => void;
  onClickWord: (word: VocabularyWord) => void;
}

export const WordCard: React.FC<WordCardProps> = ({
  word,
  isPlaying,
  isStudied = false,
  onPlayAudio,
  onClickWord,
}) => {
  return (
    <div
      onClick={() => onClickWord(word)}
      className={`group w-full bg-white border rounded-2xl p-3.5 flex items-center justify-between transition-all duration-150 cursor-pointer active:scale-[0.99] shadow-sm hover:shadow ${
        isPlaying
          ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/30'
          : isStudied
          ? 'border-emerald-200/90 bg-emerald-50/20 hover:border-emerald-300'
          : 'border-slate-200/80 hover:border-red-200 hover:bg-slate-50/50'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* 한자 강조 영역 */}
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center text-slate-900 group-hover:text-red-600 transition-colors shrink-0 relative ${
          isStudied
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : 'bg-slate-50 border-slate-100'
        }`}>
          <span className="text-2xl font-bold font-hanzi tracking-wide">
            {word.hanzi}
          </span>
          {isStudied && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[0.625rem] md:text-sm font-black shadow-xs">
              ✓
            </span>
          )}
        </div>

        {/* 병음 및 한국어 뜻 */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs md:text-base font-bold text-red-600 font-pinyin tracking-tight">
              [{word.pinyin}]
            </span>
            {isStudied && (
              <span className="text-[0.625rem] md:text-sm font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                따라쓰기 완료
              </span>
            )}
          </div>
          <span className="text-sm md:text-lg font-bold text-slate-800 mt-0.5 truncate">
            {word.meaning}
          </span>
        </div>
      </div>

      {/* 스피커 발음 재생 버튼 */}
      <button
        type="button"
        title={`${word.hanzi} 발음 듣기`}
        onClick={(e) => onPlayAudio(word, e)}
        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-150 shrink-0 ${
          isPlaying
            ? 'bg-red-600 text-white shadow-md shadow-red-200 scale-105'
            : isStudied
            ? 'bg-emerald-100/60 text-emerald-700 hover:bg-emerald-600 hover:text-white active:scale-95'
            : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600 active:scale-95'
        }`}
      >
        <Volume2
          size={20}
          className={isPlaying ? 'animate-pulse' : ''}
          strokeWidth={isPlaying ? 2.5 : 2}
        />
      </button>
    </div>
  );
};
