import React from 'react';
import { Card, Button, Badge, Tabs } from '@unb-aggregator/ui';
import { BookOpen, Trash2, Sparkles, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ScrapedClass } from '@unb-aggregator/core';
import { SHIFT_TABS, DISCIPLINE_COLORS, type DisciplineColor } from './types';

export interface SelectedClassesCardProps {
  selectedClasses: ScrapedClass[];
  disciplineColorMap: Map<string, DisciplineColor>;
  onClearGrade: () => void;
  onRemoveClass: (id: string) => void;
  shiftFilter: 'ALL' | 'M' | 'T' | 'N';
  onShiftFilterChange: (shift: 'ALL' | 'M' | 'T' | 'N') => void;
  onGenerateCombinations: () => void;
  onSaveGrade: () => void;
  isSolving: boolean;
  isSaving: boolean;
  scheduleOptionsCount: number;
  currentOptionIndex: number;
  onApplyOption: (index: number) => void;
}

export const SelectedClassesCard: React.FC<SelectedClassesCardProps> = ({
  selectedClasses,
  disciplineColorMap,
  onClearGrade,
  onRemoveClass,
  shiftFilter,
  onShiftFilterChange,
  onGenerateCombinations,
  onSaveGrade,
  isSolving,
  isSaving,
  scheduleOptionsCount,
  currentOptionIndex,
  onApplyOption,
}) => {
  return (
    <Card className="rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#468AFB] stroke-[2.5]" />
          <h3 className="text-xs font-black uppercase text-black">
            Minhas Disciplinas ({selectedClasses.length})
          </h3>
        </div>
        {selectedClasses.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearGrade}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 text-[10px] h-7 px-2 rounded-lg"
          >
            <Trash2 className="w-3 h-3 stroke-[2.5]" />
            Limpar
          </Button>
        ) : null}
      </div>

      {selectedClasses.length === 0 ? (
        <p className="text-xs font-semibold text-neutral-500 text-center py-4 bg-[#F8FAFC] border-2 border-dashed border-black/25 rounded-xl">
          Nenhuma disciplina adicionada. Escolha turmas no catálogo abaixo.
        </p>
      ) : (
        <div className="space-y-2">
          {selectedClasses.map((cls) => {
            const color = disciplineColorMap.get(cls.disciplineCode) || DISCIPLINE_COLORS[0];
            return (
              <div
                key={cls.id}
                className={`p-2.5 rounded-xl border-2 ${color.border} ${color.bg} flex items-center justify-between gap-2 shadow-[2px_2px_0px_0px_#000]`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-xs text-black">{cls.disciplineCode}</span>
                    <Badge variant="neutral" size="sm">
                      T{cls.classCode}
                    </Badge>
                    <Badge variant="neutral" size="sm" className="font-mono text-[10px]">
                      {cls.scheduleCode}
                    </Badge>
                  </div>
                  <p className="text-[11px] font-bold text-neutral-800 truncate mt-0.5">
                    {cls.disciplineName}
                  </p>
                  <p className="text-[10px] font-semibold text-neutral-600 truncate">
                    {cls.classroom}
                    {cls.scheduleDescription ? ` • ${cls.scheduleDescription}` : ''}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveClass(cls.id)}
                  title="Remover da grade"
                  className="h-8 w-8 text-neutral-600 hover:text-red-600 hover:bg-white shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Ações do Gerador Automático de Horários */}
      <div className="pt-3 border-t-2 border-black/10 space-y-3">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-black block mb-1.5">
            Filtro de Turno para Combinações:
          </span>
          <Tabs
            items={SHIFT_TABS}
            activeId={shiftFilter}
            onChange={(id) => onShiftFilterChange(id as 'ALL' | 'M' | 'T' | 'N')}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onGenerateCombinations}
            disabled={selectedClasses.length === 0 || isSolving}
            isLoading={isSolving}
            className="flex-1"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Gerar Combinações</span>
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onSaveGrade}
            disabled={selectedClasses.length === 0 || isSaving}
            isLoading={isSaving}
            title="Salvar no SQLite"
          >
            <Save className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Salvar</span>
          </Button>
        </div>

        {/* Navegação entre combinações geradas */}
        {scheduleOptionsCount > 1 ? (
          <div className="flex items-center justify-between p-2 bg-[#F8FAFC] border-2 border-black rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_#000]">
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentOptionIndex === 0}
              onClick={() => onApplyOption(currentOptionIndex - 1)}
              className="h-7 w-7 rounded-lg"
            >
              <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            </Button>

            <span className="font-black text-[#468AFB]">
              Opção {currentOptionIndex + 1} de {scheduleOptionsCount}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={currentOptionIndex === scheduleOptionsCount - 1}
              onClick={() => onApplyOption(currentOptionIndex + 1)}
              className="h-7 w-7 rounded-lg"
            >
              <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Button>
          </div>
        ) : null}
      </div>
    </Card>
  );
};
