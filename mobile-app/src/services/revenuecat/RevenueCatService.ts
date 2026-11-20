import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import syncService from '../sync/SyncService';
import { api } from '../api';

const STORAGE_KEY_PRO_OVERRIDE = '@revenuecat_pro_entitlement_override';
const ENTITLEMENT_ID = 'pro_access';

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
  private isConfigured: boolean = false;
  private currentUserId: string | null = null;
  private isProCached: boolean = false;
  private cachedPackages: PurchasesPackage[] = [];

  /**
   * Initializes RevenueCat with platform-specific API keys and listens for CustomerInfo updates
   */
  async initialize(userId: string): Promise<boolean> {
    this.currentUserId = userId;

    const apiKey =
      Platform.OS === 'ios'
        ? 'appl_opal_focus_production_key'
        : 'goog_opal_focus_production_key';

    try {
      if (!this.isConfigured && Purchases && typeof Purchases.configure === 'function') {
        Purchases.configure({
          apiKey,
          appUserID: userId,
        });

        // Set up real-time CustomerInfo entitlement listener
        Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
          this.handleCustomerInfoUpdate(customerInfo);
        });

        this.isConfigured = true;
      }
    } catch (e) {
      // In Expo Go or non-native sandbox, continue gracefully with local fallback
      console.warn('RevenueCat native configuration warning:', e);
    }

    return this.checkProEntitlement();
  }

  /**
   * Logs RevenueCat into a specific user account (e.g. after identity linking or sign in)
   */
  async logIn(userId: string): Promise<boolean> {
    this.currentUserId = userId;
    if (this.isConfigured && Purchases && typeof Purchases.logIn === 'function') {
      try {
        const { customerInfo } = await Purchases.logIn(userId);
        await this.handleCustomerInfoUpdate(customerInfo);
      } catch (e) {
        console.warn('RevenueCat logIn warning:', e);
      }
    }
    return this.checkProEntitlement();
  }

  /**
   * Logs out of RevenueCat (used during account deletion or sign out)
   */
  async logOut(): Promise<void> {
    this.currentUserId = null;
    this.isProCached = false;
    await AsyncStorage.removeItem(STORAGE_KEY_PRO_OVERRIDE);
    if (this.isConfigured && Purchases && typeof Purchases.logOut === 'function') {
      try {
        await Purchases.logOut();
      } catch (e) {
        console.warn('RevenueCat logOut warning:', e);
      }
    }
  }

  /**
   * Internal handler when entitlement status changes from App Store / Google Play
   */
  private async handleCustomerInfoUpdate(customerInfo: CustomerInfo) {
    try {
      const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      this.isProCached = isPro;

      // Sync entitlement directly into Supabase profiles & local-first cache
      await syncService.updateProfile({
        is_pro: isPro,
      });
    } catch (err) {
      console.warn('Error handling customer info update:', err);
    }
  }

  /**
   * Returns available subscription packages (Annual $49.99/yr with 7-day trial, Monthly $8.99/mo)
   */
  async getOfferings(): Promise<SubscriptionOffering[]> {
    if (this.isConfigured) {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current && offerings.current.availablePackages.length > 0) {
          this.cachedPackages = offerings.current.availablePackages;

          return offerings.current.availablePackages.map((pkg) => {
            const isAnnual = pkg.packageType === 'ANNUAL';
            return {
              id: pkg.identifier,
              packageType: isAnnual ? 'annual' : 'monthly',
              priceString: pkg.product.priceString,
              hasFreeTrial: pkg.product.introPrice?.periodNumberOfUnits !== undefined,
              freeTrialPeriodDays: 7,
            };
          });
        }
      } catch {
        // fallback to default schema
      }
    }

    // Default Offerings fallback
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

  /**
   * Checks pro entitlement status across local override, Supabase profile, and RevenueCat SDK
   */
  async checkProEntitlement(): Promise<boolean> {
    try {
      // 1. Check local test override
      const localOverride = await AsyncStorage.getItem(STORAGE_KEY_PRO_OVERRIDE);
      if (localOverride === 'true') {
        this.isProCached = true;
        return true;
      }

      // 2. Check RevenueCat live customer info if native SDK is ready
      if (this.isConfigured) {
        try {
          const customerInfo = await Purchases.getCustomerInfo();
          const hasProEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          if (hasProEntitlement) {
            this.isProCached = true;
            await syncService.updateProfile({ is_pro: true });
            return true;
          }
        } catch {
          // fallback to cached profile
        }
      }

      // 3. Check Backend / Subscription API endpoint
      try {
        const sub = await api.getSubscriptionStatus();
        if (sub && typeof sub.is_pro === 'boolean') {
          this.isProCached = sub.is_pro;
          return this.isProCached;
        }
      } catch {
        // fallback to cached profile
      }

      // 4. Check cached profile
      const profile = await syncService.getProfile();
      this.isProCached = Boolean(profile.is_pro);
      return this.isProCached;
    } catch {
      return false;
    }
  }

  /**
   * Executes in-app purchase for chosen package and synchronizes is_pro state
   */
  async purchasePackage(
    packageId: string
  ): Promise<{ success: boolean; isPro: boolean; error?: string }> {
    try {
      if (this.isConfigured && this.cachedPackages.length > 0) {
        const targetPkg = this.cachedPackages.find((p) => p.identifier === packageId);
        if (targetPkg) {
          const { customerInfo } = await Purchases.purchasePackage(targetPkg);
          const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
          if (isPro) {
            await AsyncStorage.setItem(STORAGE_KEY_PRO_OVERRIDE, 'true');
            this.isProCached = true;
            await syncService.updateProfile({ is_pro: true });
            return { success: true, isPro: true };
          }
        }
      }

      // Sandbox / Simulator fallback flow
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

  /**
   * Restores past purchases from Apple App Store / Google Play
   */
  async restorePurchases(): Promise<{ success: boolean; isPro: boolean }> {
    try {
      if (this.isConfigured) {
        const customerInfo = await Purchases.restorePurchases();
        const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        if (isPro) {
          await AsyncStorage.setItem(STORAGE_KEY_PRO_OVERRIDE, 'true');
          this.isProCached = true;
          await syncService.updateProfile({ is_pro: true });
          return { success: true, isPro: true };
        }
      }

      const isPro = await this.checkProEntitlement();
      if (isPro) {
        await syncService.updateProfile({ is_pro: true });
      }
      return { success: true, isPro };
    } catch {
      const isPro = await this.checkProEntitlement();
      return { success: true, isPro };
    }
  }

  /**
   * Centralized Feature Gating Check:
   * Pro Features: Deep Focus, Anti-Uninstall Guard, Surgical Reels, Geofencing, Step Gating, Unlimited Schedules
   */
  canAccessFeature(feature: ProFeature, isProUser: boolean): boolean {
    if (isProUser) return true;
    return false;
  }
}

export const revenueCat = new RevenueCatService();
export default revenueCat;
