import { Linking } from 'react-native';
import { supabase } from '../supabase/client';
import syncService from '../sync/SyncService';
import nativeBlocker from '../native_blocker/NativeBlockerBridge';
import healthStepService from './HealthStepService';
import { api } from '../api';

/**
 * Pure In-Memory Addons Service (Friend Lock & NFC Tag Pairing):
 * - 0% local database / 0% AsyncStorage / 0% SQLite
 * - Direct Supabase emergency_unlock_codes & profiles single source of truth
 */
class AddonsService {
  private inMemoryOfflineOtp: string | null = null;
  private inMemorySavedNfcTag: string | null = null;

  // ==========================================
  // 1. FRIEND LOCK EMERGENCY UNLOCK (WhatsApp/SMS + Supabase OTP)
  // ==========================================
  /**
   * Generates a 6-digit OTP in Supabase emergency_unlock_codes valid for 10 minutes
   * and opens a pre-filled WhatsApp / SMS share sheet to the accountability partner.
   */
  async requestFriendEmergencyUnlock(
    partnerName: string = 'Alex',
    partnerContact?: string
  ): Promise<{ otpCode: string; shareUrl: string }> {
    let otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // 1. Try Backend API first
    try {
      const active = await syncService.getActiveSession();
      const backendRes = await api.generateFriendUnlockOtp(active?.id);
      if (backendRes?.otpCode) {
        otpCode = backendRes.otpCode;
      }
    } catch {
      // 2. Direct Supabase RPC / table insertion
      try {
        const profile = await syncService.getProfile();
        const userId = profile.id;

        if (userId) {
          await supabase.from('emergency_unlock_codes').insert({
            user_id: userId,
            otp_code: otpCode,
            expires_at: expiresAt,
            is_used: false,
          });
        }
      } catch {
        this.inMemoryOfflineOtp = otpCode;
      }
    }

    const message = encodeURIComponent(
      `Hey ${partnerName}! I am currently locked in a Deep Focus Session and urgently need your partner unlock code. My emergency OTP is: ${otpCode} (valid for 10 mins).`
    );

    const shareUrl = partnerContact
      ? `https://wa.me/${partnerContact.replace(/[^0-9]/g, '')}?text=${message}`
      : `https://wa.me/?text=${message}`;

    const supported = await Linking.canOpenURL(shareUrl).catch(() => false);
    if (supported) {
      await Linking.openURL(shareUrl).catch(() => {});
    } else {
      const smsUrl = `sms:?body=${message}`;
      await Linking.openURL(smsUrl).catch(() => {});
    }

    return { otpCode, shareUrl };
  }

  /**
   * Verifies the 6-digit OTP against Supabase emergency_unlock_codes or RPC
   */
  async verifyFriendOTP(code: string, activeSessionId?: string): Promise<boolean> {
    const trimmed = code.trim();
    if (!trimmed || trimmed.length !== 6) return false;

    let isAuthorized = false;

    // 1. Master development / emergency override code
    if (trimmed === '778899') {
      isAuthorized = true;
    } else {
      // 2. Direct Supabase RPC verification
      if (activeSessionId) {
        const verified = await syncService.verifyFriendUnlockOtp(activeSessionId, trimmed);
        if (verified) {
          isAuthorized = true;
        }
      }

      if (!isAuthorized) {
        // 3. Check Backend API
        try {
          const backendRes = await api.verifyFriendUnlockOtp(trimmed, activeSessionId);
          if (backendRes?.unlocked) {
            isAuthorized = true;
          }
        } catch {
          // 4. In-Memory fallback check
          if (this.inMemoryOfflineOtp === trimmed) {
            this.inMemoryOfflineOtp = null;
            isAuthorized = true;
          }
        }
      }
    }

    if (isAuthorized) {
      await this.handleEmergencySessionBreak(activeSessionId);
      return true;
    }

    return false;
  }

  /**
   * Internal helper: marks session 'broken' and deactivates native shield
   */
  private async handleEmergencySessionBreak(sessionId?: string): Promise<void> {
    try {
      const active = await syncService.getActiveSession();
      const targetId = sessionId || active?.id;

      if (targetId) {
        await syncService.cancelSessionEarly(targetId);
      }

      await nativeBlocker.stopFocusSession();
    } catch (e) {
      console.warn('Error handling emergency session break:', e);
    }
  }

  // ==========================================
  // 2. PHYSICAL NFC TAG PAIRING & HARDWARE UNLOCK
  // ==========================================
  /**
   * Pairs a physical NFC tag UID and persists directly to Supabase profiles
   */
  async pairNfcTag(uid: string): Promise<string> {
    this.inMemorySavedNfcTag = uid;
    await syncService.updateProfile({ nfc_tag_uid: uid });
    return uid;
  }

  /**
   * Verifies scanned tag UID. If valid, releases hardware-locked session
   */
  async verifyAndReleaseNfcSession(scannedUid: string, activeSessionId?: string): Promise<boolean> {
    const profile = await syncService.getProfile();
    const saved = profile.nfc_tag_uid || this.inMemorySavedNfcTag;

    if (!saved) return true;

    const isMatch = saved.trim().toLowerCase() === scannedUid.trim().toLowerCase();
    if (isMatch) {
      await this.handleEmergencySessionBreak(activeSessionId);
      return true;
    }

    return false;
  }

  async verifyNfcTag(scannedUid: string): Promise<boolean> {
    return this.verifyAndReleaseNfcSession(scannedUid);
  }

  // ==========================================
  // 3. HEALTHKIT / HEALTH CONNECT STEP COUNT
  // ==========================================
  async getTodaySteps(): Promise<number> {
    return healthStepService.getTodaySteps();
  }

  async setTodaySteps(steps: number): Promise<void> {
    return healthStepService.setTodaySteps(steps);
  }

  async isStepGoalReached(targetGoal: number = 5000): Promise<boolean> {
    return healthStepService.isStepGoalReached(targetGoal);
  }
}

export const addonsService = new AddonsService();
export default addonsService;
