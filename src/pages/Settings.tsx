import { useState, useEffect } from 'react';
import { systemSettingsApi } from '@/services/api';
import { useToastStore } from '@/components/common/Toast';
import type { SystemSettings } from '@/types';
import { LoadingSpinner } from '@/components/common/Loading';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { ConfirmModal } from '@/components/common/ConfirmModal';

export function Settings() {
  const { addToast } = useToastStore();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const data = await systemSettingsApi.getSettings();
      setSettings(data);
      setFormData(data);
    } catch (error) {
      addToast('시스템 설정을 불러오는데 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await systemSettingsApi.updateSettings(formData);
      addToast('시스템 설정이 저장되었습니다.', 'success');
      setIsConfirmModalOpen(false);
      fetchSettings();
    } catch (error) {
      addToast('시스템 설정 저장에 실패했습니다.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark-text">시스템 설정</h1>
        <Button onClick={() => setIsConfirmModalOpen(true)}>저장</Button>
      </div>

      {/* 근무 정책 */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-semibold text-dark-text mb-4">근무 정책</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="출근 시간"
            type="time"
            value={formData.workPolicy?.workStartTime || settings.workPolicy.workStartTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                workPolicy: { ...settings.workPolicy, ...formData.workPolicy, workStartTime: e.target.value },
              })
            }
          />
          <Input
            label="퇴근 시간"
            type="time"
            value={formData.workPolicy?.workEndTime || settings.workPolicy.workEndTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                workPolicy: { ...settings.workPolicy, ...formData.workPolicy, workEndTime: e.target.value },
              })
            }
          />
          <Input
            label="점심 시작 시간"
            type="time"
            value={formData.workPolicy?.lunchStartTime || settings.workPolicy.lunchStartTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                workPolicy: { ...settings.workPolicy, ...formData.workPolicy, lunchStartTime: e.target.value },
              })
            }
          />
          <Input
            label="점심 종료 시간"
            type="time"
            value={formData.workPolicy?.lunchEndTime || settings.workPolicy.lunchEndTime}
            onChange={(e) =>
              setFormData({
                ...formData,
                workPolicy: { ...settings.workPolicy, ...formData.workPolicy, lunchEndTime: e.target.value },
              })
            }
          />
          <Input
            label="지각 기준 (분)"
            type="number"
            value={formData.workPolicy?.lateThreshold || settings.workPolicy.lateThreshold}
            onChange={(e) =>
              setFormData({
                ...formData,
                workPolicy: { ...settings.workPolicy, ...formData.workPolicy, lateThreshold: Number(e.target.value) },
              })
            }
          />
        </div>
      </div>

      {/* 블록체인 설정 */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-semibold text-dark-text mb-4">블록체인 연동</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.blockchain?.enabled ?? settings.blockchain.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  blockchain: { ...settings.blockchain, ...formData.blockchain, enabled: e.target.checked },
                })
              }
              className="w-4 h-4"
            />
            <span className="text-dark-text">블록체인 연동 활성화</span>
          </label>
          <Input
            label="엔드포인트"
            value={formData.blockchain?.endpoint || settings.blockchain.endpoint}
            onChange={(e) =>
              setFormData({
                ...formData,
                blockchain: { ...settings.blockchain, ...formData.blockchain, endpoint: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* CAPS 설정 */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-semibold text-dark-text mb-4">CAPS 연동</h2>
        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.caps?.enabled ?? settings.caps.enabled}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  caps: { ...settings.caps, ...formData.caps, enabled: e.target.checked },
                })
              }
              className="w-4 h-4"
            />
            <span className="text-dark-text">CAPS 연동 활성화</span>
          </label>
          <Input
            label="동기화 간격 (분)"
            type="number"
            value={formData.caps?.syncInterval || settings.caps.syncInterval}
            onChange={(e) =>
              setFormData({
                ...formData,
                caps: { ...settings.caps, ...formData.caps, syncInterval: Number(e.target.value) },
              })
            }
          />
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-dark-surface rounded-lg p-6 border border-dark-border">
        <h2 className="text-xl font-semibold text-dark-text mb-4">알림 설정</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-dark-text mb-2">이메일 알림</h3>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifications?.email?.enabled ?? settings.notifications.email.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: {
                        ...settings.notifications,
                        ...formData.notifications,
                        email: {
                          ...settings.notifications.email,
                          ...formData.notifications?.email,
                          enabled: e.target.checked,
                        },
                      },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-dark-text">이메일 알림 활성화</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.notifications?.email?.dailySummary ?? settings.notifications.email.dailySummary}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notifications: {
                        ...settings.notifications,
                        ...formData.notifications,
                        email: {
                          ...settings.notifications.email,
                          ...formData.notifications?.email,
                          dailySummary: e.target.checked,
                        },
                      },
                    })
                  }
                  className="w-4 h-4"
                />
                <span className="text-dark-text">일일 요약</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleSave}
        title="시스템 설정 저장"
        message="시스템 설정을 저장하시겠습니까?"
        confirmText="저장"
      />
    </div>
  );
}

