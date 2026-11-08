import React, { useState } from 'react';
import { Lesson, VocabularyWord, TestPart } from '../../types';
import { WordCard } from './WordCard';
import { TestPartSelectModal } from '../test/TestPartSelectModal';
import { ArrowLeft, Search, BookOpen, Trophy } from 'lucide-react';

interface WordListProps {
  lesson: Lesson;
  playingWordId: string | null;
  studiedWordIds?: Set<string>;
  onBack: () => void;
  onPlayAudio: (word: VocabularyWord, e: React.MouseEvent) => void;
  onSelectWord: (word: VocabularyWord) => void;
  onStartTest: (part: TestPart) => void;
}

export const WordList: React.FC<WordListProps> = ({
  lesson,
  playingWordId,
  studiedWordIds = new Set(),
  onBack,
  onPlayAudio,
  onSelectWord,
  onStartTest,
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('전체');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isPartModalOpen, setIsPartModalOpen] = useState<boolean>(false);

  // 전체 단어 추출
  const allWords = lesson.sections.flatMap((s) => s.words);

  // 필터링 적용
  const filteredSections = lesson.sections
    .map((section) => {
      if (selectedSection !== '전체' && section.title !== selectedSection) {
        return null;
      }
      const matchedWords = section.words.filter((w) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          w.hanzi.toLowerCase().includes(q) ||
          w.pinyin.toLowerCase().includes(q) ||
          w.meaning.toLowerCase().includes(q)
        );
      });
      return {
        ...section,
        words: matchedWords,
      };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null && s.words.length > 0);

  return (
    <div className="w-full flex flex-col p-4 space-y-4 animate-fadeIn relative">
      {/* 영역 선택 모달 */}
      {isPartModalOpen && (
        <TestPartSelectModal
          lesson={lesson}
          onSelectPart={(part) => {
            setIsPartModalOpen(false);
            onStartTest(part);
          }}
          onClose={() => setIsPartModalOpen(false)}
        />
      )}

      {/* 상단 네비게이션 & 뒤로가기 / 단어 테스트 버튼 */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200/80 text-slate-700 hover:text-red-600 hover:bg-red-50 text-xs md:text-base font-bold transition-all shadow-sm active:scale-95"
        >
          <ArrowLeft size={16} />
          <span>과 목록</span>
        </button>

        {/* 0. 진입: 단어 테스트 시작 버튼 */}
        <button
          type="button"
          onClick={() => setIsPartModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white text-xs md:text-base font-bold transition-all shadow-md shadow-red-200 active:scale-95"
        >
          <Trophy size={15} />
          <span>단어 테스트 시작</span>
        </button>
      </div>

      {/* 과 타이틀 헤더 */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl font-black text-slate-800 font-hanzi tracking-wide truncate">
              {lesson.titleZh}
            </h2>
            <p className="text-xs md:text-base text-slate-500 mt-0.5 font-medium">
              {lesson.titleKo} ({lesson.subtitle})
            </p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-xs md:text-base shrink-0 whitespace-nowrap shadow-2xs">
            {allWords.length}단어
          </div>
        </div>
      </div>

      {/* 검색바 */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="단어, 병음, 뜻 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs md:text-base text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all shadow-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs md:text-base font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* 섹션 필터 칩 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs md:text-base">
        <button
          type="button"
          onClick={() => setSelectedSection('전체')}
          className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
            selectedSection === '전체'
              ? 'bg-red-600 text-white shadow-sm shadow-red-200'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          전체 ({allWords.length})
        </button>
        {lesson.sections.map((section) => (
          <button
            key={section.title}
            type="button"
            onClick={() => setSelectedSection(section.title)}
            className={`px-3 py-1.5 rounded-full font-bold transition-all shrink-0 ${
              selectedSection === section.title
                ? 'bg-red-600 text-white shadow-sm shadow-red-200'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {section.title} ({section.words.length})
          </button>
        ))}
      </div>

      {/* 단어 리스트 (섹션별 묶음) */}
      {filteredSections.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center my-6">
          <BookOpen size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-sm md:text-lg font-bold text-slate-600">검색 결과가 없습니다.</p>
          <p className="text-xs md:text-base text-slate-400 mt-1">다른 검색어를 입력해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-5 pb-6">
          {filteredSections.map((section) => (
            <div key={section.title} className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs md:text-base font-black text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  {section.title}
                </span>
                <span className="text-[0.6875rem] md:text-sm text-slate-400 font-medium">
                  {section.words.length}개 단어
                </span>
              </div>

              <div className="space-y-2">
                {section.words.map((word) => (
                  <WordCard
                    key={word.id}
                    word={word}
                    isPlaying={playingWordId === word.id}
                    isStudied={studiedWordIds.has(word.id)}
                    onPlayAudio={onPlayAudio}
                    onClickWord={onSelectWord}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
