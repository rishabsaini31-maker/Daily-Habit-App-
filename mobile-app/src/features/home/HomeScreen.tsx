import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {
  Crown,
  Play,
  Sliders,
  ChevronRight,
  Lock,
  StopCircle,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import ChronographClock from '../../core/theme/components/ChronographClock';
import AppLogo from '../../core/theme/components/AppLogo';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';

export const HomeScreen: React.FC = () => {
  const { openModal, presentShield } = useAppNavigation();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
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

  // Calculate session end time formatted as HH:MM AM/PM
  const getEndTimeFormatted = () => {
    const end = new Date(Date.now() + remainingSeconds * 1000);
    return end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topInset + 12,
            paddingBottom: 100 + bottomInset,
          },
          responsiveContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Figma Header: DHI Monogram | 0-day streak | PRO pill */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => openModal('profile')}
            style={styles.brandRow}
            accessibilityLabel="Open Full Screen Profile"
          >
            <Text style={styles.brandTitle}>DHI</Text>
          </TouchableOpacity>

          <View style={styles.headerRightGroup}>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>{profile.streak_days ?? 0}-day streak</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => openModal('paywall')}
              style={[styles.proPill, profile.is_pro && styles.proPillActive]}
            >
              <Crown size={12} color={colors.primaryAccent} />
              <Text style={styles.proPillText}>
                {profile.is_pro ? 'PRO' : 'PRO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 1. FOCUS IN PROGRESS (Screen 08) */}
        {activeSession ? (
          <View style={styles.activeSessionChamber}>
            <Text style={styles.screenMainTitle}>Focus in progress</Text>

            {/* Precision Mechanical Chronograph */}
            <View style={styles.chronographWrapper}>
              <ChronographClock
                totalSeconds={activeSession.duration_minutes * 60}
                remainingSeconds={remainingSeconds}
                size={270}
                strokeWidth={5}
                strictness={activeSession.strictness_mode}
                isLockedSession={true}
                blockedAppsCount={blockedTargets.length}
              />
              <Text style={styles.endTimeLabel}>Ends at {getEndTimeFormatted()}</Text>
              <View style={styles.protectionBadge}>
                <View style={styles.protectionDot} />
                <Text style={styles.protectionText}>
                  Protected · {blockedTargets.length} apps blocked
                </Text>
              </View>
            </View>

            {/* Session details card (Figma 08) */}
            <GlassCard style={styles.sessionDetailsCard}>
              <View style={styles.sessionDetailsTop}>
                <Text style={styles.sessionDetailsLock}>Standard lock</Text>
                <Text style={styles.sessionDetailsGems}>+12 Gems</Text>
              </View>
              <Text style={styles.sessionDetailsHint}>
                A little reward for showing up. Ending early requires confirmation.
              </Text>
            </GlassCard>

            {/* Stats reclaimed / intercepted */}
            <View style={styles.inProgressStatsRow}>
              <Text style={styles.inProgressStatText}>0h 0m reclaimed</Text>
              <Text style={styles.inProgressStatDot}>•</Text>
              <Text style={styles.inProgressStatText}>0 opens intercepted</Text>
            </View>

            {/* Hold-to-end / Emergency Action */}
            <View style={styles.sessionControlBox}>
              {activeSession.strictness_mode === 'deep_focus' ? (
                <GlassCard style={styles.deepFocusNoticeCard}>
                  <View style={styles.deepFocusNoticeRow}>
                    <Lock size={16} color={colors.gemAccent} />
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleStopSession}
                  style={styles.endEarlyButton}
                >
                  <Text style={styles.endEarlyText}>End session…</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          /* 2. FOCUS HOME READY STATE (Screen 07) */
          <>
            <Text style={styles.screenMainTitle}>Ready to focus?</Text>

            {/* Ready-to-start Session Card (Figma 10:333) */}
            <GlassCard style={styles.readySessionCard}>
              <Text style={styles.cardHeaderSmall}>FOCUS SESSION</Text>

              {/* Duration Row */}
              <View style={styles.cardSubBox}>
                <View style={styles.subBoxLeft}>
                  <Text style={styles.subBoxLabel}>Duration</Text>
                  <Text style={styles.subBoxValue}>25 min</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openModal('new_focus_session')}
                  style={styles.changeActionBtn}
                >
                  <Text style={styles.changeActionText}>Change</Text>
                </TouchableOpacity>
              </View>

              {/* Apps to Block Row */}
              <View style={styles.cardSubBox}>
                <View style={styles.subBoxLeft}>
                  <Text style={styles.subBoxLabel}>Apps to block</Text>
                  <View style={styles.appsValueRow}>
                    {blockedTargets.length > 0 && (
                      <View style={styles.appIconsOverlap}>
                        {blockedTargets.slice(0, 3).map((target, idx) => (
                          <View
                            key={target.package_or_token || target.display_name || idx}
                            style={[
                              styles.overlappingLogoCircle,
                              { marginLeft: idx > 0 ? -6 : 0, zIndex: 10 - idx },
                            ]}
                          >
                            <AppLogo appNameOrId={target.package_or_token || target.display_name} size={18} />
                          </View>
                        ))}
                      </View>
                    )}
                    <Text style={styles.subBoxValue}>{blockedTargets.length} apps</Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => openModal('block_list_picker')}
                  style={styles.changeActionBtn}
                >
                  <Text style={styles.changeActionText}>Review</Text>
                </TouchableOpacity>
              </View>

              {/* Start Focus Session Button */}
              <PrimaryPillButton
                title="Start focus session"
                onPress={() => openModal('new_focus_session')}
                rightIcon={<Play size={16} color={colors.primaryButtonText} fill={colors.primaryButtonText} />}
                style={styles.startFocusButton}
              />
            </GlassCard>

            {/* Daily Focus Score Summary Card (Figma 10:349) */}
            <GlassCard style={styles.focusScoreCard}>
              <View style={styles.scoreRow}>
                <View style={styles.scoreBigGroup}>
                  <Text style={styles.scoreNumber}>{focusScore}</Text>
                  <Text style={styles.scoreOutOf}>out of 100</Text>
                </View>

                <View style={styles.scoreMetaGroup}>
                  <Text style={styles.scoreSectionLabel}>Today’s focus score</Text>
                  <View style={styles.scoreZoneRow}>
                    <View style={styles.scoreZoneDot} />
                    <Text style={styles.scoreZoneText}>
                      {focusScore >= 80 ? 'High focus zone' : 'Active focus zone'}
                    </Text>
                  </View>
                  <View style={styles.scoreProgressTrack}>
                    <View style={[styles.scoreProgressFill, { width: `${Math.min(100, focusScore)}%` }]} />
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Today at a Glance Stat Tiles (Figma 10:357) */}
            <View style={styles.glanceRow}>
              <View style={styles.glanceTile}>
                <Text style={styles.glanceValue}>0h 0m</Text>
                <Text style={styles.glanceLabel}>Reclaimed today</Text>
              </View>

              <View style={styles.glanceDivider} />

              <View style={styles.glanceTile}>
                <Text style={styles.glanceValue}>0</Text>
                <Text style={styles.glanceLabel}>Opens intercepted</Text>
              </View>
            </View>

            {/* Manage App Limits Row (Figma 10:363) */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => openModal('block_list_picker')}
            >
              <GlassCard style={styles.appLimitsCard}>
                <View style={styles.appLimitsRow}>
                  <View style={styles.appLimitsIconBox}>
                    <Sliders size={18} color={colors.primaryAccent} />
                  </View>
                  <View style={styles.appLimitsTextCol}>
                    <Text style={styles.appLimitsTitle}>Manage app limits</Text>
                    <Text style={styles.appLimitsSubtitle}>
                      {blockedTargets.length} rules · Reels & Shorts only
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.secondaryMutedText} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Confirmation Modal (Figma 10:568 Screen 12) */}
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
    backgroundColor: colors.obsidian, // Figma #090F18
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandRow: {
    paddingVertical: 4,
  },
  brandTitle: {
    fontSize: 23,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -0.5,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondaryMutedText,
  },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#253957',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    gap: 4,
  },
  proPillActive: {
    backgroundColor: '#1E3352',
  },
  proPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryAccent,
    letterSpacing: 0.5,
  },
  screenMainTitle: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.primaryText,
    letterSpacing: -0.5,
    marginTop: 4,
  },
  readySessionCard: {
    gap: 12,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
  },
  cardHeaderSmall: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.subtleSlate,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cardSubBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#152131',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  subBoxLeft: {
    gap: 2,
  },
  subBoxLabel: {
    fontSize: 13,
    color: colors.secondaryMutedText,
  },
  subBoxValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryText,
  },
  appsValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  appIconsOverlap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlappingLogoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#121D2B',
    borderWidth: 1.5,
    borderColor: '#29364B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  changeActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changeActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primaryAccent,
  },
  startFocusButton: {
    marginTop: 4,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primaryAccent, // Figma #B5C5FF
  },
  focusScoreCard: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  scoreBigGroup: {
    alignItems: 'flex-start',
    minWidth: 80,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: '300',
    color: colors.primaryText,
    lineHeight: 48,
  },
  scoreOutOf: {
    fontSize: 12,
    color: colors.secondaryMutedText,
  },
  scoreMetaGroup: {
    flex: 1,
    gap: 6,
  },
  scoreSectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.secondaryMutedText,
  },
  scoreZoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreZoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.positiveAccent,
  },
  scoreZoneText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.positiveAccent,
  },
  scoreProgressTrack: {
    height: 3,
    backgroundColor: '#344259',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginTop: 2,
  },
  scoreProgressFill: {
    height: '100%',
    backgroundColor: colors.primaryAccent,
    borderRadius: 1.5,
  },
  glanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  glanceTile: {
    flex: 1,
    gap: 2,
  },
  glanceValue: {
    fontSize: 27,
    fontWeight: '300',
    color: colors.primaryText,
  },
  glanceLabel: {
    fontSize: 13,
    color: colors.secondaryMutedText,
  },
  glanceDivider: {
    width: 1,
    height: 44,
    backgroundColor: colors.hairlineBorder,
    marginHorizontal: 16,
  },
  appLimitsCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
  },
  appLimitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  appLimitsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#253957',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLimitsTextCol: {
    flex: 1,
    gap: 2,
  },
  appLimitsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryText,
  },
  appLimitsSubtitle: {
    fontSize: 13,
    color: colors.secondaryMutedText,
  },

  // Active Session Styles (Figma 08)
  activeSessionChamber: {
    alignItems: 'center',
    gap: 16,
  },
  chronographWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
    gap: 8,
  },
  endTimeLabel: {
    fontSize: 14,
    color: colors.secondaryMutedText,
    marginTop: 4,
  },
  protectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  protectionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.positiveAccent,
  },
  protectionText: {
    fontSize: 13,
    color: colors.secondaryMutedText,
  },
  sessionDetailsCard: {
    width: '100%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
    gap: 4,
  },
  sessionDetailsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionDetailsLock: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primaryText,
  },
  sessionDetailsGems: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryAccent,
  },
  sessionDetailsHint: {
    fontSize: 13,
    color: colors.secondaryMutedText,
  },
  inProgressStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  inProgressStatText: {
    fontSize: 12,
    color: colors.secondaryMutedText,
  },
  inProgressStatDot: {
    fontSize: 12,
    color: colors.secondaryMutedText,
  },
  sessionControlBox: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  endEarlyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  endEarlyText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.dangerAccent,
  },
  deepFocusNoticeCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(224, 196, 152, 0.1)',
    borderColor: 'rgba(224, 196, 152, 0.3)',
  },
  deepFocusNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deepFocusNoticeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gemAccent,
  },
  stopBtn: {
    width: '100%',
  },

  // Confirmation modal styles
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  confirmationCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.elevatedCardSurface,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    gap: 14,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.primaryText,
    textAlign: 'center',
  },
  confirmationDescription: {
    fontSize: 14,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmationPrimary: {
    width: '100%',
    marginTop: 6,
  },
  confirmationSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  confirmationSecondaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dangerAccent,
  },
});

export default HomeScreen;
