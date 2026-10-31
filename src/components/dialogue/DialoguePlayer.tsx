import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DialogueItem, DialogueLine } from '../../types';
import { audioPlayer } from '../../utils/audioPlayer';
import { evaluateSpeechAnswer, normalizeText } from '../../utils/speechEvaluator';
import { dialogueService } from '../../services/dialogueService';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, 
  Volume2, 
  Mic, 
  MicOff, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  User,
  Headphones
} from 'lucide-react';

interface DialoguePlayerProps {
  dialogue: DialogueItem;
  onBack: () => void;
}

interface ChatMessage {
  id: string;
  line: DialogueLine;
  sender: 'ai' | 'user';
  isEvaluated?: boolean;
}

export const DialoguePlayer: React.FC<DialoguePlayerProps> = ({
  dialogue,
  onBack,
}) => {
  const { student } = useAuth();

  // 1라운드(User: B / AI: A) ➔ 2라운드(User: A / AI: B)
  const [round, setRound] = useState<1 | 2>(1);
  const [lineIndex, setLineIndex] = useState<number>(0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // AI 발화 상태 (AI가 말하는 중에는 사용자 입력 대기)
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);

  // STT 상태
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [speechFeedback, setSpeechFeedback] = useState<'idle' | 'success' | 'fail'>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // 역할 교대 모달 (3초 카운트다운)
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState<boolean>(false);
  const [roleSwitchSeconds, setRoleSwitchSeconds] = useState<number>(3);

  // 전체 완료 모달
  const [isAllCompleted, setIsAllCompleted] = useState<boolean>(false);

  // 현재 재생 중인 라인 ID
  const [playingLineId, setPlayingLineId] = useState<string | null>(null);

  // 비동기 및 Web Speech API 안전 가드: 상태 미러링 Ref
  const isMountedRef = useRef<boolean>(true);
  const roundRef = useRef<1 | 2>(round);
  const lineIndexRef = useRef<number>(lineIndex);
  const isRecordingRef = useRef<boolean>(isRecording);
  const dialogueRef = useRef<DialogueItem>(dialogue);
  const transcriptRef = useRef<string>('');
  const silenceTimerRef = useRef<number | null>(null);
  // 한 대사에서 정답 처리가 두 번 일어나 대사를 건너뛰는 것을 막는 잠금
  const advancingRef = useRef<boolean>(false);
  // 같은 AI 대사 / 라운드 종료가 중복 실행되지 않도록 막는 잠금
  const aiTurnKeyRef = useRef<string>('');
  const roundFinishingRef = useRef<boolean>(false);
  // 말하는 중간에 잠깐 쉬어도 기다려 주는 시간 (ms)
  const SILENCE_WAIT_MS = 2500;
  const recognitionRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // 상태 미러링 업데이트
  useEffect(() => {
    roundRef.current = round;
    lineIndexRef.current = lineIndex;
    isRecordingRef.current = isRecording;
    dialogueRef.current = dialogue;
    transcriptRef.current = transcript;
  }, [round, lineIndex, isRecording, dialogue, transcript]);

  // 스크롤 최하단 이동
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isRecording, speechFeedback, isAiSpeaking]);

  // TTS 재생 상태 구독
  useEffect(() => {
    isMountedRef.current = true;
    const unsub = audioPlayer.subscribe((id) => {
      if (isMountedRef.current) setPlayingLineId(id);
    });
    return () => {
      isMountedRef.current = false;
      audioPlayer.stopCurrent();
      unsub();
    };
  }, []);

  // 현재 라운드에서 사용자와 AI의 역할 정의
  // 1R: User = B, AI = A
  // 2R: User = A, AI = B
  const userRole: 'A' | 'B' = round === 1 ? 'B' : 'A';
  const aiRole: 'A' | 'B' = round === 1 ? 'A' : 'B';

  const currentLine = dialogue.lines[lineIndex] as DialogueLine | undefined;
  const isUserTurn = currentLine && currentLine.speaker === userRole && !isAiSpeaking;

  // 음성 인식(STT) 중지 헬퍼
  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        // 중지 후 뒤늦게 들어오는 결과가 다시 채점되지 않도록 이벤트 연결을 끊음
        recognitionRef.current.onresult = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {
        // 무시
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // AI 턴 진행 로직 (상대방 대화가 완전히 끝날 때까지 대기 후 순차 진행)
  const handleAITurn = useCallback(async (targetLineIndex: number) => {
    const line = dialogueRef.current.lines[targetLineIndex];
    if (!line || !isMountedRef.current) return;
    const turnKey = `${roundRef.current}_${targetLineIndex}`;
    if (aiTurnKeyRef.current === turnKey) return;
    aiTurnKeyRef.current = turnKey;

    setIsAiSpeaking(true);

    // 1. 대화 히스토리에 AI 문장 즉시 추가하여 말풍선 표시
    const msgId = `msg_r${roundRef.current}_${targetLineIndex}_ai`;
    setChatHistory((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      return [...prev, { id: msgId, line, sender: 'ai' }];
    });

    // 2. AI 음성 재생 (음성이 완전히 끝날 때까지 대기)
    try {
      await audioPlayer.playChinese(line.hanzi, msgId);
    } catch (e) {
      console.warn('AI TTS 재생 오류:', e);
    }

    if (!isMountedRef.current) return;

    // 3. AI 대사 종료 후 자연스러운 대화 호흡 대기 (800ms)
    await new Promise((r) => setTimeout(r, 800));
    if (!isMountedRef.current) return;

    setIsAiSpeaking(false);

    // 4. 다음 턴 또는 라운드 종료
    if (targetLineIndex + 1 < dialogueRef.current.lines.length) {
      setLineIndex(targetLineIndex + 1);
    } else {
      // 해당 라운드의 마지막 대사 완료 시 상대방 대답을 충분히 확인할 수 있도록 1.2초 대기
      setTimeout(() => {
        if (isMountedRef.current) {
          handleRoundFinish();
        }
      }, 1200);
    }
  }, []);

  // 1라운드 / 2라운드 종료 핸들러
  const handleRoundFinish = useCallback(() => {
    if (roundFinishingRef.current) return;
    roundFinishingRef.current = true;
    stopRecording();
    if (roundRef.current === 1) {
      // 1라운드 종료 ➔ 2라운드 역할 교대 모달 (3초)
      setShowRoleSwitchModal(true);
      setRoleSwitchSeconds(3);

      let count = 3;
      const interval = setInterval(() => {
        count -= 1;
        setRoleSwitchSeconds(count);
        if (count <= 0) {
          clearInterval(interval);
          setShowRoleSwitchModal(false);
          // 2라운드 시작
          roundFinishingRef.current = false;
          aiTurnKeyRef.current = '';
          setRound(2);
          setLineIndex(0);
          setChatHistory([]);
          setSpeechFeedback('idle');
          setTranscript('');
          setIsAiSpeaking(false);
        }
      }, 1000);
    } else {
      // 2라운드까지 모두 완료 ➔ 전체 완료 처리 및 저장
      setIsAllCompleted(true);
      if (student) {
        dialogueService.saveCompletedDialogue(
          student.student_id,
          dialogueRef.current.id,
          dialogueRef.current.lessonId
        ).catch((err) => console.warn('대화 완료 저장 실패:', err));
      }
    }
  }, [stopRecording, student]);

  // 사용자 턴 정답 처리 후 다음 대사 진행
  const proceedNextStep = useCallback(() => {
    stopRecording();
    const nextIdx = lineIndexRef.current + 1;
    if (nextIdx < dialogueRef.current.lines.length) {
      setLineIndex(nextIdx);
    } else {
      // 마지막 대사일 때 여유 있게 종료
      setTimeout(() => {
        if (isMountedRef.current) {
          handleRoundFinish();
        }
      }, 1000);
    }
  }, [stopRecording, handleRoundFinish]);

  // 발음 채점 실행 (즉각적인 피드백 제공)
  const evaluateSpokenTranscript = useCallback((spokenText: string) => {
    if (!currentLine || !isMountedRef.current) return;
    if (advancingRef.current) return;

    const isMatch = evaluateSpeechAnswer(spokenText, currentLine.hanzi);

    if (isMatch) {
      advancingRef.current = true;
      setSpeechFeedback('success');
      setFeedbackMsg('정확한 발음입니다! 🎉');

      // 대화 히스토리에 사용자 발화 추가
      const msgId = `msg_r${roundRef.current}_${lineIndexRef.current}_user`;
      setChatHistory((prev) => {
        if (prev.some((m) => m.id === msgId)) return prev;
        return [...prev, { id: msgId, line: currentLine, sender: 'user', isEvaluated: true }];
      });

      // 사용자가 정답 피드백과 본인 발화를 충분히 확인할 수 있도록 3초 대기 후 상대방(AI) 턴으로 진행
      setTimeout(() => {
        if (isMountedRef.current) {
          proceedNextStep();
        }
      }, 3000);
    } else {
      setSpeechFeedback('fail');
      setFeedbackMsg('발음이 일치하지 않습니다. 다시 한 번 말씀해 보세요.');
    }
  }, [currentLine, proceedNextStep]);


  // 턴 전환 감지 및 AI 턴 자동 실행
  useEffect(() => {
    if (!currentLine || showRoleSwitchModal || isAllCompleted) return;
    advancingRef.current = false;

    if (currentLine.speaker === aiRole) {
      // AI 턴
      handleAITurn(lineIndex);
    } else {
      // 사용자 턴: 음성 피드백 초기화
      setSpeechFeedback('idle');
      setFeedbackMsg('');
      setTranscript('');
    }
  }, [lineIndex, round, showRoleSwitchModal, isAllCompleted, currentLine, aiRole, handleAITurn]);

  // Web Speech API STT 시작 (실시간 반응속도 극대화)
  const startRecording = useCallback(() => {
    audioPlayer.stopCurrent();
    stopRecording();

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('현재 브라우저에서 마이크 음성 인식을 지원하지 않습니다. 발음 패스 버튼을 사용해 주세요.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        if (isMountedRef.current) {
          setIsRecording(true);
          setSpeechFeedback('idle');
          setFeedbackMsg('');
          setTranscript('');
        }
      };

      // STT 결과 처리: 실시간 음성 누적 및 즉각 판정
      recognition.onresult = (event: any) => {
        let accumulated = '';
        let isFinal = false;
        for (let i = 0; i < event.results.length; i++) {
          accumulated += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        const trimmed = accumulated.trim();
        if (isMountedRef.current) {
          transcriptRef.current = trimmed;
          setTranscript(trimmed);
        }

        // 1) 문장 전체가 정확히 일치하면 즉시 통과
        if (currentLine && normalizeText(trimmed) === normalizeText(currentLine.hanzi)) {
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
          }
          stopRecording();
          evaluateSpokenTranscript(trimmed);
          return;
        }

        // 1-1) 거의 맞았지만 마지막 글자가 아직 인식 중일 수 있으면 1.2초 더 듣고 채점
        //      (예: '几点起'까지만 인식된 상태에서 '床'이 들어올 때까지 기다림)
        if (currentLine && evaluateSpeechAnswer(trimmed, currentLine.hanzi)) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = window.setTimeout(() => {
            const finalText = transcriptRef.current || trimmed;
            stopRecording();
            evaluateSpokenTranscript(finalText);
          }, 1200);
          return;
        }

        // 2) 아직 정답이 아니면, 말이 잠깐 멈춰도 바로 끝내지 않고 일정 시간 더 기다린 뒤 채점
        //    (중간에 다시 말하기 시작하면 타이머가 처음부터 다시 시작됨)
        void isFinal;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => {
          const finalText = transcriptRef.current || trimmed;
          stopRecording();
          if (finalText) evaluateSpokenTranscript(finalText);
        }, SILENCE_WAIT_MS);
      };

      recognition.onerror = (err: any) => {
        console.warn('STT 오류:', err);
        stopRecording();
      };

      recognition.onend = () => {
        // 브라우저가 스스로 인식을 끝낸 경우: 지금까지 들은 내용으로 채점
        if (recognitionRef.current !== recognition) return;
        const finalText = transcriptRef.current;
        stopRecording();
        if (finalText) evaluateSpokenTranscript(finalText);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error('음성 인식 시작 예외:', e);
      setIsRecording(false);
    }
  }, [currentLine, stopRecording, evaluateSpokenTranscript]);

  // 수동 마이크 종료 및 즉시 채점
  const handleManualStop = () => {
    stopRecording();
    const textToEvaluate = transcriptRef.current.trim() || transcript.trim();
    if (textToEvaluate) {
      evaluateSpokenTranscript(textToEvaluate);
    }
  };

  // 발음 바로 통과 (학습 편의용)
  const handlePassLine = () => {
    stopRecording();
    if (!currentLine || advancingRef.current) return;
    advancingRef.current = true;
    const msgId = `msg_r${roundRef.current}_${lineIndexRef.current}_user`;
    setChatHistory((prev) => {
      if (prev.some((m) => m.id === msgId)) return prev;
      return [...prev, { id: msgId, line: currentLine, sender: 'user', isEvaluated: true }];
    });
    proceedNextStep();
  };

  // 대사 TTS 재생
  const handlePlayLineTTS = (line: DialogueLine, e: React.MouseEvent) => {
    e.stopPropagation();
    audioPlayer.playChinese(line.hanzi, `tts_${line.hanzi}`);
  };

  return (
    <div className="w-full h-full flex flex-col justify-start relative select-none bg-slate-50">
      
      {/* 1. 상단 네비게이션 헤더 */}
      <div className="h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between z-10 shrink-0 shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-700 hover:text-red-600 text-xs md:text-base font-bold transition-all border border-slate-200"
        >
          <ArrowLeft size={16} />
          <span>대화 목록</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs md:text-base font-black text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
            {dialogue.title}
          </span>
          <span className="text-xs md:text-base font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
            {round}라운드 ({userRole}역할)
          </span>
        </div>
      </div>

      {/* 2. 채팅 버블 메시지 리스트 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        
        {/* 라운드 안내 뱃지 */}
        <div className="flex justify-center">
          <div className="bg-slate-200/80 text-slate-600 text-[0.6875rem] md:text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
            <Sparkles size={12} className="text-red-500" />
            <span>
              {round === 1 ? '1라운드: 사용자가 B 역할로 대화합니다' : '2라운드: 역할을 바꿔 사용자가 A 역할로 대화합니다'}
            </span>
          </div>
        </div>

        {/* 대화 히스토리 버블 */}
        {chatHistory.map((msg) => {
          const isAI = msg.sender === 'ai';
          const isThisLinePlaying = playingLineId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 animate-fadeIn ${
                isAI ? 'justify-start' : 'justify-end'
              }`}
            >
              {/* AI 프로필 아바타 */}
              {isAI && (
                <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 ${
                  isThisLinePlaying ? 'ring-4 ring-red-200 animate-pulse' : ''
                }`}>
                  <Bot size={18} />
                </div>
              )}

              {/* 말풍선 본문 */}
              <div
                className={`max-w-[82%] rounded-3xl p-4 shadow-sm relative transition-all ${
                  isAI
                    ? `bg-white text-slate-800 border rounded-tl-sm ${
                        isThisLinePlaying ? 'border-red-400 ring-2 ring-red-100 shadow-md' : 'border-slate-200/80'
                      }`
                    : 'bg-gradient-to-tr from-red-600 to-rose-500 text-white rounded-tr-sm'
                }`}
              >
                {/* 화자 뱃지 */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className={`text-[0.625rem] md:text-sm font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    isAI ? 'bg-slate-100 text-slate-600' : 'bg-white/20 text-white'
                  }`}>
                    {isThisLinePlaying && <Volume2 size={11} className="animate-spin text-red-500" />}
                    {msg.line.speaker} 역할 ({isAI ? 'AI' : '나'})
                  </span>

                  {/* TTS 재생 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => handlePlayLineTTS(msg.line, e)}
                    className={`p-1 rounded-lg transition-colors ${
                      isAI
                        ? 'text-slate-400 hover:text-red-600 hover:bg-slate-100'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Volume2 size={15} />
                  </button>
                </div>

                {/* 한자 대사 */}
                <div className="text-lg md:text-2xl font-black font-hanzi tracking-wide mt-1">
                  {msg.line.hanzi}
                </div>

                {/* 병음 */}
                <div className={`text-xs md:text-base font-bold font-pinyin mt-0.5 ${
                  isAI ? 'text-red-600' : 'text-red-100'
                }`}>
                  [{msg.line.pinyin}]
                </div>

                {/* 한국어 뜻 */}
                <div className={`text-xs md:text-base mt-1.5 pt-1.5 border-t ${
                  isAI ? 'text-slate-500 border-slate-100' : 'text-white/90 border-white/20'
                }`}>
                  {msg.line.meaning}
                </div>
              </div>

              {/* 사용자 프로필 아바타 */}
              {!isAI && (
                <div className="w-9 h-9 rounded-2xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User size={18} />
                </div>
              )}
            </div>
          );
        })}

        {/* AI가 말하는 중 안내 표시 */}
        {isAiSpeaking && (
          <div className="flex justify-start items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs md:text-base font-bold animate-pulse">
            <Volume2 size={16} className="animate-bounce" />
            <span>상대방({aiRole})의 음성을 재생하고 있습니다... 귀 기울여 들어보세요 🎧</span>
          </div>
        )}

        {/* 3. 현재 사용자가 말해야 하는 목표 문장 카드 (사용자 턴일 때 하단 띄움) */}
        {isUserTurn && (
          <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-5 pb-6 shadow-sm animate-fadeIn space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-base font-bold text-amber-900 bg-amber-200/80 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                <Mic size={14} className="text-amber-700" />
                내 차례 ({userRole} 대사를 중국어로 말하세요)
              </span>

              <button
                type="button"
                onClick={(e) => handlePlayLineTTS(currentLine, e)}
                className="text-xs md:text-base text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 bg-white px-2.5 py-1 rounded-xl border border-amber-200 shadow-2xs transition-all active:scale-95"
              >
                <Volume2 size={14} />
                <span>모범 발음 듣기</span>
              </button>
            </div>

            {/* 목표 대사 */}
            <div className="space-y-1 pt-1">
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-hanzi tracking-wide leading-tight">
                {currentLine.hanzi}
              </div>
              <div className="text-xs md:text-base sm:text-sm font-bold text-red-600 font-pinyin tracking-tight">
                [{currentLine.pinyin}]
              </div>
              <div className="text-xs md:text-base sm:text-sm text-slate-700 font-medium pt-1.5 leading-relaxed">
                {currentLine.meaning}
              </div>
            </div>

            {/* 실시간 STT 인식 문장 노출 */}
            {transcript && (
              <div className="mt-2 p-2.5 bg-white rounded-xl border border-amber-200 text-xs md:text-base font-pinyin text-slate-700 flex items-center gap-1.5 shadow-xs">
                <span className="text-[0.625rem] md:text-sm text-amber-600 font-bold">인식 결과:</span>
                <span className="font-bold font-hanzi text-sm md:text-lg text-slate-900">{transcript}</span>
              </div>
            )}

            {/* 피드백 */}
            {speechFeedback === 'success' && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs md:text-base font-bold rounded-xl flex items-center gap-1.5 animate-bounce">
                <CheckCircle2 size={16} />
                <span>{feedbackMsg}</span>
              </div>
            )}

            {speechFeedback === 'fail' && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs md:text-base font-bold rounded-xl flex items-center gap-1.5 animate-shake">
                <AlertCircle size={16} />
                <span>{feedbackMsg}</span>
              </div>
            )}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* 4. 하단 컨트롤러 바 */}
      {isAiSpeaking ? (
        <div className="bg-slate-900 text-white p-4 flex items-center justify-center gap-2.5 shadow-lg z-20 shrink-0 border-t border-slate-800">
          <Headphones size={18} className="text-rose-400 animate-bounce" />
          <span className="text-xs md:text-base font-bold text-slate-200">
            상대방({aiRole})의 대답을 듣고 있습니다...
          </span>
        </div>
      ) : isUserTurn ? (
        <div className="bg-white border-t border-slate-200 p-3.5 flex items-center justify-between gap-3 shadow-lg z-20 shrink-0">
          {/* 발음 패스 버튼 */}
          <button
            type="button"
            onClick={handlePassLine}
            className="px-3.5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs md:text-base transition-colors shrink-0"
          >
            발음 패스 ➔
          </button>

          {/* 메인 마이크 녹음 버튼 */}
          <button
            type="button"
            onClick={isRecording ? handleManualStop : startRecording}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-xs md:text-base flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${
              isRecording
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200 ring-4 ring-rose-200 animate-pulse'
                : 'bg-red-600 hover:bg-red-700 text-white shadow-red-200'
            }`}
          >
            {isRecording ? (
              <>
                <MicOff size={18} />
                <span>말씀을 멈추면 자동 채점됩니다 (터치 시 즉시 채점)</span>
              </>
            ) : (
              <>
                <Mic size={18} />
                <span>마이크 터치하고 중국어로 말씀하세요</span>
              </>
            )}
          </button>
        </div>
      ) : null}

      {/* 5. 1R ➔ 2R 역할 교대 모달 (3초 카운트다운) */}
      {showRoleSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-200 mb-3 animate-spin">
              <RotateCcw size={32} />
            </div>

            <span className="text-xs md:text-base font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-1">
              1라운드 완료!
            </span>

            <h3 className="text-xl font-black text-slate-800 mt-1">
              역할을 바꿔서 연습합니다
            </h3>

            <p className="text-xs md:text-base text-slate-500 mt-1.5 leading-relaxed">
              이제 <span className="font-bold text-red-600">A 역할</span>을 맡아 대화를 먼저 시작해보세요!
            </p>

            <div className="mt-4 text-3xl font-black text-blue-600 font-pinyin">
              {roleSwitchSeconds}
            </div>
            <span className="text-[0.625rem] md:text-sm text-slate-400 mt-0.5">초 후 2라운드가 시작됩니다</span>
          </div>
        </div>
      )}

      {/* 6. 전체 완료 축하 모달 */}
      {isAllCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 mb-3 animate-bounce">
              <Sparkles size={34} />
            </div>

            <span className="text-xs md:text-base font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-1">
              🎉 롤플레잉 완벽 마스터!
            </span>

            <h3 className="text-xl font-black text-slate-800 mt-1">
              {dialogue.title} 대화 완료!
            </h3>

            <p className="text-xs md:text-base text-slate-500 mt-1 leading-relaxed">
              1라운드와 2라운드 역할을 모두 완벽하게 주고받았습니다.
            </p>

            <button
              type="button"
              onClick={onBack}
              className="w-full mt-6 py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs md:text-base rounded-xl shadow-md shadow-red-200 transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={16} />
              <span>대화 목록으로 돌아가기</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
