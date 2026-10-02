import React from 'react';
import { FeedItemCard } from '../components/FeedItemCard';
import { useFeed } from '../hooks/useFeed';
import { Tabs, PageContainer } from '@unb-aggregator/ui';
import { Search, Inbox } from 'lucide-react';
import type { PlatformType, FeedItemType } from '@unb-aggregator/core';

export const DashboardScreen: React.FC = () => {
  const {
    items,
    isLoading,
    selectedPlatform,
    setSelectedPlatform,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    toggleTaskCompleted,
  } = useFeed();

  const platformTabs = [
    { id: 'all', label: 'Todas' },
    { id: 'sigaa', label: 'Sigaa' },
    { id: 'aprender3', label: 'Aprender 3' },
    { id: 'moodlemat', label: 'MoodleMat' },
    { id: 'teams', label: 'Teams' },
  ];

  const typeTabs = [
    { id: 'all', label: 'Tudo' },
    { id: 'assignment', label: 'Tarefas' },
    { id: 'post', label: 'Avisos' },
  ];

  return (
    <PageContainer>
      {/* Barra de Filtros e Busca (Sem título conforme solicitado) */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[3px_3px_0px_0px_#000] space-y-4">
        {/* Campo de Busca Textual */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por disciplina, título da tarefa, aviso ou professor..."
            className="w-full bg-[#FAF7EE] pl-10 pr-4 py-2.5 text-sm font-bold text-black border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-[#003366] focus:bg-white transition-all placeholder:text-neutral-500 shadow-[2px_2px_0px_0px_#000]"
          />
        </div>

        {/* Linha de Filtros por Plataforma e Tipo */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
          {/* Filtro por Plataforma */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
              Plataformas:
            </span>
            <Tabs
              items={platformTabs}
              activeId={selectedPlatform}
              onChange={(id) => setSelectedPlatform(id as PlatformType | 'all')}
            />
          </div>

          {/* Filtro por Tipo */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-600 block">
              Categoria:
            </span>
            <Tabs
              items={typeTabs}
              activeId={selectedType}
              onChange={(id) => setSelectedType(id as FeedItemType | 'all')}
            />
          </div>
        </div>
      </div>

      {/* Lista do Feed Cronológico */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000]">
          <div className="inline-block animate-spin border-3 border-[#003366] border-t-transparent rounded-full h-8 w-8 mb-3" />
          <p className="text-sm font-black uppercase tracking-wider text-black">
            Atualizando Feed Acadêmico...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000] space-y-3">
          <div className="w-12 h-12 bg-[#FAF7EE] border-2 border-black rounded-xl flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#000]">
            <Inbox className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h4 className="text-lg font-black uppercase text-black">Nenhum item encontrado</h4>
          <p className="text-xs font-semibold text-neutral-600 max-w-sm mx-auto">
            Não há avisos ou tarefas correspondentes aos filtros selecionados. Clique em "Sincronizar" na barra lateral para atualizar os portais.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-neutral-600 px-1">
            <span>Feed Unificado ({items.length} itens encontrados)</span>
            <span>Ordenado Cronologicamente</span>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <FeedItemCard
                key={item.id}
                item={item}
                onToggleComplete={toggleTaskCompleted}
              />
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
};
