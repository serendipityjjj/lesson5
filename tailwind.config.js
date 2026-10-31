/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          '"Helvetica Neue"',
          '"Segoe UI"',
          '"Apple SD Gothic Neo"',
          '"Noto Sans KR"',
          '"Malgun Gothic"',
          'sans-serif',
        ],
        // 간화자 폰트: FangSong 계열 완전 통일
        hanzi: [
          'FangSong',
          '"STFangsong"',
          '"FangSong_GB2312"',
          '"仿宋"',
          '"SimSun"',
          '"Songti SC"',
          'serif',
        ],
        // 한어병음 폰트: Arial 계열 통일
        pinyin: [
          'Arial',
          '"Helvetica Neue"',
          'Helvetica',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
