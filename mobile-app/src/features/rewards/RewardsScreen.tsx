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
import { Gem, Flame, Users, Radio, Check } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import addonsService from '../../services/addons/AddonsService';

export const RewardsScreen: React.FC = () => {
  const { profile, updateProfile, activeSession } = useFocusEngine();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const [isScanningNFC, setIsScanningNFC] = useState<boolean>(false);
  const [showGemGuide, setShowGemGuide] = useState(false);

  const handlePairNFC = () => {
    setIsScanningNFC(true);
    Alert.alert(
      'Ready to Tap NFC Tag',
      'Hold the back of your phone against an NFC sticker (on your desk or nightstand) to pair it as a physical focus key.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setIsScanningNFC(false),
        },
        {
          text: 'Register / Tap Key',
          onPress: async () => {
            const simulatedUID = '04:5A:21:7B:9C';
            if (activeSession && activeSession.strictness_mode === 'friend_or_nfc') {
              const released = await addonsService.verifyAndReleaseNfcSession(simulatedUID, activeSession.id);
              if (released) {
                Alert.alert(
                  'Physical NFC Tag Verified ✓',
                  'Hardware key verified. Focus session released and shield deactivated.'
                );
              }
            } else {
              await addonsService.pairNfcTag(simulatedUID);
              Alert.alert(
                'NFC Key Paired ✓',
                `Tag UID [${simulatedUID}] registered. Tapping this sticker will now instantly trigger or release your Focus Sessions.`
              );
            }
            setIsScanningNFC(false);
          },
        },
      ]
    );
  };

  const handlePartnerSetup = () => {
    Alert.alert(
      'Accountability Partner Lock',
      profile.friend_partner_name
        ? `Current Partner: ${profile.friend_partner_name}.\n\nWhen a locked session is active, your partner receives an OTP via WhatsApp/SMS to authorize emergency breaks.`
        : 'No accountability partner configured yet. Add a trusted friend to enable emergency unlock codes.',
      [
        { text: 'Close', style: 'cancel' },
        ...(profile.friend_partner_name
          ? [
              {
                text: 'Send Test OTP',
                onPress: async () => {
                  await addonsService.requestFriendEmergencyUnlock(
                    profile.friend_partner_name!,
                    profile.friend_partner_contact
                  );
                },
              },
            ]
          : []),
      ]
    );
  };

  const currentGems = profile.total_gems ?? 0;
  const streakDays = profile.streak_days ?? 0;
  const tierRank = profile.tier_rank || 'Bronze';

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
        <Text style={styles.screenTitle}>Rewards</Text>

        {/* 1. FOCUS GEMS BALANCE HERO */}
        <GlassCard style={styles.gemsHeroCard}>
          <View style={styles.gemsTopRow}>
            <View style={styles.gemIconCircle}>
              <Gem size={28} color={colors.primaryAccent} />
            </View>
            <View style={styles.gemTextCol}>
              <View style={styles.gemTierRow}>
                <Text style={styles.gemLabel}>FOCUS GEMS</Text>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierBadgeText}>{tierRank.toUpperCase()} TIER</Text>
                </View>
              </View>
              <View style={styles.gemCountRow}>
                <Text style={styles.gemBalanceText}>{currentGems}</Text>
                <Gem size={17} color={colors.primaryAccent} />
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.howToEarnButton}
            activeOpacity={0.75}
            onPress={() => setShowGemGuide(true)}
          >
            <Text style={styles.howToEarnText}>How to earn</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 2. FOCUS STREAK */}
        <Text style={styles.sectionHeader}>Focus streak</Text>
        <GlassCard style={styles.streakCard}>
          <View style={styles.milestoneRow}>
            <View style={styles.milestoneIcon}>
              <Flame size={24} color="#F97316" />
            </View>
            <View style={styles.milestoneTextCol}>
              <Text style={styles.milestoneTitle}>{streakDays} days</Text>
              <Text style={styles.milestoneSub}>Focus streak</Text>
            </View>
            <View style={styles.doneCheck}>
              <Check size={16} color="#090A0F" />
            </View>
          </View>

        </GlassCard>

        {/* 3. FRIEND LOCK ACCOUNTABILITY PARTNER */}
        <Text style={styles.sectionHeader}>Accountability lock</Text>
        <GlassCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.positiveAccentGlow }]}>
              <Users size={22} color={colors.positiveAccent} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Friend Lock Partner</Text>
              <Text style={styles.featureDesc}>
                Protected by Alex • Emergency 6-digit OTP active
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.configBtn}
            onPress={handlePartnerSetup}
          >
            <Text style={styles.configBtnText}>
              Manage Partner & Test Emergency WhatsApp Link
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 4. PHYSICAL NFC TAG PAIRING */}
        <Text style={styles.sectionHeader}>Physical keys</Text>
        <GlassCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={[styles.iconBox, { backgroundColor: colors.primaryAccentGlow }]}>
              <Radio size={22} color={colors.primaryAccent} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Physical NFC Desk Key</Text>
              <Text style={styles.featureDesc}>
                {profile.nfc_tag_uid
                  ? `Paired Tag UID [${profile.nfc_tag_uid}] (Tap phone to unlock hardware-gated sessions)`
                  : 'Stick an NFC tag on your desk to trigger sessions without opening the app'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.configBtn}
            onPress={handlePairNFC}
          >
            <Text style={styles.configBtnText}>
              {profile.nfc_tag_uid ? 'Manage NFC key' : 'Pair an NFC key'}
            </Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>

      <Modal
        visible={showGemGuide}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGemGuide(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.guideTitle}>How to earn Gems</Text>
            <Text style={styles.guideLine}>+10 Gems · Every 30 minutes of Deep Focus</Text>
            <Text style={styles.guideLine}>+5 Gems · Each blocked app</Text>
            <Text style={styles.guideLine}>+50 Gems · Daily focus score of 70 or higher</Text>
            <Text style={styles.guideNote}>Your current multiplier is 1.5×.</Text>
            <TouchableOpacity style={styles.gotItButton} onPress={() => setShowGemGuide(false)}>
              <Text style={styles.gotItText}>Got it</Text>
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
    paddingBottom: 32,
  },
  screenTitle: {
    ...typography.displayMedium,
    fontSize: 24,
    marginBottom: 12,
  },
  screenSubtitle: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    marginBottom: 20,
  },
  gemsHeroCard: {
    padding: 15,
    marginBottom: 16,
    borderRadius: 14,
    borderColor: colors.hairlineBorder,
    backgroundColor: colors.elevatedCardSurface,
  },
  gemsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  gemIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primaryAccentGlow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  gemTextCol: {
    flex: 1,
  },
  gemTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gemLabel: {
    ...typography.caption,
    color: colors.primaryAccent,
    letterSpacing: 1.5,
  },
  tierBadge: {
    backgroundColor: colors.primaryAccentGlow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryAccent,
  },
  gemBalanceText: {
    fontSize: 34,
    fontWeight: '400',
    color: colors.primaryText,
  },
  gemCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  gemSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  howToEarnButton: {
    alignSelf: 'flex-start',
    marginLeft: 66,
    marginTop: -4,
    paddingVertical: 5,
  },
  howToEarnText: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontSize: 12,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 10,
    marginTop: 12,
    letterSpacing: 0.3,
    textTransform: 'none',
  },
  streakCard: {
    padding: 16,
    marginBottom: 16,
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  milestoneTextCol: {
    flex: 1,
  },
  milestoneTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    marginBottom: 2,
  },
  milestoneSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    fontSize: 11,
  },
  doneCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.positiveAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneDivider: {
    height: 1,
    backgroundColor: colors.hairlineBorder,
    marginVertical: 12,
  },
  featureCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    marginBottom: 2,
  },
  featureDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  configBtn: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    alignItems: 'center',
  },
  configBtnText: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.hairlineBorder,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
  },
  guideTitle: {
    ...typography.titleLarge,
    marginBottom: 14,
  },
  guideLine: {
    ...typography.bodySmall,
    color: colors.primaryText,
    marginBottom: 11,
  },
  guideNote: {
    ...typography.bodySmall,
    marginTop: 2,
    marginBottom: 15,
  },
  gotItButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryButtonBg,
    borderRadius: 9,
  },
  gotItText: {
    ...typography.bodySmall,
    color: colors.primaryButtonText,
    fontWeight: '700',
  },
});

export default RewardsScreen;
