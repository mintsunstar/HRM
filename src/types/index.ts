// 권한 레벨
export type UserLevel = 0 | 1 | 2 | 3 | 4;

export interface User {
  id: string;
  email: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  level: UserLevel;
  isActive: boolean;
  phone?: string;
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'normal' | 'late' | 'absent' | 'leave' | 'half_leave';
  workHours?: number;
  notes?: string;
  modifiedBy?: string;
  modifiedAt?: string;
  modificationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  targetType: 'employee' | 'attendance' | 'report' | 'system' | 'auth';
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface Report {
  id: string;
  name: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  period: {
    start: string;
    end: string;
  };
  department?: string;
  createdBy: string;
  createdAt: string;
  status: 'pending' | 'completed' | 'failed';
  fileUrl?: string;
}

export interface SystemSettings {
  workPolicy: {
    workStartTime: string;
    workEndTime: string;
    lunchStartTime: string;
    lunchEndTime: string;
    lateThreshold: number; // minutes
  };
  blockchain: {
    enabled: boolean;
    endpoint: string;
    apiKey?: string;
  };
  caps: {
    enabled: boolean;
    syncInterval: number; // minutes
    lastSyncAt?: string;
  };
  notifications: {
    email: {
      enabled: boolean;
      dailySummary: boolean;
      weeklyReport: boolean;
      securityAlerts: boolean;
    };
    sms: {
      enabled: boolean;
      securityAlerts: boolean;
    };
  };
}

export interface DashboardStats {
  todayAttendance: {
    total: number;
    checkedIn: number;
    late: number;
    absent: number;
    onLeave: number;
  };
  attendanceRate: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  departmentStats: Array<{
    department: string;
    attendanceRate: number;
    totalEmployees: number;
    checkedIn: number;
  }>;
  recentActivities: ActivityLog[];
  abnormalAttendances: Array<{
    employeeId: string;
    employeeName: string;
    date: string;
    issue: string;
  }>;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

