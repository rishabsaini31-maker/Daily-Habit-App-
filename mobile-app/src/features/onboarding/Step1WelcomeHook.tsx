import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArrowRight, Check, Clock } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { useResponsiveLayout } from '../../core/theme/useResponsiveLayout';
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
      <View style={[styles.topHeader, responsiveContainerStyle]}>
        <View style={styles.brandBadge}>
          <Image source={APP_LOGO} style={styles.logoTiny} resizeMode="contain" />
          <Text style={styles.brandTitle}>DHI</Text>
        </View>
        <TouchableOpacity
          style={styles.topSignInBtn}
          activeOpacity={0.7}
          onPress={() => setShowSignInModal(true)}
          accessibilityLabel="Already Pro? Sign In"
        >
          <Text style={styles.topSignInText}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.content, responsiveContainerStyle]}>
        <Text style={styles.eyebrow}>DAILY HABIT IMPROVEMENT</Text>
        <Text style={styles.headline}>
          Less scrolling.{'\n'}
          <Text style={styles.headlineAccent}>More living.</Text>
        </Text>
        <Text style={styles.description}>
          Make space for what matters. Build a calmer relationship with your phone.
        </Text>

        <View style={styles.heroRing}>
          <View style={styles.heroRingInner} />
        </View>

        <View style={styles.highlightsContainer}>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}><Check size={14} color={colors.primaryAccent} /></View>
            <Text style={styles.featureText}>Block reels, not your conversations</Text>
          </View>
          <View style={styles.featureRow}>
            <View style={styles.featureIcon}><Check size={14} color={colors.primaryAccent} /></View>
            <Text style={styles.featureText}>A little friction. A lot more intention.</Text>
          </View>
        </View>
      </View>

      <View style={[styles.bottomBar, responsiveContainerStyle]}>
        <PrimaryPillButton
          title="Get started"
          onPress={nextStep}
          rightIcon={<ArrowRight size={18} color={colors.primaryButtonText} />}
        />
        <View style={styles.durationRow}>
          <Clock size={12} color={colors.secondaryMutedText} />
          <Text style={styles.durationText}>3 steps · About 2 minutes</Text>
        </View>
      </View>

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
    paddingBottom: 4,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  logoTiny: {
    width: 24,
    height: 24,
    borderRadius: 7,
  },
  brandTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: 0.2,
  },
  topSignInBtn: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  topSignInText: {
    color: colors.primaryAccent,
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 9,
    letterSpacing: 1.4,
    marginBottom: 12,
  },
  headline: {
    color: colors.primaryText,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -1.3,
    fontWeight: '500',
    marginBottom: 12,
  },
  headlineAccent: {
    color: colors.primaryAccent,
  },
  description: {
    ...typography.bodySmall,
    fontSize: 12,
    lineHeight: 17,
    maxWidth: 290,
    marginBottom: 20,
  },
  heroRing: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignSelf: 'center',
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#263044',
    borderWidth: 2,
    borderColor: '#8995AA',
    shadowColor: '#BBC7DD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },
  heroRingInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.obsidian,
    borderWidth: 2,
    borderColor: '#5E6A7F',
    shadowColor: '#A9B9FF',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  highlightsContainer: {
    width: '100%',
    gap: 9,
    marginTop: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  featureIcon: {
    width: 17,
    height: 17,
    borderRadius: 5,
    backgroundColor: 'rgba(169, 185, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.primaryText,
  },
  bottomBar: {
    paddingTop: 12,
    alignItems: 'center',
    gap: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  durationText: {
    ...typography.bodySmall,
    fontSize: 10,
  },
});

export default Step1WelcomeHook;
