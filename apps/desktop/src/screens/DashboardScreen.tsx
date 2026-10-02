import React from 'react';
import { FeedItemCard } from '../components/FeedItemCard';
import { useFeed } from '../hooks/useFeed';
import { Tabs, PageContainer, PageHeader } from '@unb-aggregator/ui';
import { Search, Inbox, Home } from 'lucide-react';
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
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader icon={Home} title="Início" />

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border-2 border-black rounded-2xl p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
        {/* Campo de Busca Textual */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 stroke-[2.5]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por disciplina, título da tarefa, aviso ou professor..."
            aria-label="Buscar no feed"
            className="w-full bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-black border-2 border-black rounded-xl focus:outline-none focus:ring-2 focus:ring-neo-blue transition-[transform,box-shadow,background-color,border-color] placeholder:text-neutral-400 shadow-none"
          />
        </div>

        {/* Linha de Filtros por Plataforma e Tipo */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
          {/* Filtro por Plataforma */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-700 block">
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
            <span className="text-xs font-bold text-neutral-700 block">
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
        <div className="p-12 text-center bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
          <div className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full h-8 w-8 mb-3" />
          <p className="text-sm font-bold text-black">
            Atualizando Feed Acadêmico...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="w-12 h-12 bg-canvas border-2 border-black rounded-2xl flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#000]">
            <Inbox className="w-6 h-6 stroke-[2.5] text-neo-blue" />
          </div>
          <h3 className="text-lg font-bold text-black">Nenhum item encontrado</h3>
          <p className="text-xs font-medium text-neutral-600 max-w-sm mx-auto">
            Não há avisos ou tarefas correspondentes aos filtros selecionados. Clique em "Sincronizar" na barra lateral para atualizar os portais.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
            <span>Feed Unificado ({items.length} itens encontrados)</span>
            <span>Ordenado cronologicamente</span>
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
