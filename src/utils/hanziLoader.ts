/**
 * 3중 Failover CDN 기반 HanziWriter 데이터 로더
 * 1순위: jsdelivr
 * 2순위: fastly
 * 3순위: hanzi-writer.org 공식 미러
 */
export async function loadCharDataWithFailover(char: string): Promise<any> {
  const encodedChar = encodeURIComponent(char);
  const cdnUrls = [
    `https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodedChar}.json`,
    `https://fastly.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodedChar}.json`,
    `https://hanzi-writer.org/data/${encodedChar}.json`,
  ];

  let lastError: any = null;

  for (let i = 0; i < cdnUrls.length; i++) {
    const url = cdnUrls[i];
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(url, {
        signal: controller.signal,
        referrerPolicy: 'no-referrer',
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        throw new Error(`HTTP ${response.status} from ${url}`);
      }
    } catch (err) {
      lastError = err;
      console.warn(`[HanziWriter] CDN ${i + 1} (${url}) 로드 실패, 다음 CDN으로 대체:`, err);
    }
  }

  throw new Error(`모든 CDN에서 한자 '${char}' 데이터를 불러오는데 실패했습니다: ${lastError?.message || lastError}`);
}

/**
 * HanziWriter용 charDataLoader 콜백 래퍼
 */
export function customCharDataLoader(
  char: string,
  onComplete: (data: any) => void,
  onError: (err: any) => void
) {
  loadCharDataWithFailover(char)
    .then((data) => {
      onComplete(data);
    })
    .catch((err) => {
      console.error(`[HanziWriter] 한자 '${char}' 최종 로드 에러:`, err);
      if (typeof onError === 'function') {
        onError(err);
      }
    });
}
