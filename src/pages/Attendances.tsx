import { useState, useEffect } from 'react';
import { attendancesApi, usersApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/common/Toast';
import type { Attendance, User } from '@/types';
import { LoadingSpinner } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Table, TableRow, TableCell } from '@/components/common/Table';
import { Modal } from '@/components/common/Modal';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';

const ITEMS_PER_PAGE = 20;

export function Attendances() {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [filteredAttendances, setFilteredAttendances] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCapsModalOpen, setIsCapsModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'normal' as Attendance['status'],
    modificationReason: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendances();
  }, [dateRange]);

  useEffect(() => {
    filterAttendances();
  }, [attendances, searchTerm, statusFilter]);

  const fetchEmployees = async () => {
    try {
      const data = await usersApi.getUsers();
      // Admin은 자신의 부서만
      if (currentUser?.level === 2) {
        setEmployees(data.filter((e) => e.department === currentUser.department));
      } else {
        setEmployees(data);
      }
    } catch (error) {
      addToast('직원 목록을 불러오는데 실패했습니다.', 'error');
    }
  };

  const fetchAttendances = async () => {
    try {
      setIsLoading(true);
      const data = await attendancesApi.getAttendances({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });
      setAttendances(data);
    } catch (error) {
      addToast('근태 데이터를 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterAttendances = () => {
    let filtered = [...attendances];

    // 검색
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((att) => {
        const employee = employees.find((e) => e.employeeId === att.employeeId);
        return (
          employee?.name.toLowerCase().includes(term) ||
          employee?.employeeId.toLowerCase().includes(term)
        );
      });
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter((att) => att.status === statusFilter);
    }

    setFilteredAttendances(filtered);
    setCurrentPage(1);
  };

  const getEmployeeName = (employeeId: string) => {
    return employees.find((e) => e.employeeId === employeeId)?.name || employeeId;
  };

  // 권한별 수정 가능 기간 체크
  const canEdit = (attendance: Attendance) => {
    const attendanceDate = new Date(attendance.date);
    const today = new Date();
    const daysDiff = Math.floor((today.getTime() - attendanceDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (currentUser?.level === 1) {
      return daysDiff <= 30; // Super Admin: 30일
    } else if (currentUser?.level === 2) {
      return daysDiff <= 7; // Admin: 7일
    }
    return false;
  };

  const handleEdit = (attendance: Attendance) => {
    if (!canEdit(attendance)) {
      addToast('수정 가능 기간이 지났습니다.', 'error');
      return;
    }
    setSelectedAttendance(attendance);
    setEditForm({
      checkIn: attendance.checkIn || '',
      checkOut: attendance.checkOut || '',
      status: attendance.status,
      modificationReason: '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedAttendance || !currentUser) return;

    // 수정 사유 검증
    if (editForm.modificationReason.length < 10 || editForm.modificationReason.length > 200) {
      addToast('수정 사유는 10~200자 사이여야 합니다.', 'error');
      return;
    }

    try {
      await attendancesApi.updateAttendance(selectedAttendance.id, {
        checkIn: editForm.checkIn || undefined,
        checkOut: editForm.checkOut || undefined,
        status: editForm.status,
        modificationReason: editForm.modificationReason,
        modifiedBy: currentUser.id,
      });
      addToast('근태 데이터가 수정되었습니다.', 'success');
      setIsEditModalOpen(false);
      setSelectedAttendance(null);
      fetchAttendances();
    } catch (error) {
      addToast('근태 데이터 수정에 실패했습니다.', 'error');
    }
  };

  const handleCapsUpload = async (file: File, mode: 'append' | 'overwrite' | 'replace') => {
    try {
      const result = await attendancesApi.uploadCaps(file, mode);
      addToast(`${result.count}건의 데이터가 업로드되었습니다.`, 'success');
      setIsCapsModalOpen(false);
      fetchAttendances();
    } catch (error) {
      addToast('CAPS 데이터 업로드에 실패했습니다.', 'error');
    }
  };

  const handleExcelDownload = () => {
    const data = filteredAttendances.map((att) => {
      const employee = employees.find((e) => e.employeeId === att.employeeId);
      return {
        날짜: att.date,
        사번: att.employeeId,
        이름: employee?.name || '',
        출근시간: att.checkIn || '',
        퇴근시간: att.checkOut || '',
        상태: att.status === 'normal' ? '정상' : att.status === 'late' ? '지각' : att.status === 'absent' ? '결근' : '휴가',
        근무시간: att.workHours || 0,
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '근태현황');
    XLSX.writeFile(wb, `근태현황_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    addToast('Excel 파일이 다운로드되었습니다.', 'success');
  };

  // 페이지네이션
  const totalPages = Math.ceil(filteredAttendances.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedAttendances = filteredAttendances.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
        <h1 className="text-3xl font-bold text-dark-text">전사 근태 관리</h1>
        <div className="flex space-x-2">
          {currentUser?.level === 1 && (
            <Button onClick={() => setIsCapsModalOpen(true)}>CAPS 업로드</Button>
          )}
          <Button onClick={handleExcelDownload}>Excel 다운로드</Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Input
            type="date"
            label="시작일"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          />
          <Input
            type="date"
            label="종료일"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          />
          <Input
            placeholder="이름, 사번으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            options={[
              { value: 'all', label: '전체 상태' },
              { value: 'normal', label: '정상' },
              { value: 'late', label: '지각' },
              { value: 'absent', label: '결근' },
              { value: 'leave', label: '휴가' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <div className="flex items-end">
            <Button variant="secondary" onClick={fetchAttendances}>
              조회
            </Button>
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
        <Table
          headers={['날짜', '사번', '이름', '출근시간', '퇴근시간', '상태', '근무시간', '작업']}
        >
          {paginatedAttendances.map((attendance) => {
            const canEditThis = canEdit(attendance);
            return (
              <TableRow key={attendance.id}>
                <TableCell>{attendance.date}</TableCell>
                <TableCell>{attendance.employeeId}</TableCell>
                <TableCell>{getEmployeeName(attendance.employeeId)}</TableCell>
                <TableCell>{attendance.checkIn || '-'}</TableCell>
                <TableCell>{attendance.checkOut || '-'}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      attendance.status === 'normal'
                        ? 'bg-green-600 text-white'
                        : attendance.status === 'late'
                        ? 'bg-yellow-600 text-white'
                        : attendance.status === 'absent'
                        ? 'bg-red-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {attendance.status === 'normal'
                      ? '정상'
                      : attendance.status === 'late'
                      ? '지각'
                      : attendance.status === 'absent'
                      ? '결근'
                      : '휴가'}
                  </span>
                </TableCell>
                <TableCell>{attendance.workHours ? `${attendance.workHours}시간` : '-'}</TableCell>
                <TableCell>
                  {canEditThis ? (
                    <button
                      onClick={() => handleEdit(attendance)}
                      className="text-mint-400 hover:text-mint-300 text-sm"
                    >
                      수정
                    </button>
                  ) : (
                    <span className="text-dark-text-secondary text-sm">수정 불가</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            이전
          </Button>
          <span className="text-dark-text">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </Button>
        </div>
      )}

      {/* 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="근태 데이터 수정"
      >
        <div className="space-y-4">
          <div className="text-sm text-dark-text-secondary">
            <p>날짜: {selectedAttendance?.date}</p>
            <p>직원: {selectedAttendance && getEmployeeName(selectedAttendance.employeeId)}</p>
          </div>
          <Input
            label="출근시간"
            type="time"
            value={editForm.checkIn}
            onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
          />
          <Input
            label="퇴근시간"
            type="time"
            value={editForm.checkOut}
            onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
          />
          <Select
            label="상태"
            options={[
              { value: 'normal', label: '정상' },
              { value: 'late', label: '지각' },
              { value: 'absent', label: '결근' },
              { value: 'leave', label: '휴가' },
              { value: 'half_leave', label: '반차' },
            ]}
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value as Attendance['status'] })}
          />
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              수정 사유 <span className="text-red-500">*</span> (10~200자)
            </label>
            <textarea
              className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-dark-text placeholder-dark-text-secondary focus:outline-none focus:ring-2 focus:ring-mint-500 focus:border-transparent"
              rows={4}
              value={editForm.modificationReason}
              onChange={(e) => setEditForm({ ...editForm, modificationReason: e.target.value })}
              placeholder="수정 사유를 입력하세요"
            />
            <p className="mt-1 text-sm text-dark-text-secondary">
              {editForm.modificationReason.length}/200
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate}>저장</Button>
          </div>
        </div>
      </Modal>

      {/* CAPS 업로드 모달 */}
      <Modal
        isOpen={isCapsModalOpen}
        onClose={() => setIsCapsModalOpen(false)}
        title="CAPS 데이터 업로드"
      >
        <CapsUploadForm
          onUpload={handleCapsUpload}
          onClose={() => setIsCapsModalOpen(false)}
        />
      </Modal>
    </div>
  );
}

interface CapsUploadFormProps {
  onUpload: (file: File, mode: 'append' | 'overwrite' | 'replace') => Promise<void>;
  onClose: () => void;
}

function CapsUploadForm({ onUpload, onClose }: CapsUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'append' | 'overwrite' | 'replace'>('append');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file, mode);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-dark-text-secondary mb-1">
          파일 선택
        </label>
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="w-full px-4 py-2 rounded-lg bg-dark-card border border-dark-border text-dark-text"
        />
        {file && <p className="mt-2 text-sm text-dark-text-secondary">{file.name}</p>}
      </div>
      <Select
        label="적용 옵션"
        options={[
          { value: 'append', label: '신규 추가' },
          { value: 'overwrite', label: '덮어쓰기' },
          { value: 'replace', label: '전체 삭제 후 업로드' },
        ]}
        value={mode}
        onChange={(e) => setMode(e.target.value as 'append' | 'overwrite' | 'replace')}
      />
      <div className="bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-lg p-3">
        <p className="text-sm text-yellow-400">
          {mode === 'append' && '기존 데이터에 추가됩니다.'}
          {mode === 'overwrite' && '중복된 데이터는 덮어쓰기됩니다.'}
          {mode === 'replace' && '기존 데이터가 모두 삭제되고 새 데이터로 교체됩니다.'}
        </p>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose} disabled={isUploading}>
          취소
        </Button>
        <Button onClick={handleSubmit} isLoading={isUploading} disabled={!file || isUploading}>
          업로드
        </Button>
      </div>
    </div>
  );
}


