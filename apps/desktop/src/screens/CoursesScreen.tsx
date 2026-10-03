import React from 'react';
import { useFeed } from '../hooks/useFeed';
import { Card, Badge, PageContainer, PageHeader } from '@unb-aggregator/ui';
import { GraduationCap, User, MapPin, Clock, CheckSquare, MessageSquare, ExternalLink } from 'lucide-react';
import { openExternalUrl } from '../lib/utils';

export const CoursesScreen: React.FC = () => {
  const { courses, isLoading } = useFeed();

  if (isLoading) {
    return (
      <PageContainer>
        <div className="p-12 text-center bg-white border-2 border-black rounded-2xl shadow-[4px_4px_0px_0px_#000]">
          <div className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full h-8 w-8 mb-3" />
          <p className="text-sm font-bold text-black">
            Carregando Turmas...
          </p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader
        icon={GraduationCap}
        title="Turmas do Semestre"
      />

      <div className="flex items-center justify-between text-xs font-bold text-neutral-600 px-1">
        <span>Disciplinas Matriculadas ({courses.length})</span>
        <span>Semestre Atual</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="border-2 border-black bg-white rounded-2xl p-5 shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between"
          >
            <div>
              {/* Topo do card com código e plataforma */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold bg-neutral-100 text-neutral-800 px-2.5 py-0.5 border-2 border-black rounded-full shadow-[1px_1px_0px_0px_#000]">
                  {course.code}
                </span>
                <Badge variant={course.platform}>
                  {course.platform === 'sigaa'
                    ? 'Sigaa'
                    : course.platform === 'aprender3'
                    ? 'Aprender 3'
                    : course.platform === 'moodlemat'
                    ? 'MoodleMat'
                    : 'Teams'}
                </Badge>
              </div>

              {/* Nome da disciplina */}
              <h3 className="text-lg font-bold text-black leading-tight mb-3">
                {course.name}
              </h3>

              {/* Informações detalhadas */}
              <div className="space-y-2 text-xs font-medium text-neutral-700">
                {course.professor ? (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                    <span>{course.professor}</span>
                  </div>
                ) : null}

                {course.classroom ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                    <span>{course.classroom}</span>
                  </div>
                ) : null}

                {course.schedule ? (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-500 stroke-[2.5]" />
                    <span>{course.schedule}</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Rodapé com indicadores e link direto */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t-2 border-black/10 mt-4 text-xs font-bold">
              <span className="text-neutral-500">
                {course.semester}
              </span>

              <div className="flex items-center gap-3">
                {course.pendingAssignmentsCount !== undefined ? (
                  <div className="flex items-center gap-1 text-ink-success">
                    <CheckSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{course.pendingAssignmentsCount} entregas</span>
                  </div>
                ) : null}

                {course.unreadCount !== undefined ? (
                  <div className="flex items-center gap-1 text-neo-blue">
                    <MessageSquare className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{course.unreadCount} novos</span>
                  </div>
                ) : null}

                {course.url ? (
                  <button
                    type="button"
                    onClick={() => openExternalUrl(course.url!)}
                    className={`cursor-pointer inline-flex items-center gap-1 px-2.5 py-1 ${
                      course.platform === 'sigaa'
                        ? 'bg-platform-sigaa'
                        : course.platform === 'aprender3'
                        ? 'bg-platform-aprender3'
                        : 'bg-primary'
                    } text-black border-2 border-black rounded-lg shadow-[1.5px_1.5px_0px_0px_#000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[2.5px_2.5px_0px_0px_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all`}
                  >
                    <span>Acessar Turma</span>
                    <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                  </button>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
};
