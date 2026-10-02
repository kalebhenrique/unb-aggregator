import React, { useState, useRef, useMemo } from 'react';
import { useGrade } from '../hooks/useGrade';
import { PageContainer, PageHeader, Alert } from '@unb-aggregator/ui';
import { CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { ScrapedClass } from '@unb-aggregator/core';
import { GradeFilters } from '../components/grade/GradeFilters';
import { SelectedClassesCard } from '../components/grade/SelectedClassesCard';
import { DisciplineCatalog } from '../components/grade/DisciplineCatalog';
import { ScheduleTimetable } from '../components/grade/ScheduleTimetable';
import { DISCIPLINE_COLORS } from '../components/grade/types';

export const GradeBuilderScreen: React.FC = () => {
  const {
    departments,
    selectedDeptId,
    setSelectedDeptId,
    year,
    setYear,
    period,
    setPeriod,
    filteredDisciplines,
    searchQuery,
    setSearchQuery,
    selectedClasses,
    conflicts,
    scheduleOptions,
    currentOptionIndex,
    isScraping,
    isSolving,
    isSaving,
    feedbackMessage,
    fetchClasses,
    toggleClass,
    removeClass,
    clearGrade,
    generateCombinations,
    applyOption,
    saveGrade,
  } = useGrade();

  const [expandedDisciplines, setExpandedDisciplines] = useState<Record<string, boolean>>({});
  const [shiftFilter, setShiftFilter] = useState<'ALL' | 'M' | 'T' | 'N'>('ALL');
  const [isExportingPng, setIsExportingPng] = useState(false);
  const scheduleGridRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (code: string) => {
    setExpandedDisciplines((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  // Mapeia disciplinas para cores distintas no grid
  const disciplineColorMap = useMemo(() => {
    const map = new Map<string, (typeof DISCIPLINE_COLORS)[0]>();
    const uniqueCodes = Array.from(new Set(selectedClasses.map((c) => c.disciplineCode)));
    uniqueCodes.forEach((code, index) => {
      map.set(code, DISCIPLINE_COLORS[index % DISCIPLINE_COLORS.length]);
    });
    return map;
  }, [selectedClasses]);

  // Monta mapa de ocupação por slot: `dia-globalIndex` -> ScrapedClass[]
  const slotOccupancy = useMemo(() => {
    const map = new Map<string, ScrapedClass[]>();
    for (const c of selectedClasses) {
      for (const slot of c.scheduleSlots) {
        const key = `${slot.day}-${slot.globalSlotIndex}`;
        const existing = map.get(key) || [];
        existing.push(c);
        map.set(key, existing);
      }
    }
    return map;
  }, [selectedClasses]);

  // Exportar grade horária para imagem PNG em alta resolução (2x retina)
  const handleDownloadPng = async () => {
    if (!scheduleGridRef.current) return;
    try {
      setIsExportingPng(true);
      const dataUrl = await toPng(scheduleGridRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#FFFFFF',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-export')) {
            return false;
          }
          return true;
        },
      });

      const link = document.createElement('a');
      link.download = `grade-unb-${year}-${period}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Falha ao exportar grade para PNG:', error);
    } finally {
      setIsExportingPng(false);
    }
  };

  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader
        icon={CalendarDays}
        title="Montar Grade Horária"
      />

      {/* Barra de Filtros e Coleta do SIGAA */}
      <GradeFilters
        departments={departments}
        selectedDeptId={selectedDeptId}
        onSelectDeptId={setSelectedDeptId}
        year={year}
        onSelectYear={setYear}
        period={period}
        onSelectPeriod={setPeriod}
        isScraping={isScraping}
        onFetchClasses={() => fetchClasses(selectedDeptId, year, period)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        feedbackMessage={feedbackMessage}
      />

      {/* Grid Principal: 2 Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Minhas Matérias e Catálogo de Disciplinas (5 colunas) */}
        <div className="lg:col-span-5 space-y-4">
          <SelectedClassesCard
            selectedClasses={selectedClasses}
            disciplineColorMap={disciplineColorMap}
            onClearGrade={clearGrade}
            onRemoveClass={removeClass}
            shiftFilter={shiftFilter}
            onShiftFilterChange={setShiftFilter}
            onGenerateCombinations={() =>
              generateCombinations(shiftFilter === 'ALL' ? undefined : shiftFilter)
            }
            onSaveGrade={saveGrade}
            isSolving={isSolving}
            isSaving={isSaving}
            scheduleOptionsCount={scheduleOptions.length}
            currentOptionIndex={currentOptionIndex}
            onApplyOption={applyOption}
          />

          <DisciplineCatalog
            filteredDisciplines={filteredDisciplines}
            selectedClasses={selectedClasses}
            expandedDisciplines={expandedDisciplines}
            onToggleExpand={toggleExpand}
            onToggleClass={toggleClass}
          />
        </div>

        {/* Coluna Direita: Alertas de Conflito e Grid Semanal com Exportação PNG (7 colunas) */}
        <div className="lg:col-span-7 space-y-4">
          {conflicts.length > 0 ? (
            <Alert
              variant="destructive"
              icon={AlertTriangle}
              title={`Conflito de Horário Detectado (${conflicts.length})`}
              description={
                <div className="space-y-1">
                  <ul className="list-disc pl-4 space-y-0.5 text-xs font-bold text-red-900">
                    {conflicts.map((conf, i) => (
                      <li key={i}>{conf}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] font-medium pt-1 text-neutral-800">
                    Remova uma das turmas conflitantes ou clique em "Gerar Combinações" para resolver automaticamente.
                  </p>
                </div>
              }
            />
          ) : selectedClasses.length > 0 ? (
            <Alert
              variant="green"
              icon={CheckCircle2}
              title="Grade Válida"
              description="Nenhum conflito de horário detectado na grade atual."
            />
          ) : null}

          <ScheduleTimetable
            ref={scheduleGridRef}
            selectedClasses={selectedClasses}
            slotOccupancy={slotOccupancy}
            disciplineColorMap={disciplineColorMap}
            year={year}
            period={period}
            onDownloadPng={handleDownloadPng}
            isExportingPng={isExportingPng}
          />
        </div>
      </div>
    </PageContainer>
  );
};
