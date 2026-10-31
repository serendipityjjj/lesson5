import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { TabType } from './types';
import { AppLayout } from './components/layout/AppLayout';
import { VocabularyTab } from './components/tabs/VocabularyTab';
import { ConversationTab } from './components/tabs/ConversationTab';
import { WritingTab } from './components/tabs/WritingTab';
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  // Rules of Hooks 준수: 조기 return 이전에 모든 useState/훅을 최상단에 선언
  const { isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('vocabulary');
  const [isTestingActive, setIsTestingActive] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="max-w-lg md:max-w-3xl lg:max-w-5xl mx-auto w-full h-screen h-[100dvh] bg-slate-50 flex items-center justify-center flex-col gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        <span className="text-xs text-slate-500 font-medium">앱을 불러오는 중입니다...</span>
      </div>
    );
  }


  // 탭별 화면 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'vocabulary':
        return <VocabularyTab onTestingChange={setIsTestingActive} />;
      case 'conversation':
        return <ConversationTab />;
      case 'writing':
        return <WritingTab onTestingChange={setIsTestingActive} />;
      default:
        return <VocabularyTab onTestingChange={setIsTestingActive} />;
    }
  };

  return (
    <AppLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      hideTabBar={isTestingActive}
    >
      {renderTabContent()}
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
