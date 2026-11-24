/**
 * Native Blocker Service Interfaces & Types
 * Cross-platform bridge definitions for:
 * - iOS: Screen Time API (FamilyControls, ManagedSettings, DeviceActivity)
 * - Android: AccessibilityService, UsageStatsManager, OverlayPermission
 */

export type PlatformOSType = 'ios' | 'android' | 'web' | 'unknown';

export type AppCategory =
  | 'social'
  | 'entertainment'
  | 'gaming'
  | 'productivity'
  | 'shopping'
  | 'news'
  | 'utilities';

export interface SurgicalFeature {
  id: string; // e.g. 'reels', 'shorts', 'fyp', 'explore'
  name: string; // e.g. 'Instagram Reels', 'YouTube Shorts'
  description: string;
  isBlocked: boolean;
}

export interface BlockableApp {
  id: string; // Package name on Android, bundle ID or FamilyControls token on iOS
  name: string;
  category: AppCategory;
  iconName: string;
  iconBase64?: string; // Real native app icon base64 data URL
  isEntireAppBlocked: boolean;
  supportsSurgicalBlocking: boolean;
  surgicalFeatures: SurgicalFeature[];
  dailyUsageMinutes: number;
  blockedAttemptsToday: number;
}

export type StrictnessLevel =
  | 'normal' // Can pause session with 10s breathing delay
  | 'friction' // Requires solving a micro-puzzle or breathing exercise
  | 'hardcore' // Unbreakable: No cancellation, Anti-Uninstall guard enabled
  | 'friend_lock'; // Requires Emergency Friend Code from accountability partner

export interface FocusSessionConfig {
  id: string;
  title: string;
  durationMinutes: number;
  strictness: StrictnessLevel;
  blockedAppIds: string[];
  surgicalFeatureIds: string[];
  autoDoNotDisturb: boolean;
  startedAt?: number;
  expiresAt?: number;
}

export interface NativePermissionStatus {
  hasRequested: boolean;
  // iOS Specific
  familyControlsAuthorized: boolean;
  deviceActivityAuthorized: boolean;
  // Android Specific
  accessibilityServiceEnabled: boolean;
  usageStatsPermissionGranted: boolean;
  systemAlertWindowGranted: boolean; // For draw-over-apps shield overlay
  batteryOptimizationIgnored: boolean;
  // Global status
  allRequiredPermissionsGranted: boolean;
}

export interface ShieldInterceptionEvent {
  appId: string;
  appName: string;
  surgicalFeatureName?: string;
  reason: 'active_session' | 'smart_schedule' | 'geofence' | 'daily_limit';
  timestamp: number;
}

export interface INativeBlockerService {
  getPlatform(): PlatformOSType;
  getPermissionsStatus(): Promise<NativePermissionStatus>;
  requestAllPermissions(): Promise<NativePermissionStatus>;
  getInstalledApps(): Promise<BlockableApp[]>;
  toggleAppBlock(appId: string, blocked: boolean): Promise<void>;
  toggleSurgicalBlock(appId: string, featureId: string, blocked: boolean): Promise<void>;
  startFocusSession(config: FocusSessionConfig): Promise<boolean>;
  stopFocusSession(emergencyCode?: string): Promise<{ success: boolean; reason?: string }>;
  getActiveSession(): Promise<FocusSessionConfig | null>;
  getDailyBlockedCount(): Promise<number>;
  simulateAppLaunch(appId: string): Promise<ShieldInterceptionEvent | null>;
  setAntiUninstallGuard(enabled: boolean): Promise<boolean>;
  verifyEmergencyCode(code: string): Promise<boolean>;
}
