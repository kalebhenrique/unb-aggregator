import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  PageContainer,
  PageHeader,
} from "@unb-aggregator/ui";
import { useCredentials } from "../hooks/useCredentials";
import {
  Settings,
  School,
  BookOpen,
  Globe,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Scale,
  GitBranch,
  Trash2,
  Save,
} from "lucide-react";

export interface SettingsScreenProps {
  onResetCredentials: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onResetCredentials,
}) => {
  const {
    allCredentials,
    saveSigaa,
    saveAprender3,
    saveMoodleMat,
    saveTeams,
    clearPlatform,
    clearAll,
    refresh,
  } = useCredentials();

  // Estados locais dos formulários
  const [sigaaMat, setSigaaMat] = useState("");
  const [sigaaPass, setSigaaPass] = useState("");
  const [sigaaFeedback, setSigaaFeedback] = useState<string | null>(null);

  const [aprenderCpf, setAprenderCpf] = useState("");
  const [aprenderPass, setAprenderPass] = useState("");
  const [aprenderFeedback, setAprenderFeedback] = useState<string | null>(null);

  const [moodleMatMat, setMoodleMatMat] = useState("");
  const [moodleMatPass, setMoodleMatPass] = useState("");
  const [moodleMatFeedback, setMoodleMatFeedback] = useState<string | null>(
    null,
  );

  const [teamsEmail, setTeamsEmail] = useState("");
  const [teamsFeedback, setTeamsFeedback] = useState<string | null>(null);

  const [isWiping, setIsWiping] = useState(false);
  const [wipeConfirmed, setWipeConfirmed] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (allCredentials.sigaa) {
      setSigaaMat(allCredentials.sigaa.matricula || "");
      setSigaaPass(allCredentials.sigaa.senha || "");
    }
    if (allCredentials.aprender3) {
      setAprenderCpf(allCredentials.aprender3.cpf || "");
      setAprenderPass(allCredentials.aprender3.senha || "");
    }
    if (allCredentials.moodlemat) {
      setMoodleMatMat(allCredentials.moodlemat.matricula || "");
      setMoodleMatPass(allCredentials.moodlemat.senha || "");
    }
    if (allCredentials.teams) {
      setTeamsEmail(allCredentials.teams.email || "");
    }
  }, [allCredentials]);

  const handleSaveSigaa = async () => {
    setSigaaFeedback(null);
    const ok = await saveSigaa({ matricula: sigaaMat, senha: sigaaPass });
    setSigaaFeedback(
      ok
        ? "Credenciais do SIGAA atualizadas com sucesso!"
        : "Falha ao salvar SIGAA",
    );
    setTimeout(() => setSigaaFeedback(null), 3000);
  };

  const handleSaveAprender3 = async () => {
    setAprenderFeedback(null);
    const ok = await saveAprender3({ cpf: aprenderCpf, senha: aprenderPass });
    setAprenderFeedback(
      ok
        ? "Credenciais do Aprender 3 atualizadas com sucesso!"
        : "Falha ao salvar Aprender 3",
    );
    setTimeout(() => setAprenderFeedback(null), 3000);
  };

  const handleSaveMoodleMat = async () => {
    setMoodleMatFeedback(null);
    const ok = await saveMoodleMat({
      matricula: moodleMatMat,
      senha: moodleMatPass,
    });
    setMoodleMatFeedback(
      ok
        ? "Credenciais do MoodleMat atualizadas com sucesso!"
        : "Falha ao salvar MoodleMat",
    );
    setTimeout(() => setMoodleMatFeedback(null), 3000);
  };

  const handleToggleTeams = async () => {
    setTeamsFeedback(null);
    const isCurrentlyConnected = Boolean(allCredentials.teams?.isConnected);
    if (isCurrentlyConnected) {
      await clearPlatform("teams");
      setTeamsFeedback("Microsoft Teams desconectado.");
    } else {
      await saveTeams({
        isConnected: true,
        email: teamsEmail || "aluno@aluno.unb.br",
      });
      setTeamsFeedback("Microsoft Teams conectado com sucesso!");
    }
    setTimeout(() => setTeamsFeedback(null), 3000);
  };

  const handleWipeAll = async () => {
    if (!wipeConfirmed) {
      setWipeConfirmed(true);
      return;
    }
    setIsWiping(true);
    try {
      await clearAll();
      onResetCredentials();
    } finally {
      setIsWiping(false);
      setWipeConfirmed(false);
    }
  };

  return (
    <PageContainer>
      {/* Título Padronizado da Página com Ícone da Sidebar */}
      <PageHeader
        icon={Settings}
        title="Configuração de Acesso das Plataformas"
      />

      {/* Grid de Configuração por Plataforma */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card SIGAA */}
        <Card className="border-2 border-black bg-white rounded-2xl p-5 shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#22C55E] text-black border border-black rounded">
                  <School className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-base text-black uppercase">
                  SIGAA
                </h3>
              </div>
              <Badge
                variant={allCredentials.sigaa?.matricula ? "sigaa" : "neutral"}
              >
                {allCredentials.sigaa?.matricula ? "Configurado" : "Pendente"}
              </Badge>
            </div>

            <p className="text-xs font-semibold text-neutral-600 mb-3">
              Requer matrícula institucional e senha do portal do discente.
            </p>

            <div className="space-y-2">
              <Input
                label="Matrícula"
                placeholder="Ex: 202012345"
                value={sigaaMat}
                onChange={(e) => setSigaaMat(e.target.value)}
              />
              <Input
                type="password"
                label="Senha"
                placeholder="Senha do SIGAA"
                value={sigaaPass}
                onChange={(e) => setSigaaPass(e.target.value)}
              />
            </div>

            {sigaaFeedback ? (
              <div className="mt-2 text-xs font-bold text-[#006633] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{sigaaFeedback}</span>
              </div>
            ) : null}
          </div>

          <div className="pt-4 border-t-2 border-black/10 mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveSigaa}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#006633] hover:bg-[#007A3D] text-white font-black text-xs uppercase border-2 border-black rounded-xl translate-x-0 translate-y-0 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 ease-out"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Salvar SIGAA</span>
            </button>
          </div>
        </Card>

        {/* Card Aprender 3 */}
        <Card className="border-2 border-black bg-white rounded-2xl p-5 shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FB923C] text-black border border-black rounded-lg">
                  <BookOpen className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-base text-black uppercase">
                  Aprender 3
                </h3>
              </div>
              <Badge
                variant={
                  allCredentials.aprender3?.cpf ? "aprender3" : "neutral"
                }
              >
                {allCredentials.aprender3?.cpf ? "Configurado" : "Pendente"}
              </Badge>
            </div>

            <p className="text-xs font-semibold text-neutral-600 mb-3">
              Requer CPF (11 dígitos) e senha cadastrada no ambiente Moodle
              institucional.
            </p>

            <div className="space-y-2">
              <Input
                label="CPF"
                placeholder="Ex: 000.000.000-00"
                value={aprenderCpf}
                onChange={(e) => setAprenderCpf(e.target.value)}
              />
              <Input
                type="password"
                label="Senha"
                placeholder="Senha do Aprender 3"
                value={aprenderPass}
                onChange={(e) => setAprenderPass(e.target.value)}
              />
            </div>

            {aprenderFeedback ? (
              <div className="mt-2 text-xs font-bold text-[#006633] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{aprenderFeedback}</span>
              </div>
            ) : null}
          </div>

          <div className="pt-4 border-t-2 border-black/10 mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveAprender3}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#006633] hover:bg-[#007A3D] text-white font-black text-xs uppercase border-2 border-black rounded-xl translate-x-0 translate-y-0 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 ease-out"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Salvar Aprender 3</span>
            </button>
          </div>
        </Card>

        {/* Card MoodleMat */}
        <Card className="border-2 border-black bg-white rounded-2xl p-5 shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#C084FC] text-black border border-black rounded-lg">
                  <Globe className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-base text-black uppercase">
                  MoodleMat
                </h3>
              </div>
              <Badge
                variant={
                  allCredentials.moodlemat?.matricula ? "moodlemat" : "neutral"
                }
              >
                {allCredentials.moodlemat?.matricula
                  ? "Configurado"
                  : "Pendente"}
              </Badge>
            </div>

            <p className="text-xs font-semibold text-neutral-600 mb-3">
              Moodle do Departamento de Matemática (autenticação com Matrícula e
              Senha).
            </p>

            <div className="space-y-2">
              <Input
                label="Matrícula"
                placeholder="Ex: 202012345"
                value={moodleMatMat}
                onChange={(e) => setMoodleMatMat(e.target.value)}
              />
              <Input
                type="password"
                label="Senha"
                placeholder="Senha do MoodleMat"
                value={moodleMatPass}
                onChange={(e) => setMoodleMatPass(e.target.value)}
              />
            </div>

            {moodleMatFeedback ? (
              <div className="mt-2 text-xs font-bold text-[#006633] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{moodleMatFeedback}</span>
              </div>
            ) : null}
          </div>

          <div className="pt-4 border-t-2 border-black/10 mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveMoodleMat}
              className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 bg-[#006633] hover:bg-[#007A3D] text-white font-black text-xs uppercase border-2 border-black rounded-xl translate-x-0 translate-y-0 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 ease-out"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Salvar MoodleMat</span>
            </button>
          </div>
        </Card>

        {/* Card Microsoft Teams */}
        <Card className="border-2 border-black bg-white rounded-2xl p-5 shadow-[3px_3px_0px_0px_#000] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#60A5FA] text-black border border-black rounded-lg">
                  <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                </div>
                <h3 className="font-black text-base text-black uppercase">
                  Teams
                </h3>
              </div>
              <Badge
                variant={
                  allCredentials.teams?.isConnected ? "teams" : "neutral"
                }
              >
                {allCredentials.teams?.isConnected
                  ? "Conectado"
                  : "Não Conectado"}
              </Badge>
            </div>

            <p className="text-xs font-semibold text-neutral-600 mb-3">
              Autenticação interativa manual requerida devido ao SSO Microsoft
              365 da UnB.
            </p>

            <div className="space-y-2">
              <Input
                label="E-mail Institucional UnB"
                placeholder="Ex: aluno@aluno.unb.br"
                value={teamsEmail}
                onChange={(e) => setTeamsEmail(e.target.value)}
              />
            </div>

            {teamsFeedback ? (
              <div className="mt-2 text-xs font-bold text-[#006633] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{teamsFeedback}</span>
              </div>
            ) : null}
          </div>

          <div className="pt-4 border-t-2 border-black/10 mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleToggleTeams}
              className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-white font-black text-xs uppercase border-2 border-black rounded-xl translate-x-0 translate-y-0 shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all duration-150 ease-out ${
                allCredentials.teams?.isConnected
                  ? "bg-[#FF4D4F] hover:bg-[#FF7875]"
                  : "bg-[#003366] hover:bg-[#004080]"
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>
                {allCredentials.teams?.isConnected
                  ? "Desconectar Teams"
                  : "Conectar Teams"}
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* Licença e Código Aberto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t-2 border-black/10">
        <Card className="border-2 border-black bg-white rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000]">
          <div className="flex items-center gap-2 mb-1.5">
            <Scale className="w-4 h-4 stroke-[2.5]" />
            <h4 className="text-xs font-black uppercase text-black">
              Licença Apache 2.0
            </h4>
          </div>
          <p className="text-xs text-neutral-600 font-semibold leading-relaxed">
            Software livre e transparente para a comunidade acadêmica da
            Universidade de Brasília.
          </p>
        </Card>

        <Card className="border-2 border-black bg-white rounded-2xl p-4 shadow-[3px_3px_0px_0px_#000]">
          <div className="flex items-center gap-2 mb-1.5">
            <GitBranch className="w-4 h-4 stroke-[2.5]" />
            <h4 className="text-xs font-black uppercase text-black">
              Auditoria Pública no GitHub
            </h4>
          </div>
          <p className="text-xs text-neutral-600 font-semibold leading-relaxed">
            Código-fonte disponível publicamente para colaboração e inspeção de
            segurança.
          </p>
        </Card>
      </div>

      {/* Zona de Perigo / Limpeza */}
      <Card className="border-2 border-red-600 bg-red-50 rounded-2xl p-5 shadow-[3px_3px_0px_0px_#000]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              <h4 className="text-sm font-black uppercase tracking-tight">
                Redefinir Acessos
              </h4>
            </div>
            <p className="text-xs font-semibold text-neutral-700">
              Apaga todas as credenciais salvas e retorna o aplicativo para o
              estado inicial.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="md"
            isLoading={isWiping}
            onClick={handleWipeAll}
            className="shrink-0"
          >
            <Trash2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              {wipeConfirmed
                ? "Confirmar Exclusão"
                : "Apagar Todas as Credenciais"}
            </span>
          </Button>
        </div>
      </Card>
    </PageContainer>
  );
};
