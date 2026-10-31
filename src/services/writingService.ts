import { WritingMode, WritingRecord, WrongWriting, WritingSentence } from '../types';
import { memory } from './memoryStore';

export const writingService = {
  async saveRecord(_s: string, _l: number, _m: WritingMode, _score: number, _mc: number): Promise<void> {},
  async getRecords(_studentId: string): Promise<WritingRecord[]> {
    return [];
  },
  async addWrongWriting(studentId: string, sentence: WritingSentence): Promise<void> {
    if (memory.wrongWritings.some((w) => w.hanzi === sentence.hanzi)) return;
    memory.wrongWritings.unshift({
      student_id: studentId, sentence_id: sentence.id, lesson_id: sentence.lessonId,
      hanzi: sentence.hanzi, pinyin: sentence.pinyin, meaning: sentence.meaning,
      created_at: new Date().toISOString(),
    });
  },
  async getWrongWritings(_studentId: string): Promise<WrongWriting[]> {
    return [...memory.wrongWritings];
  },
  async deleteWrongWriting(_studentId: string, hanzi: string): Promise<void> {
    memory.wrongWritings = memory.wrongWritings.filter((w) => w.hanzi !== hanzi);
  },
};
