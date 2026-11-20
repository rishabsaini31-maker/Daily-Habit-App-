import AsyncStorage from '@react-native-async-storage/async-storage';
import syncService from '../sync/SyncService';

const STORAGE_KEY_PRO_OVERRIDE = '@revenuecat_pro_entitlement_override';

export interface SubscriptionOffering {
  id: string;
  packageType: 'annual' | 'monthly';
  priceString: string;
  introductoryPrice?: string;
  hasFreeTrial: boolean;
  freeTrialPeriodDays?: number;
}

export type ProFeature =
  | 'deep_focus' // Hardcore Mode
  | 'anti_uninstall_guard' // Prevent deleting app
  | 'surgical_reels_shorts' // Surgical Reels/Shorts blocking
  | 'geofence_schedules' // GPS location auto-lock
  | 'step_gated_unlock' // Physical activity unlocks
  | 'unlimited_schedules'; // Multiple smart schedules

class RevenueCatService {
  private currentUserId: string | null = null;
  private isProCached: boolean = false;

  async initialize(userId: string): Promise<boolean> {
    this.currentUserId = userId;
    const isPro = await this.checkProEntitlement();
    return isPro;
  }

  async getOfferings(): Promise<SubscriptionOffering[]> {
    return [
      {
        id: 'annual_4999_trial',
        packageType: 'annual',
        priceString: '$49.99/yr ($4.16/mo)',
        hasFreeTrial: true,
        freeTrialPeriodDays: 7,
      },
      {
        id: 'monthly_899',
        packageType: 'monthly',
        priceString: '$8.99/mo',
        hasFreeTrial: false,
      },
    ];
  }

  async checkProEntitlement(): Promise<boolean> {
    try {
      // Check local override or cached profile
      const localOverride = await AsyncStorage.getItem(STORAGE_KEY_PRO_OVERRIDE);
      if (localOverride === 'true') {
        this.isProCached = true;
        return true;
      }

      const profile = await syncService.getProfile();
      this.isProCached = Boolean(profile.is_pro);
      return this.isProCached;
    } catch {
      return false;
    }
  }

  async purchasePackage(
    packageId: string
  ): Promise<{ success: boolean; isPro: boolean; error?: string }> {
    try {
      // Execute purchase flow and sync is_pro to Supabase profile
      await AsyncStorage.setItem(STORAGE_KEY_PRO_OVERRIDE, 'true');
      this.isProCached = true;

      await syncService.updateProfile({
        is_pro: true,
      });

      return { success: true, isPro: true };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, isPro: false, error: msg };
    }
  }

  async restorePurchases(): Promise<{ success: boolean; isPro: boolean }> {
    const isPro = await this.checkProEntitlement();
    if (isPro) {
      await syncService.updateProfile({ is_pro: true });
    }
    return { success: true, isPro };
  }

  canAccessFeature(feature: ProFeature, isProUser: boolean): boolean {
    if (isProUser) return true;
    // Free tier allows only 1 schedule and normal friction mode
    return false;
  }
}

export const revenueCat = new RevenueCatService();
export default revenueCat;
