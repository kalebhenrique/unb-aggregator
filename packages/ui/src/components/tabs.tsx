import * as React from 'react';
import { cn } from '../utils/cn';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, onChange, className }) => {
  return (
    <div className={cn('flex flex-wrap gap-2.5', className)}>
      {items.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'cursor-pointer px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border-2 border-black select-none transition-all duration-150 ease-out translate-x-0 translate-y-0',
              isActive
                ? 'bg-[#003366] text-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
                : 'bg-white text-neutral-800 hover:bg-neutral-100 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none'
            )}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${isActive ? 'bg-white text-[#003366]' : 'bg-[#003366] text-white'}`}>
                {tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};
