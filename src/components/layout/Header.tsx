import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { HelpGuideModal } from '../common/HelpGuideModal';

export const Header: React.FC = () => {
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  return (
    <>
      <header className="h-14 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 flex items-center justify-between z-10 shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-400 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-red-200">
            中
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-1.5">
              중국어교실 <span className="text-[11px] font-medium text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">생활중국어</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 어플 사용법 버튼 */}
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-all active:scale-95 shadow-2xs"
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

