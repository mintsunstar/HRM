import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usersApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/common/Toast';
import type { User, UserLevel } from '@/types';
import { LoadingSpinner } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Table, TableRow, TableCell } from '@/components/common/Table';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { Plus, Download } from 'lucide-react';
import { Calendar } from 'lucide-react';

export function Employees() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [employees, setEmployees] = useState<User[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState<Partial<User & { birthDate?: string; jobTitle?: string }>>({});
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 초대 폼
  const [inviteForm, setInviteForm] = useState({
    email: '',
    name: '',
    employeeId: '',
    department: '',
    position: '',
    level: 3 as UserLevel,
    isActive: true,
    joinDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, departmentFilter, statusFilter]);


  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      let allEmployees = await usersApi.getUsers();
      
      // Admin은 자신의 부서만 보이도록 필터링
      if (currentUser?.level === 2) {
        allEmployees = allEmployees.filter(emp => emp.department === currentUser.department);
      }
      
      setEmployees(allEmployees);
    } catch (error) {
      addToast('직원 목록을 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = [...employees];

    // 검색
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.name.toLowerCase().includes(term) ||
          emp.email.toLowerCase().includes(term) ||
          emp.employeeId.toLowerCase().includes(term)
      );
    }

    // 부서 필터
    if (departmentFilter !== 'all') {
      filtered = filtered.filter((emp) => emp.department === departmentFilter);
    }

    // 상태 필터
    if (statusFilter === 'active') {
      filtered = filtered.filter((emp) => emp.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((emp) => !emp.isActive);
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1);
  };

  const departments = Array.from(new Set(employees.map((e) => e.department)));

  // 페이지네이션
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handleInvite = async () => {
    try {
      // 중복 체크
      const existingEmail = employees.find((e) => e.email === inviteForm.email);
      if (existingEmail) {
        addToast('이미 등록된 이메일입니다.', 'error');
        return;
      }

      const existingEmployeeId = employees.find((e) => e.employeeId === inviteForm.employeeId);
      if (existingEmployeeId) {
        addToast('이미 등록된 사번입니다.', 'error');
        return;
      }

      await usersApi.createUser(inviteForm);
      addToast('직원이 초대되었습니다.', 'success');
      setIsInviteModalOpen(false);
      setInviteForm({
        email: '',
        name: '',
        employeeId: '',
        department: '',
        position: '',
        level: 3 as UserLevel,
        isActive: true,
        joinDate: new Date().toISOString().split('T')[0],
      });
      if (location.pathname === '/admin/employees/add') {
        navigate('/admin/employees');
      } else {
        fetchEmployees();
      }
    } catch (error) {
      addToast(error instanceof Error ? error.message : '직원 초대에 실패했습니다.', 'error');
    }
  };

  const handleViewDetail = (employee: User) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      employeeId: employee.employeeId,
      department: employee.department,
      position: employee.position,
      phone: employee.phone,
      level: employee.level,
      isActive: employee.isActive,
      joinDate: employee.joinDate,
    });
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setIsEditMode(false);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (employee: User) => {
    handleViewDetail(employee);
    setIsEditMode(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;

    try {
      await usersApi.updateUser(selectedEmployee.id, editForm);
      addToast('직원 정보가 수정되었습니다.', 'success');
      setIsEditMode(false);
      fetchEmployees();
      // 업데이트된 정보로 selectedEmployee 갱신
      const updated = await usersApi.getUserById(selectedEmployee.id);
      setSelectedEmployee(updated);
      // editForm도 업데이트된 정보로 갱신
      setEditForm({
        name: updated.name,
        email: updated.email,
        department: updated.department,
        position: updated.position,
        phone: updated.phone,
        level: updated.level,
        isActive: updated.isActive,
        joinDate: updated.joinDate,
      });
    } catch (error) {
      addToast('직원 정보 수정에 실패했습니다.', 'error');
    }
  };

  const handleToggleActive = async () => {
    if (!selectedEmployee) return;

    try {
      await usersApi.updateUser(selectedEmployee.id, { isActive: !selectedEmployee.isActive });
      addToast(
        selectedEmployee.isActive ? '직원이 비활성화되었습니다.' : '직원이 활성화되었습니다.',
        'success'
      );
      fetchEmployees();
      const updated = await usersApi.getUserById(selectedEmployee.id);
      setSelectedEmployee(updated);
    } catch (error) {
      addToast('상태 변경에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    try {
      await usersApi.deleteUser(selectedEmployee.id);
      addToast('직원이 비활성화되었습니다.', 'success');
      setIsDeleteModalOpen(false);
      setIsDetailModalOpen(false);
      setIsEditMode(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      addToast('직원 비활성화에 실패했습니다.', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedEmployee) return;

    try {
      await usersApi.resetPassword(selectedEmployee.id);
      addToast('비밀번호가 초기화되었습니다.', 'success');
      setIsResetPasswordModalOpen(false);
      setSelectedEmployee(null);
    } catch (error) {
      addToast('비밀번호 초기화에 실패했습니다.', 'error');
    }
  };

  const handleResendInvite = async (employee: User) => {
    try {
      // TODO: API 연동 시 실제 초대 재발송 로직 구현
      addToast(`${employee.name}님에게 초대 메일을 재발송했습니다.`, 'success');
    } catch (error) {
      addToast('초대 재발송에 실패했습니다.', 'error');
    }
  };

  const handleExcelDownload = () => {
    const data = filteredEmployees.map((emp) => ({
      사번: emp.employeeId,
      이름: emp.name,
      이메일: emp.email,
      재직상태: emp.isActive ? '재직' : '퇴사',
      부서: emp.department,
      직책: emp.position,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '직원목록');
    XLSX.writeFile(wb, `직원목록_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    addToast('Excel 파일이 다운로드되었습니다.', 'success');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // 직원추가 페이지 표시
  if (location.pathname === '/admin/employees/add') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-dark-text-100">직원관리 / 직원등록</h1>
          <Button variant="secondary" onClick={() => navigate('/admin/employees')}>
            목록으로
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 입력 폼 */}
          <div className="bg-dark-surface-850 rounded-bdg-10 p-6 border border-[#444444] shadow-bdg">
            <h2 className="text-lg font-extrabold text-dark-text-100 mb-6">초대 정보</h2>
            <div className="space-y-4">
              <Input
                label="이메일 (필수)"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="user@company.com"
                required
              />
              <Input
                label="이름 (필수)"
                value={inviteForm.name}
                onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                placeholder="홍길동"
                required
              />
              <Input
                label="사번 (필수)"
                value={inviteForm.employeeId}
                onChange={(e) => setInviteForm({ ...inviteForm, employeeId: e.target.value })}
                placeholder="0008"
                required
              />
              <Select
                label="권한 레벨"
                options={[
                  { value: '3', label: 'User' },
                  { value: '2', label: 'Admin' },
                  { value: '1', label: 'Super Admin' },
                ]}
                value={String(inviteForm.level)}
                onChange={(e) => setInviteForm({ ...inviteForm, level: Number(e.target.value) as UserLevel })}
              />
              <div className="flex gap-3 mt-6">
                <Button onClick={handleInvite} className="flex-1">
                  초대 발송
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    addToast('초대 메일 미리보기는 API 연동 시 구현됩니다.', 'info');
                  }}
                >
                  미리보기
                </Button>
              </div>
              <div className="text-xs text-dark-text-400 mt-4">
                * 초대 발송 → 계정 생성 → 가입 완료 링크 이메일 발송(정책)
              </div>
            </div>
          </div>

          {/* 운영 가이드 */}
          <div className="bg-dark-surface-850 rounded-bdg-10 p-6 border border-[#444444] shadow-bdg">
            <h2 className="text-lg font-extrabold text-dark-text-100 mb-4">운영 가이드</h2>
            <ul className="space-y-2 text-sm text-dark-text-400">
              <li>• 필수: 이메일/이름/사번</li>
              <li>• 이미 존재(Inactive) → 재초대 정책에 따라 Active 전환 후 가입 재진행</li>
              <li>• 초대/비활성화는 감사 로그를 남기는 것을 권장</li>
            </ul>
            <hr className="border-[#444444] my-4" />
            <div className="text-xs text-dark-text-400">
              프로토타입 v1 (클릭 가능한 HTML)
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark-text-100">직원관리 / 직원목록</h1>
          <p className="text-sm text-dark-text-400 mt-2">등록된 직원정보 목록, 신규등록 및 초대 · 정보 수정</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={handleExcelDownload} className="w-[168px] flex items-center justify-center">
            <Download className="w-4 h-4 mr-2" />
            Excel 다운로드
          </Button>
          <Button onClick={() => navigate('/admin/employees/add')} className="w-[168px] flex items-center justify-center">
            <Plus className="w-4 h-4 mr-2" />
            신규 직원 등록
          </Button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-dark-surface-850 rounded-bdg-10 p-4 border border-[#444444] shadow-bdg">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-1">
            <Input
              label="검색(이름/이메일/사번)"
              placeholder="예: 0008 / user@"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <Select
              label="부서"
              options={[
                { value: 'all', label: '전체' },
                ...departments.map((dept) => ({ value: dept, label: dept })),
              ]}
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <Select
              label="계정상태"
              options={[
                { value: 'all', label: '전체' },
                { value: 'active', label: '활성' },
                { value: 'inactive', label: '비활성' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="md:col-span-1 flex items-end gap-2">
            <Button 
              onClick={filterEmployees}
              variant="ghost"
              className="!bg-[#0F172A] !border-[#263244] !text-white hover:!bg-[#1E293B] hover:!border-[#334155]"
            >
              조회
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setSearchTerm('');
                setDepartmentFilter('all');
                setStatusFilter('all');
              }}
            >
              필터 초기화
            </Button>
          </div>
        </div>
      </div>

      {/* 페이지네이션 컨트롤 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-dark-text-400">
          총 <span className="text-dark-text-100 font-bold">{filteredEmployees.length}</span>명
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
              checked={paginatedEmployees.length > 0 && paginatedEmployees.every((emp) => selectedEmployeeIds.has(emp.id))}
              onChange={(e) => {
                const newSet = new Set(selectedEmployeeIds);
                if (e.target.checked) {
                  paginatedEmployees.forEach((emp) => newSet.add(emp.id));
                } else {
                  paginatedEmployees.forEach((emp) => newSet.delete(emp.id));
                }
                setSelectedEmployeeIds(newSet);
              }}
              className="w-4 h-4 rounded border-[#444444] bg-[rgba(2,6,23,.25)] text-brand-500 focus:ring-brand-500 focus:ring-2 cursor-pointer"
            />,
            '사번',
            '이름',
            '이메일',
            '재직상태',
            '부서',
            '직책',
            '작업',
          ]}
        >
          {paginatedEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>
                <input
                  type="checkbox"
                  checked={selectedEmployeeIds.has(employee.id)}
                  onChange={(e) => {
                    const newSet = new Set(selectedEmployeeIds);
                    if (e.target.checked) {
                      newSet.add(employee.id);
                    } else {
                      newSet.delete(employee.id);
                    }
                    setSelectedEmployeeIds(newSet);
                  }}
                  className="w-4 h-4 rounded border-[#444444] bg-[rgba(2,6,23,.25)] text-brand-500 focus:ring-brand-500 focus:ring-2 cursor-pointer"
                />
              </TableCell>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    employee.isActive
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {employee.isActive ? '재직' : '퇴사'}
                </span>
              </TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleViewDetail(employee)}
                    className="px-3 py-1.5 rounded-bdg-10 bg-[#0F172A] border border-[#263244] text-white hover:bg-[#1E293B] hover:border-[#334155] text-sm transition-colors"
                  >
                    상세
                  </button>
                  <button
                    onClick={() => handleResendInvite(employee)}
                    className="px-3 py-1.5 rounded-bdg-10 border border-[#444444] text-dark-text-400 hover:text-mint-400 hover:border-mint-400 text-sm transition-colors"
                  >
                    초대 재발송
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
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

      {/* 초대 모달 */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          if (location.pathname === '/admin/employees/add') {
            navigate('/admin/employees');
          }
        }}
        title="직원 초대"
      >
        <div className="space-y-4">
          <Input
            label="이메일"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            required
          />
          <Input
            label="이름"
            value={inviteForm.name}
            onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
            required
          />
          <Input
            label="사번"
            value={inviteForm.employeeId}
            onChange={(e) => setInviteForm({ ...inviteForm, employeeId: e.target.value })}
            required
          />
          <Input
            label="부서"
            value={inviteForm.department}
            onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
            required
          />
          <Input
            label="직책"
            value={inviteForm.position}
            onChange={(e) => setInviteForm({ ...inviteForm, position: e.target.value })}
            required
          />
          <Select
            label="권한 레벨"
            options={[
              { value: '3', label: 'User (Level 3)' },
              { value: '2', label: 'Admin (Level 2)' },
              { value: '1', label: 'Super Admin (Level 1)' },
            ]}
            value={String(inviteForm.level)}
            onChange={(e) => setInviteForm({ ...inviteForm, level: Number(e.target.value) as UserLevel })}
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="secondary"
              onClick={() => {
                setIsInviteModalOpen(false);
                if (location.pathname === '/admin/employees/add') {
                  navigate('/admin/employees');
                }
              }}
            >
              취소
            </Button>
            <Button onClick={handleInvite}>초대</Button>
          </div>
        </div>
      </Modal>

      {/* 상세보기 모달 */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setIsEditMode(false);
          setSelectedEmployee(null);
        }}
        title="직원정보 상세보기"
        size="xl"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            {/* 인사 정보 (관리자 설정) - 관리자만 수정 가능 */}
            <div className="border-b border-dark-line-700 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-text">인사 정보 (관리자 설정)</h3>
                <span className="text-xs text-dark-text-secondary bg-dark-card px-2 py-1 rounded">
                  관리자만 수정 가능
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">사번</label>
                  {isEditMode ? (
                    <Input
                      value={editForm.employeeId || selectedEmployee.employeeId}
                      onChange={(e) => setEditForm({ ...editForm, employeeId: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {selectedEmployee.employeeId}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">이름</label>
                  {isEditMode ? (
                    <Input
                      value={editForm.name || selectedEmployee.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {selectedEmployee.name}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">입사일</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={isEditMode ? (editForm.joinDate || selectedEmployee.joinDate) : selectedEmployee.joinDate}
                      onChange={(e) => {
                        if (isEditMode) {
                          setEditForm({ ...editForm, joinDate: e.target.value });
                        }
                      }}
                      disabled={!isEditMode}
                      className="w-full px-3 py-2.5 pr-10 rounded-bdg-10 border border-[#444444] bg-[rgba(2,6,23,.25)] text-dark-text-100 placeholder-dark-text-400 focus:outline-none focus:border-[rgba(56,189,248,.65)] focus:shadow-[0_0_0_3px_rgba(56,189,248,.12)] disabled:opacity-100 disabled:cursor-not-allowed"
                    />
                    <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-text-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">시스템 권한</label>
                  <Select
                    options={[
                      { value: '1', label: 'Super Admin' },
                      { value: '2', label: 'Admin' },
                      { value: '3', label: 'User' },
                    ]}
                    value={String(isEditMode ? (editForm.level ?? selectedEmployee.level) : selectedEmployee.level)}
                    onChange={(e) => {
                      if (isEditMode) {
                        setEditForm({ ...editForm, level: Number(e.target.value) as UserLevel });
                      }
                    }}
                    disabled={!isEditMode}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">이메일</label>
                  {isEditMode ? (
                    <Input
                      type="email"
                      value={editForm.email || selectedEmployee.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {selectedEmployee.email}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">근무상태</label>
                  <Select
                    options={[
                      { value: 'active', label: '재직중' },
                      { value: 'inactive', label: '퇴사' },
                    ]}
                    value={isEditMode 
                      ? (editForm.isActive !== undefined ? (editForm.isActive ? 'active' : 'inactive') : (selectedEmployee.isActive ? 'active' : 'inactive'))
                      : (selectedEmployee.isActive ? 'active' : 'inactive')
                    }
                    onChange={(e) => {
                      if (isEditMode) {
                        setEditForm({ ...editForm, isActive: e.target.value === 'active' });
                      }
                    }}
                    disabled={!isEditMode}
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">퇴사일</label>
                  <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                    -
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">계정상태</label>
                  <Select
                    options={[
                      { value: 'true', label: 'Active' },
                      { value: 'false', label: 'Inactive' },
                    ]}
                    value={String(isEditMode ? (editForm.isActive ?? selectedEmployee.isActive) : selectedEmployee.isActive)}
                    onChange={(e) => {
                      if (isEditMode) {
                        setEditForm({ ...editForm, isActive: e.target.value === 'true' });
                      }
                    }}
                    disabled={!isEditMode}
                  />
                </div>
              </div>
            </div>

            {/* 사용자 입력 정보 - 사용자 커스텀 가능 */}
            <div className="border-b border-dark-line-700 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-dark-text">사용자 입력 정보</h3>
                <span className="text-xs text-mint-400 bg-mint-900 bg-opacity-20 px-2 py-1 rounded">
                  사용자 커스텀 가능
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">부서명</label>
                  {isEditMode ? (
                    <Input
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {selectedEmployee.department}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">직급</label>
                  {isEditMode ? (
                    <Input
                      value={editForm.position || ''}
                      onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {selectedEmployee.position}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">연락처</label>
                  {isEditMode ? (
                    <Input
                      value={editForm.phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {selectedEmployee.phone || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">생년월일</label>
                  {isEditMode ? (
                    <Input
                      type="date"
                      value={editForm.birthDate || ''}
                      onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {editForm.birthDate || '-'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">직위</label>
                  {isEditMode ? (
                    <Input
                      value={editForm.jobTitle || ''}
                      onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                    />
                  ) : (
                    <div className="px-4 py-2 bg-[rgba(2,6,23,.25)] border border-[#444444] rounded-bdg-10 text-dark-text-100">
                      {editForm.jobTitle || selectedEmployee.position}
                    </div>
                  )}
                </div>
                {isEditMode && currentUser?.level === 1 && (
                  <div>
                    <label className="block text-sm text-dark-text-secondary mb-1">권한 레벨</label>
                    <Select
                      options={[
                        { value: '3', label: 'User (Level 3)' },
                        { value: '2', label: 'Admin (Level 2)' },
                        { value: '1', label: 'Super Admin (Level 1)' },
                      ]}
                      value={String(editForm.level || 3)}
                      onChange={(e) =>
                        setEditForm({ ...editForm, level: Number(e.target.value) as UserLevel })
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div>
              <h3 className="text-lg font-semibold text-dark-text mb-4">비밀번호 변경</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">
                    현재 비밀번호
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    placeholder="***********"
                    disabled={!isEditMode}
                  />
                  <p className="mt-1 text-xs text-dark-text-secondary">
                    영문(대/소문자), 숫자, 특수문자를 사용하여 8~16자로 설정해주세요.
                  </p>
                </div>
                <div>
                  <label className="block text-sm text-dark-text-secondary mb-1">
                    변경 비밀번호
                  </label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    placeholder="******"
                    disabled={!isEditMode}
                  />
                  <p
                    className={`mt-1 text-xs ${
                      passwordForm.newPassword &&
                      (passwordForm.newPassword.length < 8 ||
                        passwordForm.newPassword.length > 16 ||
                        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(
                          passwordForm.newPassword
                        ))
                        ? 'text-red-500'
                        : 'text-dark-text-secondary'
                    }`}
                  >
                    {passwordForm.newPassword &&
                    (passwordForm.newPassword.length < 8 ||
                      passwordForm.newPassword.length > 16 ||
                      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(
                        passwordForm.newPassword
                      ))
                      ? '8~16자이며 3종 이상 조합해야 합니다.'
                      : '8~16자이며 3종 이상 조합해야 합니다.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex items-center justify-between pt-4 border-t border-dark-line-700">
              <div className="flex space-x-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    setSelectedEmployee(selectedEmployee);
                    setIsResetPasswordModalOpen(true);
                  }}
                >
                  비밀번호 초기화
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setIsEditMode(false);
                    setSelectedEmployee(null);
                  }}
                >
                  취소
                </Button>
                {!isEditMode ? (
                  <Button onClick={() => setIsEditMode(true)}>수정하기</Button>
                ) : (
                  <>
                    <Button
                      variant={selectedEmployee.isActive ? 'danger' : 'primary'}
                      onClick={() => {
                        if (selectedEmployee.isActive) {
                          setSelectedEmployee(selectedEmployee);
                          setIsDeleteModalOpen(true);
                        } else {
                          handleToggleActive();
                        }
                      }}
                    >
                      {selectedEmployee.isActive ? '비활성화' : '활성화'}
                    </Button>
                    <Button onClick={handleUpdate}>저장</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 비활성화 확인 모달 */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          handleDelete();
          setIsDeleteModalOpen(false);
        }}
        title="직원 비활성화"
        message={`${selectedEmployee?.name}님을 비활성화하시겠습니까?`}
        confirmText="비활성화"
        variant="danger"
      />

      {/* 비밀번호 초기화 확인 모달 */}
      <ConfirmModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onConfirm={() => {
          handleResetPassword();
          setIsResetPasswordModalOpen(false);
        }}
        title="비밀번호 초기화"
        message={`${selectedEmployee?.name}님의 비밀번호를 초기화하시겠습니까?`}
        confirmText="초기화"
      />
    </div>
  );
}

