import React from 'react';
import { Lesson, TestPart } from '../../types';
import { HelpCircle, Sparkles, BookOpen, Layers, X } from 'lucide-react';

interface TestPartSelectModalProps {
  lesson: Lesson;
  onSelectPart: (part: TestPart) => void;
  onClose: () => void;
}

export const TestPartSelectModal: React.FC<TestPartSelectModalProps> = ({
  lesson,
  onSelectPart,
  onClose,
}) => {
  const totalWordsCount = lesson.sections.reduce((acc, s) => acc + s.words.length, 0);

  const PART_OPTIONS: { id: TestPart; title: string; subtitle: string; count: number; color: string }[] = [
    {
      id: 'all',
      title: '단원 전체',
      subtitle: '본문 1 + 본문 2 + 심화 종합 평가',
      count: totalWordsCount,
      color: 'bg-red-50 text-red-600 border-red-200',
    },
    ...lesson.sections.map((sec, idx) => ({
      id: String(idx) as TestPart,
      title: sec.title,
      subtitle: `${sec.words.map((w) => w.hanzi).slice(0, 4).join(', ')} 등`,
      count: sec.words.length,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
    })),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 relative flex flex-col animate-scaleUp">
        {/* 닫기 버튼 */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 헤더 */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-red-200">
            <HelpCircle size={26} />
          </div>
          <h3 className="text-lg md:text-2xl font-black text-slate-800">
            단어 테스트 영역 선택
          </h3>
          <p className="text-xs md:text-base text-slate-500 mt-0.5">
            제{lesson.lessonNumber}과 ({lesson.titleZh})에서 응시할 범위를 선택하세요
          </p>
        </div>

        {/* 영역 선택 버튼 리스트 */}
        <div className="space-y-2.5">
          {PART_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectPart(opt.id)}
              className="w-full text-left p-3.5 rounded-2xl border bg-white hover:bg-slate-50 active:scale-[0.99] transition-all flex items-center justify-between group shadow-sm hover:border-red-300"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs md:text-base font-bold border ${opt.color}`}>
                  {opt.id === 'all' ? <Sparkles size={16} /> : <Layers size={16} />}
                </div>
                <div>
                  <h4 className="text-sm md:text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors">
                    {opt.title}
                  </h4>
                  <p className="text-[0.6875rem] md:text-sm text-slate-400 truncate max-w-[170px]">
                    {opt.subtitle}
                  </p>
                </div>
              </div>

              <span className="text-xs md:text-base font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg shrink-0">
                10문제
              </span>
            </button>
          ))}
        </div>

        {/* 하단 팁 */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center gap-1.5 text-[0.6875rem] md:text-sm text-slate-400 justify-center">
          <BookOpen size={13} />
          <span>100점 만점 감점식 / 3대 유형 10문제 고정</span>
        </div>
      </div>
    </div>
  );
};
