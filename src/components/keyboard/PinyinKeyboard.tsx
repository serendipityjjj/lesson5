import React, { useState } from 'react';
import { Delete, CornerDownLeft, Space } from 'lucide-react';

interface PinyinKeyboardProps {
  onInsertChar: (char: string) => void;
  onDeleteChar: () => void;
  onClearAll: () => void;
  onSubmit: () => void;
}

// 모음별 성조 매핑
const TONE_MAP: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'], // v는 ü 계열 자동 매핑
};

// 키 위치별 팝업 정렬 클래스 (화면 밖 잘림 방지)
function getPopupAlignmentClass(key: string): string {
  if (key === 'a' || key === 'e' || key === 'q' || key === 'w') {
    return 'left-0';
  }
  if (key === 'i' || key === 'o' || key === 'p' || key === 'l') {
    return 'right-0';
  }
  return 'left-1/2 -translate-x-1/2';
}

const ROW_1 = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'];
const ROW_2 = ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'];
const ROW_3 = ['z', 'x', 'c', 'v', 'b', 'n', 'm', "'"];

export const PinyinKeyboard: React.FC<PinyinKeyboardProps> = ({
  onInsertChar,
  onDeleteChar,
  onClearAll,
  onSubmit,
}) => {
  const [activeToneKey, setActiveToneKey] = useState<string | null>(null);

  // 일반 키 클릭 핸들러 (이중 입력 방지: 오직 onClick만 사용)
  const handleKeyClick = (key: string) => {
    if (TONE_MAP[key]) {
      // 모음 키인 경우 성조 팝업 토글
      setActiveToneKey((prev) => (prev === key ? null : key));
    } else {
      // 일반 자음 / 기호
      setActiveToneKey(null);
      onInsertChar(key);
    }
  };

  // 성조 선택 핸들러
  const handleToneSelect = (toneChar: string) => {
    onInsertChar(toneChar);
    setActiveToneKey(null);
  };

  // 백스페이스
  const handleBackspace = () => {
    setActiveToneKey(null);
    onDeleteChar();
  };

  // 스페이스바
  const handleSpace = () => {
    setActiveToneKey(null);
    onInsertChar(' ');
  };

  // 전체 지우기
  const handleClear = () => {
    setActiveToneKey(null);
    onClearAll();
  };

  return (
    <>
      {/* 팝업 닫기용 투명 백드롭 (z-index: 30) */}
      {activeToneKey && (
        <div
          className="fixed inset-0 z-30 bg-transparent"
          onClick={() => setActiveToneKey(null)}
        />
      )}

      {/* 가상 성조 키보드 본체 (z-index: 40) */}
      <div className="w-full bg-slate-200/95 backdrop-blur-md border-t border-slate-300/80 p-1.5 sm:p-2 select-none relative z-40 shadow-lg shrink-0">
        
        {/* 키보드 상단 안내 팁 */}
        <div className="flex items-center justify-between px-2 pb-1 text-[0.625rem] md:text-sm text-slate-500">
          <span>모음(a, e, i, o, u, v)을 누르면 성조(1~4성)를 고를 수 있습니다</span>
          <span className="font-mono font-bold text-red-600">v ➔ ü</span>
        </div>

        <div className="flex flex-col gap-1.5 w-full max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto">
          
          {/* 1행 (q w e r t y u i o p) */}
          <div className="flex justify-center gap-1 w-full">
            {ROW_1.map((k) => {
              const isVowel = Boolean(TONE_MAP[k]);
              const isOpen = activeToneKey === k;
              const popupAlign = getPopupAlignmentClass(k);

              return (
                <div key={k} className="relative flex-1 max-w-[44px]">
                  {/* 성조 팝업 오버레이 (z-index: 50) */}
                  {isOpen && isVowel && (
                    <div
                      className={`absolute bottom-full mb-2 ${popupAlign} z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-1 flex items-center gap-1 border border-slate-700 animate-fadeIn whitespace-nowrap`}
                    >
                      {TONE_MAP[k].map((toneChar) => (
                        <button
                          key={toneChar}
                          type="button"
                          onClick={() => handleToneSelect(toneChar)}
                          className="w-8 h-9 rounded-lg bg-slate-800 hover:bg-red-600 active:bg-red-700 text-white font-pinyin font-bold text-base md:text-xl flex items-center justify-center transition-colors shadow-sm"
                        >
                          {toneChar}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleKeyClick(k)}
                    className={`w-full h-11 rounded-lg font-pinyin font-bold text-base md:text-xl shadow-sm flex items-center justify-center transition-all active:scale-95 ${
                      isOpen
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : isVowel
                        ? 'bg-white hover:bg-red-50 text-slate-900 border-b-2 border-red-300'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-b border-slate-300'
                    }`}
                  >
                    {k}
                    {isVowel && (
                      <span className="absolute top-0.5 right-1 text-[0.5rem] md:text-xs text-red-500 font-sans">•</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 2행 (a s d f g h j k l) */}
          <div className="flex justify-center gap-1 w-full px-2">
            {ROW_2.map((k) => {
              const isVowel = Boolean(TONE_MAP[k]);
              const isOpen = activeToneKey === k;
              const popupAlign = getPopupAlignmentClass(k);

              return (
                <div key={k} className="relative flex-1 max-w-[44px]">
                  {isOpen && isVowel && (
                    <div
                      className={`absolute bottom-full mb-2 ${popupAlign} z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-1 flex items-center gap-1 border border-slate-700 animate-fadeIn whitespace-nowrap`}
                    >
                      {TONE_MAP[k].map((toneChar) => (
                        <button
                          key={toneChar}
                          type="button"
                          onClick={() => handleToneSelect(toneChar)}
                          className="w-8 h-9 rounded-lg bg-slate-800 hover:bg-red-600 active:bg-red-700 text-white font-pinyin font-bold text-base md:text-xl flex items-center justify-center transition-colors shadow-sm"
                        >
                          {toneChar}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleKeyClick(k)}
                    className={`w-full h-11 rounded-lg font-pinyin font-bold text-base md:text-xl shadow-sm flex items-center justify-center transition-all active:scale-95 ${
                      isOpen
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : isVowel
                        ? 'bg-white hover:bg-red-50 text-slate-900 border-b-2 border-red-300'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-b border-slate-300'
                    }`}
                  >
                    {k}
                    {isVowel && (
                      <span className="absolute top-0.5 right-1 text-[0.5rem] md:text-xs text-red-500 font-sans">•</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 3행 (z x c v b n m ' + Backspace) */}
          <div className="flex justify-center gap-1 w-full">
            {ROW_3.map((k) => {
              const isVowel = Boolean(TONE_MAP[k]);
              const isOpen = activeToneKey === k;
              const popupAlign = getPopupAlignmentClass(k);

              return (
                <div key={k} className="relative flex-1 max-w-[44px]">
                  {isOpen && isVowel && (
                    <div
                      className={`absolute bottom-full mb-2 ${popupAlign} z-50 bg-slate-900 text-white rounded-xl shadow-2xl p-1 flex items-center gap-1 border border-slate-700 animate-fadeIn whitespace-nowrap`}
                    >
                      {TONE_MAP[k].map((toneChar) => (
                        <button
                          key={toneChar}
                          type="button"
                          onClick={() => handleToneSelect(toneChar)}
                          className="w-8 h-9 rounded-lg bg-slate-800 hover:bg-red-600 active:bg-red-700 text-white font-pinyin font-bold text-base md:text-xl flex items-center justify-center transition-colors shadow-sm"
                        >
                          {toneChar}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleKeyClick(k)}
                    className={`w-full h-11 rounded-lg font-pinyin font-bold text-base md:text-xl shadow-sm flex items-center justify-center transition-all active:scale-95 ${
                      isOpen
                        ? 'bg-red-600 text-white ring-2 ring-red-400'
                        : isVowel
                        ? 'bg-white hover:bg-red-50 text-slate-900 border-b-2 border-red-300'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-b border-slate-300'
                    }`}
                  >
                    {k === 'v' ? 'ü(v)' : k}
                    {isVowel && (
                      <span className="absolute top-0.5 right-1 text-[0.5rem] md:text-xs text-red-500 font-sans">•</span>
                    )}
                  </button>
                </div>
              );
            })}

            {/* 백스페이스 키 */}
            <button
              type="button"
              onClick={handleBackspace}
              title="한 글자 지우기"
              className="flex-1 max-w-[50px] h-11 rounded-lg bg-slate-300/80 hover:bg-slate-400 text-slate-700 font-bold shadow-sm flex items-center justify-center transition-all active:scale-95 border-b border-slate-400"
            >
              <Delete size={19} />
            </button>
          </div>

          {/* 4행 (Clear, Space, Submit) */}
          <div className="flex justify-between items-center gap-1.5 w-full mt-0.5">
            {/* 전체 지우기 */}
            <button
              type="button"
              onClick={handleClear}
              className="px-3 h-11 rounded-lg bg-slate-300/70 hover:bg-slate-400 text-slate-700 text-xs md:text-base font-bold shadow-sm flex items-center justify-center transition-all active:scale-95 border-b border-slate-400 shrink-0"
            >
              지우기
            </button>

            {/* 스페이스바 */}
            <button
              type="button"
              onClick={handleSpace}
              className="flex-1 h-11 rounded-lg bg-white hover:bg-slate-50 text-slate-600 text-xs md:text-base font-bold shadow-sm flex items-center justify-center gap-1 transition-all active:scale-95 border-b border-slate-300"
            >
              <Space size={16} />
              <span>Space</span>
            </button>

            {/* 정답 제출 버튼 */}
            <button
              type="button"
              onClick={onSubmit}
              className="px-5 h-11 rounded-lg bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs md:text-base font-bold shadow-md shadow-red-200 flex items-center justify-center gap-1 transition-all active:scale-95 shrink-0"
            >
              <span>제출</span>
              <CornerDownLeft size={16} />
            </button>
          </div>

        </div>
      </div>
    </>
  );
};
