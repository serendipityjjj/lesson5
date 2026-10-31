import { Lesson, VocabularyWord, TestPart, TestQuestion, QuestionType } from '../types';
import { LESSONS_DATA } from '../data/vocabularyData';

// 배열 무작위 셔플 헬퍼 (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getPartName(part: TestPart): string {
  switch (part) {
    case '0':
      return '본문 1';
    case '1':
      return '본문 2';
    case '2':
      return '심화';
    case 'all':
    default:
      return '단원 전체';
  }
}

export function generateTestQuestions(lesson: Lesson, part: TestPart): TestQuestion[] {
  // 1. 선택한 영역의 단어 풀 추출
  let targetWords: VocabularyWord[] = [];
  if (part === 'all') {
    targetWords = lesson.sections.flatMap((s) => s.words);
  } else {
    const sectionIndex = parseInt(part, 10);
    if (lesson.sections[sectionIndex]) {
      targetWords = [...lesson.sections[sectionIndex].words];
    } else {
      targetWords = lesson.sections.flatMap((s) => s.words);
    }
  }

  // 만약 단어가 하나도 없으면 전체 단어로 대체
  if (targetWords.length === 0) {
    targetWords = lesson.sections.flatMap((s) => s.words);
  }

  // 전체 교과 단어 풀 (오답 보기 생성용)
  const allGlobalWords = LESSONS_DATA.flatMap((l) => l.sections.flatMap((s) => s.words));

  // 2. 10문제의 (단어, 유형) 조합 생성 (동일 단어 + 동일 유형 절대 중복 금지)
  const types: QuestionType[] = ['meaning-to-hanzi', 'hanzi-to-meaning', 'meaning-to-pinyin'];
  
  // 가능한 모든 (단어, 유형) 쌍 생성
  const possiblePairs: { word: VocabularyWord; type: QuestionType }[] = [];
  for (const word of targetWords) {
    for (const type of types) {
      possiblePairs.push({ word, type });
    }
  }

  // 쌍 셔플
  const shuffledPairs = shuffleArray(possiblePairs);

  // 3대 유형이 골고루 포함되도록 우선 배분
  const selectedPairs: { word: VocabularyWord; type: QuestionType }[] = [];
  const usedKeys = new Set<string>();

  // 1차: 각 유형별 최소 2~3문제씩 균등 선택 시도
  for (const type of types) {
    const pairsForType = shuffledPairs.filter((p) => p.type === type);
    let count = 0;
    for (const p of pairsForType) {
      const key = `${p.word.id}_${p.type}`;
      if (!usedKeys.has(key) && count < 3) {
        selectedPairs.push(p);
        usedKeys.add(key);
        count++;
      }
    }
  }

  // 2차: 10개가 될 때까지 나머지 쌍에서 중복 없이 채우기
  for (const p of shuffledPairs) {
    if (selectedPairs.length >= 10) break;
    const key = `${p.word.id}_${p.type}`;
    if (!usedKeys.has(key)) {
      selectedPairs.push(p);
      usedKeys.add(key);
    }
  }

  // 만약 단어 수가 적어 10개 고유 쌍이 부족한 경우(단어가 3개 이하 등), 유형 순환으로 10개 채움
  let fallbackIndex = 0;
  while (selectedPairs.length < 10) {
    const word = targetWords[fallbackIndex % targetWords.length];
    const type = types[fallbackIndex % types.length];
    selectedPairs.push({ word, type });
    fallbackIndex++;
  }

  // 10문제로 자르고 최종 셔플
  const finalPairs = shuffleArray(selectedPairs.slice(0, 10));

  // 3. 각 문제별 상세 데이터 및 4지선다 옵션 빌드
  const questions: TestQuestion[] = finalPairs.map((pair, index) => {
    const { word, type } = pair;
    const questionId = `q_${index + 1}_${word.id}`;

    if (type === 'meaning-to-hanzi') {
      // 유형 1: 뜻 보고 한자(병음) 고르기 (4지선다)
      const correctOption = `${word.hanzi} [${word.pinyin}]`;
      
      // 오답 보기 3개 추출 (현재 단어 제외)
      const otherWords = allGlobalWords.filter((w) => w.hanzi !== word.hanzi);
      const shuffledOthers = shuffleArray(otherWords);
      const distractorOptions = shuffledOthers.slice(0, 3).map((w) => `${w.hanzi} [${w.pinyin}]`);

      const options = shuffleArray([correctOption, ...distractorOptions]);

      return {
        id: questionId,
        word,
        type,
        prompt: `다음 뜻에 해당하는 중국어 단어를 고르세요`,
        subPrompt: `"${word.meaning}"`,
        options,
        correctAnswer: correctOption,
      };
    } else if (type === 'hanzi-to-meaning') {
      // 유형 2: 한자(병음) 보고 뜻 고르기 (4지선다)
      const correctOption = word.meaning;
      
      const otherWords = allGlobalWords.filter((w) => w.meaning !== word.meaning);
      const shuffledOthers = shuffleArray(otherWords);
      const distractorOptions = shuffledOthers.slice(0, 3).map((w) => w.meaning);

      const options = shuffleArray([correctOption, ...distractorOptions]);

      return {
        id: questionId,
        word,
        type,
        prompt: `다음 중국어 단어의 올바른 한국어 뜻을 고르세요`,
        subPrompt: `${word.hanzi} [${word.pinyin}]`,
        options,
        correctAnswer: correctOption,
      };
    } else {
      // 유형 3: 뜻 보고 병음 직접 입력 (주관식)
      return {
        id: questionId,
        word,
        type,
        prompt: `단어의 한자와 뜻을 보고 정확한 병음을 입력하세요`,
        subPrompt: `${word.hanzi} (${word.meaning})`,
        correctAnswer: word.pinyin,
      };
    }
  });

  return questions;
}
