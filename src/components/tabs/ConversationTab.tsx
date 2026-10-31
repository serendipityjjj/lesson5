import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DialogueItem, CompletedDialogue } from '../../types';
import { dialogueService } from '../../services/dialogueService';
import { useAuth } from '../../context/AuthContext';
import { DialogueList } from '../dialogue/DialogueList';
import { DialoguePlayer } from '../dialogue/DialoguePlayer';

export const ConversationTab: React.FC = () => {
  const { student } = useAuth();
  const [completedList, setCompletedList] = useState<CompletedDialogue[]>([]);
  const [selectedDialogue, setSelectedDialogue] = useState<DialogueItem | null>(null);

  const isMountedRef = useRef<boolean>(true);

  // 완료 대화 목록 로드
  const fetchCompleted = useCallback(async () => {
    if (!student) return;
    try {
      const list = await dialogueService.getCompletedDialogues(student.student_id);
      if (isMountedRef.current) {
        setCompletedList(list);
      }
    } catch (e) {
      console.warn('대화 완료 목록 로드 실패:', e);
    }
  }, [student]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCompleted();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchCompleted]);

  // 대화 상세 진입
  const handleSelectDialogue = (dialogue: DialogueItem) => {
    setSelectedDialogue(dialogue);
  };

  // 대화 상세 종료 및 목록 복귀
  const handleBackToList = () => {
    setSelectedDialogue(null);
    fetchCompleted();
  };

  if (selectedDialogue) {
    return (
      <DialoguePlayer
        dialogue={selectedDialogue}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <DialogueList
      completedList={completedList}
      onSelectDialogue={handleSelectDialogue}
    />
  );
};
