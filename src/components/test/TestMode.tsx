import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Lesson, TestPart, TestQuestion } from '../../types';
import { generateTestQuestions, getPartName } from '../../utils/testGenerator';
import { testService } from '../../services/testService';
import { wrongVocabService } from '../../services/wrongVocabService';
import { useAuth } from '../../context/AuthContext';
import { PinyinKeyboard } from '../keyboard/PinyinKeyboard';
import { convertToneNumberToPinyin } from '../../utils/writingTokenizer';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Trophy, 
  RotateCcw, 
  ArrowLeft, 
  HelpCircle,
  Send
} from 'lucide-react';

interface TestModeProps {
  lesson: Lesson;
  part: TestPart;
  onClose: () => void;
}

// 주관식 병음 일치 검사 (성조 일치 필수, 띄어쓰기 및 대소문자 무시)
function checkPinyinAnswer(input: string, correct: string): boolean {
  const normInput = input.trim().toLowerCase().replace(/\s+/g, '');
  const normCorrect = correct.trim().toLowerCase().replace(/\s+/g, '');
  return normInput === normCorrect;
}

export const TestMode: React.FC<TestModeProps> = ({ lesson, part, onClose }) => {
  const { student } = useAuth();

  // 10문제 생성
  const [questions] = useState<TestQuestion[]>(() => generateTestQuestions(lesson, part));
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // 점수 및 오답 상태
  const [mistakesCount, setMistakesCount] = useState<number>(0);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // 주관식 입력값
  const [pinyinInput, setPinyinInput] = useState<string>('');

  // 테스트 완료 상태
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(100);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);
  // 현재 문제에서 오답을 낸 적이 있는지 추적 (첫 오답 시 오답 보관함에 1회만 등록)
  const isFirstMistakeRecordedRef = useRef<boolean>(false);

  const currentQuestion = questions[currentIndex];
  const currentScore = Math.max(0, 100 - mistakesCount);

  // 문제 전환 시 상태 초기화
  useEffect(() => {
    setFeedbackState('idle');
    setErrorMessage('');
    setSelectedOption(null);
    setPinyinInput('');
    isTransitioningRef.current = false;
    isFirstMistakeRecordedRef.current = false;

    // 주관식일 때 입력창 포커스
    if (currentQuestion && currentQuestion.type === 'meaning-to-pinyin') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentIndex, currentQuestion]);

  // 클린업
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 정답 처리 및 자동 다음 문제 이동
  const handleCorrect = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    setFeedbackState('correct');
    setErrorMessage('');

    timerRef.current = window.setTimeout(async () => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        // 10문제 모두 완료 -> 점수 계산 및 저장
        const calculatedScore = Math.max(0, 100 - mistakesCount);
        setFinalScore(calculatedScore);
        setIsCompleted(true);

        if (student) {
          setIsSaving(true);
          try {
            await testService.saveRecord({
              student_id: student.student_id,
              lesson_id: lesson.id,
              part: part,
              part_name: getPartName(part),
              score: calculatedScore,
              mistakes_count: mistakesCount,
            });
          } catch (e) {
            console.error('테스트 결과 저장 실패:', e);
          } finally {
            setIsSaving(false);
          }
        }
      }
    }, 650);
  }, [currentIndex, questions.length, mistakesCount, student, lesson.id, part]);

  // 오답 처리 및 오답 복습 보관함 실시간 저장
  const handleWrong = useCallback(() => {
    setMistakesCount((prev) => prev + 1);
    setFeedbackState('wrong');
    setErrorMessage('틀렸습니다. 다시 풀어보세요.');

    // 첫 시도 오답 시 오답 복습 보관함에 중복 없이 실시간 추가
    if (!isFirstMistakeRecordedRef.current && student && currentQuestion) {
      isFirstMistakeRecordedRef.current = true;
      wrongVocabService.addWrongVocab(student.student_id, currentQuestion.word).catch((err) => {
        console.warn('오답 단어 보관함 저장 실패:', err);
      });
    }

    if (currentQuestion.type === 'meaning-to-pinyin') {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [currentQuestion, student]);

  // 1. 객관식 옵션 클릭
  const handleOptionClick = (option: string) => {
    if (isTransitioningRef.current || feedbackState === 'correct') return;

    setSelectedOption(option);

    if (option === currentQuestion.correctAnswer) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  // 2. 주관식 제출
  const handlePinyinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isTransitioningRef.current || feedbackState === 'correct') return;

    if (!pinyinInput.trim()) {
      setErrorMessage('병음을 입력해 주세요.');
      return;
    }

    const isMatch = checkPinyinAnswer(pinyinInput, currentQuestion.correctAnswer);
    if (isMatch) {
      handleCorrect();
    } else {
      handleWrong();
    }
  };

  // 가상 키보드: 문자 삽입 (커서 위치 기반 정밀 삽입 & 성조 자동 변환)
  const handleInsertChar = (char: string) => {
    const input = inputRef.current;
    if (!input) {
      setPinyinInput((prev) => convertToneNumberToPinyin(prev + char));
      return;
    }

    const start = input.selectionStart ?? pinyinInput.length;
    const end = input.selectionEnd ?? pinyinInput.length;

    const before = pinyinInput.substring(0, start);
    const after = pinyinInput.substring(end);
    const rawUpdated = before + char + after;
    const updated = convertToneNumberToPinyin(rawUpdated);

    setPinyinInput(updated);
    if (feedbackState === 'wrong') setFeedbackState('idle');

    // 커서 위치 복원 및 포커스 유지
    requestAnimationFrame(() => {
      input.focus();
      const newPos = Math.min(updated.length, start + char.length);
      input.setSelectionRange(newPos, newPos);
    });
  };


  // 가상 키보드: 백스페이스 (커서 앞 문자 삭제)
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
      const before = pinyinInput.substring(0, start - 1);
      const after = pinyinInput.substring(start);
      setPinyinInput(before + after);

      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start - 1, start - 1);
      });
    } else {
      const before = pinyinInput.substring(0, start);
      const after = pinyinInput.substring(end);
      setPinyinInput(before + after);

      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start, start);
      });
    }
  };

  // 가상 키보드: 전체 지우기
  const handleClearAll = () => {
    setPinyinInput('');
    inputRef.current?.focus();
  };

  // 10문제 완료 결과 화면
  if (isCompleted) {
    return (
      <div className="w-full flex-1 flex flex-col justify-start p-4 space-y-4 animate-fadeIn my-auto">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 text-center shadow-xl flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-lg shadow-amber-200 mb-3 animate-bounce">
            <Trophy size={40} />
          </div>

          <span className="text-xs md:text-base font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full mb-1">
            제{lesson.lessonNumber}과 · {getPartName(part)} 테스트 완료
          </span>

          <h2 className="text-2xl font-black text-slate-800 mt-1">
            {finalScore === 100 ? '완벽한 100점 만점! 🎉' : finalScore >= 90 ? '훌륭한 실력이에요! 👏' : '수고하셨습니다! 👍'}
          </h2>

          <p className="text-xs md:text-base text-slate-500 mt-1">
            총 10문제를 모두 성공적으로 완료했습니다.
          </p>

          {/* 점수 배지 */}
          <div className="my-6 p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl w-full text-white shadow-md flex items-center justify-around">
            <div className="text-center">
              <span className="text-[0.6875rem] md:text-sm text-slate-400 font-medium">최종 점수</span>
              <div className="text-4xl font-black text-amber-400 mt-0.5 font-pinyin">
                {finalScore} <span className="text-sm md:text-lg font-normal text-slate-300 font-sans">점</span>
              </div>
            </div>
            <div className="h-10 w-[1px] bg-slate-700" />
            <div className="text-center">
              <span className="text-[0.6875rem] md:text-sm text-slate-400 font-medium">오답 횟수</span>
              <div className="text-3xl font-black text-rose-400 mt-0.5 font-pinyin">
                {mistakesCount} <span className="text-sm md:text-lg font-normal text-slate-300 font-sans">회</span>
              </div>
            </div>
          </div>

          {/* 저장 완료 알림 */}
          {student && (
            <p className="text-[0.6875rem] md:text-sm text-emerald-600 font-semibold mb-6 flex items-center gap-1">
              <CheckCircle2 size={14} />
              {isSaving ? '학습 기록 저장 중...' : '학생 학습 기록에 점수가 안전하게 저장되었습니다.'}
            </p>
          )}

          {/* 액션 버튼 */}
          <div className="w-full space-y-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm md:text-lg rounded-2xl shadow-md shadow-red-200 transition-all flex items-center justify-center gap-2"
            >
              <ArrowLeft size={18} />
              <span>단어장으로 돌아가기</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentIndex(0);
                setMistakesCount(0);
                setIsCompleted(false);
                setFinalScore(100);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-bold text-xs md:text-base rounded-2xl transition-all flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={16} />
              <span>다시 테스트하기</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPinyinQuestion = currentQuestion.type === 'meaning-to-pinyin';

  return (
    // 상단 누적 정렬 및 뷰포트 찌그러짐 방지: flex flex-col h-full justify-start overflow-hidden
    <div className="w-full h-full flex flex-col justify-start relative select-none">
      
      {/* 상단 스크롤 가능 콘텐츠 영역: flex-1 overflow-y-auto */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth">
        
        {/* 상단 테스트 헤더 및 진행 바 */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-base font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-xl">
                제{lesson.lessonNumber}과 · {getPartName(part)}
              </span>
              <span className="text-xs md:text-base font-bold text-slate-500">
                문제 {currentIndex + 1} / 10
              </span>
            </div>

            {/* 현재 점수 및 닫기 버튼 */}
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
                title="테스트 종료"
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* 게이지 바 */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-red-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* 질문 카드 */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm flex flex-col items-center text-center relative">
          <span className="text-[0.6875rem] md:text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-2 flex items-center gap-1">
            <HelpCircle size={13} className="text-red-500" />
            {currentQuestion.type === 'meaning-to-hanzi' && '유형 1: 뜻 ➔ 한자/병음 선택'}
            {currentQuestion.type === 'hanzi-to-meaning' && '유형 2: 한자 ➔ 한국어 뜻 선택'}
            {currentQuestion.type === 'meaning-to-pinyin' && '유형 3: 병음 직접 입력 (주관식)'}
          </span>

          <h3 className="text-xs md:text-base font-semibold text-slate-400">
            {currentQuestion.prompt}
          </h3>

          {/* 질문 본문 (간화자는 font-hanzi FangSong, 한어병음은 font-pinyin Arial) */}
          <div className="my-3 flex items-center justify-center">
            {currentQuestion.type === 'meaning-to-hanzi' && (
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-wide font-sans">
                {currentQuestion.subPrompt}
              </span>
            )}

            {currentQuestion.type === 'hanzi-to-meaning' && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wide font-hanzi">
                  {currentQuestion.word.hanzi}
                </span>
                <span className="text-base md:text-xl sm:text-lg font-bold text-red-600 font-pinyin">
                  [{currentQuestion.word.pinyin}]
                </span>
              </div>
            )}

            {currentQuestion.type === 'meaning-to-pinyin' && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-wide font-hanzi">
                  {currentQuestion.word.hanzi}
                </span>
                <span className="text-xs md:text-base sm:text-sm font-medium text-slate-500 font-sans bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                  {currentQuestion.word.meaning}
                </span>
              </div>
            )}
          </div>

          {/* 정답/오답 피드백 알림 */}
          {feedbackState === 'correct' && (
            <div className="w-full py-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs md:text-base font-bold flex items-center justify-center gap-1.5 animate-bounce">
              <CheckCircle2 size={16} />
              <span>정답입니다! 다음 문제로 이동합니다.</span>
            </div>
          )}

          {feedbackState === 'wrong' && (
            <div className="w-full py-2 px-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs md:text-base font-bold flex items-center justify-center gap-1.5 animate-shake">
              <AlertCircle size={16} />
              <span>{errorMessage || '틀렸습니다. 다시 풀어보세요.'}</span>
            </div>
          )}
        </div>

        {/* 1. 객관식 4지선다 보기 (간화자는 FangSong, 병음은 Arial 분리 적용) */}
        {currentQuestion.options && currentQuestion.options.length > 0 && (
          <div className="space-y-2 pt-1 pb-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isAnswer = option === currentQuestion.correctAnswer;
              
              let btnStyle = 'bg-white border-slate-200/80 text-slate-700 hover:border-red-300 hover:bg-slate-50';
              if (feedbackState === 'correct' && isAnswer) {
                btnStyle = 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200';
              } else if (feedbackState === 'wrong' && isSelected) {
                btnStyle = 'bg-rose-50 border-rose-400 text-rose-700';
              }

              // 유형 1(한자+병음 보기) 분리 파싱
              const match = option.match(/^(.+?)\s*(\[.+?\])$/);

              return (
                <button
                  key={`${option}-${idx}`}
                  type="button"
                  onClick={() => handleOptionClick(option)}
                  disabled={feedbackState === 'correct'}
                  className={`w-full text-left p-3.5 rounded-2xl border font-bold text-sm md:text-lg transition-all flex items-center justify-between active:scale-[0.99] shadow-sm ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs md:text-base font-pinyin font-bold ${
                      feedbackState === 'correct' && isAnswer ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    {match ? (
                      <div className="flex items-center gap-2">
                        <span className="font-hanzi font-bold text-base md:text-xl">{match[1]}</span>
                        <span className={`font-pinyin font-bold text-xs md:text-base ${
                          feedbackState === 'correct' && isAnswer ? 'text-emerald-100' : 'text-red-600'
                        }`}>
                          {match[2]}
                        </span>
                      </div>
                    ) : (
                      <span className={currentQuestion.type === 'meaning-to-hanzi' ? 'font-hanzi' : 'font-sans'}>
                        {option}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}


        {/* 2. 주관식 병음 입력 박스 */}
        {isPinyinQuestion && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs md:text-base font-bold text-slate-700">
                병음 입력창 <span className="text-[0.625rem] md:text-sm text-slate-400 font-normal">(하단 자판으로 성조 입력)</span>
              </label>
              {pinyinInput && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[0.625rem] md:text-sm text-slate-400 hover:text-red-600 font-bold"
                >
                  전체 지우기
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
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-pinyin font-bold text-base md:text-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder:text-slate-400 placeholder:text-xs placeholder:font-sans"
              />
              <button
                type="submit"
                disabled={feedbackState === 'correct'}
                className="px-4 py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs md:text-base rounded-xl shadow-md shadow-red-200 transition-all flex items-center gap-1 shrink-0"
              >
                <span>제출</span>
                <Send size={14} />
              </button>
            </form>

          </div>
        )}

      </div>

      {/* 3. 주관식일 때 하단 고정 가상 성조 키보드 */}
      {isPinyinQuestion && (
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
