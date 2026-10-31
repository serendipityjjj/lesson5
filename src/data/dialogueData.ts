import { DialogueItem } from '../types';

export const DIALOGUES_DATA: Record<number, DialogueItem[]> = {
  // [제5과: 今天几月几号]
  5: [
    {
      id: 'd5-main-1',
      lessonId: 5,
      type: 'main',
      title: '본문 1',
      preview: '今天几月几号？ 五月十号。',
      lines: [
        { speaker: 'A', hanzi: '今天几月几号？', pinyin: 'Jīntiān jǐ yuè jǐ hào?', meaning: '오늘 몇 월 며칠이니?' },
        { speaker: 'B', hanzi: '五月十号。', pinyin: 'Wǔ yuè shí hào.', meaning: '5월 10일이야.' },
        { speaker: 'A', hanzi: '星期几？', pinyin: 'Xīngqī jǐ?', meaning: '무슨 요일이니?' },
        { speaker: 'B', hanzi: '星期四。', pinyin: 'Xīngqīsì.', meaning: '목요일이야.' },
      ],
    },
    {
      id: 'd5-app-1',
      lessonId: 5,
      type: 'applied',
      title: '응용 1',
      preview: '你的生日几月几号？ 六月八号。',
      lines: [
        { speaker: 'A', hanzi: '你的生日几月几号？', pinyin: 'Nǐ de shēngrì jǐ yuè jǐ hào?', meaning: '네 생일은 몇 월 며칠이니?' },
        { speaker: 'B', hanzi: '六月八号。', pinyin: 'Liù yuè bā hào.', meaning: '6월 8일이야.' },
      ],
    },
    {
      id: 'd5-app-2',
      lessonId: 5,
      type: 'applied',
      title: '응용 2',
      preview: '圣诞节几月几号？ 十二月二十五号。',
      lines: [
        { speaker: 'A', hanzi: '圣诞节几月几号？', pinyin: 'Shèngdànjié jǐ yuè jǐ hào?', meaning: '크리스마스는 몇 월 며칠이니?' },
        { speaker: 'B', hanzi: '十二月二十五号。', pinyin: "Shí'èr yuè èrshíwǔ hào.", meaning: '12월 25일이야.' },
      ],
    },
    {
      id: 'd5-app-3',
      lessonId: 5,
      type: 'applied',
      title: '응용 3',
      preview: '昨天几月几号？ 五月九号。',
      lines: [
        { speaker: 'A', hanzi: '昨天几月几号？', pinyin: 'Zuótiān jǐ yuè jǐ hào?', meaning: '어제는 몇 월 며칠이었니?' },
        { speaker: 'B', hanzi: '五月九号。', pinyin: 'Wǔ yuè jiǔ hào.', meaning: '5월 9일이었어.' },
        { speaker: 'A', hanzi: '星期几？', pinyin: 'Xīngqī jǐ?', meaning: '무슨 요일이었니?' },
        { speaker: 'B', hanzi: '星期三。', pinyin: 'Xīngqīsān.', meaning: '수요일이었어.' },
      ],
    },
    {
      id: 'd5-app-4',
      lessonId: 5,
      type: 'applied',
      title: '응용 4',
      preview: '明天几月几号？ 五月十一号。',
      lines: [
        { speaker: 'A', hanzi: '明天几月几号？', pinyin: 'Míngtiān jǐ yuè jǐ hào?', meaning: '내일은 몇 월 며칠이니?' },
        { speaker: 'B', hanzi: '五月十一号。', pinyin: 'Wǔ yuè shíyī hào.', meaning: '5월 11일이야.' },
        { speaker: 'A', hanzi: '星期几？', pinyin: 'Xīngqī jǐ?', meaning: '무슨 요일이니?' },
        { speaker: 'B', hanzi: '星期五。', pinyin: 'Xīngqīwǔ.', meaning: '금요일이야.' },
      ],
    },
    {
      id: 'd5-main-2',
      lessonId: 5,
      type: 'main',
      title: '본문 2',
      preview: '现在几点？ 两点半。',
      lines: [
        { speaker: 'A', hanzi: '现在几点？', pinyin: 'Xiànzài jǐ diǎn?', meaning: '지금 몇 시야?' },
        { speaker: 'B', hanzi: '两点半。', pinyin: 'Liǎng diǎn bàn.', meaning: '2시 반이야.' },
        { speaker: 'A', hanzi: '几点下课？', pinyin: 'Jǐ diǎn xiàkè?', meaning: '몇 시에 수업 끝나?' },
        { speaker: 'B', hanzi: '四点十分。', pinyin: 'Sì diǎn shí fēn.', meaning: '4시 10분이야.' },
      ],
    },
    {
      id: 'd5-app-5',
      lessonId: 5,
      type: 'applied',
      title: '응용 5',
      preview: '几点起床？ 七点二十。',
      lines: [
        { speaker: 'A', hanzi: '几点起床？', pinyin: 'Jǐ diǎn qǐchuáng?', meaning: '몇 시에 일어나?' },
        { speaker: 'B', hanzi: '七点二十。', pinyin: 'Qī diǎn èrshí.', meaning: '7시 20분.' },
      ],
    },
    {
      id: 'd5-app-6',
      lessonId: 5,
      type: 'applied',
      title: '응용 6',
      preview: '几点回家？ 五点四十。',
      lines: [
        { speaker: 'A', hanzi: '几点回家？', pinyin: 'Jǐ diǎn huí jiā?', meaning: '몇 시에 집에 가?' },
        { speaker: 'B', hanzi: '五点四十。', pinyin: 'Wǔ diǎn sìshí.', meaning: '5시 40분.' },
      ],
    },
    {
      id: 'd5-app-7',
      lessonId: 5,
      type: 'applied',
      title: '응용 7',
      preview: '几点睡觉？ 十点五十。',
      lines: [
        { speaker: 'A', hanzi: '几点睡觉？', pinyin: 'Jǐ diǎn shuìjiào?', meaning: '몇 시에 자?' },
        { speaker: 'B', hanzi: '十点五十。', pinyin: 'Shí diǎn wǔshí.', meaning: '10시 50분.' },
      ],
    },
    {
      id: 'd5-app-8',
      lessonId: 5,
      type: 'applied',
      title: '응용 8',
      preview: '几点吃饭？ 我十二点吃饭。',
      lines: [
        { speaker: 'A', hanzi: '几点吃饭？', pinyin: 'Jǐ diǎn chī fàn?', meaning: '몇 시에 밥 먹어?' },
        { speaker: 'B', hanzi: '我十二点吃饭。', pinyin: 'Wǒ shí\'èr diǎn chī fàn.', meaning: '나 12시에 밥 먹어.' },
      ],
    },
    {
      id: 'd5-app-9',
      lessonId: 5,
      type: 'applied',
      title: '응용 9',
      preview: '你几点起床？ 我七点起床。',
      lines: [
        { speaker: 'A', hanzi: '你几点起床？', pinyin: 'Nǐ jǐ diǎn qǐchuáng?', meaning: '너 몇 시에 일어나니?' },
        { speaker: 'B', hanzi: '我七点起床。', pinyin: 'Wǒ qī diǎn qǐchuáng.', meaning: '나 7시에 일어나.' },
      ],
    },
  ],
};
