import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Award, Gem, Flame, Users, Radio, Check, Lock, Sparkles } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';

export const RewardsScreen: React.FC = () => {
  const [gemsBalance, setGemsBalance] = useState<number>(480);
  const [partnerLinked, setPartnerLinked] = useState<boolean>(true);
  const [nfcDeskTagPaired, setNfcDeskTagPaired] = useState<boolean>(true);

  const handlePairNFC = () => {
    Alert.alert(
      'NFC Ready',
      'Hold the back of your phone against an NFC sticker or tag to pair with instant deep focus.',
      [{ text: 'Simulate Successful Tap', onPress: () => setNfcDeskTagPaired(true) }]
    );
  };

  const handlePartnerSetup = () => {
    Alert.alert(
      'Friend Lock Partner',
      'Your partner code is "778899". Send this invite link to your accountability partner so they can approve emergency breaks.',
      [{ text: 'Copy Invite Link' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Rewards & Focus Gems</Text>
        <Text style={styles.screenSubtitle}>
          Gamify discipline with streak multipliers, partner locks, and NFC physical keys
        </Text>

        {/* 1. FOCUS GEMS BALANCE HERO */}
        <GlassCard style={styles.gemsHeroCard}>
          <View style={styles.gemsTopRow}>
            <View style={styles.gemIconCircle}>
              <Gem size={28} color={colors.primaryAccent} />
            </View>
            <View style={styles.gemTextCol}>
              <Text style={styles.gemLabel}>TOTAL FOCUS GEMS</Text>
              <Text style={styles.gemBalanceText}>{gemsBalance} 💎</Text>
            </View>
          </View>
          <Text style={styles.gemSub}>
            Earned by hitting daily screen-time limits & completing sessions without snoozing.
          </Text>
        </GlassCard>

        {/* 2. STREAK MILESTONES */}
        <Text style={styles.sectionHeader}>STREAK MILESTONES</Text>
        <GlassCard style={styles.streakCard}>
          <View style={styles.milestoneRow}>
            <View style={styles.milestoneIcon}>
              <Flame size={24} color="#F97316" />
            </View>
            <View style={styles.milestoneTextCol}>
              <Text style={styles.milestoneTitle}>7-Day Focus Streak</Text>
              <Text style={styles.milestoneSub}>Milestone Achieved • 1.5x Gem Multiplier active</Text>
            </View>
            <View style={styles.doneCheck}>
              <Check size={16} color="#090A0F" />
            </View>
          </View>

          <View style={styles.milestoneDivider} />

          <View style={styles.milestoneRow}>
            <View style={[styles.milestoneIcon, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
              <Award size={24} color={colors.secondaryMutedText} />
            </View>
            <View style={styles.milestoneTextCol}>
              <Text style={[styles.milestoneTitle, { color: colors.secondaryMutedText }]}>
                14-Day Diamond Shield
              </Text>
              <Text style={styles.milestoneSub}>Progress: 7/14 days completed</Text>
            </View>
            <View style={styles.lockedBadge}>
              <Lock size={12} color={colors.secondaryMutedText} />
            </View>
          </View>
        </GlassCard>

        {/* 3. FRIEND LOCK ACCOUNTABILITY PARTNER */}
        <Text style={styles.sectionHeader}>ACCOUNTABILITY LOCK</Text>
        <GlassCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Users size={22} color={colors.positiveAccent} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Friend Lock Partner</Text>
              <Text style={styles.featureDesc}>
                {partnerLinked
                  ? 'Paired with Alex (Emergency PIN: 778899)'
                  : 'Pair with a friend or partner who must approve session cancellations'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.configBtn}
            onPress={handlePartnerSetup}
          >
            <Text style={styles.configBtnText}>
              {partnerLinked ? 'Manage Partner & Code' : 'Pair Accountability Partner'}
            </Text>
          </TouchableOpacity>
        </GlassCard>

        {/* 4. PHYSICAL NFC TAG PAIRING */}
        <Text style={styles.sectionHeader}>HARDWARE INTEGRATION</Text>
        <GlassCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <Radio size={22} color={colors.primaryAccent} />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Physical NFC Desk Key</Text>
              <Text style={styles.featureDesc}>
                {nfcDeskTagPaired
                  ? 'Office Desk Sticker Paired ✓ (Tap phone to instantly start Deep Work)'
                  : 'Stick an NFC tag on your desk to trigger sessions without opening the app'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.configBtn}
            onPress={handlePairNFC}
          >
            <Text style={styles.configBtnText}>
              {nfcDeskTagPaired ? 'Re-calibrate NFC Key' : 'Pair New NFC Sticker'}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 32,
  },
  screenTitle: {
    ...typography.displayMedium,
    marginBottom: 4,
  },
  screenSubtitle: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    marginBottom: 20,
  },
  gemsHeroCard: {
    padding: 20,
    marginBottom: 16,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
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
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  gemTextCol: {
    flex: 1,
  },
  gemLabel: {
    ...typography.caption,
    color: colors.primaryAccent,
    letterSpacing: 1.5,
  },
  gemBalanceText: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.primaryText,
  },
  gemSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 10,
    marginTop: 12,
    letterSpacing: 1.2,
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
});

export default RewardsScreen;
