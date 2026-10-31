/**
 * 음성 인식(STT) 결과와 정답 중국어 문장 정규화 및 채점 유틸리티
 */

// 숫자 치환 매핑 (큰 숫자부터 순서대로)
const NUMBER_REPLACEMENTS: [RegExp, string][] = [
  [/70/g, '七十'],
  [/50/g, '五十'],
  [/40/g, '四十'],
  [/30/g, '三十'],
  [/25/g, '二十五'],
  [/20/g, '二十'],
  [/18/g, '十八'],
  [/16/g, '十六'],
  [/12/g, '十二'],
  [/11/g, '十一'],
  [/10/g, '十'],
  [/9/g, '九'],
  [/8/g, '八'],
  [/7/g, '七'],
  [/6/g, '六'],
  [/5/g, '五'],
  [/4/g, '四'],
  [/3/g, '三'],
  [/2/g, '二'],
  [/1/g, '一'],
  [/0/g, '零'],
];

export function normalizeText(text: string): string {
  if (!text) return '';

  let s = text.trim();

  // 0. 시각 표기(7:20) 및 모든 아라비아 숫자를 중국어 숫자로 변환
  s = s.replace(/(\d{1,2})\s*[:：]\s*(\d{2})/g, (_m, h, m) => `${h}点${m === '30' ? '半' : m}`);
  s = s.replace(/\d{1,2}/g, (d) => toChineseNumber(parseInt(d, 10)));

  // 1. 문장 부호 및 공백, 특수문자 완벽 제거
  s = s.replace(/[!?,.。，！？~:：;；'"‘’“”\s/\\()（）\-—_·?？]/g, '');

  // 2. 나이·학년 아라비아 숫자 -> 중국어 숫자 치환
  for (const [pattern, replacement] of NUMBER_REPLACEMENTS) {
    s = s.replace(pattern, replacement);
  }

  // 3. ★ 발음이 100% 동일한 중국어 동음이의어(Homophones) 통합 처리
  // 1) 他(tā) / 她(tā) / 它(tā) -> '他'로 통일 (3인칭 대명사 발음 100% 일치)
  s = s.replace(/[她它]/g, '他');

  // 2) 两(liǎng) / 二(èr) -> '二'로 통일 (숫자 2)
  s = s.replace(/两/g, '二');

  // 3) 的 / 得 / 地 (모두 de 발음) -> '的'로 통일
  s = s.replace(/[得地]/g, '的');

  // 4) 在 / 再 (모두 zài 발음) -> '在'로 통일
  s = s.replace(/再/g, '在');

  // 5) 做 / 作 (모두 zuò 발음) -> '做'로 통일
  s = s.replace(/作/g, '做');

  // 6) 坐 / 座 (모두 zuò 발음) -> '坐'로 통일
  s = s.replace(/座/g, '坐');

  // 7) 얼화(儿화) 유무 허용 (哪儿 <-> 哪, 这儿 <-> 这, 那儿 <-> 那, 一点儿 <-> 一点)
  s = s.replace(/儿/g, '');

  // 4. 소문자화
  s = s.toLowerCase();

  return s;
}

/**
 * 두 문자열 사이의 레벤슈타인 거리(편집 거리) 계산 함수
 */
function getLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 교체
          matrix[i][j - 1] + 1,     // 삽입
          matrix[i - 1][j] + 1      // 삭제
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * 정답 문장과 STT 인식 결과 비교 정밀 채점
 */
export function evaluateSpeechAnswer(transcript: string, expectedHanzi: string): boolean {
  const normUser = normalizeText(transcript);
  const normExpected = normalizeText(expectedHanzi);

  if (!normUser || !normExpected) return false;

  // 1) 동음이의어 정규화 후 100% 완전 일치 (예: 她几岁 <-> 他几岁)
  if (normUser === normExpected) return true;

  // 2) 앞뒤 가벼운 잡음이 섞여도 정답 문장이 통째로 포함되어 있는 경우 (단, 잡음이 2글자 이내)
  if (normUser.includes(normExpected) && normUser.length <= normExpected.length + 2) {
    return true;
  }

  const expectedLen = normExpected.length;
  const userLen = normUser.length;

  // 3) 글자 수 길이 차이가 너무 크면(엉뚱한 발화) 무조건 탈락
  if (Math.abs(userLen - expectedLen) > 1) {
    return false;
  }

  // 4) 레벤슈타인 편집 거리 정밀 검사
  const dist = getLevenshteinDistance(normUser, normExpected);

  // 3글자 이하 짧은 문장 (예: 你好, 她几岁, 是的 등)은 100% 정확하게 발음해야 통과 (거리 0만 허용)
  if (expectedLen <= 3) {
    return dist === 0;
  }

  // 4글자 이상 긴 문장 (예: 你今年多大了 등)은 STT 인식 오차 감안하여 최대 1글자 오차(거리 <= 1)까지만 허용
  return dist <= 1;
}




// 0~99 숫자를 중국어 숫자로 변환 (예: 25 → 二十五, 10 → 十)
function toChineseNumber(n: number): string {
  const digits = '零一二三四五六七八九';
  if (n < 10) return digits[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return (tens === 1 ? '' : digits[tens]) + '十' + (ones ? digits[ones] : '');
}
