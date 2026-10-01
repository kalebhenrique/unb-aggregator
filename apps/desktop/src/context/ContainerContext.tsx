import React, { createContext, useContext, useMemo } from 'react';
import { createContainer, type Container } from '@unb-aggregator/core';

const ContainerContext = createContext<Container | null>(null);

export interface ContainerProviderProps {
  children: React.ReactNode;
  container?: Container;
}

export const ContainerProvider: React.FC<ContainerProviderProps> = ({ children, container }) => {
  const instance = useMemo(() => container ?? createContainer(), [container]);

  return <ContainerContext.Provider value={instance}>{children}</ContainerContext.Provider>;
};

export function useContainer(): Container {
  const context = useContext(ContainerContext);
  if (!context) {
    throw new Error('useContainer deve ser utilizado dentro de um ContainerProvider');
  }
  return context;
}
