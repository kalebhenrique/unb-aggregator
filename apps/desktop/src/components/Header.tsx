import React from 'react';
import { Button } from '@unb-aggregator/ui';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  isSyncing: boolean;
  onSync: () => void;
  lastSyncedAt: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  isSyncing,
  onSync,
  lastSyncedAt,
}) => {
  const formatLastSync = (isoString: string | null) => {
    if (!isoString) return 'Ainda não sincronizado';
    const date = new Date(isoString);
    return `Atualizado às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })}`;
  };

  return (
    <header className="bg-white border-b-2 border-black p-4 md:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 select-none">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-black uppercase tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-xs font-semibold text-neutral-600 mt-0.5">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        {/* Status de Sincronização */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-600">
          <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{formatLastSync(lastSyncedAt)}</span>
        </div>

        {/* Botão Manual de Sincronizar */}
        <Button
          type="button"
          variant="default"
          size="md"
          isLoading={isSyncing}
          onClick={onSync}
          className="shrink-0"
        >
          <RefreshCw className={`w-4 h-4 stroke-[2.5] ${isSyncing ? 'animate-spin' : ''}`} />
          <span>Sincronizar</span>
        </Button>
      </div>
    </header>
  );
};
