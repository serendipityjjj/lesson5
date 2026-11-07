import React, { useState } from 'react';
import { HelpCircle, Home } from 'lucide-react';
import { HelpGuideModal } from '../common/HelpGuideModal';
import logo from '../../assets/logo.png';

export const Header: React.FC<{ onHome: () => void }> = ({ onHome }) => {
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  return (
    <>
      <header className="h-14 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 flex items-center justify-between z-10 shrink-0 select-none">
        <button type="button" onClick={onHome} title="처음 화면으로" className="flex items-center gap-2 active:scale-95 transition-transform">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white font-bold text-sm md:text-lg shadow-sm shadow-red-200">
            中
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold text-slate-800 leading-tight flex items-center gap-1.5">
              중국어교실 <span className="text-[0.6875rem] md:text-sm font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">생활중국어</span>
              <img src={logo} alt="NE능률" className="h-5 md:h-6 w-auto ml-1" />
            </h1>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* 홈 버튼: 연습 중에도 언제든 처음 화면으로 */}
          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-1 text-xs md:text-base font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1.5 rounded-xl transition-all active:scale-95 shadow-sm"
            title="처음 화면으로"
          >
            <Home size={15} />
            <span>홈</span>
          </button>

          {/* 어플 사용법 버튼 */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 text-xs md:text-base font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all active:scale-95 shadow-2xs"
            title="어플 사용법 가이드"
          >
            <HelpCircle size={15} className="text-red-500" />
            <span>사용법</span>
          </button>

        </div>
      </header>

      {/* 사용법 가이드 모달 */}
      <HelpGuideModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </>
  );
};

