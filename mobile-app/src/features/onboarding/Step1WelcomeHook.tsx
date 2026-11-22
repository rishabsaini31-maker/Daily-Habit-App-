import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Sparkles, Zap, Lock } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';
import SignInModal from '../auth/SignInModal';

const APP_LOGO = require('../../../assets/images/app-logo.png');

export const Step1WelcomeHook: React.FC = () => {
  const { nextStep } = useOnboarding();
  const { topInset, bottomInset, responsiveContainerStyle } = useResponsiveLayout();
  const [showSignInModal, setShowSignInModal] = useState<boolean>(false);

  return (
    <View style={[styles.container, { paddingTop: topInset + 8, paddingBottom: bottomInset + 16 }]}>
      {/* Top Header with Prominent "Already Pro? Sign In" for returning users */}
      <View style={[styles.topHeader, responsiveContainerStyle]}>
        <View style={styles.brandBadge}>
          <Image source={APP_LOGO} style={styles.logoTiny} resizeMode="contain" />
          <Text style={styles.brandTitle}>Daily Habit Improvement</Text>
        </View>
        <TouchableOpacity
          style={styles.topSignInBtn}
          activeOpacity={0.7}
          onPress={() => setShowSignInModal(true)}
          accessibilityLabel="Already Pro? Sign In"
        >
          <Text style={styles.topSignInText}>
            Already Pro? <Text style={styles.topSignInHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.content, responsiveContainerStyle]}>
        {/* Glow Icon Hero with Official Metallic App Logo */}
        <View style={styles.heroIconWrapper}>
          <View style={styles.glowOuter}>
            <View style={styles.glowInner}>
              <Image source={APP_LOGO} style={styles.logoHero} resizeMode="contain" />
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

      {/* Bottom CTA & Returning Member Sign-In Link */}
      <View style={styles.bottomBar}>
        <PrimaryPillButton
          title="Begin 2-Minute Diagnostic"
          onPress={nextStep}
          rightIcon={<Sparkles size={18} color={colors.primaryButtonText} />}
        />
        <TouchableOpacity
          style={styles.signInLink}
          activeOpacity={0.7}
          onPress={() => setShowSignInModal(true)}
        >
          <Text style={styles.signInText}>
            Already have an account? <Text style={styles.signInHighlight}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>

      {/* Returning User Sign-In Modal */}
      <SignInModal
        visible={showSignInModal}
        onClose={() => setShowSignInModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingBottom: 8,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoTiny: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  logoHero: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  brandTitle: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '800',
    color: colors.primaryAccent,
    letterSpacing: 1.5,
  },
  topSignInBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  topSignInText: {
    ...typography.caption,
    fontSize: 12,
    color: colors.secondaryMutedText,
  },
  topSignInHighlight: {
    color: colors.primaryAccent,
    fontWeight: '700',
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
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glowInner: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#12141D',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    padding: 6,
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
    alignItems: 'center',
    gap: 12,
  },
  signInLink: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  signInText: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
  },
  signInHighlight: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
});

export default Step1WelcomeHook;
