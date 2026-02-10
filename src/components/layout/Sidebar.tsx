import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/components/common/Toast';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface SubMenuItem {
  path: string;
  label: string;
  minLevel?: number;
}

interface MenuItem {
  path?: string;
  label: string;
  icon?: React.ReactNode;
  minLevel?: number; // 최소 레벨 (이 레벨 이상만 표시)
  children?: SubMenuItem[]; // 하위메뉴
}

const menuItems: MenuItem[] = [
  { path: '/admin/dashboard', label: '대시보드' },
  { path: '/admin/attendances', label: '전사 근태 관리' },
  {
    label: '직원 관리',
    children: [
      { path: '/admin/employees', label: '직원목록' },
      { path: '/admin/employees/add', label: '직원등록' },
    ],
  },
  {
    label: '시스템 운영',
    children: [
      { path: '/admin/activity-logs', label: '활동로그' },
      { path: '/admin/settings', label: '시스템 설정', minLevel: 1 }, // Super Admin만
    ],
  },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useToastStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // 하위메뉴가 활성화되어 있을 때 자동으로 확장
  useEffect(() => {
    const newExpandedMenus: string[] = [];
    menuItems.forEach((item) => {
      if (item.children) {
        const isSubActive = item.children.some((child) => location.pathname === child.path);
        if (isSubActive && !expandedMenus.includes(item.label)) {
          newExpandedMenus.push(item.label);
        }
      }
    });
    if (newExpandedMenus.length > 0) {
      setExpandedMenus((prev) => [...prev, ...newExpandedMenus]);
    }
  }, [location.pathname]);

  const filteredMenuItems = menuItems.filter((item) => {
    if (item.minLevel && (!user || user.level > item.minLevel)) {
      return false;
    }
    if (item.children) {
      // 하위메뉴가 있는 경우, 하위메뉴 중 하나라도 접근 가능하면 표시
      return item.children.some(
        (child) => !child.minLevel || (user && user.level <= child.minLevel)
      );
    }
    return true;
  });

  const isMenuExpanded = (label: string) => {
    return expandedMenus.includes(label);
  };

  const toggleMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isSubMenuActive = (children?: SubMenuItem[]) => {
    if (!children) return false;
    return children.some((child) => location.pathname === child.path);
  };

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
          'fixed lg:static inset-y-0 left-0 z-50 w-[260px] transform transition-transform duration-300 ease-in-out',
          'bg-gradient-to-b from-[rgba(15,23,42,0.98)] to-[rgba(2,6,23,0.98)]',
          'bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.3),transparent_55%)]',
          'border-r border-[#444444] shadow-[0_10px_30px_rgba(15,23,42,0.9)]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-full flex flex-col p-6 gap-6">
          {/* 브랜드 */}
          <div>
            <div className="flex gap-2.5 items-center mb-6">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-white/20 to-transparent bg-[linear-gradient(135deg,#24ACFF,#0065FA)] flex items-center justify-center shadow-[0_0_18px_rgba(37,99,235,0.9)]">
                <div className="w-4 h-4 rounded-[6px] border-2 border-[rgba(15,23,42,0.9)] opacity-90"></div>
              </div>
              <div>
                <div className="font-bold text-[15px] tracking-wide text-dark-text-100">BDGen</div>
                <div className="text-[11px] text-dark-text-400">내 근무의 증명 · Portal</div>
              </div>
            </div>
            <div>
              <div className="text-[11px] text-dark-text-400 mb-1 mt-3">현재 역할</div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-br from-[rgba(59,130,246,0.35)] to-[rgba(56,189,248,0.18)] text-[#E0F2FE] text-[11px] shadow-[0_0_18px_rgba(37,99,235,0.7)]">
                {user?.level === 1 ? 'Super Admin' : user?.level === 2 ? 'Admin' : 'User'} · {user?.level === 1 ? '최고관리자' : user?.level === 2 ? '관리자' : '직원'}
              </div>
            </div>
          </div>

          {/* 네비게이션 */}
          <div className="flex-1">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase mb-1.5 mt-2.5">관리자 메뉴</div>
            <nav className="flex flex-col gap-1">
              {filteredMenuItems.map((item) => {
                const hasChildren = item.children && item.children.length > 0;
                const isActive = item.path ? location.pathname === item.path : false;
                const isSubActive = isSubMenuActive(item.children);
                const isExpanded = isMenuExpanded(item.label);
                const filteredChildren = item.children?.filter(
                  (child) => !child.minLevel || (user && user.level <= child.minLevel)
                );

                if (hasChildren) {
                  return (
                    <div key={item.label}>
                      <button
                        onClick={() => toggleMenu(item.label)}
                        className={clsx(
                          'w-full text-left text-[13px] px-3 py-2.5 rounded-[10px] cursor-pointer',
                          'flex justify-between items-center transition-all duration-150',
                          'text-dark-text-400 hover:bg-[rgba(15,23,42,0.9)] hover:text-[#E5E7EB] hover:shadow-[0_0_14px_rgba(37,99,235,0.45)] hover:-translate-y-px'
                        )}
                      >
                        <span>{item.label}</span>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {isExpanded && filteredChildren && (
                        <div className="ml-4 mt-1 flex flex-col gap-1">
                          {filteredChildren.map((child) => {
                            const isChildActive = location.pathname === child.path;
                            return (
                              <Link
                                key={child.path}
                                to={child.path}
                                onClick={onClose}
                                className={clsx(
                                  'w-full text-left text-[12px] px-3 py-2 rounded-[10px] cursor-pointer',
                                  'flex items-center transition-all duration-150',
                                  isChildActive
                                    ? 'bg-gradient-to-br from-[rgba(37,99,235,0.9)] to-[rgba(56,189,248,0.8)] text-[#F9FAFB] font-semibold shadow-bdg-glow'
                                    : 'text-dark-text-400 hover:bg-[rgba(15,23,42,0.9)] hover:text-[#E5E7EB]'
                                )}
                              >
                                <span className="ml-2">{child.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.path}
                    to={item.path!}
                    onClick={onClose}
                    className={clsx(
                      'w-full text-left text-[13px] px-3 py-2.5 rounded-[10px] cursor-pointer',
                      'flex justify-between items-center transition-all duration-150',
                      isActive
                        ? 'bg-gradient-to-br from-[rgba(37,99,235,0.9)] to-[rgba(56,189,248,0.8)] text-[#F9FAFB] font-semibold shadow-bdg-glow'
                        : 'text-dark-text-400 hover:bg-[rgba(15,23,42,0.9)] hover:text-[#E5E7EB] hover:shadow-[0_0_14px_rgba(37,99,235,0.45)] hover:-translate-y-px'
                    )}
                  >
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* 푸터 */}
          <div className="mt-auto text-[11px] text-dark-text-400 border-t border-[#444444] pt-2.5">
            <div className="mb-2">
              <p>권한 레벨: {user?.level === 1 ? 'Super Admin' : user?.level === 2 ? 'Admin' : 'User'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 bg-[rgba(15,23,42,0.9)] hover:bg-[rgba(31,41,55,0.9)] text-dark-text-400 hover:text-[#E5E7EB] border border-[#444444] rounded-bdg-10 transition-colors text-sm font-medium flex items-center justify-center gap-2"
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

