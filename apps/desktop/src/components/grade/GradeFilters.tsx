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
import { RefreshCw, ShieldCheck } from 'lucide-react';
import type { Department } from '@unb-aggregator/core';
import { DepartmentSelect } from './DepartmentSelect';

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
}) => {
  const selectedDeptName = React.useMemo(
    () => departments.find((d) => d.id === selectedDeptId)?.name,
    [departments, selectedDeptId]
  );

  // Apenas o semestre atual e o seguinte (ex.: hoje = out/2026 -> 2026.2 e 2027.1)
  const semesterOptions = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const p = now.getMonth() <= 5 ? '1' : '2';
    const current = `${y}-${p}`;
    const next = p === '1' ? `${y}-2` : `${y + 1}-1`;
    const stored = `${year}-${period}`;
    return Array.from(new Set([stored, current, next])).map((v) => {
      const [yy, pp] = v.split('-');
      return { value: v, label: `${yy} • ${pp === '1' ? '1º semestre' : '2º semestre'}` };
    });
  }, [year, period]);

  return (
    <Card className="rounded-xl p-4 space-y-4">
      {/* Cabeçalho da seção de busca */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-white border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] shrink-0">
            <RefreshCw className="w-4 h-4 stroke-[2.5] text-neo-blue" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold tracking-tight text-black">
              Buscar turmas no SIGAA
            </h3>
            <p className="text-[11px] font-semibold text-neutral-600">
              Escolha o semestre e o departamento para carregar a oferta de turmas.
            </p>
          </div>
        </div>
      </div>

      {/* Parâmetros da coleta: semestre letivo + departamento + ação */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        {/* Semestre letivo: ano + período agrupados sob um rótulo único */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
            Semestre letivo
          </span>
          <Select
            value={`${year}-${period}`}
            items={semesterOptions}
            onValueChange={(val) => {
              if (!val) return;
              const [y, p] = val.split('-');
              onSelectYear(y);
              onSelectPeriod(p);
            }}
          >
            <SelectTrigger className="rounded-lg">
              <SelectValue placeholder="Semestre">
                {semesterOptions.find((o) => o.value === `${year}-${period}`)?.label}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="rounded-lg border-2 border-black bg-canvas shadow-none">
              {semesterOptions.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Departamento com busca interna */}
        <div className="md:col-span-6 flex flex-col gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500">
            Departamento
          </span>
          <DepartmentSelect
            departments={departments}
            value={selectedDeptId}
            onChange={onSelectDeptId}
          />
        </div>

        {/* Ação: coletar a oferta do SIGAA para os parâmetros escolhidos */}
        <div className="md:col-span-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-black uppercase tracking-wider text-neutral-500 invisible">
            Ação
          </span>
          <Button
            type="button"
            variant="primary"
            size="md"
            className="w-full rounded-lg mb-[3px]"
            isLoading={isScraping}
            onClick={onFetchClasses}
          >
            {!isScraping ? <RefreshCw className="w-3.5 h-3.5 stroke-[2.5]" /> : null}
            <span>{isScraping ? 'Consultando…' : 'Buscar no SIGAA'}</span>
          </Button>
        </div>
      </div>

      {/* Linha de confiança: onde os dados vivem */}
      <div className="pt-3 border-t-2 border-black/10 flex items-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5] text-neutral-400 shrink-0" />
        <span className="text-xs font-semibold text-neutral-500">
          As turmas vêm do SIGAA e ficam salvas apenas no seu computador.
        </span>
      </div>
    </Card>
  );
};
