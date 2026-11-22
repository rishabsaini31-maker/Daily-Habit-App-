import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import {
  Flame,
  Crown,
  Play,
  StopCircle,
  Sliders,
  ShieldAlert,
  Clock,
  Sparkles,
  Zap,
  Lock,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import FocusRing from '../../core/theme/components/FocusRing';
import ChronographClock from '../../core/theme/components/ChronographClock';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';

const APP_LOGO = require('../../../assets/images/app-logo.png');

export const HomeScreen: React.FC = () => {
  const { openModal, presentShield } = useAppNavigation();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const {
    profile,
    activeSession,
    remainingSeconds,
    formattedRemainingTime,
    focusScore,
    todayMetrics,
    blockedTargets,
    stopSessionEarly,
  } = useFocusEngine();

  const handleStopSession = async () => {
    if (!activeSession) return;

    if (activeSession.strictness_mode === 'deep_focus') {
      Alert.alert(
        'Deep Focus Locked',
        'Deep Focus Mode is unbreakable. Sessions cannot be stopped until the countdown timer expires.',
        [{ text: 'Understood' }]
      );
      return;
    }

    if (activeSession.strictness_mode === 'friend_or_nfc') {
      presentShield({
        appName: 'Focus Session',
        reason: 'Requires Friend Emergency Code or NFC Key',
      });
      return;
    }

    Alert.alert(
      'End Focus Session?',
      'You are currently in a flow state. Are you sure you want to lift the focus shield early?',
      [
        { text: 'Keep Focusing', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            const res = await stopSessionEarly();
            if (!res.success && res.reason) {
              Alert.alert('Session Lock', res.reason);
            }
          },
        },
      ]
    );
  };

  const reclaimedHours = Math.floor((todayMetrics.blocked_time_min || 0) / 60);
  const reclaimedMins = (todayMetrics.blocked_time_min || 0) % 60;
  const reclaimedStr = `${reclaimedHours}h ${reclaimedMins}m`;
  const estimatedGems = activeSession
    ? Math.max(10, Math.floor(activeSession.duration_minutes / 2))
    : 15;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 8,
            paddingBottom: 80 + bottomInset,
          },
          responsiveContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => openModal('profile')}
            style={styles.avatarButton}
            accessibilityLabel="Open Full Screen Profile"
          >
            <View style={styles.avatarCircle}>
              <Image source={APP_LOGO} style={styles.avatarLogo} resizeMode="cover" />
            </View>
            <View style={styles.protectionActiveBadge} />
          </TouchableOpacity>

          <View style={styles.streakBadge}>
            <Flame size={16} color="#F97316" />
            <Text style={styles.streakText}>{profile.streak_days ?? 0}-Day Streak</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => openModal('paywall')}
            style={[styles.proPill, profile.is_pro && styles.proPillActive]}
          >
            <Crown size={14} color={profile.is_pro ? '#10B981' : '#FBBF24'} />
            <Text style={[styles.proPillText, profile.is_pro && { color: '#10B981' }]}>
              {profile.is_pro ? 'PRO ACTIVE' : 'PRO'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. FOCUS CLOCK & SESSION SECTION */}
        {activeSession ? (
          <View style={styles.activeSessionChamber}>
            {/* Precision Mechanical Chronograph */}
            <ChronographClock
              totalSeconds={activeSession.duration_minutes * 60}
              remainingSeconds={remainingSeconds}
              size={240}
              strokeWidth={8}
              strictness={activeSession.strictness_mode}
              isLockedSession={true}
              blockedAppsCount={blockedTargets.length}
              gemsEarning={estimatedGems}
            />

            {/* Hold-to-end / Emergency Action */}
            <View style={styles.sessionControlBox}>
              {activeSession.strictness_mode === 'deep_focus' ? (
                <GlassCard style={styles.deepFocusNoticeCard}>
                  <View style={styles.deepFocusNoticeRow}>
                    <Lock size={16} color="#FBBF24" />
                    <Text style={styles.deepFocusNoticeText}>
                      Deep Focus Mode Active • OS Shield Unbreakable
                    </Text>
                  </View>
                </GlassCard>
              ) : activeSession.strictness_mode === 'friend_or_nfc' ? (
                <PrimaryPillButton
                  title="Emergency Unlock (Friend OTP / NFC)"
                  variant="outline"
                  onPress={handleStopSession}
                  style={styles.stopBtn}
                  leftIcon={<Lock size={16} color={colors.warningAccent} />}
                />
              ) : (
                <PrimaryPillButton
                  title="End Session Early"
                  variant="danger"
                  onPress={handleStopSession}
                  style={styles.stopBtn}
                  leftIcon={<StopCircle size={16} color="#FFFFFF" />}
                />
              )}
            </View>
          </View>
        ) : (
          <>
            {/* Refined 100 Daily Focus Score Ring */}
            <View style={styles.focusRingContainer}>
              <FocusRing
                score={focusScore}
                size={220}
                strokeWidth={14}
                subtitle="Daily Focus Score"
                label={focusScore >= 80 ? 'High Focus Zone' : 'Attention Vulnerable'}
              />
            </View>

            {/* Elevated Instant Focus Session Pill CTA */}
            <View style={styles.ctaCardWrapper}>
              <PrimaryPillButton
                title="Start Instant Focus Session"
                onPress={() => openModal('new_focus_session')}
                leftIcon={<Play size={18} color={colors.primaryButtonText} fill={colors.primaryButtonText} />}
              />
            </View>
          </>
        )}

        {/* 2. RECLAIMED TODAY & OPENS INTERCEPTED METRICS ROW */}
        <View style={styles.metricsRow}>
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricIconCircle}>
              <Clock size={19} color={colors.positiveAccent} />
            </View>
            <Text style={styles.metricNumber}>{reclaimedStr}</Text>
            <Text style={styles.metricLabel}>Reclaimed Today</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.25)' }]}>
              <ShieldAlert size={19} color={colors.dangerAccent} />
            </View>
            <Text style={[styles.metricNumber, { color: colors.dangerAccent }]}>
              {todayMetrics.interceptions_count ?? 0}
            </Text>
            <Text style={styles.metricLabel}>Opens Intercepted</Text>
          </GlassCard>
        </View>

        {/* 3. BLOCK LIST & SURGICAL PICKER SHORTCUT */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => openModal('block_list_picker')}
        >
          <GlassCard style={styles.blockListShortcutCard}>
            <View style={styles.shortcutRow}>
              <View style={styles.shortcutIconBox}>
                <Sliders size={20} color={colors.primaryAccent} />
              </View>
              <View style={styles.shortcutTextCol}>
                <Text style={styles.shortcutTitle}>Block List & Surgical Picker</Text>
                <Text style={styles.shortcutSub}>
                  {blockedTargets.length} rules active • Surgical Reels & Shorts enabled
                </Text>
              </View>
              <View style={styles.editTag}>
                <Text style={styles.editTagText}>Configure</Text>
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>

        {/* 4. AI FOCUS OPPORTUNITY CARD */}
        <GlassCard style={styles.opportunityCard}>
          <View style={styles.opportunityHeader}>
            <Sparkles size={18} color={colors.primaryAccent} />
            <Text style={styles.opportunityTitle}>AI Focus Opportunity</Text>
          </View>
          <Text style={styles.opportunityBody}>
            Your screen baseline is {profile.daily_baseline_minutes || 270} mins. Reclaiming 2.5
            hours today will boost your Focus Score to 95 and earn +50 Gems!
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#12141D',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  protectionActiveBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.positiveAccent,
    borderWidth: 2,
    borderColor: colors.obsidian,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
    gap: 6,
  },
  streakText: {
    ...typography.caption,
    color: '#F97316',
    fontWeight: '700',
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    gap: 4,
  },
  proPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  proPillText: {
    ...typography.caption,
    color: '#FBBF24',
    fontWeight: '800',
  },
  focusRingContainer: {
    marginVertical: 6,
    alignItems: 'center',
  },
  ctaCardWrapper: {
    marginVertical: 12,
  },
  activeSessionChamber: {
    alignItems: 'center',
    marginVertical: 8,
  },
  sessionControlBox: {
    width: '100%',
    marginTop: 14,
  },
  deepFocusNoticeCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderColor: 'rgba(251, 191, 36, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deepFocusNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deepFocusNoticeText: {
    ...typography.caption,
    color: '#FBBF24',
    fontWeight: '700',
    fontSize: 12,
  },
  stopBtn: {
    height: 48,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  metricCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(17, 20, 29, 0.85)',
  },
  metricIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    ...typography.titleLarge,
    fontSize: 22,
    color: colors.positiveAccent,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  blockListShortcutCard: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutIconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shortcutTextCol: {
    flex: 1,
  },
  shortcutTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shortcutSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginTop: 2,
    fontSize: 12,
  },
  editTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  editTagText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  opportunityCard: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
    borderTopColor: 'rgba(56, 189, 248, 0.4)',
    backgroundColor: 'rgba(18, 22, 34, 0.9)',
  },
  opportunityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  opportunityTitle: {
    ...typography.titleMedium,
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryAccent,
  },
  opportunityBody: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
    fontSize: 12,
  },
});

export default HomeScreen;
