export interface Student {
  student_id: string; // 5자리 학번 (예: 20101)
  name: string;
  school_name?: string; // 학교 이름 (예: 한라중, OO중)
  password?: string;
  created_at?: string;
}

export type TabType = 'vocabulary' | 'conversation' | 'writing';

export interface AuthState {
  isAuthenticated: boolean;
  student: Student | null;
  storageMode: 'supabase' | 'local';
  isLoading: boolean;
}

export interface VocabularyWord {
  id: string;
  hanzi: string; // 한자
  pinyin: string; // 병음
  meaning: string; // 뜻
  lessonId: number;
  sectionTitle: string;
}

export interface LessonSection {
  title: string;
  words: VocabularyWord[];
}

export interface Lesson {
  id: number;
  lessonNumber: number;
  titleZh: string;
  titleKo: string;
  subtitle: string;
  description: string;
  sections: LessonSection[];
}

// 단어 테스트 관련 타입
export type TestPart = 'all' | '0' | '1' | '2';

export type QuestionType = 
  | 'meaning-to-hanzi'
  | 'hanzi-to-meaning'
  | 'meaning-to-pinyin';

export interface TestQuestion {
  id: string;
  word: VocabularyWord;
  type: QuestionType;
  prompt: string;
  subPrompt?: string;
  options?: string[];
  correctAnswer: string;
}

export interface TestRecord {
  id?: string;
  student_id: string;
  lesson_id: number;
  part: TestPart;
  part_name: string;
  score: number;
  mistakes_count: number;
  created_at: string;
}

// 오답 복습 보관함 타입
export interface WrongVocab {
  id?: string;
  student_id: string;
  word_id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  lesson_id: number;
  created_at: string;
}

// 대화 연습 관련 타입
export interface DialogueLine {
  speaker: 'A' | 'B';
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export interface DialogueItem {
  id: string;
  lessonId: number;
  type: 'main' | 'applied';
  title: string;
  preview: string;
  lines: DialogueLine[];
}

export interface CompletedDialogue {
  id?: string;
  student_id: string;
  dialogue_id: string;
  lesson_id: number;
  completed_at: string;
}

// 작문 연습(Writing) 관련 타입
export type WritingMode = 'order' | 'write' | 'both'; // order: 어순 배열, write: 직접 작문, both: 통합 연습

export interface WordToken {
  id: string;
  hanzi: string;
  pinyin: string;
}

export interface WritingSentence {
  id: string;
  lessonId: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  tokens: WordToken[];
}

export interface WritingRecord {
  id?: string;
  student_id: string;
  lesson_id: number;
  mode: WritingMode;
  score: number;
  mistakes_count: number;
  created_at: string;
}

export interface WrongWriting {
  id?: string;
  student_id: string;
  sentence_id: string;
  lesson_id: number;
  hanzi: string;
  pinyin: string;
  meaning: string;
  created_at: string;
}
