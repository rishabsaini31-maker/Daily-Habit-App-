import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  TrendingUp,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import FocusRing from '../../core/theme/components/FocusRing';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';

export const HomeScreen: React.FC = () => {
  const { openModal, presentShield } = useAppNavigation();
  const { activeSession, stopSession, dailyBlockedCount, apps } = useNativeBlocker();

  // Focus score calculation based on active protection and blocked attempts
  const baseFocusScore = activeSession ? 94 : 84;

  const blockedAppsCount = apps.filter((a) => a.isEntireAppBlocked).length;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => openModal('settings')}
            style={styles.avatarButton}
          >
            <View style={styles.avatarCircle}>
              <User size={18} color={colors.primaryText} />
            </View>
            <View style={styles.protectionActiveBadge} />
          </TouchableOpacity>

          <View style={styles.streakBadge}>
            <Flame size={16} color="#F97316" />
            <Text style={styles.streakText}>7-Day Streak</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => openModal('paywall')}
            style={styles.proPill}
          >
            <Crown size={14} color="#FBBF24" />
            <Text style={styles.proPillText}>PRO</Text>
          </TouchableOpacity>
        </View>

        {/* Circular Focus Ring */}
        <View style={styles.focusRingContainer}>
          <FocusRing
            score={baseFocusScore}
            size={220}
            strokeWidth={14}
            subtitle={activeSession ? 'Session Active' : 'Daily Focus Score'}
            label={activeSession ? 'Strict Shielding' : 'High Focus Zone'}
          />
        </View>

        {/* Active Session Status Card or Quick Session CTA */}
        {activeSession ? (
          <GlassCard variant="accent" style={styles.activeSessionCard}>
            <View style={styles.sessionHeaderRow}>
              <View style={styles.sessionIndicatorDot} />
              <Text style={styles.sessionTitle}>{activeSession.title}</Text>
              <View style={styles.strictnessTag}>
                <Text style={styles.strictnessTagText}>
                  {activeSession.strictness.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.sessionTimeText}>
              {activeSession.durationMinutes} Minutes Focus Lock
            </Text>
            <View style={styles.sessionBtnRow}>
              <PrimaryPillButton
                title="Stop Session"
                variant="danger"
                onPress={() => stopSession()}
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
            <Text style={styles.metricNumber}>1h 48m</Text>
            <Text style={styles.metricLabel}>Reclaimed Today</Text>
          </GlassCard>

          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <ShieldAlert size={18} color={colors.dangerAccent} />
            </View>
            <Text style={[styles.metricNumber, { color: colors.dangerAccent }]}>
              {dailyBlockedCount}
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
                  {blockedAppsCount} apps locked • Surgical Reels & Shorts active
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
            You usually get distracted around 2:30 PM by Instagram Reels. We recommend scheduling a
            45-minute Deep Work session now.
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
                appName: 'Instagram',
                reason: 'Active Deep Work Session',
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
    backgroundColor: colors.obsidian, // Obsidian #08090D per spec
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
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
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
