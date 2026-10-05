import React from 'react';
import { Button, Card, CardContent } from '@/components/ui';
import { ShieldCheck, Scale, GitBranch, ArrowRight, Layers } from 'lucide-react';

export interface OnboardingScreenProps {
  onContinue: () => void;
  onExplore?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onContinue, onExplore }) => {
  return (
    <div className="min-h-screen bg-canvas bg-grid flex flex-col justify-center items-center p-6 md:p-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header institucional */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-neo-blue text-white border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000]">
            <Layers className="w-4 h-4 stroke-[2.5]" />
            <span className="text-xs font-bold">Universidade de Brasília</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight">
            UnB <span className="text-unb-blue">Aggregator</span>
          </h1>

          <p className="text-base md:text-lg font-medium text-neutral-700 max-w-xl mx-auto">
            Todas as suas plataformas acadêmicas reunidas em um único feed desktop integrado, seguro e rápido.
          </p>
        </div>

        {/* 3 Destaques Obrigatórios */}
        <div className="space-y-4">
          {/* Destaque 1: Zero Telemetria */}
          <div className="flex items-start gap-4 p-5 bg-pastel-green border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000]">
            <div className="p-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0">
              <ShieldCheck className="w-6 h-6 text-ink-success stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-black tracking-tight">
                Zero Telemetria
              </h3>
              <p className="text-sm font-normal text-neutral-700 leading-relaxed">
                Sua privacidade é inegociável. Nenhum dado de navegação, uso, clique ou métrica é coletado ou transmitido para servidores de terceiros. Tudo é processado localmente no seu computador.
              </p>
            </div>
          </div>

          {/* Destaque 2: Licença Apache 2.0 */}
          <div className="flex items-start gap-4 p-5 bg-pastel-yellow border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000]">
            <div className="p-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0">
              <Scale className="w-6 h-6 text-black stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-black tracking-tight">
                Licenciado sob Apache 2.0
              </h3>
              <p className="text-sm font-normal text-neutral-700 leading-relaxed">
                Software 100% livre e transparente. Desenvolvido para a comunidade acadêmica sob os termos permissivos da Apache License Version 2.0, garantindo autonomia e perenidade.
              </p>
            </div>
          </div>

          {/* Destaque 3: Código Aberto no GitHub */}
          <div className="flex items-start gap-4 p-5 bg-pastel-blue border-2 border-black rounded-lg shadow-[4px_4px_0px_0px_#000]">
            <div className="p-3 bg-white border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_#000] shrink-0">
              <GitBranch className="w-6 h-6 text-neo-blue stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-black tracking-tight">
                Código Aberto para Auditoria no GitHub
              </h3>
              <p className="text-sm font-normal text-neutral-700 leading-relaxed">
                Transparência completa. Qualquer estudante, professor ou pesquisador pode auditar, inspecionar a implementação dos scrapers e do cofre criptográfico, e sugerir melhorias no GitHub.
              </p>
            </div>
          </div>
        </div>

        {/* Plataformas integradas */}
        <Card className="border-2 border-black bg-white rounded-lg shadow-[4px_4px_0px_0px_#000] p-4 text-center">
          <CardContent className="p-0">
            <span className="text-xs font-bold text-neutral-600 block mb-2">
              Plataformas Integradas
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-3 py-1 bg-platform-sigaa text-black font-bold text-xs border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000]">
                Sigaa
              </span>
              <span className="px-3 py-1 bg-platform-aprender3 text-black font-bold text-xs border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000]">
                Aprender 3
              </span>
              <span className="px-3 py-1 bg-platform-teams text-black font-bold text-xs border-2 border-black rounded-full shadow-[2px_2px_0px_0px_#000]">
                Microsoft Teams
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Ação */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="default"
            onClick={onContinue}
            className="w-full sm:w-auto min-w-[240px] text-base"
          >
            <span>Configurar Credenciais</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </Button>

          {onExplore ? (
            <Button
              size="lg"
              variant="outline"
              onClick={onExplore}
              className="w-full sm:w-auto min-w-[200px] text-base"
            >
              <span>Explorar sem Login</span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
