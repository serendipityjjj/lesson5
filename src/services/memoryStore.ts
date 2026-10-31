// 기록을 서버에 저장하지 않습니다. 앱을 켜 둔 동안만 메모리에 보관되고, 새로고침하면 사라집니다.
export const memory = {
  wrongVocabs: [] as any[],
  wrongWritings: [] as any[],
  completedDialogues: [] as any[],
};
