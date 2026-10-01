import React from 'react';
import { Button, Card, CardTitle, CardContent } from '@unb-aggregator/ui';
import { ShieldCheck, Scale, GitBranch, ArrowRight, Layers, Lock } from 'lucide-react';

export interface OnboardingScreenProps {
  onContinue: () => void;
  onExplore?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onContinue, onExplore }) => {
  return (
    <div className="min-h-screen bg-[#FAF7EE] flex flex-col justify-center items-center p-6 md:p-12">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header institucional */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#006633] text-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
            <Layers className="w-4 h-4 stroke-[2.5]" />
            <span className="text-xs font-black uppercase tracking-wider">Universidade de Brasília</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-[#003366] tracking-tight uppercase">
            UnB Aggregator
          </h1>

          <p className="text-base md:text-lg font-bold text-neutral-700 max-w-xl mx-auto">
            Todas as suas plataformas acadêmicas reunidas em um único feed desktop integrado, seguro e rápido.
          </p>
        </div>

        {/* 3 Destaques Obrigatórios */}
        <div className="space-y-4">
          {/* Destaque 1: Zero Telemetria */}
          <div className="flex items-start gap-4 p-5 bg-[#E6F8EE] border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000]">
            <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] shrink-0">
              <ShieldCheck className="w-6 h-6 text-[#006633] stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                Zero Telemetria
              </h3>
              <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
                Sua privacidade é inegociável. Nenhum dado de navegação, uso, clique ou métrica é coletado ou transmitido para servidores de terceiros. Tudo é processado localmente no seu computador.
              </p>
            </div>
          </div>

          {/* Destaque 2: Licença Apache 2.0 */}
          <div className="flex items-start gap-4 p-5 bg-[#FFF9D2] border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000]">
            <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] shrink-0">
              <Scale className="w-6 h-6 text-black stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                Licenciado sob Apache 2.0
              </h3>
              <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
                Software 100% livre e transparente. Desenvolvido para a comunidade acadêmica sob os termos permissivos da Apache License Version 2.0, garantindo autonomia e perenidade.
              </p>
            </div>
          </div>

          {/* Destaque 3: Código Aberto no GitHub */}
          <div className="flex items-start gap-4 p-5 bg-[#EBF3FF] border-3 border-black rounded-2xl shadow-[3px_3px_0px_0px_#000]">
            <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000] shrink-0">
              <GitBranch className="w-6 h-6 text-[#003366] stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-black uppercase tracking-tight">
                Código Aberto para Auditoria no GitHub
              </h3>
              <p className="text-sm font-semibold text-neutral-800 leading-relaxed">
                Transparência completa. Qualquer estudante, professor ou pesquisador pode auditar, inspecionar a implementação dos scrapers e do cofre criptográfico, e sugerir melhorias no GitHub.
              </p>
            </div>
          </div>
        </div>

        {/* Plataformas integradas */}
        <Card className="border-2 border-black bg-white rounded-2xl shadow-[3px_3px_0px_0px_#000] p-4 text-center">
          <CardContent className="p-0">
            <span className="text-xs font-black uppercase tracking-wider text-neutral-600 block mb-2">
              Plataformas Integradas
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="px-2.5 py-1 bg-[#22C55E] text-black font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
                Sigaa
              </span>
              <span className="px-2.5 py-1 bg-[#FB923C] text-black font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
                Aprender 3
              </span>
              <span className="px-2.5 py-1 bg-[#C084FC] text-black font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
                MoodleMat
              </span>
              <span className="px-2.5 py-1 bg-[#60A5FA] text-black font-black text-xs uppercase border-2 border-black rounded-xl shadow-[2px_2px_0px_0px_#000]">
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
            className="w-full sm:w-auto min-w-[240px] text-base bg-[#003366] hover:bg-[#004080]"
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
