import React, { createContext, useContext } from 'react';
import { Student } from '../types';

// 로그인 기능 없음: 모든 사용자를 '학생' 한 명으로 취급합니다.
const GUEST: Student = { student_id: 'guest', name: '학생' };

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  student: Student;
}

const value: AuthContextType = { isAuthenticated: true, isLoading: false, student: GUEST };
const AuthContext = createContext<AuthContextType>(value);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
);

export const useAuth = () => useContext(AuthContext);
