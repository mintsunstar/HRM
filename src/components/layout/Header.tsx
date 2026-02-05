import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/common/Toast';
import { Button } from '@/components/common/Button';

export function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    logout();
    addToast('로그아웃되었습니다.', 'success');
    navigate('/login');
  };

  const unreadNotifications = 3; // Mock

  return (
    <header className="h-16 bg-dark-surface border-b border-dark-border flex items-center justify-between px-6">
      <div className="flex items-center space-x-6">
        <Link to="/admin/dashboard" className="text-xl font-bold text-mint-400">
          내 근무 증명
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        {/* 알림 */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-dark-text-secondary hover:text-dark-text transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-dark-border rounded-lg shadow-lg z-50">
              <div className="p-4 border-b border-dark-border">
                <h3 className="font-semibold text-dark-text">알림</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 border-b border-dark-border hover:bg-dark-surface">
                  <p className="text-sm text-dark-text">이상 근태 패턴이 발견되었습니다.</p>
                  <p className="text-xs text-dark-text-secondary mt-1">5분 전</p>
                </div>
                <div className="p-4 border-b border-dark-border hover:bg-dark-surface">
                  <p className="text-sm text-dark-text">새로운 리포트가 생성되었습니다.</p>
                  <p className="text-xs text-dark-text-secondary mt-1">1시간 전</p>
                </div>
              </div>
              <div className="p-2 border-t border-dark-border">
                <button className="w-full text-sm text-mint-400 hover:text-mint-300 text-center py-2">
                  모두 확인
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 사용자 메뉴 */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-dark-card transition-colors"
          >
            <div className="w-8 h-8 bg-mint-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name.charAt(0)}
            </div>
            <span className="text-dark-text">{user?.name}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-dark-card border border-dark-border rounded-lg shadow-lg z-50">
              <Link
                to="/admin/my-account"
                className="block px-4 py-2 text-dark-text hover:bg-dark-surface transition-colors"
                onClick={() => setShowUserMenu(false)}
              >
                내 정보
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-dark-text hover:bg-dark-surface transition-colors"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

