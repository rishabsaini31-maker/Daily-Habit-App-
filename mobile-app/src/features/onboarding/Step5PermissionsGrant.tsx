import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CheckCircle2, ChevronLeft, Lock, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react-native';
import { colors, spacing, typography } from '../../core/theme/tokens';
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

  const handleGrant = async () => {
    setIsAuthorizing(true);
    try {
      await requestPermissions();
      setShowSaveProgress(true);
    } catch {
      Alert.alert('Permission Error', 'Could not configure OS blockers. Please try again.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleContinueAsGuest = async () => {
    await finishOnboarding();
    openModal('paywall');
  };

  const usageAccessGranted = isIOS
    ? permissions.familyControlsAuthorized
    : permissions.usageStatsPermissionGranted;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={18} color={colors.secondaryMutedText} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Focus setup</Text>
          <Text style={styles.stepCount}>3 of 3</Text>
        </View>
        <Text style={styles.title}>Enable app protection</Text>
        <Text style={styles.subtitle}>DHI needs two permissions to block selected apps.</Text>

        <View style={styles.cardsList}>
          <GlassCard style={styles.permissionCard}>
            <View style={styles.cardRow}>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardEyebrow}>1 OF 2 · REQUIRED</Text>
                <Text style={styles.permTitle}>{isIOS ? 'Screen Time access' : 'Usage access'}</Text>
                <Text style={styles.permDesc}>
                  {isIOS
                    ? 'Allow Screen Time access to protect the apps you choose.'
                    : 'Lets DHI detect when a selected app opens.'}
                </Text>
              </View>
              {usageAccessGranted ? (
                <CheckCircle2 size={20} color={colors.positiveAccent} />
              ) : (
                <Text style={styles.statusText}>Not enabled</Text>
              )}
            </View>
          </GlassCard>

          <GlassCard style={styles.permissionCard}>
            <View style={styles.cardRow}>
              <View style={styles.cardTextCol}>
                <Text style={styles.cardEyebrow}>NEXT</Text>
                <Text style={styles.permTitle}>{isIOS ? 'App restrictions' : 'Accessibility'}</Text>
                <Text style={styles.permDesc}>Apply the blocking rules you choose.</Text>
              </View>
              {permissions.accessibilityServiceEnabled || permissions.deviceActivityAuthorized ? (
                <CheckCircle2 size={20} color={colors.positiveAccent} />
              ) : (
                <Smartphone size={17} color={colors.secondaryMutedText} />
              )}
            </View>
          </GlassCard>

          <View style={styles.privacyRow}>
            <Lock size={13} color={colors.positiveAccent} />
            <Text style={styles.privacyTitle}>Your boundaries. Your device.</Text>
          </View>
          <Text style={styles.privacyDescription}>
            Blocking stays on-device. DHI doesn’t read messages or passwords. Revoke access anytime
            in system settings.
          </Text>
          <View style={styles.noticeRow}>
            <ShieldAlert size={14} color={colors.secondaryMutedText} />
            <Text style={styles.noticeText}>Then return here to enable Accessibility.</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <PrimaryPillButton
          title={isIOS ? 'Enable app protection' : 'Enable usage access'}
          onPress={handleGrant}
          loading={isAuthorizing}
          rightIcon={<ShieldCheck size={17} color={colors.primaryButtonText} />}
        />
      </View>
      <SignInModal
        visible={showSaveProgress}
        mode="save-progress"
        onClose={() => setShowSaveProgress(false)}
        onSuccess={() => openModal('paywall')}
        onContinueAsGuest={handleContinueAsGuest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndicator: {
    ...typography.bodySmall,
    flex: 1,
    marginLeft: 8,
  },
  stepCount: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontSize: 10,
  },
  title: {
    ...typography.displayMedium,
    fontSize: 23,
    marginBottom: 5,
  },
  subtitle: {
    ...typography.bodySmall,
    marginBottom: 17,
  },
  cardsList: {
    gap: 10,
  },
  permissionCard: {
    borderRadius: 13,
    padding: 14,
    backgroundColor: colors.elevatedCardSurface,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTextCol: {
    flex: 1,
  },
  cardEyebrow: {
    ...typography.caption,
    fontSize: 8,
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  permTitle: {
    ...typography.titleMedium,
    fontSize: 13,
    marginBottom: 3,
  },
  permDesc: {
    ...typography.bodySmall,
    fontSize: 10,
    lineHeight: 15,
  },
  statusText: {
    ...typography.bodySmall,
    fontSize: 8,
    marginLeft: 8,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 5,
  },
  privacyTitle: {
    ...typography.bodySmall,
    color: colors.primaryText,
    fontSize: 10,
  },
  privacyDescription: {
    ...typography.bodySmall,
    fontSize: 9,
    lineHeight: 14,
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 4,
  },
  noticeText: {
    ...typography.bodySmall,
    fontSize: 9,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    backgroundColor: colors.obsidian,
  },
});

export default Step5PermissionsGrant;
