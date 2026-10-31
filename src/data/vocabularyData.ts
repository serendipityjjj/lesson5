import { Lesson } from '../types';

export const LESSONS_DATA: Lesson[] = [
  {
    id: 5,
    lessonNumber: 5,
    titleZh: '今天几月几号',
    titleKo: '오늘 몇 월 며칠이야',
    subtitle: '날짜, 요일 및 시간 표현',
    description: '오늘의 날짜, 요일, 현재 시간을 묻고 하루 일과 표현하기',
    sections: [
      {
        title: '본문 1',
        words: [
          { id: '5-1-1', lessonId: 5, sectionTitle: '본문 1', hanzi: '今天', pinyin: 'jīntiān', meaning: '오늘' },
          { id: '5-1-2', lessonId: 5, sectionTitle: '본문 1', hanzi: '几', pinyin: 'jǐ', meaning: '몇' },
          { id: '5-1-3', lessonId: 5, sectionTitle: '본문 1', hanzi: '月', pinyin: 'yuè', meaning: '월, 달' },
          { id: '5-1-4', lessonId: 5, sectionTitle: '본문 1', hanzi: '号', pinyin: 'hào', meaning: '일, 날' },
          { id: '5-1-5', lessonId: 5, sectionTitle: '본문 1', hanzi: '星期', pinyin: 'xīngqī', meaning: '요일' },
        ],
      },
      {
        title: '본문 2',
        words: [
          { id: '5-2-1', lessonId: 5, sectionTitle: '본문 2', hanzi: '现在', pinyin: 'xiànzài', meaning: '현재, 지금' },
          { id: '5-2-2', lessonId: 5, sectionTitle: '본문 2', hanzi: '点', pinyin: 'diǎn', meaning: '시' },
          { id: '5-2-3', lessonId: 5, sectionTitle: '본문 2', hanzi: '两', pinyin: 'liǎng', meaning: '2, 둘' },
          { id: '5-2-4', lessonId: 5, sectionTitle: '본문 2', hanzi: '半', pinyin: 'bàn', meaning: '반 (30분)' },
          { id: '5-2-5', lessonId: 5, sectionTitle: '본문 2', hanzi: '下课', pinyin: 'xiàkè', meaning: '수업을 마치다' },
          { id: '5-2-6', lessonId: 5, sectionTitle: '본문 2', hanzi: '分', pinyin: 'fēn', meaning: '분' },
        ],
      },
      {
        title: '심화 (응용 대화문 및 표현)',
        words: [
          { id: '5-3-1', lessonId: 5, sectionTitle: '심화', hanzi: '天', pinyin: 'tiān', meaning: '날, 일' },
          { id: '5-3-2', lessonId: 5, sectionTitle: '심화', hanzi: '日', pinyin: 'rì', meaning: '날, 일' },
          { id: '5-3-3', lessonId: 5, sectionTitle: '심화', hanzi: '昨天', pinyin: 'zuótiān', meaning: '어제' },
          { id: '5-3-4', lessonId: 5, sectionTitle: '심화', hanzi: '明天', pinyin: 'míngtiān', meaning: '내일' },
          { id: '5-3-5', lessonId: 5, sectionTitle: '심화', hanzi: '的', pinyin: 'de', meaning: '~의' },
          { id: '5-3-6', lessonId: 5, sectionTitle: '심화', hanzi: '生日', pinyin: 'shēngrì', meaning: '생일' },
          { id: '5-3-7', lessonId: 5, sectionTitle: '심화', hanzi: '圣诞节', pinyin: 'Shèngdànjié', meaning: '성탄절' },
          { id: '5-3-8', lessonId: 5, sectionTitle: '심화', hanzi: '刻', pinyin: 'kè', meaning: '15분' },
          { id: '5-3-9', lessonId: 5, sectionTitle: '심화', hanzi: '起床', pinyin: 'qǐchuáng', meaning: '일어나다' },
          { id: '5-3-10', lessonId: 5, sectionTitle: '심화', hanzi: '回', pinyin: 'huí', meaning: '돌아가다' },
          { id: '5-3-11', lessonId: 5, sectionTitle: '심화', hanzi: '家', pinyin: 'jiā', meaning: '집' },
          { id: '5-3-12', lessonId: 5, sectionTitle: '심화', hanzi: '睡觉', pinyin: 'shuìjiào', meaning: '잠을 자다' },
          { id: '5-3-13', lessonId: 5, sectionTitle: '심화', hanzi: '上课', pinyin: 'shàngkè', meaning: '수업을 시작하다' },
          { id: '5-3-14', lessonId: 5, sectionTitle: '심화', hanzi: '吃', pinyin: 'chī', meaning: '먹다' },
          { id: '5-3-15', lessonId: 5, sectionTitle: '심화', hanzi: '饭', pinyin: 'fàn', meaning: '밥' },
        ],
      },
    ],
  },
];
