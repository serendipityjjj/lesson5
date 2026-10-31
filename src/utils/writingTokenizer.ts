import { WordToken } from '../types';
import { audioPlayer } from './audioPlayer';

/**
 * 구글 번역 TTS 재생 함수
 */
export async function playTTS(text: string): Promise<void> {
  if (!text) return;
  const clean = text.replace(/[!?,.。，！？~:：;；'"‘’“”/\\()（）-]/g, '').trim();
  await audioPlayer.playChinese(clean, `writing_tts_${clean}`);
}

/**
 * 숫자(아라비아 숫자)를 병음 성조 텍스트로 치환하는 매핑 테이블
 */
const NUMBER_TO_PINYIN_MAP: [RegExp, string][] = [
  [/70/g, 'qīshí'],
  [/50/g, 'wǔshí'],
  [/40/g, 'sìshí'],
  [/30/g, 'sānshí'],
  [/25/g, 'èrshíwǔ'],
  [/20/g, 'èrshí'],
  [/18/g, 'shíbā'],
  [/16/g, 'shíliù'],
  [/12/g, "shí'èr"],
  [/11/g, 'shíyī'],
  [/10/g, 'shí'],
  [/9/g, 'jiǔ'],
  [/8/g, 'bā'],
  [/7/g, 'qī'],
  [/6/g, 'liù'],
  [/5/g, 'wǔ'],
  [/4/g, 'sì'],
  [/3/g, 'sān'],
  [/2/g, 'èr'],
  [/1/g, 'yī'],
  [/0/g, 'líng'],
];

const TONE_MAP: Record<string, string[]> = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  A: ['Ā', 'Á', 'Ǎ', 'À'],
  O: ['Ō', 'Ó', 'Ǒ', 'Ò'],
  E: ['Ē', 'É', 'Ě', 'È'],
  I: ['Ī', 'Í', 'Ǐ', 'Ì'],
  U: ['Ū', 'Ú', 'Ǔ', 'Ù'],
  V: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ'],
  Ü: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ'],
};

/**
 * 키보드 타이핑 시 성조 숫자(1~4)를 성조가 붙은 운모로 실시간 변환하는 함수
 * 예: 
 *  - 단일 모음: i2 -> í, a3 -> ǎ, e4 -> è, o1 -> ō, u3 -> ǔ, v2 -> ǘ
 *  - 전체 음절: ni3 -> nǐ, hao3 -> hǎo, xue2 -> xué, zhong1 -> zhōng, dui4 -> duì, liu2 -> liú
 */
export function convertToneNumberToPinyin(text: string): string {
  if (!text) return '';

  // 1. 단어/음절 단위로 숫자(1~5)가 붙은 패턴 변환
  let res = text.replace(/([a-zA-ZüÜvV]+)([1-5])/g, (_match, word: string, toneStr: string) => {
    const tone = parseInt(toneStr, 10);
    if (tone < 1 || tone > 4) {
      // 5성은 경성 (성조 부호 없이 v->ü 치환만)
      return word.replace(/v/g, 'ü').replace(/V/g, 'Ü');
    }

    const toneIndex = tone - 1;

    // 성조 부호 위치 결정 규칙:
    // 1) 'a' 또는 'e'가 있으면 항상 거기에 성조 부여
    // 2) 'ou'가 있으면 'o'에 성조 부여
    // 3) 그 외에는 가장 마지막에 나오는 모음에 성조 부여
    let targetIndex = -1;

    const lower = word.toLowerCase();
    const aIndex = lower.indexOf('a');
    const eIndex = lower.indexOf('e');

    if (aIndex !== -1) {
      targetIndex = aIndex;
    } else if (eIndex !== -1) {
      targetIndex = eIndex;
    } else if (lower.includes('ou')) {
      targetIndex = lower.indexOf('o');
    } else {
      // 마지막 모음 찾기 (a, e, i, o, u, v, ü)
      for (let i = word.length - 1; i >= 0; i--) {
        const ch = lower[i];
        if ('aeiouvü'.includes(ch)) {
          targetIndex = i;
          break;
        }
      }
    }

    if (targetIndex !== -1) {
      const charToTone = word[targetIndex];
      const toneReplacements = TONE_MAP[charToTone];
      if (toneReplacements && toneReplacements[toneIndex]) {
        const tonedChar = toneReplacements[toneIndex];
        const before = word.slice(0, targetIndex).replace(/v/g, 'ü').replace(/V/g, 'Ü');
        const after = word.slice(targetIndex + 1).replace(/v/g, 'ü').replace(/V/g, 'Ü');
        return before + tonedChar + after;
      }
    }

    return word.replace(/v/g, 'ü').replace(/V/g, 'Ü');
  });

  return res;
}


/**
 * 채점용 병음 정규화 함수
 * - 공백, 쉼표, 마침표 등 기호 제거 및 소문자 변환
 * - 성조 기호는 정확히 유지
 * - 숫자는 병음 성조 텍스트로 강제 치환
 */
export function cleanPinyinForCheck(pinyin: string): string {
  if (!pinyin) return '';

  let s = pinyin.trim().toLowerCase();

  // 1. 숫자 치환 (큰 수부터 작은 수 순서)
  for (const [pattern, replacement] of NUMBER_TO_PINYIN_MAP) {
    s = s.replace(pattern, replacement);
  }

  // 2. 모든 공백, 쉼표, 마침표, 따옴표 등 기호 제거 (성조 기호는 온전히 보존)
  s = s.replace(/[!?,.。，！？~:：;；'"‘’“”\s/\\()（）-]/g, '');

  return s;
}

/**
 * 병음 토큰의 음절(Syllable) 수 계산 헬퍼
 * 예:
 * "wǒ" -> 1
 * "kě'ài" -> 2
 * "hánguórén" -> 3
 * "dìdi" -> 2
 * "jīnnián" -> 2
 * "shí'èr" -> 2
 * "shèngdànjié" -> 3
 */
function countPinyinSyllables(token: string): number {
  if (!token) return 1;

  const clean = token.toLowerCase().replace(/[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü']/g, '');
  if (!clean) return 1;

  // 아포스트로피가 있으면 아포스트로피 단위로 음절 분할
  if (clean.includes("'")) {
    const parts = clean.split("'").filter(Boolean);
    return parts.reduce((acc, part) => acc + countPinyinSyllables(part), 0);
  }

  // 성조가 붙은 모음 개수 세기
  const tonedVowels = clean.match(/[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g);
  if (tonedVowels && tonedVowels.length > 0) {
    return tonedVowels.length;
  }

  // 일반 모음(경성 등 성조 없는 경우) 패턴 추정
  // 연속 모음(ai, ao, ou, ei, ia, ie, iao, iou, ua, uo, uai, uei, ue, van 등)은 1음절로 묶임
  const vowelMatches = clean.match(/[aeiouü]+/g);
  if (vowelMatches) {
    return Math.max(1, vowelMatches.length);
  }

  return 1;
}

/**
 * 중국어 한자와 병음을 의미 단위의 '단어 카드' 배열로 분할
 * 병음 문장의 띄어쓰기(공백)를 기준으로 한자 글자 수를 매핑하여 분할
 */
export function tokenizeSentence(hanzi: string, pinyin: string): WordToken[] {
  // 1. 기호 제거 안전장치 (파싱 전 정규식으로 기호 제거)
  const cleanHanzi = hanzi.replace(/[!?,.。，！？~:：;；'"‘’“”\s/\\()（）-]/g, '');
  const cleanPinyinStr = pinyin.replace(/[!?,.。，！？~:：;；"“”/\\()（）]/g, ' ').trim();

  // 2. 병음 공백 기준으로 분할
  const pinyinTokens = cleanPinyinStr.split(/\s+/).filter(Boolean);

  if (pinyinTokens.length === 0 || !cleanHanzi) {
    return [
      {
        id: 'tok_0',
        hanzi: cleanHanzi || hanzi,
        pinyin: pinyin.trim(),
      },
    ];
  }

  const tokens: WordToken[] = [];
  let hanziCursor = 0;

  for (let i = 0; i < pinyinTokens.length; i++) {
    const pToken = pinyinTokens[i];
    const syllableCount = countPinyinSyllables(pToken);

    // 남은 토큰이 마지막 하나인 경우 남은 한자 전체 할당
    let charLength = syllableCount;
    if (i === pinyinTokens.length - 1) {
      charLength = Math.max(1, cleanHanzi.length - hanziCursor);
    } else {
      // 범위 초과 방어
      charLength = Math.min(syllableCount, Math.max(1, cleanHanzi.length - hanziCursor - (pinyinTokens.length - 1 - i)));
    }

    const hChunk = cleanHanzi.slice(hanziCursor, hanziCursor + charLength);
    hanziCursor += charLength;

    tokens.push({
      id: `tok_${i}_${hChunk}`,
      hanzi: hChunk,
      pinyin: pToken,
    });
  }

  // 혹시 남은 한자가 있다면 마지막 토큰에 병합
  if (hanziCursor < cleanHanzi.length && tokens.length > 0) {
    const last = tokens[tokens.length - 1];
    last.hanzi += cleanHanzi.slice(hanziCursor);
  }

  return tokens;
}
