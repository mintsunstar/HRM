import { useState, useEffect } from 'react';
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

const ITEMS_PER_PAGE = 10;

export function Employees() {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [employees, setEmployees] = useState<User[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});

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
  const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
      fetchEmployees();
    } catch (error) {
      addToast(error instanceof Error ? error.message : '직원 초대에 실패했습니다.', 'error');
    }
  };

  const handleEdit = (employee: User) => {
    setSelectedEmployee(employee);
    setEditForm({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      phone: employee.phone,
      level: employee.level,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;

    try {
      await usersApi.updateUser(selectedEmployee.id, editForm);
      addToast('직원 정보가 수정되었습니다.', 'success');
      setIsEditModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (error) {
      addToast('직원 정보 수정에 실패했습니다.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedEmployee) return;

    try {
      await usersApi.deleteUser(selectedEmployee.id);
      addToast('직원이 비활성화되었습니다.', 'success');
      setIsDeleteModalOpen(false);
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

  const handleExcelDownload = () => {
    const data = filteredEmployees.map((emp) => ({
      사번: emp.employeeId,
      이름: emp.name,
      이메일: emp.email,
      부서: emp.department,
      직책: emp.position,
      상태: emp.isActive ? '활성' : '비활성',
      입사일: emp.joinDate,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-text">직원 관리</h1>
        <div className="flex space-x-2">
          <Button onClick={handleExcelDownload}>Excel 다운로드</Button>
          <Button onClick={() => setIsInviteModalOpen(true)}>직원 초대</Button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-dark-surface rounded-lg p-4 border border-dark-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="이름, 이메일, 사번으로 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            options={[
              { value: 'all', label: '전체 부서' },
              ...departments.map((dept) => ({ value: dept, label: dept })),
            ]}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          />
          <Select
            options={[
              { value: 'all', label: '전체 상태' },
              { value: 'active', label: '활성' },
              { value: 'inactive', label: '비활성' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <div className="text-dark-text-secondary flex items-center">
            총 {filteredEmployees.length}명
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
        <Table
          headers={['사번', '이름', '이메일', '부서', '직책', '상태', '입사일', '작업']}
        >
          {paginatedEmployees.map((employee) => (
            <TableRow key={employee.id}>
              <TableCell>{employee.employeeId}</TableCell>
              <TableCell>{employee.name}</TableCell>
              <TableCell>{employee.email}</TableCell>
              <TableCell>{employee.department}</TableCell>
              <TableCell>{employee.position}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    employee.isActive
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {employee.isActive ? '활성' : '비활성'}
                </span>
              </TableCell>
              <TableCell>{employee.joinDate}</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(employee)}
                    className="text-mint-400 hover:text-mint-300 text-sm"
                  >
                    수정
                  </button>
                  {employee.isActive && (
                    <>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsResetPasswordModalOpen(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        비밀번호 초기화
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setIsDeleteModalOpen(true);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        비활성화
                      </button>
                    </>
                  )}
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
        onClose={() => setIsInviteModalOpen(false)}
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
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleInvite}>초대</Button>
          </div>
        </div>
      </Modal>

      {/* 수정 모달 */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="직원 정보 수정"
      >
        <div className="space-y-4">
          <Input
            label="이름"
            value={editForm.name || ''}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <Input
            label="이메일"
            type="email"
            value={editForm.email || ''}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <Input
            label="부서"
            value={editForm.department || ''}
            onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
          />
          <Input
            label="직책"
            value={editForm.position || ''}
            onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
          />
          <Input
            label="전화번호"
            value={editForm.phone || ''}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
          />
          {currentUser?.level === 1 && (
            <Select
              label="권한 레벨"
              options={[
                { value: '3', label: 'User (Level 3)' },
                { value: '2', label: 'Admin (Level 2)' },
                { value: '1', label: 'Super Admin (Level 1)' },
              ]}
              value={String(editForm.level || 3)}
              onChange={(e) => setEditForm({ ...editForm, level: Number(e.target.value) as UserLevel })}
            />
          )}
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate}>저장</Button>
          </div>
        </div>
      </Modal>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="직원 비활성화"
        message={`${selectedEmployee?.name}님을 비활성화하시겠습니까?`}
        confirmText="비활성화"
        variant="danger"
      />

      {/* 비밀번호 초기화 확인 모달 */}
      <ConfirmModal
        isOpen={isResetPasswordModalOpen}
        onClose={() => setIsResetPasswordModalOpen(false)}
        onConfirm={handleResetPassword}
        title="비밀번호 초기화"
        message={`${selectedEmployee?.name}님의 비밀번호를 초기화하시겠습니까?`}
        confirmText="초기화"
      />
    </div>
  );
}

