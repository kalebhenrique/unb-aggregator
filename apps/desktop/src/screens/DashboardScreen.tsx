import React, { useEffect, useState } from 'react';
import { FeedList } from '../components/feed/FeedList';
import { useFeed } from '../hooks/useFeed';
import { Card, Pagination, Tabs, PageContainer, PageHeader, Button } from '@unb-aggregator/ui';
import { Search, Inbox, Home, EyeOff, Eye } from 'lucide-react';
import { toast } from '../components/ui/toast';
import type { PlatformType, FeedItemType } from '@unb-aggregator/core';

export const DashboardScreen: React.FC = () => {
  const {
    items,
    disciplines,
    isLoading,
    selectedPlatform,
    setSelectedPlatform,
    selectedType,
    setSelectedType,
    searchQuery,
    setSearchQuery,
    showHidden,
    setShowHidden,
    toggleTaskCompleted,
    hideFeedItem,
  } = useFeed();

  // Paginação client-side do feed: 25 itens por página, volta à 1ª página quando filtros mudam
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
  }, [selectedPlatform, selectedType, searchQuery, showHidden]);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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

  const handleHide = async (id: string) => {
    await hideFeedItem(id, true);
    toast.add({
      title: 'Item ocultado',
      description: 'O item foi ocultado do seu feed com sucesso.',
      type: 'info',
      timeout: 5000,
    });
  };

  const handleRestore = async (id: string) => {
    await hideFeedItem(id, false);
    toast.add({
      title: 'Item restaurado',
      description: 'O item retornou ao seu feed visível.',
      type: 'success',
      timeout: 4000,
    });
  };

  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader icon={Home} title="Início" />

      {/* Barra de Filtros e Busca */}
      <div className="bg-white border-2 border-black rounded-lg p-5 shadow-[4px_4px_0px_0px_#000] space-y-4">
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

        {/* Linha de Filtros por Plataforma, Tipo e Ocultos */}
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

          {/* Filtro por Tipo e Botão de Ocultos */}
          <div className="flex flex-wrap items-end gap-3">
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

            <Button
              type="button"
              variant={showHidden ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowHidden(!showHidden)}
              title={showHidden ? 'Ver feed regular' : 'Ver itens que você ocultou'}
              className={`cursor-pointer flex items-center gap-1.5 text-xs font-bold h-[34px] ${
                showHidden
                  ? 'bg-neutral-800 text-white hover:bg-black'
                  : 'bg-white text-neutral-700 hover:text-black'
              }`}
            >
              {showHidden ? (
                <>
                  <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Ver Feed Ativo</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Itens Ocultos</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Banner se estiver visualizando itens ocultos */}
      {showHidden ? (
        <div className="bg-neutral-100 border-2 border-black rounded-lg p-3 flex items-center justify-between gap-2 shadow-[4px_4px_0px_0px_#000]">
          <div className="flex items-center gap-2">
            <EyeOff className="w-4 h-4 text-neutral-600 stroke-[2.5]" />
            <span className="text-xs font-bold text-black">
              Você está visualizando os itens que ocultou. Clique em "Restaurar" para devolvê-los ao feed ativo.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowHidden(false)}
            className="cursor-pointer text-xs font-bold"
          >
            Sair dos Ocultos
          </Button>
        </div>
      ) : null}

      {/* Lista do Feed Cronológico */}
      {isLoading ? (
        <div className="p-12 text-center bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000]">
          <div className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full h-8 w-8 mb-3" />
          <p className="text-sm font-bold text-black">
            Atualizando Feed Acadêmico...
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000] space-y-3">
          <div className="w-12 h-12 bg-canvas border-2 border-black rounded-lg flex items-center justify-center mx-auto shadow-[2px_2px_0px_0px_#000]">
            <Inbox className="w-6 h-6 stroke-[2.5] text-neo-blue" />
          </div>
          <h3 className="text-lg font-bold text-black">
            {showHidden ? 'Nenhum item oculto encontrado' : 'Nenhum item encontrado'}
          </h3>
          <p className="text-xs font-medium text-neutral-600 max-w-sm mx-auto">
            {showHidden
              ? 'Você ainda não ocultou nenhum aviso ou tarefa.'
              : 'Não há avisos ou tarefas correspondentes aos filtros selecionados. Clique em "Sincronizar" na barra lateral para atualizar os portais.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
            <span>
              {showHidden ? 'Itens Ocultados' : 'Feed Unificado'} ({items.length} {items.length === 1 ? 'item' : 'itens'})
            </span>
            <span>Ordenado cronologicamente</span>
          </div>

          <Card className="p-0 overflow-hidden">
            <FeedList
              items={pageItems}
              disciplines={disciplines}
              onToggleComplete={toggleTaskCompleted}
              onHide={handleHide}
              onRestore={handleRestore}
            />
          </Card>

          <Pagination page={safePage} pageCount={pageCount} onPageChange={setPage} />
        </div>
      )}
    </PageContainer>
  );
};
