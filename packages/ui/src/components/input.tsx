import * as React from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-xs font-bold text-neutral-800">
            {label}
          </label>
        ) : null}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full bg-white px-4 py-2.5 text-sm font-medium text-black placeholder:text-neutral-400 border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#468AFB] transition-all disabled:opacity-50 disabled:bg-neutral-100',
            error && 'border-red-600 ring-red-600',
            className
          )}
          {...props}
        />
        {error ? <span className="text-xs font-bold text-red-600 mt-0.5">{error}</span> : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
