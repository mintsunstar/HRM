import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/common/Toast';
import clsx from 'clsx';

interface MenuItem {
  path: string;
  label: string;
  icon?: React.ReactNode;
  minLevel?: number; // 최소 레벨 (이 레벨 이상만 표시)
}

const menuItems: MenuItem[] = [
  { path: '/admin/dashboard', label: '대시보드' },
  { path: '/admin/employees', label: '직원 관리' },
  { path: '/admin/attendances', label: '전사 근태 관리' },
  { path: '/admin/reports', label: '통계 및 리포트' },
  { path: '/admin/activity-logs', label: '활동 로그' },
  { path: '/admin/settings', label: '시스템 설정', minLevel: 1 }, // Super Admin만
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();

  const filteredMenuItems = menuItems.filter(
    (item) => !item.minLevel || (user && user.level <= item.minLevel)
  );

  const handleLogout = () => {
    logout();
    addToast('로그아웃되었습니다.', 'success');
    navigate('/login');
    onClose();
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-dark-surface border-r border-dark-border transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-dark-border">
            <h2 className="text-xl font-bold text-mint-400">관리자 메뉴</h2>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {filteredMenuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={clsx(
                    'block px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-mint-500 text-white'
                      : 'text-dark-text-secondary hover:bg-dark-card hover:text-dark-text'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-dark-border space-y-3">
            <div className="text-xs text-dark-text-secondary">
              <p>권한 레벨: {user?.level === 1 ? 'Super Admin' : user?.level === 2 ? 'Admin' : 'User'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

