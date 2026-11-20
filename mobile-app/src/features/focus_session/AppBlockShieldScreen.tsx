import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { ShieldAlert, Lock, Heart, KeyRound, ArrowLeft } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';

export const AppBlockShieldScreen: React.FC = () => {
  const { closeModal, modalParams } = useAppNavigation();
  const { clearShieldEvent } = useNativeBlocker();

  const [breathTimer, setBreathTimer] = useState<number>(10);
  const [canSnooze, setCanSnooze] = useState<boolean>(false);

  const blockedAppName = (modalParams?.appName as string) || 'Instagram';
  const blockReason = (modalParams?.reason as string) || 'Deep Work Session Active';

  useEffect(() => {
    const timer = setInterval(() => {
      setBreathTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSnooze(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleDismiss = () => {
    clearShieldEvent();
    closeModal();
  };

  const handleEmergencyFriendUnlock = () => {
    Alert.prompt
      ? Alert.prompt(
          'Emergency Friend Code',
          'Enter the 6-digit partner override code to unlock temporarily:',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Unlock',
              onPress: (code) => {
                if (code === '778899') {
                  Alert.alert('Unlocked', 'Shield snoozed for 10 minutes.');
                  handleDismiss();
                } else {
                  Alert.alert('Invalid Code', 'The code provided does not match your partner key.');
                }
              },
            },
          ],
          'plain-text'
        )
      : Alert.alert(
          'Emergency Friend Unlock',
          'Friend Unlock requires partner verification code "778899". Unlocking now for testing.',
          [{ text: 'OK', onPress: handleDismiss }]
        );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Glow Ring */}
      <View style={styles.glowBackdrop} />

      {/* Top Bar with Dismiss */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleDismiss} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.shieldActiveBadge}>SHIELD ACTIVE</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Pulsing Lock Motif */}
        <View style={styles.shieldIconOuter}>
          <View style={styles.shieldIconMid}>
            <View style={styles.shieldIconInner}>
              <Lock size={44} color={colors.dangerAccent} />
            </View>
          </View>
        </View>

        <Text style={styles.blockedAppTitle}>{blockedAppName} is Shielded</Text>
        <Text style={styles.reasonText}>{blockReason}</Text>

        {/* Mindful Friction Card */}
        <GlassCard variant="danger" style={styles.frictionCard}>
          <View style={styles.frictionHeader}>
            <Heart size={20} color={colors.dangerAccent} />
            <Text style={styles.frictionTitle}>Mindful Breath Pause</Text>
          </View>
          <Text style={styles.timerCountText}>
            {breathTimer > 0 ? `${breathTimer}s` : '✓ Complete'}
          </Text>
          <Text style={styles.frictionDesc}>
            {breathTimer > 0
              ? 'Inhale slowly. Notice if opening this was an unconscious urge or deliberate.'
              : 'Pause completed. Consider if this action serves your long-term goals.'}
          </Text>
        </GlassCard>

        {/* Reality Check Quote */}
        <View style={styles.quoteBox}>
          <Text style={styles.quoteText}>
            “You do not rise to the level of your goals, you fall to the level of your systems.”
          </Text>
          <Text style={styles.quoteAuthor}>— James Clear</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsFooter}>
        <PrimaryPillButton
          title="Return to Focus"
          onPress={handleDismiss}
          style={styles.primaryReturnBtn}
        />

        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleEmergencyFriendUnlock}
          >
            <KeyRound size={16} color={colors.secondaryMutedText} />
            <Text style={styles.actionBtnText}>Friend Code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canSnooze}
            style={[styles.actionBtn, !canSnooze && styles.actionBtnDisabled]}
            onPress={() => {
              Alert.alert('Snooze Granted', '5-minute emergency grace period started.');
              handleDismiss();
            }}
          >
            <ShieldAlert size={16} color={canSnooze ? colors.warningAccent : colors.tertiaryText} />
            <Text style={[styles.actionBtnText, canSnooze && { color: colors.warningAccent }]}>
              {canSnooze ? 'Snooze 5m (1 Gem)' : `Wait (${breathTimer}s)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidianDeep, // #040508
    justifyContent: 'space-between',
  },
  glowBackdrop: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldActiveBadge: {
    ...typography.caption,
    color: colors.dangerAccent,
    letterSpacing: 2,
    fontWeight: '800',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginBottom: 20,
  },
  shieldIconMid: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIconInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  blockedAppTitle: {
    ...typography.displayMedium,
    textAlign: 'center',
    marginBottom: 6,
  },
  reasonText: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    marginBottom: 24,
  },
  frictionCard: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.06)',
    marginBottom: 20,
  },
  frictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  frictionTitle: {
    ...typography.caption,
    color: colors.dangerAccent,
    letterSpacing: 1.5,
  },
  timerCountText: {
    fontSize: 42,
    fontWeight: '900',
    color: colors.primaryText,
    marginVertical: 4,
  },
  frictionDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    lineHeight: 18,
  },
  quoteBox: {
    paddingHorizontal: 16,
  },
  quoteText: {
    ...typography.bodySmall,
    fontStyle: 'italic',
    color: colors.secondaryMutedText,
    textAlign: 'center',
    lineHeight: 20,
  },
  quoteAuthor: {
    ...typography.caption,
    fontSize: 10,
    color: colors.tertiaryText,
    textAlign: 'center',
    marginTop: 4,
  },
  actionsFooter: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: 24,
    gap: 12,
  },
  primaryReturnBtn: {
    width: '100%',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnText: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontWeight: '600',
  },
});

export default AppBlockShieldScreen;
