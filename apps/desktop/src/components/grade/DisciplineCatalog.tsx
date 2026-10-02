import React from 'react';
import { Card, Button, Badge } from '@unb-aggregator/ui';
import { ChevronDown, ChevronUp, User, MapPin, Clock, Calendar } from 'lucide-react';
import type { ScrapedDiscipline, ScrapedClass } from '@unb-aggregator/core';

export interface DisciplineCatalogProps {
  filteredDisciplines: ScrapedDiscipline[];
  selectedClasses: ScrapedClass[];
  expandedDisciplines: Record<string, boolean>;
  onToggleExpand: (code: string) => void;
  onToggleClass: (cls: ScrapedClass) => void;
}

export const DisciplineCatalog: React.FC<DisciplineCatalogProps> = ({
  filteredDisciplines,
  selectedClasses,
  expandedDisciplines,
  onToggleExpand,
  onToggleClass,
}) => {
  return (
    <div className="space-y-2">
      <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block px-1">
        Catálogo de Disciplinas ({filteredDisciplines.length})
      </span>

      {filteredDisciplines.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-xs font-bold text-neutral-600">
            Nenhuma disciplina encontrada para os filtros aplicados. Clique em "Buscar" acima para carregar o SIGAA.
          </p>
        </Card>
      ) : (
        filteredDisciplines.map((discipline) => {
          const isExpanded = expandedDisciplines[discipline.code] ?? false;
          const isDisciplineSelected = selectedClasses.some(
            (c) => c.disciplineCode === discipline.code
          );

          return (
            <Card key={discipline.code} className="p-3.5">
              {/* Cabeçalho da Disciplina (clicável para expandir) */}
              <button
                type="button"
                onClick={() => onToggleExpand(discipline.code)}
                className="cursor-pointer w-full text-left flex items-start justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" size="sm">
                      {discipline.code}
                    </Badge>
                    <span className="text-[10px] font-bold text-neutral-600">
                      {discipline.classes.length} {discipline.classes.length === 1 ? 'turma' : 'turmas'}
                    </span>
                    {isDisciplineSelected ? (
                      <Badge variant="success" size="sm">
                        Na Grade
                      </Badge>
                    ) : null}
                  </div>
                  <h4 className="text-xs font-black text-black leading-snug">
                    {discipline.name}
                  </h4>
                </div>

                <div className="p-1 rounded-lg hover:bg-neutral-100 shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  )}
                </div>
              </button>

              {/* Turmas Ofertadas (quando expandido) */}
              {isExpanded ? (
                <div className="mt-3 pt-3 border-t-2 border-black/10 space-y-2">
                  {discipline.classes.map((cls) => {
                    const isClassSelected = selectedClasses.some((c) => c.id === cls.id);

                    return (
                      <div
                        key={cls.id}
                        className={`p-2.5 rounded-xl border-2 transition-all ${
                          isClassSelected
                            ? 'border-[#006633] bg-[#E6F8EE] shadow-[2px_2px_0px_0px_#000]'
                            : 'border-black/30 bg-[#FAF7EE] hover:border-black'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-black">
                              Turma {cls.classCode}
                            </span>
                            {cls.dateRange ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-600 bg-white/80 px-2 py-0.5 rounded-md border border-black/20">
                                <Calendar className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
                                {cls.dateRange}
                              </span>
                            ) : null}
                          </div>
                          <Badge variant="neutral" size="sm" className="font-mono text-xs">
                            {cls.scheduleCode}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-[11px] font-medium text-neutral-700">
                          <div className="flex items-center gap-1.5 truncate">
                            <User className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span className="truncate">{cls.teachers.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                            <span className="truncate">{cls.classroom}</span>
                          </div>
                          {cls.scheduleDescription ? (
                            <div className="flex items-center gap-1.5 text-neutral-700 font-normal">
                              <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span className="truncate text-[10px]">{cls.scheduleDescription}</span>
                            </div>
                          ) : null}
                        </div>

                        <div className="pt-2 mt-2 border-t border-black/10 flex items-center justify-between">
                          <span className="text-[10px] font-bold text-neutral-600">
                            Vagas: {cls.occupied ?? 0}/{cls.vacancies ?? 0}
                          </span>

                          <Button
                            type="button"
                            variant={isClassSelected ? 'destructive' : 'primary'}
                            size="sm"
                            onClick={() => onToggleClass(cls)}
                            className="h-7 px-3 text-[11px]"
                          >
                            {isClassSelected ? 'Remover' : '+ Adicionar'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
};
