import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Bloco de conteúdo ainda sem tinta: preenchimento neutro com pulso lento.
 * Nunca recebe borda própria — a borda pertence ao adesivo (Card) que o contém.
 */
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn('animate-pulse motion-reduce:animate-none rounded bg-neutral-200', className)}
      {...props}
    />
  )
);
Skeleton.displayName = 'Skeleton';
