import React, { useState } from 'react';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { CredentialsScreen } from './screens/CredentialsScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { CoursesScreen } from './screens/CoursesScreen';
import { GradeBuilderScreen } from './screens/GradeBuilderScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Sidebar, type NavTab } from './components/Sidebar';
import { useCredentials } from './hooks/useCredentials';
import { useFeed } from './hooks/useFeed';

type AppStep = 'onboarding' | 'credentials' | 'main';

export const App: React.FC = () => {
  const { hasCredentials, isLoading: isCheckingAuth } = useCredentials();
  const { sync, isSyncing, lastSyncedAt } = useFeed();

  const [step, setStep] = useState<AppStep>('onboarding');
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Inicializa a sincronização quando o usuário entra na tela principal com credenciais existentes
  React.useEffect(() => {
    if (hasCredentials) {
      setStep('main');
    }
  }, [hasCredentials]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#E8EFF8] bg-grid flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 bg-[#468AFB] text-white border-2 border-black rounded-2xl flex items-center justify-center font-black text-lg shadow-[4px_4px_0px_0px_#000]">
          UnB
        </div>
        <div className="inline-block animate-spin border-2 border-black border-t-transparent rounded-full h-6 w-6" />
        <p className="text-xs font-bold text-neutral-700">
          Verificando Cofre Seguro...
        </p>
      </div>
    );
  }

  // Fluxo 1: Onboarding de Boas-vindas
  if (step === 'onboarding' && !hasCredentials) {
    return (
      <OnboardingScreen
        onContinue={() => setStep('credentials')}
        onExplore={() => setStep('main')}
      />
    );
  }

  // Fluxo 2: Configuração de Credenciais no Stronghold
  if (step === 'credentials' && !hasCredentials) {
    return (
      <CredentialsScreen
        onBack={() => setStep('onboarding')}
        onExplore={() => setStep('main')}
        onSuccess={() => {
          setStep('main');
          sync();
        }}
      />
    );
  }

  // Fluxo 3: Aplicação Principal (Dashboard com Sidebar Colapsável)
  return (
    <div className="flex h-screen bg-[#E8EFF8] bg-grid overflow-hidden">
      {/* Sidebar Colapsável com Botão de Sincronização no Canto Inferior */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isSyncing={isSyncing}
        onSync={() => sync()}
        lastSyncedAt={lastSyncedAt}
        hasConnectedAccounts={Boolean(hasCredentials)}
      />

      {/* Área Central de Conteúdo (Sem Header global, títulos direto no corpo) */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {currentTab === 'home' && <DashboardScreen />}
          {currentTab === 'courses' && <CoursesScreen />}
          {currentTab === 'grade' && <GradeBuilderScreen />}
          {currentTab === 'settings' && (
            <SettingsScreen
              onResetCredentials={() => {
                setStep('onboarding');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};
