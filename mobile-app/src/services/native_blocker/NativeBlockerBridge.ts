import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  INativeBlockerService,
  NativePermissionStatus,
  BlockableApp,
  FocusSessionConfig,
  PlatformOSType,
  ShieldInterceptionEvent,
} from './types';

const STORAGE_KEYS = {
  PERMISSIONS: '@native_blocker_permissions',
  ACTIVE_SESSION: '@native_blocker_active_session',
  BLOCKED_APPS: '@native_blocker_apps',
  BLOCKED_COUNT: '@native_blocker_daily_count',
  EMERGENCY_CODE: '@native_blocker_emergency_code',
  ANTI_UNINSTALL: '@native_blocker_anti_uninstall',
};

// Initial realistic catalog of blockable apps with surgical reel/shorts capabilities
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
      {
        id: 'explore',
        name: 'Explore Page',
        description: 'Block infinite discovery feed grid',
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
      {
        id: 'comments',
        name: 'Comments Section',
        description: 'Hide distracting comment threads',
        isBlocked: false,
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
  {
    id: 'com.reddit.frontpage',
    name: 'Reddit',
    category: 'news',
    iconName: 'message-circle',
    isEntireAppBlocked: false,
    supportsSurgicalBlocking: true,
    dailyUsageMinutes: 35,
    blockedAttemptsToday: 5,
    surgicalFeatures: [
      {
        id: 'popular_feed',
        name: 'Popular / Watch Feed',
        description: 'Block rage-bait and doom-scrolling video feed',
        isBlocked: true,
      },
    ],
  },
  {
    id: 'com.snapchat.android',
    name: 'Snapchat',
    category: 'social',
    iconName: 'camera',
    isEntireAppBlocked: false,
    supportsSurgicalBlocking: true,
    dailyUsageMinutes: 28,
    blockedAttemptsToday: 3,
    surgicalFeatures: [
      {
        id: 'spotlight',
        name: 'Snapchat Spotlight',
        description: 'Block vertical video copycat feed',
        isBlocked: true,
      },
    ],
  },
  {
    id: 'com.supercell.clashroyale',
    name: 'Clash Royale',
    category: 'gaming',
    iconName: 'gamepad-2',
    isEntireAppBlocked: true,
    supportsSurgicalBlocking: false,
    dailyUsageMinutes: 45,
    blockedAttemptsToday: 6,
    surgicalFeatures: [],
  },
  {
    id: 'com.amazon.mShop.android.shopping',
    name: 'Amazon Shopping',
    category: 'shopping',
    iconName: 'shopping-bag',
    isEntireAppBlocked: false,
    supportsSurgicalBlocking: false,
    dailyUsageMinutes: 15,
    blockedAttemptsToday: 1,
    surgicalFeatures: [],
  },
];

class NativeBlockerBridge implements INativeBlockerService {
  private listeners: ((event: ShieldInterceptionEvent) => void)[] = [];

  getPlatform(): PlatformOSType {
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'unknown';
  }

  async getPermissionsStatus(): Promise<NativePermissionStatus> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }

    // Default mock initial state (requires granting during onboarding)
    return {
      hasRequested: false,
      familyControlsAuthorized: false,
      deviceActivityAuthorized: false,
      accessibilityServiceEnabled: false,
      usageStatsPermissionGranted: false,
      systemAlertWindowGranted: false,
      batteryOptimizationIgnored: false,
      allRequiredPermissionsGranted: false,
    };
  }

  async requestAllPermissions(): Promise<NativePermissionStatus> {
    const isIOS = Platform.OS === 'ios';
    const status: NativePermissionStatus = {
      hasRequested: true,
      familyControlsAuthorized: isIOS,
      deviceActivityAuthorized: isIOS,
      accessibilityServiceEnabled: !isIOS,
      usageStatsPermissionGranted: !isIOS,
      systemAlertWindowGranted: !isIOS,
      batteryOptimizationIgnored: true,
      allRequiredPermissionsGranted: true,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(status));
    return status;
  }

  async getInstalledApps(): Promise<BlockableApp[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_APPS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(DEFAULT_APPS));
    return DEFAULT_APPS;
  }

  async toggleAppBlock(appId: string, blocked: boolean): Promise<void> {
    const apps = await this.getInstalledApps();
    const updated = apps.map((app) =>
      app.id === appId ? { ...app, isEntireAppBlocked: blocked } : app
    );
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(updated));
  }

  async toggleSurgicalBlock(
    appId: string,
    featureId: string,
    blocked: boolean
  ): Promise<void> {
    const apps = await this.getInstalledApps();
    const updated = apps.map((app) => {
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
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_APPS, JSON.stringify(updated));
  }

  async startFocusSession(config: FocusSessionConfig): Promise<boolean> {
    const now = Date.now();
    const expiresAt = now + config.durationMinutes * 60 * 1000;
    const sessionWithTiming: FocusSessionConfig = {
      ...config,
      startedAt: now,
      expiresAt,
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.ACTIVE_SESSION,
      JSON.stringify(sessionWithTiming)
    );
    return true;
  }

  async stopFocusSession(
    emergencyCode?: string
  ): Promise<{ success: boolean; reason?: string }> {
    const session = await this.getActiveSession();
    if (!session) {
      return { success: true };
    }

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

    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    return { success: true };
  }

  async getActiveSession(): Promise<FocusSessionConfig | null> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      if (stored) {
        const session: FocusSessionConfig = JSON.parse(stored);
        if (session.expiresAt && Date.now() > session.expiresAt) {
          await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
          return null;
        }
        return session;
      }
    } catch {
      // fallback
    }
    return null;
  }

  async getDailyBlockedCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_COUNT);
      return count ? parseInt(count, 10) : 48; // realistic mock count
    } catch {
      return 48;
    }
  }

  async incrementBlockedCount(): Promise<number> {
    const current = await this.getDailyBlockedCount();
    const updated = current + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_COUNT, updated.toString());
    return updated;
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
    await AsyncStorage.setItem(STORAGE_KEYS.ANTI_UNINSTALL, JSON.stringify(enabled));
    return true;
  }

  async verifyEmergencyCode(code: string): Promise<boolean> {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CODE);
    const expected = stored ? JSON.parse(stored) : '778899'; // Default Friend Code
    return code.trim() === expected.trim();
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
