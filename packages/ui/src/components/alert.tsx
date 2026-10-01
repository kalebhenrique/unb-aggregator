import * as React from 'react';
import { cn } from '../utils/cn';
import type { LucideIcon } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description: string;
  variant?: 'yellow' | 'green' | 'blue' | 'neutral';
}

export const Alert: React.FC<AlertProps> = ({
  icon: Icon,
  title,
  description,
  variant = 'yellow',
  className,
  ...props
}) => {
  const variantStyles = {
    yellow: 'bg-[#FFF9D2] border-black',
    green: 'bg-[#E6F8EE] border-black',
    blue: 'bg-[#EBF3FF] border-black',
    neutral: 'bg-white border-black',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-4 p-4 border-2 border-black rounded-lg shadow-[3px_3px_0px_0px_#000]',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {Icon ? (
        <div className="p-2.5 bg-white border-2 border-black rounded-md shadow-[2px_2px_0px_0px_#000] shrink-0">
          <Icon className="w-5 h-5 text-black stroke-[2.5]" />
        </div>
      ) : null}
      <div className="flex flex-col">
        <h4 className="text-sm font-black uppercase tracking-tight text-black">{title}</h4>
        <p className="text-xs font-semibold text-neutral-800 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
