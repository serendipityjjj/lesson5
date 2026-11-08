import React, { useState } from 'react';
import { 
  X, 
  BookOpen, 
  MessageSquare, 
  PenTool,  
  Sparkles, 
  Volume2, 
  Mic, 
  Keyboard
} from 'lucide-react';

interface HelpGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpGuideModal: React.FC<HelpGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'vocab' | 'dialogue' | 'writing'>('vocab');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp">
        
        {/* 모달 상단 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm md:text-lg shadow-sm shadow-red-200">
              <Sparkles size={16} />
            </div>
            <div>
              <h2 className="text-base md:text-xl sm:text-lg font-bold text-slate-800">
                중국어교실 쉽게 배우는 사용법
              </h2>
              <p className="text-[0.6875rem] md:text-sm text-slate-500">단어, 말하기 대화, 작문 연습 완전 정복 가이드</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="grid grid-cols-3 p-2 bg-slate-100/80 gap-1 text-xs md:text-base font-bold border-b border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('vocab')}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'vocab'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen size={14} />
            <span className="text-[0.6875rem] md:text-sm sm:text-xs">1. 단어장</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dialogue')}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'dialogue'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={14} />
            <span className="text-[0.6875rem] md:text-sm sm:text-xs">2. 대화연습</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('writing')}
            className={`py-2 px-1 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
              activeTab === 'writing'
                ? 'bg-white text-red-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool size={14} />
            <span className="text-[0.6875rem] md:text-sm sm:text-xs">3. 작문연습</span>
          </button>

        </div>

        {/* 탭 본문 내용 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs md:text-base text-slate-700 leading-relaxed scroll-smooth">
          
          {/* 1. 단어장 안내 */}
          {activeTab === 'vocab' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 bg-red-50/70 border border-red-100 rounded-2xl">
                <span className="font-bold text-red-700 flex items-center gap-1.5 text-xs md:text-base mb-1">
                  <BookOpen size={15} /> 과별 단어 학습 & 한자 따라쓰기
                </span>
                <p className="text-slate-600 text-[0.6875rem] md:text-sm">
                  단원별 단어를 클릭하면 원어민 발음과 한자 획순을 바로 학습할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    <Volume2 size={13} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">원어민 발음 듣기</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">단어 카드의 스피커 아이콘을 누르면 정확한 중국어 발음을 무제한으로 들을 수 있습니다.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    ✍️
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">한자 바로 따라쓰기 (자동 활성화)</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">버튼을 따로 누르지 않아도 격자 칸 위에 손가락이나 마우스로 첫 획을 긋는 순간 바로 써집니다! [획순 보기]로 모범 획순을 볼 수 있습니다.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    📝
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">단어 4지선다 시험</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">본문 1, 본문 2, 심화 영역별로 시험을 볼 수 있으며, 결과 화면에서 틀린 단어를 확인할 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 대화 연습 안내 */}
          {activeTab === 'dialogue' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 bg-rose-50/70 border border-rose-100 rounded-2xl">
                <span className="font-bold text-rose-700 flex items-center gap-1.5 text-xs md:text-base mb-1">
                  <MessageSquare size={15} /> AI와 주고받는 롤플레잉 말하기
                </span>
                <p className="text-slate-600 text-[0.6875rem] md:text-sm">
                  실제 대화하듯 AI와 A/B 역할을 번갈아가며 마이크로 중국어를 말하는 연습입니다.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    1R
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">1라운드 & 2라운드 역할 교대</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">1라운드에서는 B 역할로, 2라운드에서는 A 역할로 번갈아 말하여 모든 대사를 완벽하게 마스터합니다.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    <Mic size={13} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">마이크 터치 후 말하기</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">마이크 버튼을 터치하고 중국어로 말하면 화면에 실시간 글자가 나타나며 즉시 발음이 채점됩니다. (동음이의어 他/她 완벽 지원)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    🎧
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">상대방 대화 완청 시스템</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">내가 말한 뒤 '정확한 발음입니다' 확인 후 3초 뒤에 상대방(AI)의 대답이 이어지며, 상대방 대답이 완전히 끝난 후 다음 턴으로 넘어갑니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. 작문 연습 안내 */}
          {activeTab === 'writing' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl">
                <span className="font-bold text-indigo-700 flex items-center gap-1.5 text-xs md:text-base mb-1">
                  <PenTool size={15} /> 3가지 작문 트레이닝 모드
                </span>
                <p className="text-slate-600 text-[0.6875rem] md:text-sm">
                  어순 감각을 기르는 단어 카드 조립부터 직접 병음 작성까지 단계별 훈련을 진행합니다.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    🧩
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">어순 배열 모드</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">아래의 단어 카드를 올바른 중국어 어순 순서대로 터치하여 상단 조립판에 완성합니다.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    <Keyboard size={13} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">직접 작문 (스마트 성조 자동 변환 ⭐️)</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5 leading-normal">
                      컴퓨터 키보드로 숫자만 치면 성조가 자동 변환됩니다!<br />
                      • <span className="font-mono font-bold text-blue-600">i2</span> ➔ <span className="font-mono font-bold text-blue-600">í</span>, <span className="font-mono font-bold text-blue-600">a3</span> ➔ <span className="font-mono font-bold text-blue-600">ǎ</span><br />
                      • <span className="font-mono font-bold text-blue-600">ni3</span> ➔ <span className="font-mono font-bold text-blue-600">nǐ</span>, <span className="font-mono font-bold text-blue-600">hao3</span> ➔ <span className="font-mono font-bold text-blue-600">hǎo</span><br />
                      (태블릿/스마트폰은 하단 가상 성조 자판 터치 가능)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 font-bold text-xs md:text-base">
                    🔄
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800">통합 연습 모드</h4>
                    <p className="text-slate-500 text-[0.6875rem] md:text-sm mt-0.5">1단계 어순 배열 성공 후 2단계 직접 작문까지 연속으로 마스터하는 종합 실전 모드입니다.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 모달 하단 닫기 버튼 */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-xs md:text-base rounded-xl shadow-md shadow-red-200 transition-all"
          >
            확인하고 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
