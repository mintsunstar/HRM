import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold rounded-bdg-10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg-900';
  
  const variantStyles = {
    primary: 'bg-gradient-to-br from-brand-400 to-brand-500 hover:opacity-90 text-white focus:ring-brand-400 shadow-[0_0_18px_rgba(37,99,235,0.5)] border border-[#444444]',
    secondary: 'bg-dark-surface-850 hover:bg-dark-surface-800 text-dark-text-100 focus:ring-dark-line-700 border border-[#444444]',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 border border-[#444444]',
    ghost: 'bg-[rgba(148,163,184,.12)] hover:bg-[rgba(148,163,184,.18)] text-dark-text-100 focus:ring-dark-line-700 border border-[#444444]',
  };
  
  const sizeStyles = {
    sm: 'px-3.5 py-2 text-sm',
    md: 'px-3.5 py-2.5 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        (disabled || isLoading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          처리 중...
        </span>
      ) : (
        children
      )}
    </button>
  );
}


