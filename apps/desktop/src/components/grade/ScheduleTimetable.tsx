import React, { forwardRef } from 'react';
import { Card, Button } from '@unb-aggregator/ui';
import { Download } from 'lucide-react';
import type { ScrapedClass } from '@unb-aggregator/core';
import { DAYS_HEADER, TIME_ROWS, DISCIPLINE_COLORS, type DisciplineColor } from './types';

export interface ScheduleTimetableProps {
  selectedClasses: ScrapedClass[];
  slotOccupancy: Map<string, ScrapedClass[]>;
  disciplineColorMap: Map<string, DisciplineColor>;
  year: string;
  period: string;
  onDownloadPng: () => void;
  isExportingPng: boolean;
}

export const ScheduleTimetable = forwardRef<HTMLDivElement, ScheduleTimetableProps>(
  (
    {
      selectedClasses,
      slotOccupancy,
      disciplineColorMap,
      year,
      period,
      onDownloadPng,
      isExportingPng,
    },
    ref
  ) => {
    return (
      <Card className="p-4 overflow-x-auto" ref={ref}>
        <div className="min-w-[620px] space-y-3">
          {/* Cabeçalho do Card da Grade com Ação de Download */}
          <div className="flex items-center justify-between pb-2 border-b-2 border-black/15">
            <div>
              <h3 className="text-sm font-black uppercase text-[#003366] tracking-tight">
                Universidade de Brasília &bull; Grade Semanal {year}/{period}
              </h3>
              <p className="text-[11px] font-semibold text-neutral-600">
                {selectedClasses.length}{' '}
                {selectedClasses.length === 1
                  ? 'disciplina selecionada'
                  : 'disciplinas selecionadas'}
              </p>
            </div>

            <div className="no-export">
              <Button
                type="button"
                variant="outline"
                onClick={onDownloadPng}
                disabled={selectedClasses.length === 0 || isExportingPng}
                isLoading={isExportingPng}
                title="Baixar grade em PNG"
                aria-label="Baixar grade em PNG"
                className="h-8 w-8 p-0"
              >
                {!isExportingPng && <Download className="w-4 h-4 stroke-[2.5]" />}
              </Button>
            </div>
          </div>

          {/* Cabeçalho dos Dias da Semana */}
          <div className="grid grid-cols-7 gap-1.5 pb-2 border-b-2 border-black text-center text-xs font-black uppercase text-black">
            <div className="p-1.5 text-neutral-500 font-bold text-[11px]">Horário</div>
            {DAYS_HEADER.map((day) => (
              <div
                key={day.id}
                className="p-1.5 bg-[#FAF7EE] border border-black rounded-xl shadow-[1px_1px_0px_0px_#000]"
              >
                <span>{day.short}</span>
              </div>
            ))}
          </div>

          {/* Linhas de Horários (15 slots) */}
          <div className="divide-y divide-black/10 mt-1">
            {TIME_ROWS.map((timeRow) => {
              return (
                <div
                  key={`${timeRow.shift}-${timeRow.period}`}
                  className="grid grid-cols-7 gap-1.5 py-1 items-stretch"
                >
                  {/* Faixa horária na esquerda */}
                  <div className="flex flex-col justify-center items-center text-[10px] font-mono font-bold text-neutral-600 bg-neutral-50 rounded border border-black/15 px-1 py-1">
                    <span className="font-black text-black">
                      {timeRow.shift}
                      {timeRow.period}
                    </span>
                    <span className="text-[9px] tracking-tight">{timeRow.range}</span>
                  </div>

                  {/* 6 Células dos dias (Segunda a Sábado) */}
                  {DAYS_HEADER.map((day) => {
                    const cellKey = `${day.id}-${timeRow.globalIndex}`;
                    const classesInSlot = slotOccupancy.get(cellKey) || [];
                    const isConflictSlot = classesInSlot.length > 1;

                    if (classesInSlot.length === 0) {
                      return (
                        <div
                          key={day.id}
                          className="h-11 rounded-lg border border-dashed border-black/15 bg-neutral-50/50 hover:bg-neutral-100/60 transition-colors"
                        />
                      );
                    }

                    // Se houver conflito nesta célula
                    if (isConflictSlot) {
                      return (
                        <div
                          key={day.id}
                          className="h-11 p-1 rounded-lg border-2 border-red-600 bg-red-100 text-red-700 shadow-[1px_1px_0px_0px_#000] flex flex-col justify-center items-center text-center animate-pulse"
                          title={`Conflito: ${classesInSlot.map((c) => c.disciplineCode).join(' vs ')}`}
                        >
                          <span className="text-[9px] font-black uppercase">Conflito!</span>
                          <span className="text-[8px] font-bold truncate">
                            {classesInSlot.map((c) => c.disciplineCode).join('/')}
                          </span>
                        </div>
                      );
                    }

                    // Célula preenchida por 1 disciplina
                    const c = classesInSlot[0];
                    const color = disciplineColorMap.get(c.disciplineCode) || DISCIPLINE_COLORS[0];

                    return (
                      <div
                        key={day.id}
                        className={`h-11 p-1 rounded-lg border-2 ${color.border} ${color.bg} shadow-[1.5px_1.5px_0px_0px_#000] flex flex-col justify-between overflow-hidden`}
                        title={`${c.disciplineCode} - ${c.disciplineName} (Turma ${c.classCode}) - Sala: ${c.classroom}`}
                      >
                        <div className="flex items-center justify-between text-[9px] font-black leading-none">
                          <span className={color.text}>{c.disciplineCode}</span>
                          <span className="text-black bg-white/80 px-1 rounded text-[8px]">
                            T{c.classCode}
                          </span>
                        </div>
                        <span className="text-[8px] font-semibold text-neutral-800 truncate">
                          {c.classroom}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Legenda Resumida das Disciplinas (incluída no PNG exportado) */}
          {selectedClasses.length > 0 ? (
            <div className="pt-3 mt-2 border-t-2 border-black/15">
              <span className="text-[10px] font-black uppercase text-black block mb-1.5">
                Legenda das Disciplinas:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedClasses.map((cls) => {
                  const color = disciplineColorMap.get(cls.disciplineCode) || DISCIPLINE_COLORS[0];
                  return (
                    <div
                      key={cls.id}
                      className="flex items-center gap-2 p-1.5 bg-[#FAF7EE] border border-black/30 rounded-lg text-[10px]"
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-black shrink-0"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span className="font-black text-black">
                        {cls.disciplineCode} (T{cls.classCode}):
                      </span>
                      <span className="truncate text-neutral-700 font-medium">{cls.disciplineName}</span>
                      <span className="text-neutral-500 font-mono ml-auto shrink-0">{cls.classroom}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    );
  }
);

ScheduleTimetable.displayName = 'ScheduleTimetable';
