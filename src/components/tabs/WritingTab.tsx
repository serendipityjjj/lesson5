import React, { useState, useEffect } from 'react';
import { WritingMode } from '../../types';
import { WritingHome } from '../writing/WritingHome';
import { WritingPractice } from '../writing/WritingPractice';
import { audioPlayer } from '../../utils/audioPlayer';

interface WritingTabProps {
  onTestingChange?: (active: boolean) => void;
}

export const WritingTab: React.FC<WritingTabProps> = ({ onTestingChange }) => {
  const [isPracticing, setIsPracticing] = useState<boolean>(false);
  const [selectedLessonId, setSelectedLessonId] = useState<number | 'all'>(5);
  const [selectedMode, setSelectedMode] = useState<WritingMode>('order');

  // 작문 연습 중일 때 글로벌 탭바 숨김 제어
  useEffect(() => {
    if (onTestingChange) {
      onTestingChange(isPracticing);
    }
  }, [isPracticing, onTestingChange]);

  useEffect(() => {
    return () => {
      audioPlayer.stopCurrent();
      if (onTestingChange) {
        onTestingChange(false);
      }
    };
  }, [onTestingChange]);

  const handleStartWriting = (lessonId: number | 'all', mode: WritingMode) => {
    audioPlayer.stopCurrent();
    setSelectedLessonId(lessonId);
    setSelectedMode(mode);
    setIsPracticing(true);
  };

  const handleCloseWriting = () => {
    audioPlayer.stopCurrent();
    setIsPracticing(false);
  };

  if (isPracticing) {
    return (
      <WritingPractice
        lessonId={selectedLessonId}
        mode={selectedMode}
        onClose={handleCloseWriting}
      />
    );
  }

  return (
    <WritingHome onStartWriting={handleStartWriting} />
  );
};
