import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/services/api';
import { useToastStore } from '@/components/common/Toast';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { LoadingSpinner } from '@/components/common/Loading';

export function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuthStore();
  const { addToast } = useToastStore();
  
  // 로그인 페이지는 항상 표시 (인증 상태와 관계없이)
  // 사용자가 명시적으로 로그인 페이지로 접근한 경우 로그인 화면을 보여줌
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    }
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await authApi.login({ email, password });
      login(response.token, response.user);
      addToast('로그인 성공', 'success');
      navigate('/admin/dashboard');
    } catch (error) {
      addToast(error instanceof Error ? error.message : '로그인에 실패했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg-900">
      <div className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-[34px] h-[34px] rounded-[10px] bg-gradient-to-br from-white/20 to-transparent bg-[linear-gradient(135deg,#24ACFF,#0065FA)] flex items-center justify-center shadow-[0_0_18px_rgba(37,99,235,0.9)]">
              <div className="w-4 h-4 rounded-[6px] border-2 border-[rgba(15,23,42,0.9)] opacity-90"></div>
            </div>
            <h1 className="text-3xl font-bold text-brand-400">BDGen</h1>
          </div>
          <h2 className="text-2xl font-bold text-dark-text-100 mb-2">내 근무 증명</h2>
          <p className="text-dark-text-400">관리자 모드</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="이메일"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            placeholder="admin@bdgen.co.kr"
            disabled={isLoading}
            autoFocus
          />

          <Input
            label="비밀번호"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            placeholder="비밀번호를 입력하세요"
            disabled={isLoading}
          />

          <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
            로그인
          </Button>
        </form>

        <div className="mt-8 p-4 bg-dark-surface-850 rounded-bdg-10 border border-[#444444] shadow-bdg">
          <p className="text-sm text-dark-text-400 mb-2">테스트 계정:</p>
          <div className="text-xs text-dark-text-400 space-y-1">
            <p>Super Admin: superadmin@bdgen.co.kr / pass1234</p>
            <p>Admin: admin@bdgen.co.kr / pass1234</p>
          </div>
        </div>
      </div>
    </div>
  );
}


