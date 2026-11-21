import React, { createContext, useContext, useState, useEffect } from 'react';
import focusEngine, { FocusEngineState } from './FocusEngineService';
import syncService, { SyncSchedule, SyncBlockedTarget } from '../sync/SyncService';
import { UserProfile } from '../supabase/auth';

interface FocusEngineContextValue extends FocusEngineState {
  startSession: (
    title: string,
    durationMinutes: number,
    strictness?: 'normal' | 'deep_focus' | 'friend_or_nfc'
  ) => Promise<void>;
  stopSessionEarly: (emergencyCode?: string) => Promise<{ success: boolean; reason?: string }>;
  recordInterception: (appName?: string) => Promise<void>;
  awardGems: (amount: number, reason: string) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  toggleSchedule: (id: string, active: boolean) => Promise<void>;
  addBlockedTarget: (target: SyncBlockedTarget) => Promise<void>;
  removeBlockedTarget: (packageOrToken: string) => Promise<void>;
  setAppDailyLimit: (packageOrToken: string, limitMinutes: number) => Promise<void>;
  recordAppUsage: (packageOrToken: string, minutes: number) => Promise<{ isLimitReached: boolean; newSpent: number }>;
  refreshState: () => Promise<void>;
}

const FocusEngineContext = createContext<FocusEngineContextValue | undefined>(undefined);

export const FocusEngineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<FocusEngineState>(focusEngine.getState());

  useEffect(() => {
    const unsubscribe = focusEngine.subscribe((latestState) => {
      setState(latestState);
    });
    return () => unsubscribe();
  }, []);

  const startSession = async (
    title: string,
    durationMinutes: number,
    strictness: 'normal' | 'deep_focus' | 'friend_or_nfc' = 'normal'
  ) => {
    await focusEngine.startSession(title, durationMinutes, strictness);
  };

  const stopSessionEarly = async (emergencyCode?: string) => {
    return await focusEngine.stopSessionEarly(emergencyCode);
  };

  const recordInterception = async (appName?: string) => {
    await focusEngine.recordInterception(appName);
  };

  const awardGems = async (amount: number, reason: string) => {
    await focusEngine.awardGems(amount, reason);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    await syncService.updateProfile(updates);
    await focusEngine.refreshState();
  };

  const toggleSchedule = async (id: string, active: boolean) => {
    await syncService.toggleSchedule(id, active);
    await focusEngine.refreshState();
  };

  const addBlockedTarget = async (target: SyncBlockedTarget) => {
    await syncService.addBlockedTarget(target);
    await focusEngine.refreshState();
  };

  const removeBlockedTarget = async (packageOrToken: string) => {
    await syncService.removeBlockedTarget(packageOrToken);
    await focusEngine.refreshState();
  };

  const setAppDailyLimit = async (packageOrToken: string, limitMinutes: number) => {
    await focusEngine.setAppDailyLimit(packageOrToken, limitMinutes);
  };

  const recordAppUsage = async (packageOrToken: string, minutes: number) => {
    return await focusEngine.recordAppUsage(packageOrToken, minutes);
  };

  const refreshState = async () => {
    await focusEngine.refreshState();
  };

  return (
    <FocusEngineContext.Provider
      value={{
        ...state,
        startSession,
        stopSessionEarly,
        recordInterception,
        awardGems,
        updateProfile,
        toggleSchedule,
        addBlockedTarget,
        removeBlockedTarget,
        setAppDailyLimit,
        recordAppUsage,
        refreshState,
      }}
    >
      {children}
    </FocusEngineContext.Provider>
  );
};

export const useFocusEngine = () => {
  const context = useContext(FocusEngineContext);
  if (!context) {
    throw new Error('useFocusEngine must be used within a FocusEngineProvider');
  }
  return context;
};

export default FocusEngineContext;
