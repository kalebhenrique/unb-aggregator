import * as React from 'react';
import { cn } from '../utils/cn';
import type { LucideIcon } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: React.ReactNode;
  variant?: 'yellow' | 'green' | 'blue' | 'neutral' | 'destructive';
}

export const Alert: React.FC<AlertProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'yellow',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    yellow: 'bg-[#FFF9D2] border-black text-black',
    green: 'bg-[#E6F8EE] border-black text-black',
    blue: 'bg-[#EBF3FF] border-black text-black',
    neutral: 'bg-white border-black text-black',
    destructive: 'bg-[#FFEBEB] border-black text-black',
  };

  const iconStyles = {
    yellow: 'bg-white text-black',
    green: 'bg-white text-[#006633]',
    blue: 'bg-white text-[#003366]',
    neutral: 'bg-white text-black',
    destructive: 'bg-[#FF4D4F] text-white',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3.5 p-4 border-2 border-black rounded-xl shadow-[3px_3px_0px_0px_#000]',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {Icon ? (
        <div
          className={cn(
            'p-2 border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] shrink-0',
            iconStyles[variant]
          )}
        >
          <Icon className="w-4 h-4 stroke-[2.5]" />
        </div>
      ) : null}
      <div className="flex flex-col flex-1 min-w-0">
        <h4 className="text-xs font-black uppercase tracking-tight text-black">{title}</h4>
        {description ? (
          typeof description === 'string' ? (
            <p className="text-xs font-semibold text-neutral-800 mt-1 leading-relaxed">{description}</p>
          ) : (
            <div className="text-xs font-semibold text-neutral-800 mt-1 leading-relaxed">{description}</div>
          )
        ) : null}
        {children}
      </div>
    </div>
  );
};
