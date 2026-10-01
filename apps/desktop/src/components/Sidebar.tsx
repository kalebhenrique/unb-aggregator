import React from 'react';
import { Home, BookOpen, Settings, PanelLeftClose, PanelLeftOpen, RefreshCw } from 'lucide-react';

export type NavTab = 'home' | 'courses' | 'settings';

export interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isSyncing?: boolean;
  onSync?: () => void;
  lastSyncedAt?: string | null;
  hasConnectedAccounts?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isSyncing = false,
  onSync,
  lastSyncedAt,
  hasConnectedAccounts = false,
}) => {
  const navItems = [
    { id: 'home' as NavTab, label: 'Home', icon: Home },
    { id: 'courses' as NavTab, label: 'Turmas', icon: BookOpen },
    { id: 'settings' as NavTab, label: 'Configurações', icon: Settings },
  ];

  const formatLastSync = (isoString?: string | null) => {
    if (!isoString) return 'Não sincronizado';
    try {
      const date = new Date(isoString);
      return `Último: ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '';
    }
  };

  return (
    <aside
      className={`group h-screen bg-white border-r-3 border-black flex flex-col justify-between transition-all duration-200 select-none z-20 shrink-0 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Topo da Sidebar */}
      <div>
        {/* Header da Sidebar */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between min-h-[69px]">
          {!isCollapsed ? (
            <>
              {/* Quando expandido: Logo e nome */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 bg-[#006633] text-white border-2 border-black rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-[2px_2px_0px_0px_#000]">
                  UnB
                </div>
                <span className="font-black text-sm uppercase tracking-tight truncate text-[#003366]">
                  Aggregator
                </span>
              </div>

              {/* Botão de Colapsar: só visível no hover-group da sidebar */}
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Recolher barra lateral"
                className="cursor-pointer p-1.5 border-2 border-black rounded-xl bg-white hover:bg-neutral-100 text-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all opacity-0 group-hover:opacity-100"
              >
                <PanelLeftClose className="w-4 h-4 stroke-[2.5]" />
              </button>
            </>
          ) : (
            /* Quando colapsado: normal exibe o ícone da plataforma, no hover-group substitui pelo botão de expandir */
            <div className="w-full flex justify-center">
              {/* Ícone da plataforma (visível por padrão, oculto no hover-group) */}
              <div className="flex group-hover:hidden items-center justify-center">
                <div className="w-9 h-9 bg-[#006633] text-white border-2 border-black rounded-xl flex items-center justify-center font-black text-xs shadow-[2px_2px_0px_0px_#000]">
                  UnB
                </div>
              </div>

              {/* Botão de Expandir (oculto por padrão, substitui o ícone no hover-group) */}
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Expandir barra lateral"
                className="cursor-pointer hidden group-hover:flex w-9 h-9 items-center justify-center border-2 border-black rounded-xl bg-[#003366] text-white shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
              >
                <PanelLeftOpen className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>

        {/* Lista de Navegação */}
        <nav className="p-3">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    title={item.label}
                    className={`cursor-pointer w-full flex items-center select-none transition-colors duration-150 ${
                      isCollapsed
                        ? 'justify-center p-2.5 rounded-xl'
                        : 'gap-3 px-3.5 py-2.5 rounded-xl text-left'
                    } ${
                      isActive
                        ? 'bg-[#003366] text-white font-black'
                        : 'text-neutral-600 hover:text-black hover:bg-neutral-100 font-bold'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0 stroke-[2.5]" />
                    {!isCollapsed ? (
                      <span className="text-sm uppercase tracking-wider">{item.label}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Canto Inferior da Sidebar: Botão de Sincronizar com Efeito Macio */}
      <div className="p-3 border-t-2 border-black">
        {!isCollapsed ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing || !hasConnectedAccounts}
              title={
                !hasConnectedAccounts
                  ? 'Conecte ao menos uma plataforma nas configurações para sincronizar'
                  : 'Sincronizar todas as plataformas'
              }
              className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 font-black text-xs uppercase tracking-wider rounded-xl border-2 transition-all duration-150 ease-out select-none ${
                !hasConnectedAccounts || isSyncing
                  ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed shadow-none'
                  : 'cursor-pointer bg-[#003366] hover:bg-[#004080] text-white border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
              }`}
            >
              <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar'}</span>
            </button>
            {!hasConnectedAccounts ? (
              <p className="text-[10px] text-neutral-500 font-bold text-center leading-tight">
                Nenhuma conta conectada
              </p>
            ) : (
              <p className="text-[10px] text-neutral-500 font-bold text-center truncate">
                {formatLastSync(lastSyncedAt)}
              </p>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing || !hasConnectedAccounts}
              title={
                !hasConnectedAccounts
                  ? 'Conecte ao menos uma conta nas configurações'
                  : 'Sincronizar todas as plataformas'
              }
              className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all duration-150 ease-out select-none ${
                !hasConnectedAccounts || isSyncing
                  ? 'bg-neutral-200 text-neutral-400 border-neutral-300 cursor-not-allowed shadow-none'
                  : 'cursor-pointer bg-[#003366] hover:bg-[#004080] text-white border-black shadow-[3px_3px_0px_0px_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] hover:shadow-[1.5px_1.5px_0px_0px_#000] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none'
              }`}
            >
              <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
