import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lesson, VocabularyWord, TestPart } from '../../types';
import { LESSONS_DATA } from '../../data/vocabularyData';
import { LessonList } from '../vocabulary/LessonList';
import { WordList } from '../vocabulary/WordList';
import { WordPracticeView } from '../vocabulary/WordPracticeView';
import { TestMode } from '../test/TestMode';
import { audioPlayer } from '../../utils/audioPlayer';
import { useAuth } from '../../context/AuthContext';

interface VocabularyTabProps {
  onTestingChange?: (active: boolean) => void;
}

const STUDIED_WORDS_STORAGE_KEY_PREFIX = 'cn_studied_words_';

export const VocabularyTab: React.FC<VocabularyTabProps> = ({ onTestingChange }) => {
  const { student } = useAuth();
  const studentId = student?.student_id || 'guest';
  const storageKey = `${STUDIED_WORDS_STORAGE_KEY_PREFIX}${studentId}`;

  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  
  // 학습 완료한 단어 ID 목록
  const [studiedWordIds, setStudiedWordIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  // 단어 테스트 상태
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testPart, setTestPart] = useState<TestPart>('all');

  const isMountedRef = useRef<boolean>(true);

  // 학생 변경 시 학습 완료 단어 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setStudiedWordIds(new Set(JSON.parse(raw)));
      } else {
        setStudiedWordIds(new Set());
      }
    } catch {
      setStudiedWordIds(new Set());
    }
  }, [storageKey]);

  // 학습 완료 마킹 핸들러
  const handleMarkStudied = useCallback((wordId: string) => {
    setStudiedWordIds((prev) => {
      const updated = new Set(prev);
      updated.add(wordId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(updated)));
      } catch (e) {
        console.error('학습 완료 단어 저장 실패:', e);
      }
      return updated;
    });
  }, [storageKey]);

  // 테스트 상태 변경 시 상위 AppLayout에 탭바 숨김 여부 전달
  useEffect(() => {
    if (onTestingChange) {
      onTestingChange(isTesting);
    }
  }, [isTesting, onTestingChange]);

  // TTS 재생 상태 구독 및 클린업
  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribe = audioPlayer.subscribe((playingId) => {
      if (isMountedRef.current) {
        setPlayingWordId(playingId);
      }
    });

    // 컴포넌트 언마운트(화면 이탈) 시 오디오 정지 및 클린업
    return () => {
      isMountedRef.current = false;
      audioPlayer.stopCurrent();
      unsubscribe();
      if (onTestingChange) {
        onTestingChange(false);
      }
    };
  }, [onTestingChange]);

  // 발음 재생 핸들러
  const handlePlayAudio = useCallback(async (word: VocabularyWord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await audioPlayer.playChinese(word.hanzi, word.id);
    } catch (err) {
      console.warn('TTS 재생 실패:', err);
    }
  }, []);

  // 과 선택 핸들러
  const handleSelectLesson = useCallback((lesson: Lesson) => {
    audioPlayer.stopCurrent();
    setSelectedLesson(lesson);
    setSelectedWord(null);
    setIsTesting(false);
  }, []);

  // 과 목록으로 뒤로가기
  const handleBackToLessonList = useCallback(() => {
    audioPlayer.stopCurrent();
    setSelectedLesson(null);
    setSelectedWord(null);
    setIsTesting(false);
  }, []);

  // 단어 상세/한자 따라쓰기 캔버스 화면 진입
  const handleSelectWord = useCallback((word: VocabularyWord) => {
    audioPlayer.stopCurrent();
    setSelectedWord(word);
    setIsTesting(false);
  }, []);

  // 단어 목록으로 뒤로가기
  const handleBackToWordList = useCallback(() => {
    audioPlayer.stopCurrent();
    setSelectedWord(null);
    setIsTesting(false);
  }, []);

  // 단어 테스트 시작 핸들러
  const handleStartTest = useCallback((part: TestPart) => {
    audioPlayer.stopCurrent();
    setSelectedWord(null);
    setTestPart(part);
    setIsTesting(true);
  }, []);

  // 단어 테스트 종료 핸들러
  const handleCloseTest = useCallback(() => {
    setIsTesting(false);
  }, []);

  // 1. 단어 테스트 모드 화면 (isTesting === true)
  if (isTesting && selectedLesson) {
    return (
      <TestMode
        lesson={selectedLesson}
        part={testPart}
        onClose={handleCloseTest}
      />
    );
  }

  // 2. 단어 선택 시 -> 한자 따라쓰기 캔버스 화면 (WordPracticeView)
  if (selectedWord && selectedLesson) {
    const allLessonWords = selectedLesson.sections.flatMap((s) => s.words);

    return (
      <WordPracticeView
        word={selectedWord}
        lessonWords={allLessonWords}
        isPlaying={playingWordId === selectedWord.id}
        onBack={handleBackToWordList}
        onPlayAudio={handlePlayAudio}
        onSelectWord={handleSelectWord}
        onMarkStudied={handleMarkStudied}
      />
    );
  }

  // 3. 단어 리스트 화면 (과가 선택되었을 때)
  if (selectedLesson) {
    return (
      <WordList
        lesson={selectedLesson}
        playingWordId={playingWordId}
        studiedWordIds={studiedWordIds}
        onBack={handleBackToLessonList}
        onPlayAudio={handlePlayAudio}
        onSelectWord={handleSelectWord}
        onStartTest={handleStartTest}
      />
    );
  }

  // 4. 과 목록 카드 화면 (기본 진입 화면)
  return (
    <LessonList
      lessons={LESSONS_DATA}
      onSelectLesson={handleSelectLesson}
    />
  );
};
