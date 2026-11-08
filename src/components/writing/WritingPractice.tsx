import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WritingMode, WritingSentence, WordToken } from '../../types';
import { getTenWritingSentences } from '../../utils/writingSentenceGenerator';
import { cleanPinyinForCheck, playTTS, convertToneNumberToPinyin } from '../../utils/writingTokenizer';
import { writingService } from '../../services/writingService';
import { useAuth } from '../../context/AuthContext';
import { PinyinKeyboard } from '../keyboard/PinyinKeyboard';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  Volume2, 
  Send,
  HelpCircle,
  Layers
} from 'lucide-react';

interface WritingPracticeProps {
  lessonId: number | 'all';
  mode: WritingMode;
  onClose: () => void;
}

export const WritingPractice: React.FC<WritingPracticeProps> = ({
  lessonId,
  mode,
  onClose,
}) => {
  const { student } = useAuth();
  const studentId = student?.student_id || 'guest';
  const progressStorageKey = `cn_writing_progress_${studentId}_${lessonId}_${mode}`;

  // 저장된 진행 상태 복원 또는 10문제 새로 생성
  const [savedData] = useState(() => {
    try {
      const raw = localStorage.getItem(progressStorageKey);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [sentences] = useState<WritingSentence[]>(() => {
    if (savedData && savedData.sentences && savedData.sentences.length > 0) {
      return savedData.sentences;
    }
    return getTenWritingSentences(lessonId);
  });

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (savedData && typeof savedData.currentIndex === 'number' && savedData.currentIndex < 10) {
      return savedData.currentIndex;
    }
    return 0;
  });

  // 현재 문제 단계 (통합 모드일 때: 'order_step' ➔ 'write_step')
  const [currentStage, setCurrentStage] = useState<'order_step' | 'write_step'>(() => {
    if (savedData && savedData.currentStage) {
      return savedData.currentStage;
    }
    return mode === 'write' ? 'write_step' : 'order_step';
  });

  // 1. 어순 배열 상태
  const [availableTokens, setAvailableTokens] = useState<WordToken[]>([]);
  const [assembledTokens, setAssembledTokens] = useState<WordToken[]>([]);

  // 2. 직접 작문 상태
  const [pinyinInput, setPinyinInput] = useState<string>('');

  // 3. 점수 및 피드백 상태
  const [mistakesCount, setMistakesCount] = useState<number>(() => {
    if (savedData && typeof savedData.mistakesCount === 'number') {
      return savedData.mistakesCount;
    }
    return 0;
  });
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 4. 완료 상태
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(100);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);
  const isFirstMistakeRecordedRef = useRef<boolean>(false);

  const currentSentence = sentences[currentIndex];
  const currentScore = Math.max(0, 100 - mistakesCount);

  // 진행 상태 실시간 로컬 스토리지 보존
  useEffect(() => {
    if (!isCompleted && sentences.length > 0) {
      try {
        localStorage.setItem(
          progressStorageKey,
          JSON.stringify({
            sentences,
            currentIndex,
            currentStage,
            mistakesCount,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }
  }, [progressStorageKey, isCompleted, sentences, currentIndex, currentStage, mistakesCount]);

  // 문제 및 단계 초기화
  useEffect(() => {
    if (!currentSentence) return;

    setFeedbackState('idle');
    setErrorMessage('');
    setPinyinInput('');
    isTransitioningRef.current = false;
    isFirstMistakeRecordedRef.current = false;

    if (mode === 'write') {
      setCurrentStage('write_step');
    } else if (mode === 'order') {
      setCurrentStage('order_step');
    }

    // 어순 배열용 토큰 풀 셔플
    const shuffledTokens = [...currentSentence.tokens].sort(() => Math.random() - 0.5);
    setAvailableTokens(shuffledTokens);
    setAssembledTokens([]);

    if (mode === 'write' || (mode === 'both' && currentStage === 'write_step')) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentIndex, currentSentence, mode]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 오답 발생 시 감점 및 오답 문장 저장
  const handleWrong = useCallback((customMsg?: string) => {
    setMistakesCount((prev) => prev + 1);
    setFeedbackState('wrong');
    setErrorMessage(customMsg || '틀렸습니다. 다시 시도해 보세요.');

    // 첫 실패 시 wrong_writing_${studentId}에 누적 저장
    if (!isFirstMistakeRecordedRef.current && student && currentSentence) {
      isFirstMistakeRecordedRef.current = true;
      writingService.addWrongWriting(student.student_id, currentSentence).catch((e) => {
        console.warn('작문 오답 저장 실패:', e);
      });
    }
  }, [student, currentSentence]);

  // 다음 문제 이동 또는 완료
  const proceedNextQuestion = useCallback(async () => {
    if (currentIndex + 1 < sentences.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 10문제 완주 -> 완료 화면 및 저장
      const calculatedScore = Math.max(0, 100 - mistakesCount);
      setFinalScore(calculatedScore);
      setIsCompleted(true);

      // 진행 상태 캐시 삭제
      try {
        localStorage.removeItem(progressStorageKey);
      } catch {
        // ignore
      }

      if (student) {
        setIsSaving(true);
        try {
          const lId = typeof lessonId === 'number' ? lessonId : 4;
          await writingService.saveRecord(student.student_id, lId, mode, calculatedScore, mistakesCount);
        } catch (e) {
          console.error('작문 결과 저장 실패:', e);
        } finally {
          setIsSaving(false);
        }
      }
    }
  }, [currentIndex, sentences.length, mistakesCount, student, lessonId, mode, progressStorageKey]);

  // 어순 단어 카드 터치 조립
  const handleTokenClick = (token: WordToken) => {
    if (isTransitioningRef.current || feedbackState === 'correct') return;

    // 현재 조립되어야 할 올바른 다음 토큰 검사
    const nextExpectedToken = currentSentence.tokens[assembledTokens.length];

    if (token.id === nextExpectedToken.id || token.hanzi === nextExpectedToken.hanzi) {
      // 정답 순서 ➔ 조립판에 추가
      const newAssembled = [...assembledTokens, token];
      setAssembledTokens(newAssembled);
      setAvailableTokens((prev) => prev.filter((t) => t.id !== token.id));
      setFeedbackState('idle');

      // 어순 전체 완성 검사
      if (newAssembled.length === currentSentence.tokens.length) {
        isTransitioningRef.current = true;
        setFeedbackState('correct');
        setErrorMessage('');

        // 완성 즉시 TTS 재생
        playTTS(currentSentence.hanzi).catch(() => {});

        // 2초 뒤 다음 처리
        timerRef.current = window.setTimeout(() => {
          if (mode === 'both') {
            // 통합 모드: 2단계 직접 작문 모드로 전환
            setCurrentStage('write_step');
            setFeedbackState('idle');
            setPinyinInput('');
            isTransitioningRef.current = false;
            setTimeout(() => {
              inputRef.current?.focus();
            }, 100);
          } else {
            // 어순 모드: 다음 문제로 이동
            proceedNextQuestion();
          }
        }, 2000);
      }
    } else {
      // 틀린 순서 ➔ 경고 피드백 및 감점
      handleWrong('어순이 올바르지 않습니다. 다시 선택해 보세요.');
    }
  };

  // 조립판에서 마지막 토큰 취소
  const handleRemoveLastToken = () => {
    if (assembledTokens.length === 0 || isTransitioningRef.current || feedbackState === 'correct') return;
    const last = assembledTokens[assembledTokens.length - 1];
    setAssembledTokens((prev) => prev.slice(0, -1));
    setAvailableTokens((prev) => [...prev, last]);
    setFeedbackState('idle');
  };

  // 직접 작문(병음) 제출 채점
  const handlePinyinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isTransitioningRef.current || feedbackState === 'correct') return;

    if (!pinyinInput.trim()) {
      setErrorMessage('병음을 입력해 주세요.');
      return;
    }

    const normInput = cleanPinyinForCheck(pinyinInput);
    const normCorrect = cleanPinyinForCheck(currentSentence.pinyin);

    if (normInput === normCorrect) {
      // 정답!
      isTransitioningRef.current = true;
      setFeedbackState('correct');
      setErrorMessage('');

      // TTS 재생
      playTTS(currentSentence.hanzi).catch(() => {});

      timerRef.current = window.setTimeout(() => {
        proceedNextQuestion();
      }, 1500);
    } else {
      handleWrong('병음 또는 성조가 일치하지 않습니다. 다시 입력해 보세요.');
    }
  };

  // 가상 성조 키보드 및 실시간 키보드 핸들러
  const handleInsertChar = (char: string) => {
    const input = inputRef.current;
    if (!input) {
      setPinyinInput((prev) => convertToneNumberToPinyin(prev + char));
      return;
    }

    const start = input.selectionStart ?? pinyinInput.length;
    const end = input.selectionEnd ?? pinyinInput.length;
    const rawUpdated = pinyinInput.substring(0, start) + char + pinyinInput.substring(end);
    const updated = convertToneNumberToPinyin(rawUpdated);

    setPinyinInput(updated);
    if (feedbackState === 'wrong') setFeedbackState('idle');

    requestAnimationFrame(() => {
      input.focus();
      const newPos = Math.min(updated.length, start + char.length);
      input.setSelectionRange(newPos, newPos);
    });
  };


  const handleDeleteChar = () => {
    const input = inputRef.current;
    if (!input) {
      setPinyinInput((prev) => prev.slice(0, -1));
      return;
    }

    const start = input.selectionStart ?? pinyinInput.length;
    const end = input.selectionEnd ?? pinyinInput.length;

    if (start === end) {
      if (start === 0) return;
      setPinyinInput(pinyinInput.substring(0, start - 1) + pinyinInput.substring(start));
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start - 1, start - 1);
      });
    } else {
      setPinyinInput(pinyinInput.substring(0, start) + pinyinInput.substring(end));
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start, start);
      });
    }
  };

  const handleClearAll = () => {
    setPinyinInput('');
    inputRef.current?.focus();
  };

  // 10문제 완료 결과 화면
  if (isCompleted) {
    return (
      <div className="w-full flex-1 flex flex-col justify-start p-4 space-y-4 animate-fadeIn my-auto">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 text-center shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-200 mb-3 animate-bounce">
            <Trophy size={40} />
          </div>

          <span className="text-xs md:text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-1">
            작문 연습 10문장 완주! 🎉
          </span>

          <h2 className="text-2xl font-black text-slate-800 mt-1">
            {finalScore === 100 ? '완벽한 100점 만점!' : finalScore >= 90 ? '훌륭한 작문 실력이에요!' : '수고하셨습니다!'}
          </h2>

          <p className="text-xs md:text-base text-slate-500 mt-1">
            {mode === 'order' ? '어순 배열' : mode === 'write' ? '직접 작문' : '통합 연습'} 모드를 성공적으로 완주했습니다.
          </p>

          {/* 점수 뱃지 */}
          <div className="my-6 p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl w-full text-white shadow-md flex items-center justify-around">
            <div className="text-center">
              <span className="text-[0.6875rem] md:text-sm text-slate-400 font-medium">최종 점수</span>
              <div className="text-4xl font-black text-amber-400 mt-0.5 font-pinyin">
                {finalScore} <span className="text-sm md:text-lg font-normal text-slate-300 font-sans">점</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-700" />
            <div className="text-center">
              <span className="text-[0.6875rem] md:text-sm text-slate-400 font-medium">감점/오답</span>
              <div className="text-3xl font-black text-rose-400 mt-0.5 font-pinyin">
                {mistakesCount} <span className="text-sm md:text-lg font-normal text-slate-300 font-sans">회</span>
              </div>
            </div>
          </div>

          {student && (
            <p className="text-[0.6875rem] md:text-sm text-emerald-600 font-semibold mb-6 flex items-center gap-1">
              <CheckCircle2 size={14} />
              {isSaving ? '작문 기록 저장 중...' : '학생 작문 기록에 안전하게 저장되었습니다.'}
            </p>
          )}

          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm md:text-lg rounded-2xl shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>작문 메인으로 돌아가기</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                setMistakesCount(0);
                setIsCompleted(false);
                setFinalScore(100);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-base rounded-2xl transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={16} />
              <span>다시 연습하기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    // 상단 누적 정렬 및 뷰포트 찌그러짐 방지
    <div className="w-full h-full flex flex-col justify-start relative select-none bg-slate-50">
      
      {/* 상단 스크롤 가능 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth">
        
        {/* 상단 헤더 & 진행 바 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-base font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl">
                {mode === 'order' ? '어순 배열' : mode === 'write' ? '직접 작문' : '통합 연습'}
              </span>
              <span className="text-xs md:text-base font-bold text-slate-500">
                문장 {currentIndex + 1} / 10
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <span className="text-[0.625rem] md:text-sm text-slate-400 font-medium">현재 점수</span>
                <div className="text-sm md:text-lg font-black text-slate-800 font-pinyin leading-none">
                  {currentScore}점
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="작문 종료"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* 한국어 뜻 제시 카드 */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm text-center relative">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[0.6875rem] md:text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <HelpCircle size={13} />
              {currentStage === 'order_step' ? '1단계: 단어 카드를 터치해 어순을 완성하세요' : '2단계: 한어병음을 직접 입력하세요'}
            </span>

            <button
              type="button"
              onClick={() => playTTS(currentSentence.hanzi)}
              className="text-xs md:text-base text-slate-500 hover:text-blue-600 font-bold flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl transition-colors"
            >
              <Volume2 size={14} />
              <span>듣기</span>
            </button>
          </div>

          <div className="my-3">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              "{currentSentence.meaning}"
            </h3>
          </div>

          {/* 피드백 */}
          {feedbackState === 'correct' && (
            <div className="py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs md:text-base font-bold flex items-center justify-center gap-1.5 animate-bounce">
              <CheckCircle2 size={16} />
              <span>
                {mode === 'both' && currentStage === 'order_step'
                  ? '어순 완성! 2단계 직접 작문으로 넘어갑니다.'
                  : '완벽한 정답입니다! 🎉'}
              </span>
            </div>
          )}

          {feedbackState === 'wrong' && (
            <div className="py-2 px-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs md:text-base font-bold flex items-center justify-center gap-1.5 animate-shake">
              <AlertCircle size={16} />
              <span>{errorMessage || '틀렸습니다. 다시 시도해 보세요.'}</span>
            </div>
          )}
        </div>

        {/* 1. 어순 배열 단계 (order_step) */}
        {currentStage === 'order_step' && (
          <div className="space-y-4">
            {/* 상단 조립판 (가운데 정렬) */}
            <div className="bg-slate-100/90 rounded-3xl p-4 border-2 border-dashed border-slate-300 min-h-[90px] flex flex-wrap items-center justify-center gap-2.5 relative">
              {assembledTokens.length === 0 ? (
                <p className="w-full text-center text-xs md:text-base text-slate-400 font-medium py-3">
                  아래의 단어 카드를 순서대로 터치하여 이곳에 조립하세요
                </p>
              ) : (
                assembledTokens.map((token, idx) => (
                  <div
                    key={`assembled_${token.id}_${idx}`}
                    className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm flex flex-col items-center animate-scaleUp"
                  >
                    <span className="text-base md:text-xl font-bold font-hanzi leading-tight">
                      {token.hanzi}
                    </span>
                    <span className="text-[0.625rem] md:text-sm font-pinyin text-blue-200 leading-none mt-0.5">
                      {token.pinyin}
                    </span>
                  </div>
                ))
              )}

              {assembledTokens.length > 0 && feedbackState !== 'correct' && (
                <button
                  type="button"
                  onClick={handleRemoveLastToken}
                  className="absolute right-3 top-3 text-[0.625rem] md:text-sm font-bold text-slate-500 hover:text-red-600 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-2xs"
                >
                  되돌리기 ⌫
                </button>
              )}
            </div>

            {/* 하단 셔플 단어 카드 풀 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs md:text-base font-bold text-slate-600 flex items-center gap-1">
                  <Layers size={14} className="text-blue-500" />
                  선택할 단어 카드
                </span>
                <span className="text-[0.625rem] md:text-sm text-slate-400">
                  남은 카드 {availableTokens.length}개
                </span>
              </div>

              <div className="flex flex-wrap gap-2.5 justify-center py-2">
                {availableTokens.map((token) => (
                  <button
                    key={`avail_${token.id}`}
                    type="button"
                    onClick={() => handleTokenClick(token)}
                    className="p-3 bg-white hover:bg-blue-50 active:bg-blue-100 border border-slate-200 hover:border-blue-300 rounded-2xl shadow-sm flex flex-col items-center transition-all active:scale-95 min-w-[70px]"
                  >
                    <span className="text-lg md:text-2xl font-bold text-slate-800 font-hanzi leading-tight">
                      {token.hanzi}
                    </span>
                    <span className="text-[0.6875rem] md:text-sm font-bold text-blue-600 font-pinyin leading-none mt-1">
                      {token.pinyin}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. 직접 작문 단계 (write_step) */}
        {currentStage === 'write_step' && (
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs md:text-base font-bold text-slate-700">
                한어병음 입력창 <span className="text-[0.625rem] md:text-sm text-slate-400 font-normal">(성조 포함, 대소문자·공백 무관)</span>
              </label>
              {pinyinInput && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[0.625rem] md:text-sm text-slate-400 hover:text-red-600 font-bold"
                >
                  지우기
                </button>
              )}
            </div>

            <form onSubmit={handlePinyinSubmit} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={pinyinInput}
                onChange={(e) => {
                  const converted = convertToneNumberToPinyin(e.target.value);
                  setPinyinInput(converted);
                  if (feedbackState === 'wrong') setFeedbackState('idle');
                }}
                disabled={feedbackState === 'correct'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="병음 직접 입력 (예: i2 ➔ í, a3 ➔ ǎ, ni3 ➔ nǐ)"
                className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-pinyin font-bold text-base md:text-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 placeholder:text-xs placeholder:font-sans"
              />
              <button
                type="submit"
                disabled={feedbackState === 'correct'}
                className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs md:text-base rounded-2xl shadow-md shadow-blue-200 transition-all flex items-center gap-1 shrink-0"
              >
                <span>제출</span>
                <Send size={14} />
              </button>
            </form>

          </div>
        )}

      </div>

      {/* 3. 직접 작문 단계일 때 하단 고정 가상 성조 키보드 */}
      {currentStage === 'write_step' && (
        <PinyinKeyboard
          onInsertChar={handleInsertChar}
          onDeleteChar={handleDeleteChar}
          onClearAll={handleClearAll}
          onSubmit={() => handlePinyinSubmit()}
        />
      )}

    </div>
  );
};
