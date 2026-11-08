import React from 'react';
import { TabType } from '../../types';
import { BookOpen, MessageSquareText, PenTool } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

interface TabItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { id: 'vocabulary', label: '단어장', icon: BookOpen },
  { id: 'conversation', label: '대화 연습', icon: MessageSquareText },
  { id: 'writing', label: '작문 연습', icon: PenTool },
];

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ activeTab, onTabChange }) => {
  return (
    <nav 
      aria-label="하단 네비게이션"
      className="absolute bottom-0 left-0 right-0 h-20 bg-white z-10 border-t border-slate-200/80 px-2 flex items-center justify-around select-none"
    >
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-colors duration-150 active:scale-95 ${
              isActive
                ? 'text-red-600 font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-red-50' : 'bg-transparent'}`}>
              <Icon size={22} strokeWidth={isActive ? 2.3 : 1.8} />
            </div>
            <span className={`text-[0.6875rem] md:text-sm mt-0.5 tracking-tight ${isActive ? 'text-red-600' : 'text-slate-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
