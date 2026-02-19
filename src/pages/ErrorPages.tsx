import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-mint-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-dark-text mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-dark-text-secondary mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link to="/admin/dashboard">
          <Button>대시보드로 이동</Button>
        </Link>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold text-dark-text mb-4">접근 권한이 없습니다</h2>
        <p className="text-dark-text-secondary mb-8">
          이 페이지에 접근할 권한이 없습니다.
        </p>
        <Link to="/admin/dashboard">
          <Button>대시보드로 이동</Button>
        </Link>
      </div>
    </div>
  );
}








