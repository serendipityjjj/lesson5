/**
 * 중국어 TTS 오디오 재생 유틸리티
 * Google TTS API 및 브라우저 차단/CORS/오디오 겹침 방어 로직 적용
 */

class AudioPlayerService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentPlayingId: string | null = null;
  private onStateChangeListeners: Set<(playingId: string | null) => void> = new Set();

  /**
   * 상태 변경 리스너 등록
   */
  public subscribe(listener: (playingId: string | null) => void): () => void {
    this.onStateChangeListeners.add(listener);
    listener(this.currentPlayingId);
    return () => {
      this.onStateChangeListeners.delete(listener);
    };
  }

  private notify(playingId: string | null) {
    this.currentPlayingId = playingId;
    this.onStateChangeListeners.forEach(listener => listener(playingId));
  }

  /**
   * 현재 재생 중인 모든 오디오 정지 및 메모리 정리
   */
  public stopCurrent() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio.onplay = null;
        this.currentAudio.onended = null;
        this.currentAudio.onerror = null;
        this.currentAudio.src = '';
      } catch (e) {
        console.warn('오디오 정지 중 오류:', e);
      }
      this.currentAudio = null;
    }
    this.notify(null);
  }

  /**
   * 중국어 발음 재생 (zh-CN)
   * Google TTS -> SpeechSynthesis fallback 완벽 지원
   */
  public playChinese(text: string, wordId: string): Promise<void> {
    return new Promise((resolve) => {
      const cleanText = text?.trim();
      if (!cleanText) {
        resolve();
        return;
      }

      // [오디오 겹침 방지] 이전 오디오 즉시 완전 정지
      this.stopCurrent();

      // 브라우저 Web Speech API SpeechSynthesis 대체 함수
      const playViaSpeechSynthesis = () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.85;

            utterance.onstart = () => {
              this.notify(wordId);
            };
            utterance.onend = () => {
              this.notify(null);
              resolve();
            };
            utterance.onerror = () => {
              this.notify(null);
              // 실패하더라도 글자 수 기반 최소 시간 보장
              setTimeout(resolve, Math.max(1200, cleanText.length * 300));
            };

            window.speechSynthesis.speak(utterance);
            return;
          } catch (err) {
            console.warn('SpeechSynthesis 예외:', err);
          }
        }
        // TTS를 전혀 지원하지 않는 환경
        this.notify(wordId);
        setTimeout(() => {
          this.notify(null);
          resolve();
        }, Math.max(1500, cleanText.length * 300));
      };

      const encoded = encodeURIComponent(cleanText);
      const url = `https://translate.googleapis.com/translate_tts?client=gtx&ie=UTF-8&tl=zh-CN&q=${encoded}`;

      const audio = new Audio();
      try {
        (audio as any).referrerPolicy = 'no-referrer';
      } catch {
        // 지원 브라우저용
      }

      audio.preload = 'auto';
      audio.src = url;

      let hasResolved = false;
      const safeResolve = () => {
        if (hasResolved) return;
        hasResolved = true;
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        this.notify(null);
        resolve();
      };

      audio.onplay = () => {
        this.notify(wordId);
      };

      audio.onended = () => {
        safeResolve();
      };

      audio.onerror = () => {
        console.warn(`Google TTS 실패 (${cleanText}), Web Speech API로 대체합니다.`);
        this.stopCurrent();
        playViaSpeechSynthesis();
      };

      this.currentAudio = audio;

      try {
        audio.load();
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // 브라우저 자동재생 차단 또는 네트워크 에러 시 fallback
            if (!hasResolved) {
              this.stopCurrent();
              playViaSpeechSynthesis();
            }
          });
        }
      } catch {
        if (!hasResolved) {
          this.stopCurrent();
          playViaSpeechSynthesis();
        }
      }
    });
  }

  public getCurrentPlayingId(): string | null {
    return this.currentPlayingId;
  }
}

export const audioPlayer = new AudioPlayerService();

