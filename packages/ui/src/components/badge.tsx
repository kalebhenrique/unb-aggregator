import * as React from 'react';
import { cn } from '../utils/cn';
import { BookOpen, School, Globe, MessageSquare, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export type PlatformBadgeVariant = 'sigaa' | 'aprender3' | 'moodlemat' | 'teams';
export type BadgeTypeVariant =
  | PlatformBadgeVariant
  | 'assignment'
  | 'post'
  | 'urgent'
  | 'neutral'
  | 'success'
  | 'primary'
  | 'outline';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeTypeVariant;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  showIcon = false,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeTypeVariant, string> = {
    sigaa: 'bg-[#46E297] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    aprender3: 'bg-[#FB923C] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    moodlemat: 'bg-[#C084FC] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    teams: 'bg-[#60A5FA] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    assignment: 'bg-[#FFE600] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    post: 'bg-[#E2E8F0] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    urgent: 'bg-[#FF6B6B] text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    neutral: 'bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    success: 'bg-[#46E297] text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    primary: 'bg-[#468AFB] text-white border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
    outline: 'bg-white text-black border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] rounded-full',
    md: 'px-3 py-0.5 text-xs rounded-full',
  };

  const renderIcon = () => {
    if (!showIcon) return null;
    const iconClass = size === 'sm' ? 'w-3 h-3 shrink-0 stroke-[2.5]' : 'w-3.5 h-3.5 shrink-0 stroke-[2.5]';

    switch (variant) {
      case 'sigaa':
        return <School className={iconClass} />;
      case 'aprender3':
        return <BookOpen className={iconClass} />;
      case 'moodlemat':
        return <Globe className={iconClass} />;
      case 'teams':
        return <MessageSquare className={iconClass} />;
      case 'assignment':
        return <CheckCircle2 className={iconClass} />;
      case 'post':
        return <FileText className={iconClass} />;
      case 'urgent':
        return <AlertCircle className={iconClass} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold select-none tracking-normal',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {renderIcon()}
      {children}
    </span>
  );
};
