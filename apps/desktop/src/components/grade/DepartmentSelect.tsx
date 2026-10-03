import React from 'react';
import { Popover } from '@base-ui/react/popover';
import { Check, ChevronDown, Search } from 'lucide-react';
import type { Department } from '@unb-aggregator/core';

// Busca sem sensibilidade a acentos, maiúsculas ou pontuação ("ciencias" acha "Ciências")
const normalizeText = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export interface DepartmentSelectProps {
  departments: Department[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * Seletor de departamento com busca interna.
 * Gatilho estilo SelectTrigger + popup com campo de pesquisa e lista filtrável.
 */
export const DepartmentSelect: React.FC<DepartmentSelectProps> = ({
  departments,
  value,
  onChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const selectedName = React.useMemo(
    () => departments.find((d) => d.id === value)?.name,
    [departments, value]
  );

  const filtered = React.useMemo(() => {
    const q = normalizeText(query);
    if (!q) return departments;
    return departments.filter((d) => normalizeText(d.name).includes(q));
  }, [departments, query]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <Popover.Root open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery(''); }}>
      <Popover.Trigger
        className="flex h-10 w-full items-center justify-between rounded-lg border-2 border-black bg-white gap-2 px-3 py-2 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-neo-blue transition-[box-shadow,border-color] cursor-pointer select-none"
      >
        <span className="truncate text-left">{selectedName ?? 'Selecione o departamento'}</span>
        <ChevronDown className={`w-4 h-4 stroke-[2.5] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner side="bottom" align="start" sideOffset={6} className="isolate z-50">
          <Popover.Popup className="relative z-50 w-[var(--anchor-width)] min-w-[240px] rounded-xl border-2 border-black bg-canvas text-black outline-none origin-(--transform-origin)">
            {/* Busca interna */}
            <div className="p-2 border-b-2 border-black/10">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filtered.length > 0) {
                      pick(filtered[0].id);
                    }
                  }}
                  placeholder="Pesquisar departamento…"
                  autoFocus
                  className="w-full h-8 bg-white pl-9 pr-3 text-xs font-semibold text-black rounded-lg border-2 border-black focus:outline-none focus:ring-2 focus:ring-neo-blue placeholder:text-neutral-400"
                />
              </div>
            </div>

            {/* Lista filtrável */}
            <div className="p-1 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="p-4 text-center text-xs font-semibold text-neutral-500">
                  Nenhum departamento encontrado
                </p>
              ) : (
                filtered.map((dept) => {
                  const isSelected = dept.id === value;
                  return (
                    <button
                      key={dept.id}
                      type="button"
                      onClick={() => pick(dept.id)}
                      className={`relative flex w-full cursor-pointer select-none items-center gap-2 rounded-lg py-1.5 pr-8 pl-2.5 text-xs font-bold outline-none hover:bg-neo-blue hover:text-white data-[selected=true]:font-extrabold transition-colors`}
                      data-selected={isSelected}
                    >
                      <span className="truncate text-left">{dept.name}</span>
                      {isSelected ? (
                        <Check className="w-4 h-4 stroke-[2.5] absolute right-2" />
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};
