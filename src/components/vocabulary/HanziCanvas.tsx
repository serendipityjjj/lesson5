import React, { useEffect, useRef, useState, useCallback } from 'react';
import HanziWriter from 'hanzi-writer';
import { customCharDataLoader } from '../../utils/hanziLoader';
import { Play, RotateCcw, Loader2 } from 'lucide-react';

interface HanziCanvasProps {
  hanziText: string;
  onCompleteAll?: () => void;
}

export const HanziCanvas: React.FC<HanziCanvasProps> = ({
  hanziText,
  onCompleteAll,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const writersRef = useRef<HanziWriter[]>([]);
  const charDivsRef = useRef<HTMLDivElement[]>([]);
  const isMountedRef = useRef<boolean>(true);
  const activeQuizIndexRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentMode, setCurrentMode] = useState<'idle' | 'animating' | 'quiz'>('idle');
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);

  // 글자 목록 분리 (특수문자 제외하고 한자만 추출)
  const characters = Array.from(hanziText).filter((char) => char.trim() !== '');
  const charCount = characters.length;

  // 글자 수에 따른 캔버스 크기 계산 (최소 80px ~ 최대 140px)
  const calculateCanvasSize = (): number => {
    if (charCount <= 1) return 140;
    if (charCount === 2) return 120;
    if (charCount === 3) return 96;
    return Math.max(80, Math.min(140, Math.floor(280 / charCount)));
  };

  const canvasSize = calculateCanvasSize();

  // 모든 Writer 정리 (클린업 함수)
  const cleanupWriters = useCallback(() => {
    isAnimatingRef.current = false;
    writersRef.current.forEach((writer) => {
      try {
        writer.cancelQuiz();
      } catch (e) {
        // 무시
      }
    });
    writersRef.current = [];

    charDivsRef.current.forEach((div) => {
      if (div) {
        div.innerHTML = '';
      }
    });
  }, []);

  // HanziWriter 인스턴스 초기화
  useEffect(() => {
    isMountedRef.current = true;
    setIsLoading(true);
    setLoadError(null);
    setCurrentMode('quiz');
    setCurrentQuizIndex(0);
    activeQuizIndexRef.current = 0;

    cleanupWriters();

    if (!containerRef.current || characters.length === 0) {
      setIsLoading(false);
      return;
    }

    const createdWriters: HanziWriter[] = [];
    let loadCount = 0;

    characters.forEach((char, index) => {
      const targetDiv = charDivsRef.current[index];
      if (!targetDiv) return;

      // 레이아웃 붕괴 방지: 인라인 픽셀 크기 강제 주입
      targetDiv.style.width = `${canvasSize}px`;
      targetDiv.style.height = `${canvasSize}px`;
      targetDiv.innerHTML = '';

      try {
        const writer = HanziWriter.create(targetDiv, char, {
          width: canvasSize,
          height: canvasSize,
          padding: 6,
          showOutline: true,
          showCharacter: false, // 처음에는 윤곽선만 표시
          strokeAnimationSpeed: 1.2,
          delayBetweenStrokes: 150,
          strokeColor: '#dc2626', // 한자 획 색상 (레드)
          radicalColor: '#e11d48', // 부수 색상
          outlineColor: '#cbd5e1', // 가이드 윤곽선 색상 (연한 슬레이트)
          drawingColor: '#2563eb', // 사용자 필기 색상 (블루)
          drawingWidth: 6,
          showHintAfterMisses: 2,
          charDataLoader: customCharDataLoader,
          onLoadCharDataSuccess: () => {
            loadCount += 1;
            if (loadCount === characters.length && isMountedRef.current) {
              setIsLoading(false);
              // ★ 로드 완료 즉시 따라쓰기(Quiz) 모드 자동 활성화! (버튼 안 눌러도 바로 쓰기 가능)
              setCurrentMode('quiz');
              startQuizForChar(0);
            }
          },
          onLoadCharDataError: (err) => {
            console.error(`한자(${char}) 로드 오류:`, err);
            if (isMountedRef.current) {
              setLoadError(`한자 '${char}' 데이터를 불러오지 못했습니다.`);
              setIsLoading(false);
            }
          },
        });

        createdWriters.push(writer);
      } catch (err) {
        console.error('HanziWriter 생성 실패:', err);
      }
    });

    writersRef.current = createdWriters;

    return () => {
      isMountedRef.current = false;
      cleanupWriters();
    };
  }, [hanziText, canvasSize]);

  // 1. 획순 애니메이션 순차 재생 (Play)
  const handlePlayAnimation = useCallback(() => {
    if (isLoading || writersRef.current.length === 0) return;

    // 기존 퀴즈 취소 및 리셋
    writersRef.current.forEach((w) => {
      try {
        w.cancelQuiz();
        w.hideCharacter();
        w.showOutline();
      } catch (e) {
        // 무시
      }
    });

    setCurrentMode('animating');
    isAnimatingRef.current = true;

    // 순차적 애니메이션 체이닝
    const playSequentially = (index: number) => {
      if (!isMountedRef.current || !isAnimatingRef.current) return;
      if (index >= writersRef.current.length) {
        if (isMountedRef.current) {
          isAnimatingRef.current = false;
          // 획순 보기 재생이 끝나면 자동으로 다시 직접 쓰기 모드로 전환
          setTimeout(() => {
            if (isMountedRef.current) {
              handleStartQuiz();
            }
          }, 400);
        }
        return;
      }

      const writer = writersRef.current[index];
      writer.animateCharacter({
        onComplete: () => {
          if (isMountedRef.current && isAnimatingRef.current) {
            playSequentially(index + 1);
          }
        },
      });
    };

    playSequentially(0);
  }, [isLoading]);

  // 2. 지우고 처음부터 (Reset)
  const handleReset = useCallback(() => {
    if (isLoading || writersRef.current.length === 0) return;
    isAnimatingRef.current = false;
    writersRef.current.forEach((writer) => {
      try {
        writer.cancelQuiz();
        writer.hideCharacter();
        writer.showOutline();
      } catch (e) {
        // 무시
      }
    });
    // 리셋 후에도 바로 쓸 수 있도록 퀴즈 모드 유지
    setCurrentMode('quiz');
    setCurrentQuizIndex(0);
    activeQuizIndexRef.current = 0;
    startQuizForChar(0);
  }, [isLoading]);

  // 3. 따라쓰기 퀴즈 (Quiz) - 순차적 획 판정
  const startQuizForChar = (index: number) => {
    if (!isMountedRef.current) return;
    if (index >= writersRef.current.length) {
      // 모든 글자 작성 완료!
      if (onCompleteAll) {
        onCompleteAll();
      }
      return;
    }

    setCurrentQuizIndex(index);
    activeQuizIndexRef.current = index;

    const writer = writersRef.current[index];
    if (writer) {
      writer.hideCharacter();
      writer.showOutline();

      writer.quiz({
        onComplete: () => {
          if (isMountedRef.current) {
            // 다음 글자 퀴즈로 순차 진행
            startQuizForChar(index + 1);
          }
        },
      });
    }
  };

  const handleStartQuiz = useCallback(() => {
    if (isLoading || writersRef.current.length === 0) return;

    isAnimatingRef.current = false;
    writersRef.current.forEach((w) => {
      try {
        w.cancelQuiz();
        w.hideCharacter();
        w.showOutline();
      } catch (e) {
        // 무시
      }
    });

    setCurrentMode('quiz');
    startQuizForChar(0);
  }, [isLoading]);


  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 캔버스 컨테이너 (터치 스크롤 간섭 방지 touch-action: none) */}
      <div
        ref={containerRef}
        className="w-full flex items-center justify-center gap-3 p-4 bg-white/90 rounded-3xl border border-slate-200/80 shadow-sm relative min-h-[160px]"
        style={{ touchAction: 'none' }}
        onTouchMove={(e) => {
          // 모바일 화면 터치 시 스크롤 간섭 방지
          if (e.target instanceof SVGElement || (e.target as HTMLElement).closest('.hanzi-char-box')) {
            e.preventDefault();
          }
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-500">
            <Loader2 className="w-7 h-7 animate-spin text-red-600" />
            <span className="text-xs md:text-base font-semibold">한자 획 데이터를 불러오는 중...</span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-20 bg-white rounded-3xl flex flex-col items-center justify-center p-4 text-center">
            <p className="text-xs md:text-base text-red-600 font-semibold">{loadError}</p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 text-xs md:text-base text-slate-500 underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {/* 각 글자별 米자 격자 배경 캔버스 박스 */}
        {characters.map((char, index) => {
          const isCurrentActiveQuiz = currentMode === 'quiz' && currentQuizIndex === index;

          return (
            <div
              key={`${char}-${index}`}
              className={`hanzi-char-box relative rounded-2xl bg-amber-50/20 border-2 transition-all flex items-center justify-center overflow-hidden ${
                isCurrentActiveQuiz
                  ? 'border-red-500 shadow-md ring-2 ring-red-500/20 scale-105'
                  : 'border-slate-200'
              }`}
              style={{
                width: `${canvasSize}px`,
                height: `${canvasSize}px`,
                touchAction: 'none',
              }}
            >
              {/* 米字格 (미자격 격자 가이드 배경) */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none opacity-35"
                viewBox="0 0 100 100"
              >
                <line x1="0" y1="50" x2="100" y2="50" stroke="#f87171" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50" y1="0" x2="50" y2="100" stroke="#f87171" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="0" y1="0" x2="100" y2="100" stroke="#fca5a5" strokeDasharray="2 2" strokeWidth="0.8" />
                <line x1="0" y1="100" x2="100" y2="0" stroke="#fca5a5" strokeDasharray="2 2" strokeWidth="0.8" />
              </svg>

              {/* HanziWriter가 렌더링될 실제 div */}
              <div
                ref={(el) => {
                  if (el) charDivsRef.current[index] = el;
                }}
                className="relative z-10"
                style={{
                  width: `${canvasSize}px`,
                  height: `${canvasSize}px`,
                  touchAction: 'none',
                }}
              />

              {/* 퀴즈 진행 중 현재 글자 표시 뱃지 */}
              {currentMode === 'quiz' && characters.length > 1 && (
                <span className="absolute bottom-1 right-1.5 text-[0.5625rem] md:text-xs font-bold text-slate-400 bg-white/90 px-1.5 py-0.5 rounded-md shadow-xs">
                  {index + 1}/{characters.length}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 조작 버튼 바 */}
      <div className="grid grid-cols-2 gap-2.5 w-full mt-3.5">
        {/* 1. 획순 보기 (Play) */}
        <button
          type="button"
          onClick={handlePlayAnimation}
          disabled={isLoading || currentMode === 'animating'}
          className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-base transition-all shadow-sm active:scale-95 ${
            currentMode === 'animating'
              ? 'bg-red-600 text-white shadow-md shadow-red-200'
              : 'bg-white border border-slate-200/80 text-slate-700 hover:text-red-600 hover:bg-red-50 hover:border-red-200'
          } disabled:opacity-50`}
        >
          <Play size={16} fill={currentMode === 'animating' ? 'currentColor' : 'none'} />
          <span>{currentMode === 'animating' ? '획순 재생 중...' : '획순 보기'}</span>
        </button>

        {/* 2. 지우고 다시 쓰기 (Reset) */}
        <button
          type="button"
          onClick={handleReset}
          disabled={isLoading}
          className="py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs md:text-base bg-white border border-slate-200/80 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RotateCcw size={16} />
          <span>지우고 다시 쓰기</span>
        </button>
      </div>
    </div>
  );
};

