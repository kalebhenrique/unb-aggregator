import React from 'react';
import {
  Card,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@unb-aggregator/ui';
import { RefreshCw, Search } from 'lucide-react';
import type { Department } from '@unb-aggregator/core';

export interface GradeFiltersProps {
  departments: Department[];
  selectedDeptId: string;
  onSelectDeptId: (id: string) => void;
  year: string;
  onSelectYear: (year: string) => void;
  period: string;
  onSelectPeriod: (period: string) => void;
  isScraping: boolean;
  onFetchClasses: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  feedbackMessage?: string | null;
}

export const GradeFilters: React.FC<GradeFiltersProps> = ({
  departments,
  selectedDeptId,
  onSelectDeptId,
  year,
  onSelectYear,
  period,
  onSelectPeriod,
  isScraping,
  onFetchClasses,
  searchQuery,
  onSearchChange,
  feedbackMessage,
}) => {
  const departmentItems = React.useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.name })),
    [departments]
  );

  const selectedDeptName = React.useMemo(
    () => departments.find((d) => d.id === selectedDeptId)?.name,
    [departments, selectedDeptId]
  );

  const yearItems = React.useMemo(
    () => [
      { value: '2027', label: '2027' },
      { value: '2026', label: '2026' },
      { value: '2025', label: '2025' },
    ],
    []
  );

  const periodItems = React.useMemo(
    () => [
      { value: '2', label: '2' },
      { value: '1', label: '1' },
    ],
    []
  );

  return (
    <Card className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Seletor de Departamento */}
        <div className="md:col-span-6 lg:col-span-6 flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-black">
            Departamento da UnB
          </label>
          <Select
            value={selectedDeptId}
            items={departmentItems}
            onValueChange={(val) => {
              if (val) onSelectDeptId(val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o departamento">
                {selectedDeptName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ano */}
        <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-black">
            Ano
          </label>
          <Select
            value={year}
            items={yearItems}
            onValueChange={(val) => {
              if (val) onSelectYear(val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ano">{year}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-black">
            Período
          </label>
          <Select
            value={period}
            items={periodItems}
            onValueChange={(val) => {
              if (val) onSelectPeriod(val);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Período">{period}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botão de Raspagem no SIGAA */}
        <div className="md:col-span-2 lg:col-span-2">
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={isScraping}
            onClick={onFetchClasses}
          >
            <RefreshCw className={`w-3.5 h-3.5 stroke-[2.5] ${isScraping ? 'animate-spin' : ''}`} />
            <span>{isScraping ? 'Buscando...' : 'Buscar'}</span>
          </Button>
        </div>
      </div>

      {/* Linha de Busca Rápida e Feedback */}
      <div className="pt-3 border-t-2 border-black/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrar por código ou nome (ex: APC)..."
            className="w-full bg-white pl-9 pr-3 py-2 text-xs font-bold text-black border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] focus:outline-none focus:ring-2 focus:ring-[#003366] placeholder:text-neutral-500 transition-all"
          />
        </div>

        {feedbackMessage ? (
          <span className="text-xs font-bold text-[#006633] truncate">
            {feedbackMessage}
          </span>
        ) : null}
      </div>
    </Card>
  );
};
