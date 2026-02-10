import { ReactNode, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string | ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className={`bg-[#0E1629] border border-[#444444] rounded-bdg-10 shadow-bdg ${sizeClasses[size]} w-full mx-4 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => {
          // select 요소나 option 요소, 또는 select 내부 요소가 아닌 경우에만 이벤트 전파 중지
          const target = e.target as HTMLElement;
          const isSelectElement = target.tagName === 'SELECT' || target.tagName === 'OPTION' || target.closest('select');
          if (!isSelectElement) {
            e.stopPropagation();
          }
        }}
        onMouseDown={(e) => {
          // select 요소나 option 요소, 또는 select 내부 요소가 아닌 경우에만 이벤트 전파 중지
          const target = e.target as HTMLElement;
          const isSelectElement = target.tagName === 'SELECT' || target.tagName === 'OPTION' || target.closest('select');
          if (!isSelectElement) {
            e.stopPropagation();
          }
        }}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-[#444444]">
            {title && <h2 className="text-lg font-extrabold text-dark-text-100">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-dark-text-400 hover:text-dark-text-100 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

