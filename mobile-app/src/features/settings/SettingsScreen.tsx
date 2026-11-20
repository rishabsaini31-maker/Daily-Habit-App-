import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Shield,
  KeyRound,
  Activity,
  Trash2,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useOnboarding } from '../onboarding/OnboardingContext';
import nativeBlocker from '../../services/native_blocker/NativeBlockerBridge';

export const SettingsScreen: React.FC = () => {
  const { closeModal } = useAppNavigation();
  const { resetOnboarding } = useOnboarding();

  const [antiUninstallEnabled, setAntiUninstallEnabled] = useState<boolean>(true);
  const [friendCode, setFriendCode] = useState<string>('778899');
  const [healthSyncEnabled, setHealthSyncEnabled] = useState<boolean>(true);

  const handleToggleAntiUninstall = async (value: boolean) => {
    setAntiUninstallEnabled(value);
    await nativeBlocker.setAntiUninstallGuard(value);
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding Flow',
      'This will reset onboarding completion state so you can experience the 5-step onboarding stack again from Step 1.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Test',
          style: 'destructive',
          onPress: async () => {
            await resetOnboarding();
            closeModal();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={closeModal} style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Protection</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Anti-Bypass & Security */}
        <Text style={styles.sectionHeader}>ANTI-BYPASS & SECURITY</Text>

        <GlassCard style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <Shield size={20} color={colors.dangerAccent} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>Anti-Uninstall Guard</Text>
              <Text style={styles.cardSub}>
                Requires OS device passcode to delete the app while focus session is running
              </Text>
            </View>
            <Switch
              value={antiUninstallEnabled}
              onValueChange={handleToggleAntiUninstall}
              trackColor={{ false: colors.hairlineBorder, true: colors.dangerAccent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {/* Emergency Friend Code */}
        <GlassCard style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <KeyRound size={20} color={colors.primaryAccent} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>Emergency Friend Code</Text>
              <Text style={styles.cardSub}>
                Current Partner PIN: <Text style={styles.pinCode}>{friendCode}</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => Alert.alert('Edit Friend Code', 'Partner PIN is locked to 778899 for accountability.')}
            >
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Apple Health / Health Connect Sync */}
        <Text style={styles.sectionHeader}>HEALTH & WEARABLE INTEGRATIONS</Text>
        <GlassCard style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
              <Activity size={20} color={colors.positiveAccent} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>Apple Health / Health Connect</Text>
              <Text style={styles.cardSub}>
                Sync steps for step-gated "Earn Screen Time" rules
              </Text>
            </View>
            <Switch
              value={healthSyncEnabled}
              onValueChange={setHealthSyncEnabled}
              trackColor={{ false: colors.hairlineBorder, true: colors.positiveAccent }}
              thumbColor="#FFFFFF"
            />
          </View>
        </GlassCard>

        {/* Developer Diagnostics / Reset Onboarding */}
        <Text style={styles.sectionHeader}>DEVELOPER TESTING TOOLS</Text>
        <GlassCard style={styles.card}>
          <View style={styles.cardRow}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <RotateCcw size={20} color={colors.warningAccent} />
            </View>
            <View style={styles.cardTextCol}>
              <Text style={styles.cardTitle}>Test Onboarding Flow Again</Text>
              <Text style={styles.cardSub}>
                Reset onboarding flag to preview 5-step diagnostic and permissions
              </Text>
            </View>
            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetOnboarding}
            >
              <Text style={styles.resetBtnText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Version Information */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appInfoTitle}>Opal Digital Well-Being OS</Text>
          <Text style={styles.appInfoVersion}>Version 2.4.0 (Build 2026.11) • Production Architecture</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...typography.titleMedium,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: 32,
  },
  sectionHeader: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    marginBottom: 10,
    marginTop: 14,
    letterSpacing: 1.2,
  },
  card: {
    padding: 16,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextCol: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    ...typography.titleMedium,
    fontSize: 15,
    marginBottom: 2,
  },
  cardSub: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 16,
  },
  pinCode: {
    color: colors.primaryAccent,
    fontWeight: '700',
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.hairlineBorder,
  },
  editBtnText: {
    ...typography.caption,
    color: colors.primaryText,
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  resetBtnText: {
    ...typography.caption,
    color: colors.warningAccent,
    fontWeight: '700',
  },
  appInfoContainer: {
    alignItems: 'center',
    marginTop: 28,
  },
  appInfoTitle: {
    ...typography.titleMedium,
    fontSize: 13,
    color: colors.secondaryMutedText,
  },
  appInfoVersion: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.tertiaryText,
    marginTop: 2,
  },
});

export default SettingsScreen;
