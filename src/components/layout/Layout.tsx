import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-bg-900">
      <Header />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-[26px_22px] lg:ml-0 bg-[radial-gradient(circle_at_0%_100%,rgba(37,99,235,0.18),transparent_60%),radial-gradient(circle_at_100%_0%,rgba(34,211,238,0.16),transparent_55%),linear-gradient(135deg,#020617,#020617)]">
          {/* 모바일 메뉴 버튼 */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mb-4 p-2 text-dark-text-secondary hover:text-dark-text"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          {children}
        </main>
      </div>
    </div>
  );
}


