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
import { Calendar } from 'lucide-react';

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
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCapsModalOpen, setIsCapsModalOpen] = useState(false);
  const [isDetailEditMode, setIsDetailEditMode] = useState(false);
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    checkIn: '',
    checkOut: '',
    status: 'normal' as Attendance['status'],
    modificationReason: '',
  });
  const [detailEditForm, setDetailEditForm] = useState({
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
  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedAttendances = filteredAttendances.slice(startIndex, startIndex + itemsPerPage);

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
        <div>
          <h1 className="text-3xl font-bold text-dark-text">전사 근태 관리</h1>
          <p className="text-sm text-dark-text-400 mt-2">
            출근/미출근 인원 수, 지각 인원 수, 정상 출근율 표시
          </p>
        </div>
        <div className="flex space-x-2">
          {currentUser?.level === 1 && (
            <Button 
              onClick={() => setIsCapsModalOpen(true)}
              variant="ghost"
              className="!bg-[#0F172A] !border-[#263244] !text-white hover:!bg-[#1E293B] hover:!border-[#334155]"
            >
              캡스 데이터 업로드
            </Button>
          )}
          <Button 
            onClick={handleExcelDownload}
            variant="ghost"
            className="!bg-[#1E293B] !border-[#334155] !text-white hover:!bg-[#0F172A] hover:!border-[#263244]"
          >
            엑셀 다운로드(CSV)
          </Button>
        </div>
      </div>

      {/* 필터 */}
      <div className="bg-dark-surface-850 rounded-bdg-10 p-4 border border-[#444444] shadow-bdg">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs text-[rgba(224,242,254,.82)] mb-1.5">기간 시작</label>
            <div className="relative">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2.5 pr-10 rounded-bdg-10 border border-[#444444] bg-[rgba(2,6,23,.25)] text-dark-text-100 placeholder-dark-text-400 focus:outline-none focus:border-[rgba(56,189,248,.65)] focus:shadow-[0_0_0_3px_rgba(56,189,248,.12)]"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-text-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[rgba(224,242,254,.82)] mb-1.5">기간 종료</label>
            <div className="relative">
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2.5 pr-10 rounded-bdg-10 border border-[#444444] bg-[rgba(2,6,23,.25)] text-dark-text-100 placeholder-dark-text-400 focus:outline-none focus:border-[rgba(56,189,248,.65)] focus:shadow-[0_0_0_3px_rgba(56,189,248,.12)]"
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-text-400 pointer-events-none" />
            </div>
          </div>
          <Select
            label="상태"
            options={[
              { value: 'all', label: '전체' },
              { value: 'normal', label: '정상' },
              { value: 'late', label: '지각' },
              { value: 'absent', label: '결근' },
              { value: 'leave', label: '휴가' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Input
            label="검색(이름/사번/이메일)"
            placeholder="예: 0008 / 김 / user@"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Button 
              onClick={fetchAttendances}
              variant="ghost"
              className="!bg-[#0F172A] !border-[#263244] !text-white hover:!bg-[#1E293B] hover:!border-[#334155]"
            >
              조회
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDateRange({
                  start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                  end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
                });
                setSearchTerm('');
                setStatusFilter('all');
              }}
            >
              초기화
            </Button>
          </div>
        </div>
      </div>

      {/* 페이지네이션 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-dark-text-400">
          총 <span className="text-dark-text-100 font-bold">{filteredAttendances.length}</span>명
        </div>
        <div className="flex items-center gap-2">
          <Select
            options={[
              { value: '10', label: '10개' },
              { value: '20', label: '20개' },
              { value: '50', label: '50개' },
            ]}
            value={itemsPerPage.toString()}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-[100px]"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-dark-surface-850 rounded-bdg-10 border border-[#444444] shadow-bdg overflow-hidden">
        <Table
          headers={[
            <input
              key="select-all"
              type="checkbox"
              checked={paginatedAttendances.length > 0 && paginatedAttendances.every((att) => selectedAttendanceIds.has(att.id))}
              onChange={(e) => {
                const newSet = new Set(selectedAttendanceIds);
                if (e.target.checked) {
                  paginatedAttendances.forEach((att) => newSet.add(att.id));
                } else {
                  paginatedAttendances.forEach((att) => newSet.delete(att.id));
                }
                setSelectedAttendanceIds(newSet);
              }}
              className="w-4 h-4 rounded border-[#444444] bg-[rgba(2,6,23,.25)] text-brand-500 focus:ring-brand-500 focus:ring-2 cursor-pointer"
            />,
            '날짜',
            '사번',
            '이름',
            '출근시간',
            '퇴근시간',
            '상태',
            '근무시간',
            '작업',
          ]}
        >
          {paginatedAttendances.map((attendance) => {
            const canEditThis = canEdit(attendance);
            const isSelected = selectedAttendanceIds.has(attendance.id);
            return (
              <TableRow key={attendance.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      const newSet = new Set(selectedAttendanceIds);
                      if (e.target.checked) {
                        newSet.add(attendance.id);
                      } else {
                        newSet.delete(attendance.id);
                      }
                      setSelectedAttendanceIds(newSet);
                    }}
                    className="w-4 h-4 rounded border-[#444444] bg-[rgba(2,6,23,.25)] text-brand-500 focus:ring-brand-500 focus:ring-2 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                </TableCell>
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
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAttendance(attendance);
                      setIsDetailEditMode(false);
                      setShowBlockchainDetails(false);
                      setDetailEditForm({
                        checkIn: attendance.checkIn || '',
                        checkOut: attendance.checkOut || '',
                        status: attendance.status,
                        modificationReason: '',
                      });
                      setIsDetailModalOpen(true);
                    }}
                    className="text-brand-400 hover:text-brand-500"
                  >
                    상세보기
                  </Button>
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
              className="w-full px-4 py-2 rounded-bdg-10 bg-[rgba(2,6,23,.25)] border border-[#444444] text-dark-text-100 placeholder-dark-text-400 focus:outline-none focus:border-[rgba(56,189,248,.65)] focus:shadow-[0_0_0_3px_rgba(56,189,248,.12)]"
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

      {/* 상세보기 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setIsDetailEditMode(false);
          setShowBlockchainDetails(false);
        }}
        title={
          selectedAttendance ? (
            <div className="flex items-center gap-2">
              <span>근태 상세</span>
              <span className="text-sm font-normal text-dark-text-400">
                {getEmployeeName(selectedAttendance.employeeId)} ({selectedAttendance.employeeId})
              </span>
            </div>
          ) : (
            '근태 상세'
          )
        }
        size="lg"
      >
        {selectedAttendance && (
          <div className="space-y-6">
            {/* 근무 정보 섹션 */}
            <div className="bg-dark-surface-800 rounded-bdg-10 p-4 border border-[#444444]">
              <h3 className="text-base font-bold text-dark-text-100 mb-4">근무 정보</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-dark-text-400">근무날짜</span>
                  <p className="text-base font-semibold text-dark-text-100 mt-1">{selectedAttendance.date}</p>
                </div>
                <div>
                  <span className="text-sm text-dark-text-400">출근시간</span>
                  {isDetailEditMode ? (
                    <Input
                      type="time"
                      value={detailEditForm.checkIn}
                      onChange={(e) => setDetailEditForm({ ...detailEditForm, checkIn: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-semibold text-dark-text-100 mt-1">{selectedAttendance.checkIn || '-'}</p>
                  )}
                </div>
                <div>
                  <span className="text-sm text-dark-text-400">퇴근시간</span>
                  {isDetailEditMode ? (
                    <Input
                      type="time"
                      value={detailEditForm.checkOut}
                      onChange={(e) => setDetailEditForm({ ...detailEditForm, checkOut: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-semibold text-dark-text-100 mt-1">{selectedAttendance.checkOut || '-'}</p>
                  )}
                </div>
                <div>
                  <span className="text-sm text-dark-text-400">총 근로시간</span>
                  <p className="text-base font-semibold text-dark-text-100 mt-1">
                    {selectedAttendance.workHours ? `${selectedAttendance.workHours}시간` : '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-dark-text-400">근무 상태</span>
                  {isDetailEditMode ? (
                    <Select
                      options={[
                        { value: 'normal', label: '정상' },
                        { value: 'late', label: '지각' },
                        { value: 'absent', label: '결근' },
                        { value: 'leave', label: '휴가' },
                        { value: 'half_leave', label: '반차' },
                      ]}
                      value={detailEditForm.status}
                      onChange={(e) => setDetailEditForm({ ...detailEditForm, status: e.target.value as Attendance['status'] })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-base font-semibold text-dark-text-100 mt-1">
                      {selectedAttendance.status === 'normal'
                        ? '정상'
                        : selectedAttendance.status === 'late'
                        ? '지각'
                        : selectedAttendance.status === 'absent'
                        ? '결근'
                        : selectedAttendance.status === 'leave'
                        ? '휴가'
                        : '반차'}
                    </p>
                  )}
                </div>
                {isDetailEditMode && (
                  <div className="col-span-2">
                    <label className="block text-sm text-dark-text-400 mb-1">
                      정정사유 <span className="text-red-500">*</span> (10자 이상)
                    </label>
                    <textarea
                      className="w-full px-3 py-2.5 rounded-bdg-10 bg-[rgba(2,6,23,.25)] border border-[#444444] text-dark-text-100 placeholder-dark-text-400 focus:outline-none focus:border-[rgba(56,189,248,.65)] focus:shadow-[0_0_0_3px_rgba(56,189,248,.12)]"
                      rows={3}
                      value={detailEditForm.modificationReason}
                      onChange={(e) => setDetailEditForm({ ...detailEditForm, modificationReason: e.target.value })}
                      placeholder="정정 사유를 입력하세요 (10자 이상)"
                    />
                    <p className={`mt-1 text-xs ${detailEditForm.modificationReason.length >= 10 ? 'text-dark-text-400' : 'text-red-500'}`}>
                      {detailEditForm.modificationReason.length}/10자 이상
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 블록체인 기록 섹션 */}
            <div className="bg-dark-surface-800 rounded-bdg-10 p-4 border border-[#444444]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-dark-text-100">블록체인 기록</h3>
                <button
                  onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
                  className="text-sm text-brand-400 hover:text-brand-500 transition-colors"
                >
                  {showBlockchainDetails ? '접기' : '더보기'}
                </button>
              </div>
              {showBlockchainDetails && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-dark-text-400">record_id</span>
                  <p className="text-dark-text-100 mt-1 font-mono">{selectedAttendance.recordId || '-'}</p>
                </div>
                <div>
                  <span className="text-dark-text-400">userid</span>
                  <p className="text-dark-text-100 mt-1 font-mono">{selectedAttendance.userId || selectedAttendance.employeeId || '-'}</p>
                </div>
                <div>
                  <span className="text-dark-text-400">name</span>
                  <p className="text-dark-text-100 mt-1">{selectedAttendance.userName || getEmployeeName(selectedAttendance.employeeId) || '-'}</p>
                </div>
                <div>
                  <span className="text-dark-text-400">date</span>
                  <p className="text-dark-text-100 mt-1">{selectedAttendance.date}</p>
                </div>
                <div>
                  <span className="text-dark-text-400">mod_start</span>
                  <p className="text-dark-text-100 mt-1">{selectedAttendance.modStart || selectedAttendance.checkIn || '-'}</p>
                </div>
                <div>
                  <span className="text-dark-text-400">mod_end</span>
                  <p className="text-dark-text-100 mt-1">{selectedAttendance.modEnd || selectedAttendance.checkOut || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-dark-text-400">sender</span>
                  <p className="text-dark-text-100 mt-1 font-mono break-all">{selectedAttendance.sender || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-dark-text-400">mod_start_tx_hash</span>
                  <p className="text-dark-text-100 mt-1 font-mono break-all text-xs">{selectedAttendance.modStartTxHash || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-dark-text-400">mod_start_block_hash</span>
                  <p className="text-dark-text-100 mt-1 font-mono break-all text-xs">{selectedAttendance.modStartBlockHash || '-'}</p>
                </div>
                <div>
                  <span className="text-dark-text-400">mod_start_block_number</span>
                  <p className="text-dark-text-100 mt-1 font-mono">{selectedAttendance.modStartBlockNumber || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-dark-text-400">mod_end_tx_hash</span>
                  <p className="text-dark-text-100 mt-1 font-mono break-all text-xs">{selectedAttendance.modEndTxHash || '-'}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-dark-text-400">mod_end_block_hash</span>
                  <p className="text-dark-text-100 mt-1 font-mono break-all text-xs">{selectedAttendance.modEndBlockHash || '-'}</p>
                </div>
                <div>
                  <span className="text-dark-text-400">mod_end_block_number</span>
                  <p className="text-dark-text-100 mt-1 font-mono">{selectedAttendance.modEndBlockNumber || '-'}</p>
                </div>
                </div>
              )}
            </div>

            {/* 업데이트 날짜 (정정 모드일 때만 표시) */}
            {isDetailEditMode && (
              <div className="text-sm text-dark-text-400 pb-2">
                업데이트 날짜: {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
              </div>
            )}

            {/* 하단 버튼 */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#444444]">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsDetailEditMode(false);
                    setDetailEditForm({
                      checkIn: selectedAttendance.checkIn || '',
                      checkOut: selectedAttendance.checkOut || '',
                      status: selectedAttendance.status,
                      modificationReason: '',
                    });
                  }}
                  className={isDetailEditMode ? '' : 'hidden'}
                >
                  취소하기
                </Button>
                {!isDetailEditMode && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      setIsDetailEditMode(false);
                      setShowBlockchainDetails(false);
                    }}
                  >
                    닫기
                  </Button>
                )}
              </div>
              <div className="flex gap-3 ml-auto">
                {!isDetailEditMode ? (
                  <Button
                    onClick={() => {
                      if (!canEdit(selectedAttendance)) {
                        addToast('수정 가능 기간이 지났습니다.', 'error');
                        return;
                      }
                      setIsDetailEditMode(true);
                    }}
                    className="w-full sm:w-auto"
                  >
                    정정하기
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      if (detailEditForm.modificationReason.length < 10) {
                        addToast('정정사유를 10자 이상 입력해주세요.', 'error');
                        return;
                      }
                      try {
                        await attendancesApi.updateAttendance(selectedAttendance.id, {
                          checkIn: detailEditForm.checkIn,
                          checkOut: detailEditForm.checkOut,
                          status: detailEditForm.status,
                          modificationReason: detailEditForm.modificationReason,
                          modifiedBy: currentUser?.id,
                        });
                        addToast('근태 데이터가 수정되었습니다.', 'success');
                        setIsDetailEditMode(false);
                        setIsDetailModalOpen(false);
                        setShowBlockchainDetails(false);
                        fetchAttendances();
                      } catch (error) {
                        addToast('근태 데이터 수정에 실패했습니다.', 'error');
                      }
                    }}
                    disabled={detailEditForm.modificationReason.length < 10}
                    className="w-full sm:w-auto"
                  >
                    저장
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
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
          className="w-full px-4 py-2 rounded-bdg-10 bg-[rgba(2,6,23,.25)] border border-[#444444] text-dark-text-100"
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


