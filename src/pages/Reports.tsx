import { useState, useEffect } from 'react';
import { reportsApi } from '@/services/api';
import { useToastStore } from '@/components/common/Toast';
import type { Report } from '@/types';
import { LoadingSpinner } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { format } from 'date-fns';

export function Reports() {
  const { addToast } = useToastStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'monthly' as Report['type'],
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const data = await reportsApi.getReports();
      setReports(data);
    } catch (error) {
      addToast('리포트 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await reportsApi.createReport({
        name: createForm.name,
        type: createForm.type,
        period: {
          start: createForm.startDate,
          end: createForm.endDate,
        },
        createdBy: '1', // Mock
      });
      addToast('리포트가 생성되었습니다.', 'success');
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        type: 'monthly',
        startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
      });
      fetchReports();
    } catch (error) {
      addToast('리포트 생성에 실패했습니다.', 'error');
    }
  };

  const handleDownload = (report: Report) => {
    addToast('리포트 다운로드 기능은 준비 중입니다.', 'info');
  };

  const handleEmailSend = (report: Report) => {
    addToast('이메일 발송 기능은 준비 중입니다.', 'info');
  };

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
        <h1 className="text-3xl font-bold text-dark-text">통계 및 리포트</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>리포트 생성</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-dark-surface rounded-lg p-6 border border-dark-border">
            <h3 className="text-lg font-semibold text-dark-text mb-2">{report.name}</h3>
            <p className="text-sm text-dark-text-secondary mb-4">
              {report.period.start} ~ {report.period.end}
            </p>
            <div className="flex items-center justify-between">
              <span
                className={`px-2 py-1 rounded text-xs ${
                  report.status === 'completed'
                    ? 'bg-green-600 text-white'
                    : report.status === 'pending'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-red-600 text-white'
                }`}
              >
                {report.status === 'completed' ? '완료' : report.status === 'pending' ? '대기' : '실패'}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(report)}
                  className="text-mint-400 hover:text-mint-300 text-sm"
                >
                  다운로드
                </button>
                <button
                  onClick={() => handleEmailSend(report)}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  이메일 발송
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="리포트 생성"
      >
        <div className="space-y-4">
          <Input
            label="리포트명"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            required
          />
          <Select
            label="리포트 유형"
            options={[
              { value: 'daily', label: '일간' },
              { value: 'weekly', label: '주간' },
              { value: 'monthly', label: '월간' },
              { value: 'custom', label: '사용자 정의' },
            ]}
            value={createForm.type}
            onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as Report['type'] })}
          />
          <Input
            label="시작일"
            type="date"
            value={createForm.startDate}
            onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
          />
          <Input
            label="종료일"
            type="date"
            value={createForm.endDate}
            onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleCreate}>생성</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


