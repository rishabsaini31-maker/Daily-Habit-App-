import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { ShieldCheck, CheckCircle2, Lock, Smartphone, ShieldAlert } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';
import { useAppNavigation } from '../../core/navigation/NavigationContext';

export const Step5PermissionsGrant: React.FC = () => {
  const { finishOnboarding, prevStep } = useOnboarding();
  const { permissions, requestPermissions } = useNativeBlocker();
  const { openModal } = useAppNavigation();
  const [isAuthorizing, setIsAuthorizing] = useState<boolean>(false);

  const isIOS = Platform.OS === 'ios';

  const handleGrant = async () => {
    setIsAuthorizing(true);
    try {
      await requestPermissions();
      await finishOnboarding();
      // Per spec: completing Step 5 marks hasCompletedOnboarding = true and presents Pro Paywall Modal
      openModal('paywall');
    } catch {
      Alert.alert('Permission Error', 'Could not configure OS blockers. Please try again.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepIndicator}>STEP 5 OF 5</Text>
        <Text style={styles.title}>Enable OS-Level Shielding</Text>
        <Text style={styles.subtitle}>
          To stop compulsive opens and surgical shorts, our app requires local system-level
          blocking permission.
        </Text>

        <View style={styles.cardsList}>
          {/* iOS / Android Specific Permissions Card */}
          <GlassCard style={styles.permissionCard}>
            <View style={styles.cardRow}>
              <View style={styles.iconCircle}>
                <Smartphone size={24} color={colors.primaryAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.permTitle}>
                  {isIOS ? 'Apple Screen Time API' : 'Android Accessibility & Usage'}
                </Text>
                <Text style={styles.permDesc}>
                  {isIOS
                    ? 'FamilyControls & ManagedSettings authorization to lock apps without VPN overhead.'
                    : 'Accessibility Service & UsageStatsManager to intercept and shield distraction apps.'}
                </Text>
              </View>
              <View style={styles.statusCol}>
                {permissions.allRequiredPermissionsGranted ? (
                  <CheckCircle2 size={24} color={colors.positiveAccent} />
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>Required</Text>
                  </View>
                )}
              </View>
            </View>
          </GlassCard>

          {/* Privacy Guarantee Card */}
          <GlassCard style={styles.privacyCard}>
            <View style={styles.cardRow}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: 'rgba(16, 185, 129, 0.12)' },
                ]}
              >
                <Lock size={22} color={colors.positiveAccent} />
              </View>
              <View style={styles.cardTextCol}>
                <Text style={styles.privacyTitle}>100% Private & On-Device</Text>
                <Text style={styles.privacyDesc}>
                  Zero personal data leaves your device. We cannot view your screen contents,
                  chats, or passwords. Everything runs locally in Apple/Android secure enclaves.
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Anti-Bypass Note */}
          <GlassCard style={styles.antiBypassCard}>
            <View style={styles.cardRow}>
              <ShieldAlert size={20} color={colors.warningAccent} />
              <Text style={styles.antiBypassText}>
                Friction shielding stops subconscious muscle-memory opens instantly.
              </Text>
            </View>
          </GlassCard>
        </View>
      </View>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backBtn}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.ctaWrapper}>
            <PrimaryPillButton
              title="Grant Permission & Finish"
              onPress={handleGrant}
              loading={isAuthorizing}
              rightIcon={<ShieldCheck size={18} color={colors.primaryButtonText} />}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 20,
    justifyContent: 'center',
  },
  stepIndicator: {
    ...typography.caption,
    color: colors.primaryAccent,
    marginBottom: 6,
    letterSpacing: 1.5,
  },
  title: {
    ...typography.displayMedium,
    marginBottom: 8,
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    marginBottom: 24,
  },
  cardsList: {
    gap: 14,
  },
  permissionCard: {
    padding: 18,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  privacyCard: {
    padding: 18,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  antiBypassCard: {
    padding: 14,
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  antiBypassText: {
    ...typography.bodySmall,
    color: colors.warningAccent,
    marginLeft: 10,
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardTextCol: {
    flex: 1,
  },
  permTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    marginBottom: 3,
  },
  permDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  privacyTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    marginBottom: 3,
    color: colors.positiveAccent,
  },
  privacyDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 18,
  },
  statusCol: {
    marginLeft: 10,
  },
  pendingBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primaryAccent,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.obsidian,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backText: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
  },
  ctaWrapper: {
    flex: 1,
    marginLeft: 12,
  },
});

export default Step5PermissionsGrant;
