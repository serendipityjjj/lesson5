import { CompletedDialogue } from '../types';
import { memory } from './memoryStore';

export const dialogueService = {
  async saveCompletedDialogue(studentId: string, dialogueId: string, lessonId: number): Promise<void> {
    if (memory.completedDialogues.some((d) => d.dialogue_id === dialogueId)) return;
    memory.completedDialogues.push({ student_id: studentId, dialogue_id: dialogueId, lesson_id: lessonId, completed_at: new Date().toISOString() });
  },
  async getCompletedDialogues(_studentId: string): Promise<CompletedDialogue[]> {
    return [...memory.completedDialogues];
  },
};
