import React from 'react';
import { Card, Badge, Button } from '@unb-aggregator/ui';
import type { FeedItem } from '@unb-aggregator/core';
import {
  Calendar,
  Clock,
  ExternalLink,
  CheckCircle,
  Circle,
  User,
  AlertTriangle,
  EyeOff,
  Eye,
} from 'lucide-react';
import { openExternalUrl } from '../lib/utils';

export interface FeedItemCardProps {
  item: FeedItem;
  onToggleComplete?: (id: string, currentStatus?: boolean) => void;
  onHide?: (id: string) => void;
  onRestore?: (id: string) => void;
}


const PLATFORM_BUTTON_LABELS: Record<string, string> = {
  aprender3: 'Abrir no Aprender 3',
  sigaa: 'Abrir no SIGAA',
  moodlemat: 'Abrir no Moodle',
  teams: 'Abrir no Teams',
};

export const FeedItemCard: React.FC<FeedItemCardProps> = ({
  item,
  onToggleComplete,
  onHide,
  onRestore,
}) => {
  const isAssignment = item.itemType === 'assignment';

  const formatCreationDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getDueDateStatus = (dueDateStr?: string) => {
    if (!dueDateStr) return null;
    const now = new Date().getTime();
    const due = new Date(dueDateStr).getTime();
    const diffHours = (due - now) / (1000 * 60 * 60);

    const formattedDate = new Date(dueDateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    if (diffHours < 0) {
      return {
        label: `Prazo encerrado (${formattedDate})`,
        variant: 'urgent' as const,
        isUrgent: true,
      };
    } else if (diffHours <= 24) {
      return {
        label: `Entrega em menos de 24h (${formattedDate})`,
        variant: 'urgent' as const,
        isUrgent: true,
      };
    } else if (diffHours <= 48) {
      return {
        label: `Entrega em 2 dias (${formattedDate})`,
        variant: 'assignment' as const,
        isUrgent: false,
      };
    } else {
      return {
        label: `Entrega até ${formattedDate}`,
        variant: 'assignment' as const,
        isUrgent: false,
      };
    }
  };

  const dueStatus = isAssignment ? getDueDateStatus(item.dueDate) : null;

  return (
    <Card
      className={`${
        item.isCompleted ? 'bg-neutral-100/90 opacity-75' : 'bg-white'
      }`}
    >
      {/* Header do Card */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge da Plataforma */}
          <Badge variant={item.platform}>
            {item.platform === 'sigaa'
              ? 'Sigaa'
              : item.platform === 'aprender3'
              ? 'Aprender 3'
              : item.platform === 'moodlemat'
              ? 'MoodleMat'
              : 'Teams'}
          </Badge>

          {/* Badge de Tipo */}
          <Badge variant={isAssignment ? 'assignment' : 'post'}>
            {isAssignment ? 'Trabalho' : 'Aviso'}
          </Badge>

          {/* Código da Disciplina */}
          {item.courseCode ? (
            <span className="text-xs font-bold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 border-2 border-black rounded-full shadow-[1px_1px_0px_0px_#000]">
              {item.courseCode}
            </span>
          ) : null}
        </div>

        {/* Data de Publicação */}
        <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-500">
          <Calendar className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{formatCreationDate(item.createdAt)}</span>
        </div>
      </div>

      {/* Título e Disciplina */}
      <div className="space-y-1 mb-2">
        <h3
          className={`text-base font-bold text-black leading-snug ${
            item.isCompleted ? 'line-through text-neutral-500' : ''
          }`}
        >
          {item.title}
        </h3>
        <p className="text-xs font-bold text-ink-success">
          {item.courseName}
        </p>
      </div>

      {/* Conteúdo textual */}
      <p className="text-sm font-normal text-neutral-700 leading-relaxed line-clamp-3 mb-4">
        {item.content}
      </p>

      {/* Rodapé do Card com Prazo e Ações */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-black/10">
        {/* Status de Entrega (se for trabalho) */}
        {dueStatus ? (
          <div className="flex items-center gap-1.5">
            {dueStatus.isUrgent ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-neo-danger text-white text-xs font-bold rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.5]" />
                {dueStatus.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-neo-yellow text-black text-xs font-bold rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000]">
                <Clock className="w-3.5 h-3.5 stroke-[2.5]" />
                {dueStatus.label}
              </span>
            )}
          </div>
        ) : item.author ? (
          <div className="flex items-center gap-1.5 text-xs font-medium text-neutral-600">
            <User className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{item.author}</span>
          </div>
        ) : <div />}

        {/* Botões de Ação */}
        <div className="flex items-center gap-2">
          {item.isHidden && onRestore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onRestore(item.id)}
              title="Restaurar item no feed"
              className="cursor-pointer text-xs flex items-center gap-1 text-neutral-600 hover:text-black"
            >
              <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Restaurar</span>
            </Button>
          ) : !item.isHidden && onHide ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onHide(item.id)}
              title="Ocultar do feed"
              className="cursor-pointer text-xs flex items-center gap-1 text-neutral-500 hover:text-black"
            >
              <EyeOff className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Ocultar</span>
            </Button>
          ) : null}

          {isAssignment && onToggleComplete ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleComplete(item.id, item.isCompleted)}
            >
              {item.isCompleted ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-ink-success stroke-[2.5]" />
                  <span>Concluído</span>
                </>
              ) : (
                <>
                  <Circle className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Concluir</span>
                </>
              )}
            </Button>
          ) : null}

          {item.externalUrl ? (
            <Button
              type="button"
              size="sm"
              onClick={() => openExternalUrl(item.externalUrl!)}
              className={
                item.platform === 'sigaa'
                  ? 'bg-platform-sigaa hover:bg-neo-greenHover text-black'
                  : item.platform === 'aprender3'
                  ? 'bg-platform-aprender3 hover:bg-orange-400 text-black'
                  : 'bg-neo-blue hover:bg-neo-blueHover text-white'
              }
            >
              <span>{PLATFORM_BUTTON_LABELS[item.platform] ?? 'Abrir'}</span>
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            </Button>
          ) : null}
        </div>

      </div>
    </Card>
  );
};
