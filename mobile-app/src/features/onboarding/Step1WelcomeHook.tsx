import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield, Sparkles, Zap, Lock } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';

export const Step1WelcomeHook: React.FC = () => {
  const { nextStep } = useOnboarding();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Glow Icon Hero */}
        <View style={styles.heroIconWrapper}>
          <View style={styles.glowOuter}>
            <View style={styles.glowInner}>
              <Shield size={48} color={colors.primaryAccent} />
            </View>
          </View>
        </View>

        <Text style={styles.tagline}>DIGITAL WELL-BEING OS</Text>
        <Text style={styles.headline}>Take Back Your Life from Screen Addiction.</Text>
        <Text style={styles.description}>
          The average person spends 4+ hours daily in dopamine loops. Regain 2+ hours of deep
          focus every single day with surgical app blocking and friction shielding.
        </Text>

        {/* Feature Highlights Cards */}
        <View style={styles.highlightsContainer}>
          <GlassCard style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Zap size={20} color={colors.primaryAccent} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Surgical Reels & Shorts Blocker</Text>
                <Text style={styles.featureSub}>
                  Block endless vertical video feeds while keeping messages and utilities
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.featureCard}>
            <View style={styles.featureRow}>
              <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Lock size={20} color={colors.positiveAccent} />
              </View>
              <View style={styles.featureTextCol}>
                <Text style={styles.featureTitle}>Hardcore Friction Shield</Text>
                <Text style={styles.featureSub}>
                  Unbreakable locks with friend verification & physical NFC pairing
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </View>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <PrimaryPillButton
          title="Begin 2-Minute Diagnostic"
          onPress={nextStep}
          rightIcon={<Sparkles size={18} color={colors.primaryButtonText} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 24,
    paddingBottom: 24,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIconWrapper: {
    marginBottom: 20,
    alignItems: 'center',
  },
  glowOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  glowInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
  },
  tagline: {
    ...typography.caption,
    color: colors.primaryAccent,
    marginBottom: 8,
    letterSpacing: 2,
  },
  headline: {
    ...typography.displayMedium,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    ...typography.bodyMedium,
    textAlign: 'center',
    color: colors.secondaryMutedText,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  highlightsContainer: {
    width: '100%',
    gap: 12,
  },
  featureCard: {
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 12,
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
  featureSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
  },
  bottomBar: {
    paddingTop: 16,
  },
});

export default Step1WelcomeHook;
