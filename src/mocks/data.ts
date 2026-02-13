import { User, Attendance, ActivityLog, SystemSettings } from '@/types';

// Mock 사용자 데이터
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'superadmin@bdgen.co.kr',
    name: '최고관리자',
    employeeId: 'EMP001',
    department: '경영지원팀',
    position: 'CTO',
    level: 1,
    isActive: true,
    phone: '010-1234-5678',
    joinDate: '2020-01-01',
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'admin@bdgen.co.kr',
    name: '일반관리자',
    employeeId: 'EMP002',
    department: '인사팀',
    position: '인사팀장',
    level: 2,
    isActive: true,
    phone: '010-2345-6789',
    joinDate: '2021-03-15',
    createdAt: '2021-03-15T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    email: 'user1@bdgen.co.kr',
    name: '김철수',
    employeeId: 'EMP003',
    department: '개발팀',
    position: '시니어 개발자',
    level: 3,
    isActive: true,
    phone: '010-3456-7890',
    joinDate: '2022-05-10',
    createdAt: '2022-05-10T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'user2@bdgen.co.kr',
    name: '이영희',
    employeeId: 'EMP004',
    department: '개발팀',
    position: '주니어 개발자',
    level: 3,
    isActive: true,
    phone: '010-4567-8901',
    joinDate: '2023-01-20',
    createdAt: '2023-01-20T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    email: 'user3@bdgen.co.kr',
    name: '박민수',
    employeeId: 'EMP005',
    department: '디자인팀',
    position: '디자이너',
    level: 3,
    isActive: true,
    phone: '010-5678-9012',
    joinDate: '2022-08-15',
    createdAt: '2022-08-15T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '6',
    email: 'user4@bdgen.co.kr',
    name: '정수진',
    employeeId: 'EMP006',
    department: '인사팀',
    position: '인사담당',
    level: 3,
    isActive: true,
    phone: '010-6789-0123',
    joinDate: '2023-03-01',
    createdAt: '2023-03-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '7',
    email: 'user5@bdgen.co.kr',
    name: '최동욱',
    employeeId: 'EMP007',
    department: '개발팀',
    position: '개발자',
    level: 3,
    isActive: false,
    phone: '010-7890-1234',
    joinDate: '2021-11-10',
    createdAt: '2021-11-10T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

// Mock 근태 데이터
const today = new Date();
const generateAttendance = (employeeId: string, daysAgo: number): Attendance => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  const dateStr = date.toISOString().split('T')[0];
  
  const checkInHour = 8 + Math.floor(Math.random() * 2); // 8-9시
  const checkInMin = Math.floor(Math.random() * 60);
  const checkOutHour = 17 + Math.floor(Math.random() * 3); // 17-19시
  const checkOutMin = Math.floor(Math.random() * 60);
  
  const checkIn = `${String(checkInHour).padStart(2, '0')}:${String(checkInMin).padStart(2, '0')}`;
  const checkOut = `${String(checkOutHour).padStart(2, '0')}:${String(checkOutMin).padStart(2, '0')}`;
  
  const workHours = checkOutHour - checkInHour - 1 + (checkOutMin - checkInMin) / 60;
  
  let status: Attendance['status'] = 'normal';
  if (checkInHour > 9 || (checkInHour === 9 && checkInMin > 0)) {
    status = 'late';
  }
  
  return {
    id: `att_${employeeId}_${dateStr}`,
    employeeId,
    date: dateStr,
    checkIn,
    checkOut,
    status,
    workHours: Math.round(workHours * 10) / 10,
    createdAt: `${dateStr}T00:00:00Z`,
    updatedAt: `${dateStr}T00:00:00Z`,
  };
};

export const mockAttendances: Attendance[] = [];
// 최근 60일간의 근태 데이터 생성
for (let i = 0; i < 60; i++) {
  mockUsers.forEach((user) => {
    if (user.level === 3 && user.isActive) {
      mockAttendances.push(generateAttendance(user.employeeId, i));
    }
  });
}

// Mock 활동 로그
export const mockActivityLogs: ActivityLog[] = [
  {
    id: 'log1',
    userId: '1',
    userName: '최고관리자',
    action: '로그인',
    targetType: 'auth',
    ipAddress: '192.168.1.100',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'log2',
    userId: '2',
    userName: '일반관리자',
    action: '직원 정보 수정',
    targetType: 'employee',
    targetId: '3',
    details: { field: 'phone', oldValue: '010-0000-0000', newValue: '010-3456-7890' },
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'log3',
    userId: '1',
    userName: '최고관리자',
    action: '근태 데이터 수정',
    targetType: 'attendance',
    targetId: 'att_EMP003_2024-01-15',
    details: { reason: '시스템 오류로 인한 수정' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 'log4',
    userId: '2',
    userName: '일반관리자',
    action: '리포트 생성',
    targetType: 'report',
    targetId: 'report1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'log5',
    userId: '1',
    userName: '최고관리자',
    action: '시스템 설정 변경',
    targetType: 'system',
    details: { setting: 'workStartTime', value: '09:00' },
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];

// Mock 시스템 설정
export const mockSystemSettings: SystemSettings = {
  workPolicy: {
    workStartTime: '09:00',
    workEndTime: '18:00',
    lunchStartTime: '12:00',
    lunchEndTime: '13:00',
    lateThreshold: 10,
  },
  blockchain: {
    enabled: true,
    endpoint: 'https://blockchain.example.com/api',
    apiKey: 'mock-api-key',
  },
  caps: {
    enabled: true,
    syncInterval: 60,
    lastSyncAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  notifications: {
    email: {
      enabled: true,
      dailySummary: true,
      weeklyReport: true,
      securityAlerts: true,
    },
    sms: {
      enabled: false,
      securityAlerts: true,
    },
  },
};

// Mock 비밀번호 (실제로는 해시되어야 함)
export const mockPasswords: Record<string, string> = {
  'superadmin@bdgen.co.kr': 'pass1234',
  'admin@bdgen.co.kr': 'pass1234',
};







