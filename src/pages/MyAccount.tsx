import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/services/api';
import { useToastStore } from '@/components/common/Toast';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { LoadingSpinner } from '@/components/common/Loading';

export function MyAccount() {
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
  });

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setIsLoading(true);
      await usersApi.updateUser(currentUser.id, formData);
      addToast('정보가 수정되었습니다.', 'success');
    } catch (error) {
      addToast('정보 수정에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return <div>사용자 정보를 불러올 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-dark-text">내 정보</h1>

      <div className="bg-dark-surface-850 rounded-bdg-10 p-6 border border-[#444444] shadow-bdg max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              사번
            </label>
            <input
              type="text"
              value={currentUser.employeeId}
              disabled
              className="w-full px-4 py-2 rounded-bdg-10 bg-[rgba(2,6,23,.25)] border border-[#444444] text-dark-text-400"
            />
          </div>
          <Input
            label="이름"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="이메일"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="전화번호"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-dark-text-secondary mb-1">
              부서
            </label>
            <input
              type="text"
              value={currentUser.department}
              disabled
              className="w-full px-4 py-2 rounded-bdg-10 bg-[rgba(2,6,23,.25)] border border-[#444444] text-dark-text-400"
            />
            <p className="mt-1 text-xs text-dark-text-secondary">
              부서 정보는 관리자만 수정할 수 있습니다.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} isLoading={isLoading}>
              저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


