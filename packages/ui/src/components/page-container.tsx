import * as React from 'react';
import { cn } from '../utils/cn';

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn('w-full max-w-6xl mx-auto space-y-6 pb-12 select-none', className)} {...props}>
      {children}
    </div>
  );
};
