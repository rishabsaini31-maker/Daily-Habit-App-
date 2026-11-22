import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Shield,
  KeyRound,
  Activity,
  RotateCcw,
  CheckCircle2,
  LogIn,
  Crown,
  Trash2,
  User as UserIcon,
  Flame,
  Award,
  Clock,
  Sparkles,
  Smartphone,
  Globe,
  Radio,
  ExternalLink,
  ChevronRight,
  Copy,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import nativeBlocker from '../../services/native_blocker/NativeBlockerBridge';
import authService from '../../services/supabase/auth';
import oAuthService from '../../services/oauth/OAuthService';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import { AppleIcon, GoogleIcon } from '../../core/theme/components/SocialIcons';

const APP_LOGO = require('../../../assets/images/app-logo.png');

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney',
  'UTC',
];

export const SettingsScreen: React.FC = () => {
  const { closeModal, openModal } = useAppNavigation();
  const { resetOnboarding } = useOnboarding();
  const { profile, updateProfile, todayMetrics } = useFocusEngine();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();

  const [antiUninstallEnabled, setAntiUninstallEnabled] = useState<boolean>(true);
  const [healthSyncEnabled, setHealthSyncEnabled] = useState<boolean>(true);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);
  const [isLinking, setIsLinking] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [currentTimezone, setCurrentTimezone] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );
  const [showTzPicker, setShowTzPicker] = useState<boolean>(false);

  useEffect(() => {
    const u = oAuthService.getCurrentOAuthUser();
    setIsAnonymous(!u || u.isGuest);
  }, []);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Permanently Delete Account?',
      'This will permanently delete your account, streaks, Focus Gems, and all custom schedules from our cloud servers and this device.\n\nThis action is irreversible and complies with Apple App Store & Google Play privacy guidelines.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const res = await authService.deleteAccount();
              if (res.success) {
                await resetOnboarding();
                closeModal();
                Alert.alert(
                  'Account Deleted',
                  'Your account and all associated personal data have been completely wiped.'
                );
              } else {
                Alert.alert('Deletion Failed', res.error || 'Unable to delete account.');
              }
            } catch {
              Alert.alert('Error', 'An error occurred during account deletion.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleToggleAntiUninstall = async (value: boolean) => {
    if (value && !profile.is_pro) {
      Alert.alert(
        'Pro Feature',
        'Anti-Uninstall Guard requires DHI Pro to prevent settings bypass during focus sessions.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock Pro', onPress: () => openModal('paywall') },
        ]
      );
      return;
    }
    setAntiUninstallEnabled(value);
    await nativeBlocker.setAntiUninstallGuard(value);
  };

  const handleLinkApple = async () => {
    setIsLinking(true);
    try {
      const res = await oAuthService.signInWithApple();
      if (res.success) {
        setIsAnonymous(false);
        Alert.alert('Apple OAuth Connected ✓', 'Profile synchronized with Apple account.');
      }
    } catch (err: any) {
      Alert.alert('Sign-In Error', err?.message || 'Apple Sign-In cancelled.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const res = await oAuthService.signInWithGoogle();
      if (res.success) {
        setIsAnonymous(false);
        Alert.alert('Google OAuth Connected ✓', 'Profile synchronized with Google account.');
      }
    } catch (err: any) {
      Alert.alert('Sign-In Error', err?.message || 'Google Sign-In cancelled.');
    } finally {
      setIsLinking(false);
    }
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'diamond':
        return { text: '#38BDF8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)' };
      case 'obsidian':
        return { text: '#C084FC', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.35)' };
      case 'gold':
        return { text: '#FBBF24', bg: 'rgba(251, 191, 36, 0.15)', border: 'rgba(251, 191, 36, 0.35)' };
      case 'silver':
        return { text: '#E2E8F0', bg: 'rgba(226, 232, 240, 0.15)', border: 'rgba(226, 232, 240, 0.35)' };
      default:
        return { text: '#D97706', bg: 'rgba(217, 119, 6, 0.15)', border: 'rgba(217, 119, 6, 0.35)' };
    }
  };

  const tierStyle = getTierBadgeStyle(profile.tier_rank || 'Bronze');
  const baselineHours = ((profile.daily_baseline_minutes || 270) / 60).toFixed(1);
  const reclaimedHours = ((todayMetrics.blocked_time_min || 0) / 60).toFixed(1);

  return (
    <View style={styles.fullScreenWrapper}>
      <View style={[styles.container, responsiveContainerStyle]}>
        {/* Dynamic Header (never goes under Dynamic Island or Notch) */}
        <View style={[styles.header, { paddingTop: topInset + 6 }]}>
          <TouchableOpacity
            onPress={closeModal}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.primaryText} />
          </TouchableOpacity>
          <View style={styles.headerTitleCenter}>
            <Text style={styles.headerTitle}>Profile & Settings</Text>
            <Text style={styles.headerSubtitle}>Digital Well-Being Identity</Text>
          </View>
          <View style={styles.headerRightBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusDotText}>Online</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(bottomInset + 48, 64) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. HERO USER PROFILE CARD */}
          <GlassCard style={styles.heroProfileCard}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarBigCircle}>
                <Image source={APP_LOGO} style={styles.avatarLogoBig} resizeMode="cover" />
                <View style={styles.protectionActiveBadge} />
              </View>
              <View style={styles.userMainCol}>
                <View style={styles.nameAndTierRow}>
                  <Text style={styles.userNameText}>
                    {profile.display_name || 'Focus Pioneer'}
                  </Text>
                  <View
                    style={[
                      styles.tierBadge,
                      { backgroundColor: tierStyle.bg, borderColor: tierStyle.border },
                    ]}
                  >
                    <Award size={12} color={tierStyle.text} />
                    <Text style={[styles.tierBadgeText, { color: tierStyle.text }]}>
                      {profile.tier_rank || 'Bronze'}
                    </Text>
                  </View>
                </View>
                <View style={styles.guestIdRow}>
                  <Text style={styles.userIdText}>
                    {profile.is_pro ? 'DHI Pro Member' : 'Guest Account'}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyIdBtn}
                    onPress={() => {
                      Alert.alert(
                        'Account Identifier',
                        `ID: ${profile.id || 'guest_dev_session'}\n\nThis identifier is linked to your device's focus session.`
                      );
                    }}
                    activeOpacity={0.7}
                    accessibilityLabel="Copy Account ID"
                  >
                    <Copy size={11} color={colors.secondaryMutedText} />
                    <Text style={styles.copyIdText}>Copy ID</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 4-Stat Telemetry Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <Flame size={14} color="#F97316" />
                  <Text style={styles.statNumber}>{profile.streak_days ?? 0}</Text>
                </View>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <Award size={14} color="#38BDF8" />
                  <Text style={[styles.statNumber, { color: '#38BDF8' }]}>
                    {profile.total_gems ?? 0}
                  </Text>
                </View>
                <Text style={styles.statLabel}>Focus Gems</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <Clock size={14} color="#E2E8F0" />
                  <Text style={styles.statNumber}>{baselineHours}h</Text>
                </View>
                <Text style={styles.statLabel}>Daily Baseline</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <View style={styles.statIconRow}>
                  <CheckCircle2 size={14} color="#10B981" />
                  <Text style={[styles.statNumber, { color: '#10B981' }]}>
                    {reclaimedHours}h
                  </Text>
                </View>
                <Text style={styles.statLabel}>Reclaimed</Text>
              </View>
            </View>
          </GlassCard>

          {/* 2. PRO MEMBERSHIP VIP PASS CARD */}
          <GlassCard
            variant={profile.is_pro ? 'accent' : 'elevated'}
            style={[styles.proMembershipCard, profile.is_pro && styles.proCardGlow]}
          >
            <View style={styles.proHeaderRow}>
              <View style={styles.proIconBox}>
                <Crown size={22} color={profile.is_pro ? '#10B981' : '#FBBF24'} />
              </View>
              <View style={styles.proTextCol}>
                <View style={styles.proTitleRow}>
                  <Text style={styles.proCardTitle}>
                    {profile.is_pro ? 'DHI Pro Pass Active' : 'Upgrade to DHI Pro'}
                  </Text>
                  <View
                    style={[
                      styles.proPillBadge,
                      profile.is_pro && styles.proPillBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.proPillBadgeText,
                        profile.is_pro && { color: '#10B981' },
                      ]}
                    >
                      {profile.is_pro ? 'UNLOCKED' : 'PRO ACCESS'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.proCardSub}>
                  {profile.is_pro
                    ? 'Unbreakable Deep Focus, Surgical Reels Blocking & Unlimited Schedules.'
                    : 'Unlock Hardcore mode, surgical video blockers, and unlimited geofencing.'}
                </Text>
              </View>
            </View>

            {!profile.is_pro ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => openModal('paywall')}
                style={styles.proUpgradeBtn}
              >
                <Sparkles size={16} color="#08090D" />
                <Text style={styles.proUpgradeBtnText}>Unlock Pro (7 Days Free)</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.proActiveFooter}>
                <CheckCircle2 size={14} color="#10B981" />
                <Text style={styles.proActiveFooterText}>
                  All Differentiator Features Active on iOS & Android
                </Text>
              </View>
            )}
          </GlassCard>

          {/* 3. DIRECT OAUTH CLOUD LINKING (Apple / Google) */}
          <Text style={styles.sectionHeader}>ACCOUNT & CLOUD IDENTITY</Text>
          <GlassCard style={styles.card}>
            <View style={styles.accountRow}>
              <View style={styles.accountTextCol}>
                <Text style={styles.cardTitle}>Identity Status</Text>
                <Text style={styles.cardSub}>
                  {isAnonymous
                    ? 'Anonymous Guest Session • In-memory state syncs to Cloud'
                    : 'Linked Cloud Profile • Streaks and Gems saved across devices'}
                </Text>
              </View>
              <View
                style={[
                  styles.guestBadge,
                  !isAnonymous && { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                ]}
              >
                <Text
                  style={[
                    styles.guestBadgeText,
                    !isAnonymous && { color: '#10B981' },
                  ]}
                >
                  {isAnonymous ? 'GUEST' : 'LINKED'}
                </Text>
              </View>
            </View>

            {isAnonymous && (
              <View style={styles.linkButtonsRow}>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={styles.linkSocialBtn}
                    onPress={handleLinkApple}
                    disabled={isLinking}
                    activeOpacity={0.75}
                  >
                    <AppleIcon size={16} color="#FFFFFF" />
                    <Text style={styles.linkSocialText}>
                      {isLinking ? 'Linking...' : 'Apple ID'}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.linkSocialBtn}
                  onPress={handleLinkGoogle}
                  disabled={isLinking}
                  activeOpacity={0.75}
                >
                  <GoogleIcon size={16} />
                  <Text style={styles.linkSocialText}>
                    {isLinking ? 'Linking...' : 'Google Account'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </GlassCard>

          {/* 4. REGIONAL & TIMEZONE PREFERENCES */}
          <Text style={styles.sectionHeader}>PREFERENCES & REGION</Text>
          <GlassCard style={styles.card}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setShowTzPicker(!showTzPicker)}
              style={styles.cardRow}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                <Globe size={20} color={colors.primaryAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>Daily Midnight Reset Timezone</Text>
                <Text style={styles.cardSub}>{currentTimezone}</Text>
              </View>
              <ChevronRight
                size={18}
                color={colors.secondaryMutedText}
                style={{ transform: [{ rotate: showTzPicker ? '90deg' : '0deg' }] }}
              />
            </TouchableOpacity>

            {showTzPicker && (
              <View style={styles.tzDropdown}>
                {COMMON_TIMEZONES.map((tz) => (
                  <TouchableOpacity
                    key={tz}
                    onPress={() => {
                      setCurrentTimezone(tz);
                      setShowTzPicker(false);
                    }}
                    style={[styles.tzItem, currentTimezone === tz && styles.tzItemActive]}
                  >
                    <Text
                      style={[
                        styles.tzItemText,
                        currentTimezone === tz && styles.tzItemTextActive,
                      ]}
                    >
                      {tz}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </GlassCard>

          {/* 5. NATIVE OS BLOCKER & SECURITY CONTROLS */}
          <Text style={styles.sectionHeader}>NATIVE OS SYSTEM CONTROLS</Text>

          {/* Anti-Uninstall Guard */}
          <GlassCard style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Shield size={20} color={colors.dangerAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <View style={styles.rowWithBadge}>
                  <Text style={styles.cardTitle}>Anti-Uninstall Shield</Text>
                  {!profile.is_pro && (
                    <View style={styles.proTag}>
                      <Crown size={10} color="#FBBF24" />
                      <Text style={styles.proTagText}>PRO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSub}>
                  Blocks Android Settings removal and device force-stop during active sessions.
                </Text>
              </View>
              <Switch
                value={antiUninstallEnabled}
                onValueChange={handleToggleAntiUninstall}
                trackColor={{ false: '#1E2230', true: colors.primaryAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </GlassCard>

          {/* HealthKit / Step Tracking Sync */}
          <GlassCard style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Activity size={20} color={colors.positiveAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>HealthKit / Steps Sync</Text>
                <Text style={styles.cardSub}>
                  Syncs daily walking steps to automatically unlock apps once you hit 5,000 steps.
                </Text>
              </View>
              <Switch
                value={healthSyncEnabled}
                onValueChange={setHealthSyncEnabled}
                trackColor={{ false: '#1E2230', true: colors.positiveAccent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </GlassCard>

          {/* 6. DIFFERENTIATOR HARDWARE & ACCOUNTABILITY LOCKS */}
          <Text style={styles.sectionHeader}>ACCOUNTABILITY & HARDWARE LOCKS</Text>

          {/* Friend Lock */}
          <GlassCard style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <KeyRound size={20} color={colors.warningAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>Friend Lock (Emergency OTP)</Text>
                <Text style={styles.cardSub}>
                  Partner: {profile.friend_partner_name || 'Alex'} • PIN:{' '}
                  <Text style={styles.pinCode}>778899</Text>
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  Alert.alert(
                    'Edit Partner',
                    'Update your accountability partner contact in Supabase.'
                  )
                }
              >
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* NFC Tag Lock */}
          <GlassCard style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                <Radio size={20} color="#A855F7" />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>Physical NFC Tag Lock</Text>
                <Text style={styles.cardSub}>
                  {profile.nfc_tag_uid ? `Paired Tag: ${profile.nfc_tag_uid}` : 'Tap NTAG213/215 sticker to unlock'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() =>
                  Alert.alert('NFC Reader', 'Hold any NTAG213/215 sticker to the top of your phone.')
                }
              >
                <Text style={styles.editBtnText}>{profile.nfc_tag_uid ? 'Re-pair' : 'Pair'}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* 7. DANGER ZONE & STORE COMPLIANCE */}
          <Text style={[styles.sectionHeader, { color: colors.dangerAccent }]}>
            DANGER ZONE & COMPLIANCE
          </Text>

          {/* Reset Onboarding */}
          <GlassCard style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <RotateCcw size={20} color={colors.warningAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardTitle}>Reset Onboarding Flow</Text>
                <Text style={styles.cardSub}>
                  Re-run the initial 5-step quiz, baseline check, and permissions setup.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={async () => {
                  await resetOnboarding();
                  closeModal();
                }}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* Account Deletion (Apple 5.1.1 & Play Store Mandatory) */}
          <GlassCard style={[styles.card, styles.dangerCard]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Trash2 size={20} color={colors.dangerAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={[styles.cardTitle, { color: colors.dangerAccent }]}>
                  Permanently Delete Account
                </Text>
                <Text style={styles.cardSub}>
                  Wipes your profile, streaks, and schedules. Mandatory compliance with App Store & Play Store.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.dangerAccent} />
                ) : (
                  <Text style={styles.deleteBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>

          {/* App Telemetry Footer */}
          <View style={styles.appInfoContainer}>
            <Text style={styles.appInfoTitle}>Focus Well-Being & App Blocker</Text>
            <Text style={styles.appInfoVersion}>
              Version 2.4.0 • Zero-Local-Database Architecture{'\n'}
              Cross-Platform Native Shielding • Cloud Synced
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullScreenWrapper: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.obsidian,
    zIndex: 100,
  },
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
    backgroundColor: colors.obsidian,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  headerTitleCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.titleMedium,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    ...typography.caption,
    fontSize: 10,
    color: colors.secondaryMutedText,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  headerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusDotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
  },
  heroProfileCard: {
    padding: 18,
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarBigCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#12141D',
    borderWidth: 2,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarLogoBig: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  protectionActiveBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.positiveAccent,
    borderWidth: 2,
    borderColor: colors.obsidian,
  },
  userMainCol: {
    flex: 1,
  },
  nameAndTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userNameText: {
    ...typography.titleLarge,
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  userIdText: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 11,
  },
  guestIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  copyIdBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  copyIdText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.secondaryMutedText,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.hairlineBorder,
  },
  proMembershipCard: {
    padding: 18,
    marginBottom: 16,
  },
  proCardGlow: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  proHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  proIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proTextCol: {
    flex: 1,
  },
  proTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proCardTitle: {
    ...typography.titleMedium,
    fontSize: 16,
    fontWeight: '800',
  },
  proPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  proPillBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  proPillBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  proCardSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginTop: 4,
    lineHeight: 16,
  },
  proUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#38BDF8',
  },
  proUpgradeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#08090D',
  },
  proActiveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  proActiveFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 1.2,
  },
  card: {
    padding: 16,
    marginBottom: 10,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountTextCol: {
    flex: 1,
    marginRight: 12,
  },
  guestBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  guestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryMutedText,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  linkButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  linkSocialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.hairlineBorder,
    paddingVertical: 10,
    borderRadius: 12,
  },
  linkSocialText: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextCol: {
    flex: 1,
    marginRight: 8,
  },
  rowWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  proTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
  },
  cardTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    marginBottom: 2,
    color: '#FFFFFF',
  },
  cardSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 16,
  },
  tzDropdown: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    gap: 4,
  },
  tzItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  tzItemActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
  },
  tzItemText: {
    fontSize: 12,
    color: colors.secondaryMutedText,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tzItemTextActive: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  pinCode: {
    color: colors.primaryAccent,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.hairlineBorder,
  },
  editBtnText: {
    ...typography.caption,
    color: colors.primaryText,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  resetBtnText: {
    ...typography.caption,
    color: colors.warningAccent,
    fontWeight: '700',
  },
  dangerCard: {
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  deleteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    ...typography.caption,
    color: colors.dangerAccent,
    fontWeight: '700',
  },
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  appInfoTitle: {
    ...typography.titleMedium,
    fontSize: 13,
    color: colors.secondaryMutedText,
  },
  appInfoVersion: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.tertiaryText,
    marginTop: 2,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default SettingsScreen;
