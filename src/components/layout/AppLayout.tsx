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
      </main>

      {/* 하단 탭바: hideTabBar가 false일 때만 노출 */}
      {!hideTabBar && (
        <BottomTabBar activeTab={activeTab} onTabChange={onTabChange} />
      )}
    </div>
  );
};
