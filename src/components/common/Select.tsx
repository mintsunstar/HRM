import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, options, disabled, ...props }, ref) => {
    return (
      <div className="w-full relative">
        {label && (
          <label className="block text-xs text-[rgba(224,242,254,.82)] mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          disabled={disabled}
          className={clsx(
            'w-full px-3 py-2.5 rounded-bdg-10 border border-[#444444]',
            'bg-[rgba(2,6,23,.25)] text-dark-text-100',
            'focus:outline-none focus:border-[rgba(56,189,248,.65)] focus:shadow-[0_0_0_3px_rgba(56,189,248,.12)]',
            'appearance-none',
            disabled ? 'cursor-not-allowed opacity-100' : 'cursor-pointer',
            error && 'border-red-500 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,.12)]',
            className
          )}
          style={{
            backgroundImage: disabled 
              ? `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4L6 8L10 4' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`
              : `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2 4L6 8L10 4' stroke='%23E0F2FE' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '40px',
          }}
          onMouseDown={(e) => {
            if (!disabled) {
              e.stopPropagation();
            }
          }}
          onClick={(e) => {
            if (!disabled) {
              e.stopPropagation();
            }
          }}
          onFocus={(e) => {
            if (!disabled) {
              e.stopPropagation();
            }
          }}
          {...props}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';


