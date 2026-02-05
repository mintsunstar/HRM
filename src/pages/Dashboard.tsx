import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardApi } from '@/services/api';
import type { DashboardStats } from '@/types';
import { LoadingSpinner } from '@/components/common/Loading';
import { useToastStore } from '@/components/common/Toast';
import { format, addDays, isToday } from 'date-fns';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const navigate = useNavigate();
  const { addToast } = useToastStore();

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const data = await dashboardApi.getStats();
      setStats(data);
    } catch (error) {
      addToast('데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // 5분마다 자동 갱신
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleDateChange = (days: number) => {
    setSelectedDate(addDays(selectedDate, days));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { todayAttendance, attendanceRate, departmentStats, recentActivities, abnormalAttendances } = stats;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-text">대시보드</h1>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-dark-card hover:bg-dark-border rounded-lg text-dark-text transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 오늘 근무 현황 타이틀 및 날짜 이동 */}
      <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-dark-text">오늘 근무 현황</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleDateChange(-1)}
              className="p-2 bg-dark-card hover:bg-dark-border rounded-lg text-dark-text transition-colors"
              title="이전 날짜"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 bg-dark-card border border-dark-border rounded-lg text-dark-text focus:outline-none focus:ring-2 focus:ring-mint-500"
              />
              {!isToday(selectedDate) && (
                <button
                  onClick={handleToday}
                  className="px-3 py-2 bg-mint-500 hover:bg-mint-600 text-white rounded-lg text-sm transition-colors"
                >
                  오늘
                </button>
              )}
            </div>
            <button
              onClick={() => handleDateChange(1)}
              disabled={isToday(selectedDate)}
              className="p-2 bg-dark-card hover:bg-dark-border rounded-lg text-dark-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="다음 날짜"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
            <span className="text-sm text-dark-text-secondary">
              {isToday(selectedDate) 
                ? '오늘' 
                : format(selectedDate, 'yyyy년 MM월 dd일')}
            </span>
          </div>
        </div>
      </div>

      {/* 오늘 전사 근태 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="전체 직원"
          value={todayAttendance.total}
          onClick={() => navigate('/admin/employees')}
        />
        <StatCard
          label="출근"
          value={todayAttendance.checkedIn}
          color="text-green-400"
          onClick={() => navigate('/admin/attendances?status=normal')}
        />
        <StatCard
          label="지각"
          value={todayAttendance.late}
          color="text-yellow-400"
          onClick={() => navigate('/admin/attendances?status=late')}
        />
        <StatCard
          label="결근"
          value={todayAttendance.absent}
          color="text-red-400"
          onClick={() => navigate('/admin/attendances?status=absent')}
        />
        <StatCard
          label="휴가"
          value={todayAttendance.onLeave}
          color="text-blue-400"
          onClick={() => navigate('/admin/attendances?status=leave')}
        />
      </div>

      {/* 출근율 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
          <h2 className="text-xl font-semibold text-dark-text mb-4">출근율</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-dark-text-secondary">오늘</span>
                <span className="text-dark-text font-semibold">{attendanceRate.today.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className="bg-mint-500 h-2 rounded-full transition-all"
                  style={{ width: `${attendanceRate.today}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-dark-text-secondary">이번 주</span>
                <span className="text-dark-text font-semibold">{attendanceRate.thisWeek.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className="bg-mint-500 h-2 rounded-full transition-all"
                  style={{ width: `${attendanceRate.thisWeek}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-dark-text-secondary">이번 달</span>
                <span className="text-dark-text font-semibold">{attendanceRate.thisMonth.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-dark-card rounded-full h-2">
                <div
                  className="bg-mint-500 h-2 rounded-full transition-all"
                  style={{ width: `${attendanceRate.thisMonth}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 부서별 출근율 */}
        <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
          <h2 className="text-xl font-semibold text-dark-text mb-4">부서별 출근율</h2>
          <div className="space-y-3">
            {departmentStats.map((dept) => (
              <div key={dept.department}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-text">{dept.department}</span>
                  <span className="text-dark-text-secondary">
                    {dept.checkedIn}/{dept.totalEmployees} ({dept.attendanceRate.toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-dark-card rounded-full h-2">
                  <div
                    className="bg-mint-500 h-2 rounded-full transition-all"
                    style={{ width: `${dept.attendanceRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 이상 근태 알림 */}
      {abnormalAttendances.length > 0 && (
        <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-dark-text">이상 근태 알림</h2>
            <button className="text-sm text-mint-400 hover:text-mint-300">
              모두 확인
            </button>
          </div>
          <div className="space-y-2">
            {abnormalAttendances.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-dark-card rounded-lg hover:bg-dark-border transition-colors"
              >
                <div>
                  <p className="text-dark-text font-medium">{item.employeeName}</p>
                  <p className="text-sm text-dark-text-secondary">{item.issue} - {item.date}</p>
                </div>
                <button className="text-sm text-mint-400 hover:text-mint-300">
                  상세보기
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 활동 로그 */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-semibold text-dark-text mb-4">최근 활동 로그</h2>
        <div className="space-y-2">
          {recentActivities.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 bg-dark-card rounded-lg"
            >
              <div>
                <p className="text-dark-text">
                  <span className="font-medium">{log.userName}</span> - {log.action}
                </p>
                <p className="text-sm text-dark-text-secondary">
                  {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm')}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/admin/activity-logs')}
            className="text-mint-400 hover:text-mint-300 text-sm"
          >
            전체 로그 보기 →
          </button>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
  onClick?: () => void;
}

function StatCard({ label, value, color = 'text-dark-text', onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-dark-surface rounded-lg p-6 border border-dark-border ${onClick ? 'cursor-pointer hover:border-mint-500 transition-colors' : ''}`}
    >
      <p className="text-sm text-dark-text-secondary mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

