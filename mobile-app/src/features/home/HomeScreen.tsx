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
  User,
  Flame,
  Crown,
  Play,
  StopCircle,
  Sliders,
  ShieldAlert,
  Clock,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import FocusRing from '../../core/theme/components/FocusRing';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';

const APP_LOGO = require('../../../assets/images/app-logo.png');

export const HomeScreen: React.FC = () => {
  const { openModal, presentShield } = useAppNavigation();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const {
    profile,
    activeSession,
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
        'Deep Focus Mode is unbreakable. Sessions cannot be stopped until the timer expires.',
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

    const res = await stopSessionEarly();
    if (!res.success && res.reason) {
      Alert.alert('Session Lock', res.reason);
    }
  };

  const reclaimedHours = Math.floor((todayMetrics.blocked_time_min || 0) / 60);
  const reclaimedMins = (todayMetrics.blocked_time_min || 0) % 60;
  const reclaimedStr = `${reclaimedHours}h ${reclaimedMins}m`;

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

        {/* Circular Focus Ring */}
        <View style={styles.focusRingContainer}>
          <FocusRing
            score={focusScore}
            size={220}
            strokeWidth={14}
            subtitle={activeSession ? 'Session Active' : 'Daily Focus Score'}
            label={
              activeSession
                ? `${formattedRemainingTime} Remaining`
                : focusScore >= 80
                ? 'High Focus Zone'
                : 'Attention Vulnerable'
            }
          />
        </View>

        {/* Active Session Status Card or Quick Session CTA */}
        {activeSession ? (
          <GlassCard variant="accent" style={styles.activeSessionCard}>
            <View style={styles.sessionHeaderRow}>
              <View style={styles.sessionIndicatorDot} />
              <Text style={styles.sessionTitle}>Focus Lock Active</Text>
              <View style={styles.strictnessTag}>
                <Text style={styles.strictnessTagText}>
                  {activeSession.strictness_mode.replace('_', ' ').toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.sessionTimeText}>
              {formattedRemainingTime} remaining of {activeSession.duration_minutes}m target
            </Text>
            <View style={styles.sessionBtnRow}>
              <PrimaryPillButton
                title={
                  activeSession.strictness_mode === 'deep_focus'
                    ? 'Locked (Unbreakable)'
                    : 'Stop Focus Session'
                }
                variant="danger"
                onPress={handleStopSession}
                style={styles.stopBtn}
                leftIcon={<StopCircle size={18} color="#FFFFFF" />}
              />
            </View>
          </GlassCard>
        ) : (
          <View style={styles.ctaCardWrapper}>
            <PrimaryPillButton
              title="Start Instant Focus Session"
              onPress={() => openModal('new_focus_session')}
              leftIcon={<Play size={18} color={colors.primaryButtonText} fill={colors.primaryButtonText} />}
            />
          </View>
        )}

        {/* Real-time Status / Reclaimed Today Metrics */}
        <View style={styles.metricsRow}>
          <GlassCard style={styles.metricCard}>
            <View style={styles.metricIconCircle}>
              <Clock size={18} color={colors.positiveAccent} />
            </View>
            <Text style={styles.metricNumber}>{reclaimedStr}</Text>
            <Text style={styles.metricLabel}>Reclaimed Today</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <ShieldAlert size={18} color={colors.dangerAccent} />
            </View>
            <Text style={[styles.metricNumber, { color: colors.dangerAccent }]}>
              {todayMetrics.interceptions_count ?? 0}
            </Text>
            <Text style={styles.metricLabel}>Opens Intercepted</Text>
          </GlassCard>
        </View>

        {/* Block List & Surgical Picker Shortcut Card */}
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

        {/* AI Focus Opportunity Card */}
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

        {/* TEMPORARY DEBUG BUTTON PER SPEC */}
        <View style={styles.debugSection}>
          <Text style={styles.debugLabel}>DEVELOPER / REVIEWER PREVIEW</Text>
          <PrimaryPillButton
            title="🚨 Test App Interception Shield (Preview Block Screen)"
            variant="outline"
            onPress={() =>
              presentShield({
                appName: 'Instagram Reels',
                reason: 'Active Deep Focus Lock',
              })
            }
            textStyle={styles.debugBtnText}
            style={styles.debugBtn}
          />
        </View>
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
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  avatarButton: {
    position: 'relative',
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    borderRadius: 20,
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
    marginVertical: 10,
    alignItems: 'center',
  },
  ctaCardWrapper: {
    marginVertical: 12,
  },
  activeSessionCard: {
    padding: 18,
    marginVertical: 12,
  },
  sessionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primaryAccent,
    marginRight: 8,
  },
  sessionTitle: {
    ...typography.titleLarge,
    fontSize: 18,
    flex: 1,
  },
  strictnessTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  strictnessTagText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primaryAccent,
  },
  sessionTimeText: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    marginTop: 4,
    marginBottom: 14,
  },
  sessionBtnRow: {
    width: '100%',
  },
  stopBtn: {
    height: 48,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 8,
  },
  metricCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  metricIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricNumber: {
    ...typography.titleLarge,
    fontSize: 20,
    color: colors.positiveAccent,
    fontWeight: '800',
  },
  metricLabel: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  blockListShortcutCard: {
    padding: 16,
    marginVertical: 8,
  },
  shortcutRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shortcutIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
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
  },
  shortcutSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  editTag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.hairlineBorder,
  },
  editTagText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.primaryAccent,
  },
  opportunityCard: {
    padding: 16,
    marginVertical: 8,
    borderColor: 'rgba(56, 189, 248, 0.25)',
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
    color: colors.primaryAccent,
  },
  opportunityBody: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  debugSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  debugLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.secondaryMutedText,
    marginBottom: 8,
    textAlign: 'center',
  },
  debugBtn: {
    height: 48,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
  },
  debugBtnText: {
    color: colors.dangerAccent,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default HomeScreen;
