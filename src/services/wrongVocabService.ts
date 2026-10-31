import { VocabularyWord, WrongVocab } from '../types';
import { memory } from './memoryStore';

export const wrongVocabService = {
  async addWrongVocab(studentId: string, word: VocabularyWord): Promise<void> {
    if (memory.wrongVocabs.some((w) => w.word_id === word.id)) return;
    memory.wrongVocabs.unshift({
      student_id: studentId, word_id: word.id, hanzi: word.hanzi, pinyin: word.pinyin,
      meaning: word.meaning, lesson_id: word.lessonId, created_at: new Date().toISOString(),
    });
  },
  async getWrongVocabs(_studentId: string): Promise<WrongVocab[]> {
    return [...memory.wrongVocabs];
  },
  async deleteWrongVocab(_studentId: string, wordId: string): Promise<void> {
    memory.wrongVocabs = memory.wrongVocabs.filter((w) => w.word_id !== wordId);
  },
};
