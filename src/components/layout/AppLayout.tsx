import React from 'react';
import { TabType } from '../../types';
import { Header } from './Header';
import { BottomTabBar } from './BottomTabBar';

interface AppLayoutProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  hideTabBar?: boolean;
  onHome: () => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  onTabChange,
  hideTabBar = false,
  onHome,
  children,
}) => {
  return (
    // 요구사항: max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full h-screen h-[100dvh] overflow-hidden relative bg-slate-50 flex flex-col
    <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full h-screen h-[100dvh] overflow-hidden relative bg-slate-50 flex flex-col">
      {/* 상단 고정 헤더 */}
      <Header onHome={onHome} />

      {/* 자식 콘텐츠 영역: 탭바가 숨겨졌을 때는 하단 패딩 제거 (pb-0), 탭바가 있을 때는 pb-24 */}
      <main className={`flex-1 overflow-y-auto w-full scroll-smooth flex flex-col ${
        hideTabBar ? 'pb-0' : 'pb-24'
      }`}>
        {children}

        {/* 출처 · 라이선스 표시 */}
        <footer className="mt-auto px-4 pt-6 pb-3 text-center text-[0.6875rem] md:text-sm leading-relaxed text-slate-400">
          단어 발음 음원:{' '}
          <a href="https://github.com/hugolpz/audio-cmn" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">audio-cmn</a>
          {' '}(녹음 Yue Tan,{' '}
          <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.ko" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">CC BY-SA</a>)
          <span className="mx-1.5">·</span>
          한자 글꼴:{' '}
          <a href="https://github.com/TrionesType/zhuque" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">朱雀仿宋 Zhuque Fangsong</a>
          {' '}(<a href="https://openfontlicense.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">SIL OFL 1.1</a>)
        </footer>
      </main>

      {/* 하단 탭바: hideTabBar가 false일 때만 노출 */}
      {!hideTabBar && (
        <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
};
