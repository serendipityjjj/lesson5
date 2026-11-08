import { WritingSentence } from '../types';
import { DIALOGUES_DATA } from '../data/dialogueData';
import { tokenizeSentence } from './writingTokenizer';

/**
 * 대화 데이터셋으로부터 작문 연습용 문장 풀 추출
 */
export function getAllWritingSentences(): WritingSentence[] {
  const sentences: WritingSentence[] = [];

  Object.entries(DIALOGUES_DATA).forEach(([lessonIdStr, dialogues]) => {
    const lessonId = parseInt(lessonIdStr, 10);

    dialogues.forEach((d) => {
      d.lines.forEach((line, lineIdx) => {
        const id = `ws_${lessonId}_${d.id}_${lineIdx}`;
        const tokens = tokenizeSentence(line.hanzi, line.pinyin);

        // 중복 방지 및 유효성 검사 (너무 짧은 감탄사 단독 제외)
        if (tokens.length >= 1) {
          sentences.push({
            id,
            lessonId,
            hanzi: line.hanzi,
            pinyin: line.pinyin,
            meaning: line.meaning,
            tokens,
          });
        }
      });
    });
  });

  return sentences;
}

/**
 * 단원별 10문장 무작위 추출 함수 (단어가 부족할 경우 분산 반복 채우기)
 */
export function getTenWritingSentences(lessonId: number | 'all'): WritingSentence[] {
  const allSentences = getAllWritingSentences();
  
  let pool = allSentences;
  if (lessonId !== 'all') {
    pool = allSentences.filter((s) => s.lessonId === lessonId);
  }

  if (pool.length === 0) {
    pool = allSentences;
  }

  // 무작위 셔플
  const shuffled = [...pool].sort(() => Math.random() - 0.5);

  const selected: WritingSentence[] = [];
  let index = 0;
  while (selected.length < 10) {
    const item = shuffled[index % shuffled.length];
    selected.push({
      ...item,
      id: `${item.id}_q${selected.length + 1}`,
    });
    index++;
  }

  return selected;
}
