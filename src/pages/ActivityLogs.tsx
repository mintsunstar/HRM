import { useState, useEffect } from 'react';
import { activityLogsApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/common/Toast';
import type { ActivityLog } from '@/types';
import { LoadingSpinner } from '@/components/common/Loading';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Table, TableRow, TableCell } from '@/components/common/Table';
import { format } from 'date-fns';

const ITEMS_PER_PAGE = 20;

export function ActivityLogs() {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [targetTypeFilter]);

  useEffect(() => {
    filterLogs();
  }, [logs]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const filters: any = {};
      
      // Admin은 본인 로그만
      if (currentUser?.level === 2) {
        filters.userId = currentUser.id;
      }
      
      if (targetTypeFilter !== 'all') {
        filters.targetType = targetTypeFilter;
      }
      
      const data = await activityLogsApi.getLogs(filters);
      setLogs(data);
    } catch (error) {
      addToast('활동 로그를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterLogs = () => {
    setFilteredLogs(logs);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-text">활동 로그</h1>
      </div>

      <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            options={[
              { value: 'all', label: '전체 유형' },
              { value: 'employee', label: '직원' },
              { value: 'attendance', label: '근태' },
              { value: 'report', label: '리포트' },
              { value: 'system', label: '시스템' },
              { value: 'auth', label: '인증' },
            ]}
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
        <Table headers={['시간', '사용자', '액션', '대상 유형', '상세', 'IP 주소']}>
          {paginatedLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
              <TableCell>{log.userName}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded text-xs bg-dark-card text-dark-text">
                  {log.targetType}
                </span>
              </TableCell>
              <TableCell>
                {log.details ? JSON.stringify(log.details).substring(0, 50) : '-'}
              </TableCell>
              <TableCell>{log.ipAddress || '-'}</TableCell>
            </TableRow>
          ))}
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-dark-card hover:bg-dark-border rounded-lg disabled:opacity-50"
          >
            이전
          </button>
          <span className="text-dark-text">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-dark-card hover:bg-dark-border rounded-lg disabled:opacity-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}


