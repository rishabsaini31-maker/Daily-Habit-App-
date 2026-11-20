import React, { createContext, useContext, useState, useCallback } from 'react';
import { AppTab, AppModal, NavigationContextValue, ShieldModalParams } from './types';

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [activeModal, setActiveModal] = useState<AppModal | null>(null);
  const [modalParams, setModalParams] = useState<Record<string, unknown> | null>(null);

  const switchTab = useCallback((tab: AppTab) => {
    setActiveTab(tab);
  }, []);

  const openModal = useCallback((modal: AppModal, params?: Record<string, unknown>) => {
    setModalParams(params || null);
    setActiveModal(modal);
  }, []);

  const closeModal = useCallback(() => {
    setActiveModal(null);
    setModalParams(null);
  }, []);

  const presentShield = useCallback((params?: ShieldModalParams) => {
    setModalParams(params ? { ...params } : { appName: 'Instagram' });
    setActiveModal('shield_interception');
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeTab,
        switchTab,
        activeModal,
        modalParams,
        openModal,
        closeModal,
        presentShield,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useAppNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useAppNavigation must be used within a NavigationProvider');
  }
  return context;
};

export default NavigationContext;
