import { mockStore } from '@/mocks';
import type {
  User,
  Attendance,
  ActivityLog,
  SystemSettings,
  LoginRequest,
  LoginResponse,
  DashboardStats,
  Report,
} from '@/types';

const USE_MOCK = true; // 환경변수로 제어 가능

// API 응답 시뮬레이션 지연
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(200 + Math.random() * 300);

// Auth API
export const authApi = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await randomDelay();
    
    if (USE_MOCK) {
      const user = mockStore.getUserByEmail(credentials.email);
      if (!user || !mockStore.verifyPassword(credentials.email, credentials.password)) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
      if (!user.isActive) {
        throw new Error('비활성화된 계정입니다.');
      }
      
      const token = `mock_token_${user.id}_${Date.now()}`;
      mockStore.addActivityLog({
        userId: user.id,
        userName: user.name,
        action: '로그인',
        targetType: 'auth',
        ipAddress: '192.168.1.100',
      });
      
      return { token, user };
    }
    
    // 실제 API 호출 (추후 구현)
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async logout(): Promise<void> {
    await randomDelay();
    // 토큰 무효화 로직
  },
};

// Users API
export const usersApi = {
  async getUsers(filters?: {
    department?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<User[]> {
    await randomDelay();
    
    if (USE_MOCK) {
      let users = mockStore.getUsers();
      
      if (filters?.department) {
        users = users.filter(u => u.department === filters.department);
      }
      if (filters?.isActive !== undefined) {
        users = users.filter(u => u.isActive === filters.isActive);
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        users = users.filter(u =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.employeeId.toLowerCase().includes(searchLower)
        );
      }
      
      return users;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async getUserById(id: string): Promise<User> {
    await randomDelay();
    
    if (USE_MOCK) {
      const user = mockStore.getUserById(id);
      if (!user) throw new Error('사용자를 찾을 수 없습니다.');
      return user;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    await randomDelay();
    
    if (USE_MOCK) {
      // 중복 체크
      const existingEmail = mockStore.getUserByEmail(userData.email);
      if (existingEmail) {
        throw new Error('이미 등록된 이메일입니다.');
      }
      
      const existingEmployeeId = mockStore.getUsers().find(u => u.employeeId === userData.employeeId);
      if (existingEmployeeId) {
        throw new Error('이미 등록된 사번입니다.');
      }
      
      const newUser = mockStore.createUser(userData);
      mockStore.addActivityLog({
        userId: newUser.id,
        userName: newUser.name,
        action: '직원 초대',
        targetType: 'employee',
        targetId: newUser.id,
      });
      
      return newUser;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await randomDelay();
    
    if (USE_MOCK) {
      const updated = mockStore.updateUser(id, updates);
      if (!updated) throw new Error('사용자를 찾을 수 없습니다.');
      
      mockStore.addActivityLog({
        userId: id,
        userName: updated.name,
        action: '직원 정보 수정',
        targetType: 'employee',
        targetId: id,
        details: updates,
      });
      
      return updated;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async deleteUser(id: string): Promise<void> {
    await randomDelay();
    
    if (USE_MOCK) {
      const user = mockStore.getUserById(id);
      if (!user) throw new Error('사용자를 찾을 수 없습니다.');
      
      mockStore.deleteUser(id);
      mockStore.addActivityLog({
        userId: id,
        userName: user.name,
        action: '직원 비활성화',
        targetType: 'employee',
        targetId: id,
      });
    } else {
      throw new Error('실제 API가 구현되지 않았습니다.');
    }
  },

  async resetPassword(id: string): Promise<void> {
    await randomDelay();
    
    if (USE_MOCK) {
      const user = mockStore.getUserById(id);
      if (!user) throw new Error('사용자를 찾을 수 없습니다.');
      
      mockStore.addActivityLog({
        userId: id,
        userName: user.name,
        action: '비밀번호 초기화',
        targetType: 'employee',
        targetId: id,
      });
    } else {
      throw new Error('실제 API가 구현되지 않았습니다.');
    }
  },
};

// Attendances API
export const attendancesApi = {
  async getAttendances(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: Attendance['status'];
    search?: string;
  }): Promise<Attendance[]> {
    await randomDelay();
    
    if (USE_MOCK) {
      let attendances = mockStore.getAttendances({
        employeeId: filters?.employeeId,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
        status: filters?.status,
      });
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        const users = mockStore.getUsers();
        attendances = attendances.filter(att => {
          const user = users.find(u => u.employeeId === att.employeeId);
          return user?.name.toLowerCase().includes(searchLower) ||
                 user?.employeeId.toLowerCase().includes(searchLower);
        });
      }
      
      return attendances;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async updateAttendance(
    id: string,
    updates: Partial<Attendance> & { modificationReason: string; modifiedBy: string }
  ): Promise<Attendance> {
    await randomDelay();
    
    if (USE_MOCK) {
      const updated = mockStore.updateAttendance(id, updates);
      if (!updated) throw new Error('근태 데이터를 찾을 수 없습니다.');
      
      const user = mockStore.getUserById(updates.modifiedBy);
      mockStore.addActivityLog({
        userId: updates.modifiedBy,
        userName: user?.name || 'Unknown',
        action: '근태 데이터 수정',
        targetType: 'attendance',
        targetId: id,
        details: { reason: updates.modificationReason },
      });
      
      return updated;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async uploadCaps(file: File, mode: 'append' | 'overwrite' | 'replace'): Promise<{ count: number }> {
    await randomDelay();
    
    if (USE_MOCK) {
      // 파일 파싱 시뮬레이션
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const count = Math.min(lines.length - 1, 100); // 헤더 제외
      
      // 실제로는 CSV 파싱하여 attendances에 추가/업데이트
      // 여기서는 시뮬레이션만
      
      mockStore.addActivityLog({
        userId: '1', // Super Admin
        userName: '최고관리자',
        action: 'CAPS 데이터 업로드',
        targetType: 'system',
        details: { mode, count },
      });
      
      return { count };
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },
};

// Dashboard API
export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    await randomDelay();
    
    if (USE_MOCK) {
      const today = new Date().toISOString().split('T')[0];
      const todayAttendances = mockStore.getAttendances({
        startDate: today,
        endDate: today,
      });
      
      const users = mockStore.getUsers().filter(u => u.level === 3 && u.isActive);
      const total = users.length;
      const checkedIn = todayAttendances.filter(a => a.checkIn).length;
      const late = todayAttendances.filter(a => a.status === 'late').length;
      const absent = total - checkedIn;
      const onLeave = todayAttendances.filter(a => a.status === 'leave' || a.status === 'half_leave').length;
      
      // 부서별 통계
      const departmentMap = new Map<string, { total: number; checkedIn: number }>();
      users.forEach(user => {
        const dept = user.department;
        const current = departmentMap.get(dept) || { total: 0, checkedIn: 0 };
        current.total++;
        if (todayAttendances.some(a => a.employeeId === user.employeeId && a.checkIn)) {
          current.checkedIn++;
        }
        departmentMap.set(dept, current);
      });
      
      const departmentStats = Array.from(departmentMap.entries()).map(([department, stats]) => ({
        department,
        attendanceRate: stats.total > 0 ? (stats.checkedIn / stats.total) * 100 : 0,
        totalEmployees: stats.total,
        checkedIn: stats.checkedIn,
      }));
      
      // 이상 근태
      const abnormalAttendances = todayAttendances
        .filter(a => a.status === 'late' || !a.checkIn)
        .slice(0, 5)
        .map(a => {
          const user = users.find(u => u.employeeId === a.employeeId);
          return {
            employeeId: a.employeeId,
            employeeName: user?.name || 'Unknown',
            date: a.date,
            issue: a.status === 'late' ? '지각' : '미출근',
          };
        });
      
      return {
        todayAttendance: {
          total,
          checkedIn,
          late,
          absent,
          onLeave,
        },
        attendanceRate: {
          today: total > 0 ? (checkedIn / total) * 100 : 0,
          thisWeek: 85, // Mock
          thisMonth: 88, // Mock
        },
        departmentStats,
        recentActivities: mockStore.getActivityLogs().slice(0, 5),
        abnormalAttendances,
      };
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },
};

// Reports API
export const reportsApi = {
  async getReports(): Promise<Report[]> {
    await randomDelay();
    
    if (USE_MOCK) {
      // Mock 리포트 데이터
      return [
        {
          id: 'report1',
          name: '2024년 1월 근태 리포트',
          type: 'monthly',
          period: { start: '2024-01-01', end: '2024-01-31' },
          createdBy: '1',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          status: 'completed',
        },
      ];
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async createReport(report: Omit<Report, 'id' | 'createdAt' | 'status'>): Promise<Report> {
    await randomDelay();
    
    if (USE_MOCK) {
      const newReport: Report = {
        ...report,
        id: `report_${Date.now()}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      
      // 리포트 생성 시뮬레이션
      setTimeout(() => {
        newReport.status = 'completed';
      }, 2000);
      
      mockStore.addActivityLog({
        userId: report.createdBy,
        userName: '관리자',
        action: '리포트 생성',
        targetType: 'report',
        targetId: newReport.id,
      });
      
      return newReport;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },
};

// System Settings API
export const systemSettingsApi = {
  async getSettings(): Promise<SystemSettings> {
    await randomDelay();
    
    if (USE_MOCK) {
      return mockStore.getSystemSettings();
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },

  async updateSettings(updates: Partial<SystemSettings>): Promise<SystemSettings> {
    await randomDelay();
    
    if (USE_MOCK) {
      const updated = mockStore.updateSystemSettings(updates);
      mockStore.addActivityLog({
        userId: '1',
        userName: '최고관리자',
        action: '시스템 설정 변경',
        targetType: 'system',
        details: updates,
      });
      return updated;
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },
};

// Activity Logs API
export const activityLogsApi = {
  async getLogs(filters?: {
    userId?: string;
    targetType?: ActivityLog['targetType'];
    startDate?: string;
    endDate?: string;
  }): Promise<ActivityLog[]> {
    await randomDelay();
    
    if (USE_MOCK) {
      return mockStore.getActivityLogs(filters);
    }
    
    throw new Error('실제 API가 구현되지 않았습니다.');
  },
};

