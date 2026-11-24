import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
} from 'react-native';
import {
  Flame,
  Crown,
  Play,
  StopCircle,
  Lock,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import ChronographClock from '../../core/theme/components/ChronographClock';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';

const APP_LOGO = require('../../../assets/images/app-logo.png');

export const HomeScreen: React.FC = () => {
  const { openModal, presentShield } = useAppNavigation();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const [showEndConfirmation, setShowEndConfirmation] = React.useState(false);
  const {
    profile,
    activeSession,
    remainingSeconds,
    formattedRemainingTime,
    focusScore,
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

    setShowEndConfirmation(true);
  };

  const confirmEndSession = async () => {
    setShowEndConfirmation(false);
    const res = await stopSessionEarly();
    if (!res.success && res.reason) {
      Alert.alert('Session Lock', res.reason);
    }
  };

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
              <Image source={APP_LOGO} style={styles.avatarLogo} resizeMode="contain" />
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
            <Text style={styles.sessionHeading}>Focus in progress</Text>
            {/* Precision Mechanical Chronograph */}
            <ChronographClock
              totalSeconds={activeSession.duration_minutes * 60}
              remainingSeconds={remainingSeconds}
              size={240}
              strokeWidth={8}
              strictness={activeSession.strictness_mode}
              isLockedSession={true}
              blockedAppsCount={blockedTargets.length}
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
            <Text style={styles.readyHeading}>Ready to focus?</Text>
            <GlassCard style={styles.sessionSummaryCard}>
              <Text style={styles.summaryLabel}>FOCUS SESSION</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Duration</Text>
                <Text style={styles.summaryValue}>25 min</Text>
                <TouchableOpacity onPress={() => openModal('new_focus_session')}>
                  <Text style={styles.summaryAction}>Change</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Apps to block</Text>
                <Text style={styles.summaryValue}>{blockedTargets.length} apps</Text>
                <TouchableOpacity onPress={() => openModal('block_list_picker')}>
                  <Text style={styles.summaryAction}>Review</Text>
                </TouchableOpacity>
              </View>
              <PrimaryPillButton
                title="Start focus session"
                onPress={() => openModal('new_focus_session')}
                rightIcon={<Play size={16} color={colors.primaryButtonText} fill={colors.primaryButtonText} />}
                style={styles.startButton}
              />
            </GlassCard>

            <GlassCard style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <Text style={styles.scoreValue}>{focusScore}</Text>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreTitle}>Today&apos;s focus score</Text>
                  <Text style={styles.scoreSubtitle}>
                    {focusScore >= 80 ? 'High focus zone' : 'Keep building your focus'}
                  </Text>
                </View>
              </View>
              <View style={styles.scoreTrack}>
                <View style={[styles.scoreFill, { width: `${focusScore}%` }]} />
              </View>
            </GlassCard>
          </>
        )}

      </ScrollView>

      <Modal
        visible={showEndConfirmation}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndConfirmation(false)}
      >
        <View style={styles.confirmationOverlay}>
          <View style={styles.confirmationCard}>
            <Text style={styles.confirmationTitle}>End this focus session?</Text>
            <Text style={styles.confirmationDescription}>
              {formattedRemainingTime} remains. Ending now will stop protection for this session.
            </Text>
            <PrimaryPillButton
              title="Keep focusing"
              onPress={() => setShowEndConfirmation(false)}
              style={styles.confirmationPrimary}
            />
            <TouchableOpacity
              style={styles.confirmationSecondary}
              onPress={confirmEndSession}
            >
              <Text style={styles.confirmationSecondaryText}>End session</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    borderColor: colors.primaryAccent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: 3,
  },
  avatarLogo: {
    width: '100%',
    height: '100%',
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
  readyHeading: {
    ...typography.displayMedium,
    fontSize: 24,
    marginTop: 16,
    marginBottom: 14,
  },
  sessionSummaryCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: colors.elevatedCardSurface,
  },
  summaryLabel: {
    ...typography.caption,
    fontSize: 9,
    marginBottom: 11,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 28,
  },
  summaryKey: {
    ...typography.bodySmall,
    color: colors.primaryText,
    flex: 1,
  },
  summaryValue: {
    ...typography.bodySmall,
    color: colors.primaryText,
    marginRight: 12,
  },
  summaryAction: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.hairlineBorder,
    marginVertical: 6,
  },
  startButton: {
    marginTop: 12,
  },
  scoreCard: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 9,
  },
  scoreValue: {
    color: colors.primaryText,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  scoreInfo: {
    flex: 1,
  },
  scoreTitle: {
    ...typography.bodySmall,
    color: colors.primaryText,
  },
  scoreSubtitle: {
    ...typography.bodySmall,
    fontSize: 9,
    color: colors.positiveAccent,
    marginTop: 2,
  },
  scoreTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.hairlineBorder,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: colors.primaryAccent,
    borderRadius: 2,
  },
  sessionHeading: {
    ...typography.displayMedium,
    fontSize: 22,
    marginBottom: 12,
  },
  confirmationOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  confirmationCard: {
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    borderRadius: 16,
    padding: 18,
  },
  confirmationTitle: {
    ...typography.titleLarge,
    fontSize: 17,
    marginBottom: 8,
  },
  confirmationDescription: {
    ...typography.bodySmall,
    lineHeight: 18,
    marginBottom: 15,
  },
  confirmationPrimary: {
    borderRadius: 9,
  },
  confirmationSecondary: {
    height: 40,
    marginTop: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  confirmationSecondaryText: {
    ...typography.bodySmall,
    color: colors.primaryText,
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
});

export default HomeScreen;
