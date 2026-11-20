import React, { createContext, useContext, useState, useEffect } from 'react';
import nativeBlocker from './NativeBlockerBridge';
import {
  BlockableApp,
  FocusSessionConfig,
  NativePermissionStatus,
  ShieldInterceptionEvent,
} from './types';

interface NativeBlockerContextType {
  apps: BlockableApp[];
  activeSession: FocusSessionConfig | null;
  permissions: NativePermissionStatus;
  dailyBlockedCount: number;
  isLoading: boolean;
  requestPermissions: () => Promise<void>;
  toggleAppBlock: (appId: string, blocked: boolean) => Promise<void>;
  toggleSurgicalBlock: (appId: string, featureId: string, blocked: boolean) => Promise<void>;
  startSession: (config: FocusSessionConfig) => Promise<boolean>;
  stopSession: (emergencyCode?: string) => Promise<{ success: boolean; reason?: string }>;
  triggerShieldPreview: (appName?: string) => void;
  lastShieldEvent: ShieldInterceptionEvent | null;
  clearShieldEvent: () => void;
  refreshState: () => Promise<void>;
}

const NativeBlockerContext = createContext<NativeBlockerContextType | undefined>(undefined);

export const NativeBlockerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [apps, setApps] = useState<BlockableApp[]>([]);
  const [activeSession, setActiveSession] = useState<FocusSessionConfig | null>(null);
  const [permissions, setPermissions] = useState<NativePermissionStatus>({
    hasRequested: false,
    familyControlsAuthorized: false,
    deviceActivityAuthorized: false,
    accessibilityServiceEnabled: false,
    usageStatsPermissionGranted: false,
    systemAlertWindowGranted: false,
    batteryOptimizationIgnored: false,
    allRequiredPermissionsGranted: false,
  });
  const [dailyBlockedCount, setDailyBlockedCount] = useState<number>(48);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastShieldEvent, setLastShieldEvent] = useState<ShieldInterceptionEvent | null>(
    null
  );

  const refreshState = async () => {
    try {
      const [installedApps, session, perms, count] = await Promise.all([
        nativeBlocker.getInstalledApps(),
        nativeBlocker.getActiveSession(),
        nativeBlocker.getPermissionsStatus(),
        nativeBlocker.getDailyBlockedCount(),
      ]);
      setApps(installedApps);
      setActiveSession(session);
      setPermissions(perms);
      setDailyBlockedCount(count);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshState();

    const unsubscribe = nativeBlocker.onShieldInterception((event) => {
      setLastShieldEvent(event);
      setDailyBlockedCount((prev) => prev + 1);
    });

    return () => unsubscribe();
  }, []);

  const requestPermissions = async () => {
    const updated = await nativeBlocker.requestAllPermissions();
    setPermissions(updated);
  };

  const toggleAppBlock = async (appId: string, blocked: boolean) => {
    await nativeBlocker.toggleAppBlock(appId, blocked);
    setApps((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, isEntireAppBlocked: blocked } : app))
    );
  };

  const toggleSurgicalBlock = async (
    appId: string,
    featureId: string,
    blocked: boolean
  ) => {
    await nativeBlocker.toggleSurgicalBlock(appId, featureId, blocked);
    setApps((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            surgicalFeatures: app.surgicalFeatures.map((f) =>
              f.id === featureId ? { ...f, isBlocked: blocked } : f
            ),
          };
        }
        return app;
      })
    );
  };

  const startSession = async (config: FocusSessionConfig): Promise<boolean> => {
    const success = await nativeBlocker.startFocusSession(config);
    if (success) {
      const current = await nativeBlocker.getActiveSession();
      setActiveSession(current);
    }
    return success;
  };

  const stopSession = async (
    emergencyCode?: string
  ): Promise<{ success: boolean; reason?: string }> => {
    const res = await nativeBlocker.stopFocusSession(emergencyCode);
    if (res.success) {
      setActiveSession(null);
    }
    return res;
  };

  const triggerShieldPreview = (appName: string = 'Instagram') => {
    const event: ShieldInterceptionEvent = {
      appId: 'com.instagram.android',
      appName,
      reason: 'active_session',
      timestamp: Date.now(),
    };
    setLastShieldEvent(event);
    setDailyBlockedCount((prev) => prev + 1);
  };

  const clearShieldEvent = () => {
    setLastShieldEvent(null);
  };

  return (
    <NativeBlockerContext.Provider
      value={{
        apps,
        activeSession,
        permissions,
        dailyBlockedCount,
        isLoading,
        requestPermissions,
        toggleAppBlock,
        toggleSurgicalBlock,
        startSession,
        stopSession,
        triggerShieldPreview,
        lastShieldEvent,
        clearShieldEvent,
        refreshState,
      }}
    >
      {children}
    </NativeBlockerContext.Provider>
  );
};

export const useNativeBlocker = () => {
  const context = useContext(NativeBlockerContext);
  if (!context) {
    throw new Error('useNativeBlocker must be used within a NativeBlockerProvider');
  }
  return context;
};

export default NativeBlockerContext;
