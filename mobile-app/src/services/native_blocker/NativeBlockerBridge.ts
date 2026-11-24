import { Platform, NativeModules } from 'react-native';
import {
  INativeBlockerService,
  NativePermissionStatus,
  BlockableApp,
  FocusSessionConfig,
  PlatformOSType,
  ShieldInterceptionEvent,
} from './types';
import syncService from '../sync/SyncService';

const { FocusBlockerModule } = NativeModules;

const DEFAULT_APPS: BlockableApp[] = [
  {
    id: 'com.instagram.android',
    name: 'Instagram',
    category: 'social',
    iconName: 'instagram',
    isEntireAppBlocked: true,
    supportsSurgicalBlocking: true,
    dailyUsageMinutes: 114,
    blockedAttemptsToday: 18,
    surgicalFeatures: [
      {
        id: 'reels',
        name: 'Instagram Reels',
        description: 'Block algorithmic short-form video feed while keeping DMs open',
        isBlocked: true,
      },
    ],
  },
  {
    id: 'com.google.android.youtube',
    name: 'YouTube',
    category: 'entertainment',
    iconName: 'youtube',
    isEntireAppBlocked: false,
    supportsSurgicalBlocking: true,
    dailyUsageMinutes: 92,
    blockedAttemptsToday: 12,
    surgicalFeatures: [
      {
        id: 'shorts',
        name: 'YouTube Shorts',
        description: 'Block vertical swipe feed while allowing educational long-form videos',
        isBlocked: true,
      },
    ],
  },
  {
    id: 'com.zhiliaoapp.musically',
    name: 'TikTok',
    category: 'social',
    iconName: 'video',
    isEntireAppBlocked: true,
    supportsSurgicalBlocking: true,
    dailyUsageMinutes: 85,
    blockedAttemptsToday: 24,
    surgicalFeatures: [
      {
        id: 'fyp',
        name: 'For You Page (FYP)',
        description: 'Block infinite vertical autoplay algorithm',
        isBlocked: true,
      },
    ],
  },
  {
    id: 'com.twitter.android',
    name: 'X (Twitter)',
    category: 'social',
    iconName: 'twitter',
    isEntireAppBlocked: true,
    supportsSurgicalBlocking: false,
    dailyUsageMinutes: 48,
    blockedAttemptsToday: 8,
    surgicalFeatures: [],
  },
];

/**
 * Pure In-Memory Native Blocker Bridge:
 * - 0% local database / 0% AsyncStorage / 0% SQLite
 * - On iOS: ManagedSettingsStore & DeviceActivityCenter persist shields in OS natively
 * - On Android: In-memory platform channel to FocusAccessibilityService
 */
class NativeBlockerBridge implements INativeBlockerService {
  private listeners: ((event: ShieldInterceptionEvent) => void)[] = [];

  // In-Memory State
  private inMemoryPermissions: NativePermissionStatus = {
    hasRequested: true,
    familyControlsAuthorized: Platform.OS === 'ios',
    deviceActivityAuthorized: Platform.OS === 'ios',
    accessibilityServiceEnabled: Platform.OS === 'android',
    usageStatsPermissionGranted: Platform.OS === 'android',
    systemAlertWindowGranted: Platform.OS === 'android',
    batteryOptimizationIgnored: true,
    allRequiredPermissionsGranted: true,
  };
  private inMemoryApps: BlockableApp[] = DEFAULT_APPS;
  private inMemoryActiveSession: FocusSessionConfig | null = null;
  private inMemoryBlockedCount: number = 48;
  private inMemoryAntiUninstall: boolean = false;
  private inMemoryEmergencyCode: string = '778899';
  private inMemorySurgicalSelectors: { instagram: string[]; youtube: string[] } = {
    instagram: ['clips_viewer_view_pager', 'reels_tray_container', 'reel_viewer_container'],
    youtube: ['reel_recycler', 'shorts_shelf'],
  };

  setRemoteSurgicalSelectors(selectors: { instagram: string[]; youtube: string[] }) {
    if (selectors) {
      this.inMemorySurgicalSelectors = selectors;
      if (Platform.OS === 'android' && FocusBlockerModule?.updateSurgicalSelectors) {
        try {
          FocusBlockerModule.updateSurgicalSelectors(JSON.stringify(selectors));
        } catch (err) {
          console.warn('NativeBlockerBridge.updateSurgicalSelectors warning:', err);
        }
      }
    }
  }

  getSurgicalSelectors() {
    return this.inMemorySurgicalSelectors;
  }

  getPlatform(): PlatformOSType {
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'unknown';
  }

  // =========================================================================
  // 1. SYSTEM PERMISSIONS & SETTINGS ROUTING
  // =========================================================================
  async getPermissionsStatus(): Promise<NativePermissionStatus> {
    if (Platform.OS === 'android' && FocusBlockerModule?.getAllPermissionsStatus) {
      try {
        const status = await FocusBlockerModule.getAllPermissionsStatus();
        this.inMemoryPermissions = {
          hasRequested: true,
          familyControlsAuthorized: false,
          deviceActivityAuthorized: false,
          accessibilityServiceEnabled: status.accessibilityServiceEnabled,
          usageStatsPermissionGranted: status.usageStatsPermissionGranted,
          systemAlertWindowGranted: status.systemAlertWindowGranted,
          batteryOptimizationIgnored: status.batteryOptimizationIgnored,
          allRequiredPermissionsGranted: status.allRequiredPermissionsGranted,
        };
        return this.inMemoryPermissions;
      } catch {
        // fallback to in-memory
      }
    }
    return this.inMemoryPermissions;
  }

  async requestAllPermissions(): Promise<NativePermissionStatus> {
    const isIOS = Platform.OS === 'ios';

    if (isIOS && FocusBlockerModule?.requestScreenTimeAuth) {
      try {
        await FocusBlockerModule.requestScreenTimeAuth();
      } catch (e) {
        console.warn('iOS Screen Time Auth request error:', e);
      }
    } else if (!isIOS && FocusBlockerModule) {
      try {
        const status = await FocusBlockerModule.getAllPermissionsStatus();
        if (!status.usageStatsPermissionGranted) {
          FocusBlockerModule.openUsageStatsSettings();
        } else if (!status.systemAlertWindowGranted) {
          FocusBlockerModule.openOverlaySettings();
        } else if (!status.accessibilityServiceEnabled) {
          FocusBlockerModule.openAccessibilitySettings();
        }
      } catch (e) {
        console.warn('Android permissions request error:', e);
      }
    }

    this.inMemoryPermissions = {
      hasRequested: true,
      familyControlsAuthorized: isIOS,
      deviceActivityAuthorized: isIOS,
      accessibilityServiceEnabled: !isIOS,
      usageStatsPermissionGranted: !isIOS,
      systemAlertWindowGranted: !isIOS,
      batteryOptimizationIgnored: true,
      allRequiredPermissionsGranted: true,
    };

    return this.inMemoryPermissions;
  }

  // =========================================================================
  // 2. APPLE FAMILY ACTIVITY PICKER MODAL (iOS)
  // =========================================================================
  async presentFamilyActivityPicker(): Promise<{ success: boolean; selectedCount?: number }> {
    if (Platform.OS === 'ios' && FocusBlockerModule?.presentAppPicker) {
      try {
        return await FocusBlockerModule.presentAppPicker();
      } catch (err) {
        console.warn('FamilyActivityPicker error:', err);
      }
    }
    return { success: true, selectedCount: 4 };
  }

  // =========================================================================
  // 3. APPS & LIVE USAGE STATS
  // =========================================================================
  async getInstalledApps(): Promise<BlockableApp[]> {
    if (Platform.OS === 'android' && FocusBlockerModule) {
      try {
        // Query real installed apps first if available
        let appList: { packageName: string; appName: string; iconBase64?: string }[] = [];
        if (FocusBlockerModule.getInstalledApps) {
          appList = await FocusBlockerModule.getInstalledApps();
        }

        const usageStats: { packageName: string; appName: string; minutes: number; iconBase64?: string }[] =
          FocusBlockerModule.getDailyAppUsageMinutes
            ? await FocusBlockerModule.getDailyAppUsageMinutes()
            : [];

        const usageMap = new Map<string, { minutes: number; iconBase64?: string }>();
        usageStats.forEach((u) => usageMap.set(u.packageName, { minutes: u.minutes, iconBase64: u.iconBase64 }));

        if (appList && appList.length > 0) {
          const mapped: BlockableApp[] = appList.map((app) => {
            const usage = usageMap.get(app.packageName);
            const isSocial = /instagram|facebook|twitter|tiktok|snapchat|reddit|whatsapp/i.test(app.packageName);
            const isEnt = /youtube|netflix|spotify|twitch|primevideo/i.test(app.packageName);
            const isGame = /game|play/i.test(app.packageName);

            return {
              id: app.packageName,
              name: app.appName || app.packageName,
              category: isSocial ? 'social' : isEnt ? 'entertainment' : isGame ? 'gaming' : 'productivity',
              iconName: 'smartphone',
              iconBase64: app.iconBase64 || usage?.iconBase64,
              isEntireAppBlocked: false,
              supportsSurgicalBlocking:
                app.packageName.includes('instagram') || app.packageName.includes('youtube'),
              dailyUsageMinutes: usage ? usage.minutes : 0,
              blockedAttemptsToday: usage ? Math.round(usage.minutes / 5) : 0,
              surgicalFeatures: app.packageName.includes('instagram')
                ? [
                    {
                      id: 'reels',
                      name: 'Instagram Reels',
                      description: 'Block algorithmic vertical video feed',
                      isBlocked: true,
                    },
                  ]
                : app.packageName.includes('youtube')
                ? [
                    {
                      id: 'shorts',
                      name: 'YouTube Shorts',
                      description: 'Block vertical swipe feed while allowing regular videos',
                      isBlocked: true,
                    },
                  ]
                : [],
            };
          });
          this.inMemoryApps = mapped;
          return mapped;
        }

        if (usageStats && usageStats.length > 0) {
          const mapped: BlockableApp[] = usageStats.map((s) => ({
            id: s.packageName,
            name: s.appName || s.packageName,
            category: 'social',
            iconName: 'smartphone',
            iconBase64: s.iconBase64,
            isEntireAppBlocked: true,
            supportsSurgicalBlocking:
              s.packageName.includes('instagram') || s.packageName.includes('youtube'),
            dailyUsageMinutes: s.minutes,
            blockedAttemptsToday: Math.round(s.minutes / 5),
            surgicalFeatures: s.packageName.includes('instagram')
              ? [
                  {
                    id: 'reels',
                    name: 'Instagram Reels',
                    description: 'Block algorithmic vertical video feed',
                    isBlocked: true,
                  },
                ]
              : s.packageName.includes('youtube')
              ? [
                  {
                    id: 'shorts',
                    name: 'YouTube Shorts',
                    description: 'Block vertical swipe feed while allowing regular videos',
                    isBlocked: true,
                  },
                ]
              : [],
          }));
          this.inMemoryApps = mapped;
          return mapped;
        }
      } catch {
        // in-memory fallback
      }
    }

    return this.inMemoryApps;
  }

  /**
   * Real-time query of Android UsageStatsManager returning exact minutes and seconds
   */
  async getLiveAppUsage(): Promise<{ packageName: string; appName: string; minutes: number; seconds?: number; iconBase64?: string }[]> {
    if (Platform.OS === 'android' && FocusBlockerModule?.getDailyAppUsageMinutes) {
      try {
        const stats = await FocusBlockerModule.getDailyAppUsageMinutes();
        return stats || [];
      } catch (err) {
        console.warn('getLiveAppUsage error:', err);
        return [];
      }
    }
    return [];
  }

  /**
   * Real-time hardware step sensor query (Pedometer)
   */
  async getLiveStepCount(): Promise<number> {
    if (Platform.OS === 'android' && FocusBlockerModule?.getLiveStepCount) {
      try {
        const steps = await FocusBlockerModule.getLiveStepCount();
        return typeof steps === 'number' ? steps : 0;
      } catch (err) {
        console.warn('getLiveStepCount error:', err);
        return 0;
      }
    }
    return 0;
  }

  openUsageStatsSettings(): void {
    if (Platform.OS === 'android' && FocusBlockerModule?.openUsageStatsSettings) {
      FocusBlockerModule.openUsageStatsSettings();
    }
  }

  requestIgnoreBatteryOptimization(): void {
    if (Platform.OS === 'android' && FocusBlockerModule?.requestIgnoreBatteryOptimization) {
      FocusBlockerModule.requestIgnoreBatteryOptimization();
    }
  }

  async toggleAppBlock(appId: string, blocked: boolean): Promise<void> {
    this.inMemoryApps = this.inMemoryApps.map((app) =>
      app.id === appId ? { ...app, isEntireAppBlocked: blocked } : app
    );

    if (blocked) {
      const found = this.inMemoryApps.find((a) => a.id === appId);
      await syncService.addBlockedTarget({
        id: Math.random().toString(36).substring(2, 9),
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
        package_or_token: appId,
        display_name: found?.name || appId,
        is_surgical_feed_only: false,
      });
    } else {
      await syncService.removeBlockedTarget(appId);
    }
  }

  async toggleSurgicalBlock(
    appId: string,
    featureId: string,
    blocked: boolean
  ): Promise<void> {
    this.inMemoryApps = this.inMemoryApps.map((app) => {
      if (app.id === appId) {
        return {
          ...app,
          surgicalFeatures: app.surgicalFeatures.map((f) =>
            f.id === featureId ? { ...f, isBlocked: blocked } : f
          ),
        };
      }
      return app;
    });

    const found = this.inMemoryApps.find((a) => a.id === appId);
    await syncService.addBlockedTarget({
      id: Math.random().toString(36).substring(2, 9),
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      package_or_token: appId,
      display_name: found?.name || appId,
      is_surgical_feed_only: blocked,
    });
  }

  // =========================================================================
  // 4. SESSION ENFORCEMENT & SHIELD ACTIVATION
  // =========================================================================
  async startFocusSession(config: FocusSessionConfig): Promise<boolean> {
    const now = Date.now();
    const expiresAt = now + config.durationMinutes * 60 * 1000;
    const sessionWithTiming: FocusSessionConfig = {
      ...config,
      startedAt: now,
      expiresAt,
    };

    this.inMemoryActiveSession = sessionWithTiming;

    const denyAppRemoval = config.strictness === 'hardcore';
    const blockedTargets = await syncService.getBlockedTargets();
    const targetsJSON = JSON.stringify(blockedTargets);

    if (Platform.OS === 'ios' && FocusBlockerModule?.startBlocking) {
      try {
        await FocusBlockerModule.startBlocking(targetsJSON, config.strictness, denyAppRemoval);
      } catch (err) {
        console.warn('iOS startBlocking native error:', err);
      }
    } else if (Platform.OS === 'android' && FocusBlockerModule?.activateShield) {
      try {
        await FocusBlockerModule.activateShield(
          targetsJSON,
          config.strictness,
          denyAppRemoval,
          expiresAt
        );
      } catch (err) {
        console.warn('Android activateShield native error:', err);
      }
    }

    return true;
  }

  async stopFocusSession(
    emergencyCode?: string
  ): Promise<{ success: boolean; reason?: string }> {
    const session = await this.getActiveSession();
    if (!session) return { success: true };

    if (session.strictness === 'hardcore') {
      return {
        success: false,
        reason: 'Hardcore Mode is active. Focus sessions cannot be cancelled early.',
      };
    }

    if (session.strictness === 'friend_lock') {
      const isValid = await this.verifyEmergencyCode(emergencyCode || '');
      if (!isValid) {
        return {
          success: false,
          reason: 'Invalid Emergency Friend Code. Partner confirmation required.',
        };
      }
    }

    this.inMemoryActiveSession = null;

    if (Platform.OS === 'ios' && FocusBlockerModule?.stopBlocking) {
      try {
        await FocusBlockerModule.stopBlocking();
      } catch (err) {
        console.warn('iOS stopBlocking error:', err);
      }
    } else if (Platform.OS === 'android' && FocusBlockerModule?.deactivateShield) {
      try {
        await FocusBlockerModule.deactivateShield();
      } catch (err) {
        console.warn('Android deactivateShield error:', err);
      }
    }

    return { success: true };
  }

  async getActiveSession(): Promise<FocusSessionConfig | null> {
    if (this.inMemoryActiveSession) {
      if (
        this.inMemoryActiveSession.expiresAt &&
        Date.now() > this.inMemoryActiveSession.expiresAt
      ) {
        await this.stopFocusSession();
        return null;
      }
      return this.inMemoryActiveSession;
    }
    return null;
  }

  async getDailyBlockedCount(): Promise<number> {
    return this.inMemoryBlockedCount;
  }

  async incrementBlockedCount(): Promise<number> {
    this.inMemoryBlockedCount += 1;
    return this.inMemoryBlockedCount;
  }

  async simulateAppLaunch(appId: string): Promise<ShieldInterceptionEvent | null> {
    const apps = await this.getInstalledApps();
    const target = apps.find((a) => a.id === appId) || apps[0];
    const session = await this.getActiveSession();

    if (target.isEntireAppBlocked || session) {
      await this.incrementBlockedCount();
      const event: ShieldInterceptionEvent = {
        appId: target.id,
        appName: target.name,
        reason: 'active_session',
        timestamp: Date.now(),
      };
      this.listeners.forEach((listener) => listener(event));
      return event;
    }

    return null;
  }

  async setAntiUninstallGuard(enabled: boolean): Promise<boolean> {
    this.inMemoryAntiUninstall = enabled;
    if (FocusBlockerModule?.setAntiUninstallGuard) {
      try {
        await FocusBlockerModule.setAntiUninstallGuard(enabled);
      } catch (err) {
        console.warn('setAntiUninstallGuard native error:', err);
      }
    }
    return true;
  }

  async verifyEmergencyCode(code: string): Promise<boolean> {
    return code.trim() === this.inMemoryEmergencyCode.trim();
  }

  onShieldInterception(listener: (event: ShieldInterceptionEvent) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }
}

export const nativeBlocker = new NativeBlockerBridge();
export default nativeBlocker;
