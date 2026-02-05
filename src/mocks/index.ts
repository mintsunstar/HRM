// Mock 데이터를 메모리에서 관리하는 스토어
import { User, Attendance, ActivityLog, SystemSettings } from '@/types';
import { mockUsers, mockAttendances, mockActivityLogs, mockSystemSettings, mockPasswords } from './data';

class MockStore {
  private users: User[] = [...mockUsers];
  private attendances: Attendance[] = [...mockAttendances];
  private activityLogs: ActivityLog[] = [...mockActivityLogs];
  private systemSettings: SystemSettings = { ...mockSystemSettings };

  // Users
  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email === email);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return this.users[index];
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    this.users[index].isActive = false;
    return true;
  }

  // Attendances
  getAttendances(filters?: {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: Attendance['status'];
  }): Attendance[] {
    let result = [...this.attendances];
    
    if (filters?.employeeId) {
      result = result.filter(a => a.employeeId === filters.employeeId);
    }
    if (filters?.startDate) {
      result = result.filter(a => a.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter(a => a.date <= filters.endDate!);
    }
    if (filters?.status) {
      result = result.filter(a => a.status === filters.status);
    }
    
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }

  getAttendanceById(id: string): Attendance | undefined {
    return this.attendances.find(a => a.id === id);
  }

  updateAttendance(id: string, updates: Partial<Attendance> & { modificationReason: string; modifiedBy: string }): Attendance | null {
    const index = this.attendances.findIndex(a => a.id === id);
    if (index === -1) return null;
    
    this.attendances[index] = {
      ...this.attendances[index],
      ...updates,
      modifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return this.attendances[index];
  }

  // Activity Logs
  getActivityLogs(filters?: {
    userId?: string;
    targetType?: ActivityLog['targetType'];
    startDate?: string;
    endDate?: string;
  }): ActivityLog[] {
    let result = [...this.activityLogs];
    
    if (filters?.userId) {
      result = result.filter(log => log.userId === filters.userId);
    }
    if (filters?.targetType) {
      result = result.filter(log => log.targetType === filters.targetType);
    }
    if (filters?.startDate) {
      result = result.filter(log => log.createdAt >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter(log => log.createdAt <= filters.endDate!);
    }
    
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  addActivityLog(log: Omit<ActivityLog, 'id' | 'createdAt'>): ActivityLog {
    const newLog: ActivityLog = {
      ...log,
      id: `log_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.activityLogs.unshift(newLog);
    // 최대 1000개까지만 유지
    if (this.activityLogs.length > 1000) {
      this.activityLogs = this.activityLogs.slice(0, 1000);
    }
    return newLog;
  }

  // System Settings
  getSystemSettings(): SystemSettings {
    return { ...this.systemSettings };
  }

  updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
    this.systemSettings = {
      ...this.systemSettings,
      ...updates,
    };
    return { ...this.systemSettings };
  }

  // Auth
  verifyPassword(email: string, password: string): boolean {
    return mockPasswords[email] === password;
  }
}

export const mockStore = new MockStore();

