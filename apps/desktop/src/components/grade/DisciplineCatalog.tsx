import React from "react";
import { Card, Button, Badge } from "@unb-aggregator/ui";
import {
  ChevronDown,
  ChevronUp,
  User,
  MapPin,
  Clock,
  Calendar,
  LibraryBig,
  Search,
} from "lucide-react";
import type { ScrapedDiscipline, ScrapedClass } from "@unb-aggregator/core";

export interface DisciplineCatalogProps {
  filteredDisciplines: ScrapedDiscipline[];
  selectedClasses: ScrapedClass[];
  expandedDisciplines: Record<string, boolean>;
  onToggleExpand: (code: string) => void;
  onToggleClass: (cls: ScrapedClass) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isCatalogLoaded: boolean;
}

export const DisciplineCatalog: React.FC<DisciplineCatalogProps> = ({
  filteredDisciplines,
  selectedClasses,
  expandedDisciplines,
  onToggleExpand,
  onToggleClass,
  searchQuery,
  onSearchChange,
  isCatalogLoaded,
}) => {
  return (
    <Card className="rounded-xl overflow-hidden p-0">
      {/* Header unificado do Catálogo */}
      <div className="px-4 py-3 border-b-2 border-black flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0">
            <LibraryBig className="w-4 h-4 stroke-[2.5] text-neo-blue" />
          </div>
          <h3 className="text-sm font-extrabold tracking-tight text-black whitespace-nowrap">
            Catálogo de disciplinas
          </h3>
          <Badge variant="neutral" size="sm">
            {filteredDisciplines.length}
          </Badge>
        </div>
        {/* Busca do catálogo: junto de quem ela filtra */}
        <div className="relative w-full sm:w-60 shrink">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Buscar disciplina no catálogo"
            placeholder="Filtrar por código ou nome…"
            className="w-full bg-white pl-9 pr-3 h-8 text-xs font-semibold text-black border-2 border-black rounded-lg shadow-none focus:outline-none focus:ring-2 focus:ring-neo-blue placeholder:text-neutral-500 transition-[box-shadow,border-color]"
          />
        </div>
      </div>
      {/* Conteúdo com scroll independente para não esticar a tela */}
      {filteredDisciplines.length === 0 ? (
        <div className="p-8 text-center bg-white space-y-1.5">
          <div className="w-10 h-10 mx-auto bg-pastel-blue border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] flex items-center justify-center">
            <Search className="w-4 h-4 stroke-[2.5] text-neo-blue" />
          </div>
          <p className="text-xs font-extrabold text-black">
            Nenhuma disciplina encontrada
          </p>
          <p className="text-[11px] font-semibold text-neutral-600 max-w-xs mx-auto">
            {isCatalogLoaded
              ? "Nenhuma disciplina corresponde à busca. Tente parte do nome ou do código (ex.: APC)."
              : 'Clique em "Buscar no SIGAA" acima para carregar a oferta do departamento.'}
          </p>
        </div>
      ) : (
        <div className="max-h-[560px] overflow-y-auto divide-y-2 divide-black/10 bg-white">
          {filteredDisciplines.map((discipline) => {
            const isExpanded = expandedDisciplines[discipline.code] ?? false;
            const isDisciplineSelected = selectedClasses.some(
              (c) => c.disciplineCode === discipline.code,
            );

            return (
              <div key={discipline.code} className="transition-colors">
                {/* Cabeçalho da Disciplina (clicável para expandir) */}
                <button
                  type="button"
                  onClick={() => onToggleExpand(discipline.code)}
                  aria-expanded={isExpanded}
                  className="cursor-pointer w-full text-left p-3.5 flex items-start justify-between gap-3 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="outline" size="sm">
                        {discipline.code}
                      </Badge>
                      <span className="text-[11px] font-bold text-neutral-600">
                        {discipline.classes.length}{" "}
                        {discipline.classes.length === 1 ? "turma" : "turmas"}
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

                  <div className="p-1 rounded-lg hover:bg-neutral-200/60 shrink-0 mt-0.5">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                </button>

                {/* Turmas Ofertadas (quando expandido) */}
                {isExpanded ? (
                  <div className="p-3 bg-slate-50 border-t-2 border-black/10 space-y-2.5">
                    {discipline.classes.map((cls) => {
                      const isClassSelected = selectedClasses.some(
                        (c) => c.id === cls.id,
                      );

                      return (
                        <div
                          key={cls.id}
                          className={`p-3 rounded-lg border-2 transition-[transform,box-shadow,background-color,border-color] ${
                            isClassSelected
                              ? "border-black bg-pastel-green shadow-[2px_2px_0px_0px_#000]"
                              : "border-black/25 bg-white hover:border-black"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-black">
                                Turma {cls.classCode}
                              </span>
                              {cls.dateRange ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-md border border-black/20">
                                  <Calendar className="w-2.5 h-2.5 text-neutral-500 shrink-0" />
                                  {cls.dateRange}
                                </span>
                              ) : null}
                            </div>
                            <Badge
                              variant="neutral"
                              size="sm"
                              className="font-mono text-xs"
                            >
                              {cls.scheduleCode}
                            </Badge>
                          </div>

                          <div className="space-y-1 text-[11px] font-medium text-neutral-700">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span className="truncate">
                                {cls.teachers.join(", ")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <MapPin className="w-3 h-3 text-neutral-500 shrink-0" />
                              <span className="truncate">{cls.classroom}</span>
                            </div>
                            {cls.scheduleDescription ? (
                              <div className="flex items-center gap-1.5 text-neutral-700 font-normal">
                                <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
                                <span className="truncate text-[11px]">
                                  {cls.scheduleDescription}
                                </span>
                              </div>
                            ) : null}
                          </div>

                          <div className="pt-2 mt-2 border-t border-black/10 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-neutral-600">
                              Vagas: {cls.occupied ?? 0}/{cls.vacancies ?? 0}
                            </span>

                            <Button
                              type="button"
                              variant={
                                isClassSelected ? "destructive" : "primary"
                              }
                              size="sm"
                              onClick={() => onToggleClass(cls)}
                              aria-pressed={isClassSelected}
                              className="h-7 px-3 text-[11px] rounded-lg"
                            >
                              {isClassSelected ? "Remover" : "+ Adicionar"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
