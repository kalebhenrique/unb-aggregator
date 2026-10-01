import * as React from 'react';
import { cn } from '../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'accent' | 'yellow' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Efeito de botão macio: repouso (3px 3px), hover desce metade (1.5px 1.5px), active desce até o fim (3px 3px, shadow-none)
    const baseStyles =
      'cursor-pointer inline-flex items-center justify-center gap-2 font-bold tracking-wide select-none border-2 border-black rounded-xl translate-x-0 translate-y-0 shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all duration-150 ease-out disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[3px_3px_0px_0px_#000] disabled:active:translate-x-0 disabled:active:translate-y-0';

    const variantStyles = {
      // Cor predominante oficial da UnB: Azul #003366
      default: 'bg-[#003366] text-white hover:bg-[#004080]',
      primary: 'bg-[#006633] text-white hover:bg-[#007A3D]',
      accent: 'bg-[#003366] text-white hover:bg-[#004080]',
      yellow: 'bg-[#FFE600] text-black hover:bg-[#FFF066]',
      destructive: 'bg-[#FF4D4F] text-white hover:bg-[#FF7875]',
      outline: 'bg-white text-black hover:bg-neutral-100',
      ghost:
        'bg-transparent text-black border-transparent shadow-none hover:bg-neutral-200 hover:shadow-none hover:translate-x-0 hover:translate-y-0 active:translate-x-[1px] active:translate-y-[1px]',
    };

    const sizeStyles = {
      sm: 'h-8 px-3.5 text-xs rounded-lg',
      md: 'h-10 px-5 text-sm rounded-xl',
      lg: 'h-12 px-7 text-base rounded-2xl',
      icon: 'h-10 w-10 p-0 rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block animate-spin border-2 border-current border-t-transparent rounded-full h-4 w-4" />
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
