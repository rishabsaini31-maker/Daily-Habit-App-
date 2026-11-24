import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View, ScrollView } from 'react-native';
import { CheckCircle2, ChevronLeft, Lock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { colors, typography } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import SignInModal from '../auth/SignInModal';

export const Step5PermissionsGrant: React.FC = () => {
  const { finishOnboarding, prevStep } = useOnboarding();
  const { permissions, requestPermissions } = useNativeBlocker();
  const { openModal } = useAppNavigation();
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [showSaveProgress, setShowSaveProgress] = useState(false);
  const isIOS = Platform.OS === 'ios';

  const usageAccessGranted = isIOS
    ? permissions.familyControlsAuthorized
    : permissions.usageStatsPermissionGranted;

  const accessibilityGranted = isIOS
    ? permissions.deviceActivityAuthorized
    : permissions.accessibilityServiceEnabled;

  const bothGranted = usageAccessGranted && accessibilityGranted;

  const handleAction = async () => {
    if (bothGranted) {
      setShowSaveProgress(true);
      return;
    }
    setIsAuthorizing(true);
    try {
      await requestPermissions();
    } catch {
      Alert.alert('Permission Error', 'Could not open permission settings. Please try again.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleFinish = async () => {
    await finishOnboarding();
    openModal('paywall');
  };

  const buttonTitle = !usageAccessGranted
    ? 'Enable usage access'
    : !accessibilityGranted
      ? 'Enable accessibility'
      : 'Finish setup';

  const footnoteText = !usageAccessGranted
    ? 'Then return here to enable Accessibility.'
    : !accessibilityGranted
      ? 'Turn on Daily Habit Improvement in Accessibility.'
      : 'App shielding is configured and ready.';

  return (
    <View style={styles.container}>
      {/* Figma Screen 05 Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Focus setup</Text>
          <Text style={styles.stepCount}>3 of 3</Text>
        </View>
        {/* 3-segment progress indicator (all 3 active) */}
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Enable app{'\n'}protection</Text>
        <Text style={styles.subtitle}>
          DHI needs two Android permissions to block selected apps.
        </Text>

        {/* Card 1: Usage Access */}
        <GlassCard style={styles.permissionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1 OF 2 · REQUIRED</Text>
            </View>
            {usageAccessGranted ? (
              <View style={styles.grantedBadge}>
                <CheckCircle2 size={13} color={colors.positiveAccent} />
                <Text style={styles.grantedText}>Enabled</Text>
              </View>
            ) : (
              <Text style={styles.notEnabledText}>Not enabled</Text>
            )}
          </View>
          <Text style={styles.permTitle}>
            {isIOS ? 'Screen Time access' : 'Usage access'}
          </Text>
          <Text style={styles.permDesc}>
            {isIOS
              ? 'Allow Screen Time access to protect the apps you choose.'
              : 'Lets DHI detect when a selected app opens.'}
          </Text>
        </GlassCard>

        {/* Card 2: Accessibility */}
        <GlassCard style={styles.permissionCard}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.badge, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
              <Text style={styles.badgeText}>NEXT</Text>
            </View>
            {accessibilityGranted ? (
              <View style={styles.grantedBadge}>
                <CheckCircle2 size={13} color={colors.positiveAccent} />
                <Text style={styles.grantedText}>Enabled</Text>
              </View>
            ) : (
              <Text style={styles.notEnabledText}>Not enabled</Text>
            )}
          </View>
          <Text style={styles.permTitle}>
            {isIOS ? 'App restrictions' : 'Accessibility'}
          </Text>
          <Text style={styles.permDesc}>
            Apply the blocking rules you choose.
          </Text>
        </GlassCard>

        {/* Reassurance Card: Your boundaries. Your device. */}
        <GlassCard style={styles.reassuranceCard}>
          <View style={styles.reassuranceRow}>
            <View style={styles.lockIconBox}>
              <Lock size={16} color={colors.positiveAccent} />
            </View>
            <View style={styles.reassuranceTextCol}>
              <Text style={styles.reassuranceTitle}>Your boundaries. Your device.</Text>
              <Text style={styles.reassuranceSubtitle}>
                Blocking stays on-device. DHI doesn’t read messages or passwords. Revoke access anytime in Android Settings.
              </Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <PrimaryPillButton
          title={buttonTitle}
          onPress={handleAction}
          loading={isAuthorizing}
          rightIcon={<ArrowRight size={18} color="#10182D" />}
        />
        <Text style={styles.footnote}>{footnoteText}</Text>
      </View>

      {/* Screen 06 Save Your Progress Modal */}
      <SignInModal
        visible={showSaveProgress}
        onClose={handleFinish}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.elevatedCardSurface,
  },
  stepIndicator: {
    ...typography.bodyMedium,
    color: colors.primaryText,
    flex: 1,
    marginLeft: 12,
    fontWeight: '600',
  },
  stepCount: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 12,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: colors.hairlineBorder,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: colors.primaryAccent,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 6,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondaryMutedText,
    lineHeight: 20,
    marginBottom: 20,
  },
  permissionCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#121D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(181, 197, 255, 0.12)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryAccent,
    letterSpacing: 0.8,
  },
  notEnabledText: {
    fontSize: 12,
    color: colors.secondaryMutedText,
    fontWeight: '500',
  },
  grantedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  grantedText: {
    fontSize: 12,
    color: colors.positiveAccent,
    fontWeight: '600',
  },
  permTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  permDesc: {
    fontSize: 13,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  reassuranceCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#121D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 6,
  },
  reassuranceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  lockIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(165, 217, 200, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reassuranceTextCol: {
    flex: 1,
  },
  reassuranceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  reassuranceSubtitle: {
    fontSize: 12,
    color: colors.secondaryMutedText,
    lineHeight: 17,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.obsidian,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  footnote: {
    fontSize: 11,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Step5PermissionsGrant;
