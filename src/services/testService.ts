import { TestRecord } from '../types';

export const testService = {
  async saveRecord(_record: Omit<TestRecord, 'id' | 'created_at'>): Promise<{ success: boolean }> {
    return { success: true };
  },
  async getRecordsByStudent(_studentId: string): Promise<TestRecord[]> {
    return [];
  },
};
