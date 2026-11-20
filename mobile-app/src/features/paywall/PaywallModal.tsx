import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Crown, Check, Zap, Shield, Sparkles, Lock } from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useAppNavigation } from '../../core/navigation/NavigationContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';
import revenueCat from '../../services/revenuecat/RevenueCatService';
import authService from '../../services/supabase/auth';
import oAuthService from '../../services/oauth/OAuthService';
import ProAuthGateModal from './ProAuthGateModal';
import SignInModal from '../auth/SignInModal';

export const PaywallModal: React.FC = () => {
  const { closeModal } = useAppNavigation();
  const { updateProfile } = useFocusEngine();
  const [billingPlan, setBillingPlan] = useState<'annual' | 'monthly'>('annual');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [showAuthGate, setShowAuthGate] = useState<boolean>(false);
  const [showSignIn, setShowSignIn] = useState<boolean>(false);

  // Executes purchase only after OAuth user identity is established
  const executePurchase = async () => {
    setIsProcessing(true);
    try {
      const oAuthUser = oAuthService.getCurrentOAuthUser();
      if (oAuthUser && !oAuthUser.isGuest && oAuthUser.sub) {
        // Pass verified OAuth sub ID directly into Purchases.logIn(oauthSubId)
        await revenueCat.logIn(oAuthUser.sub);
      }

      const packageId = billingPlan === 'annual' ? 'annual_4999_trial' : 'monthly_899';
      const result = await revenueCat.purchasePackage(packageId);

      if (result.success) {
        await updateProfile({ is_pro: true });
        Alert.alert(
          'Opal Pro Activated ✓',
          billingPlan === 'annual'
            ? 'Your 7-day free trial has started. All pro features (Surgical Reels, Deep Focus, Unlimited Schedules) are unlocked!'
            : 'Opal Pro monthly subscription active. Enjoy full cognitive protection!',
          [{ text: 'Start Focusing', onPress: closeModal }]
        );
      } else {
        Alert.alert('Purchase Incomplete', result.error || 'Payment was not processed.');
      }
    } catch {
      Alert.alert('Error', 'Unable to reach App Store / Play Store billing.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Spec: Enforce mandatory OAuth sign-in BEFORE initiating payment for anonymous guests
  const handleStartTrial = async () => {
    try {
      const oAuthUser = oAuthService.getCurrentOAuthUser();
      if (!oAuthUser || oAuthUser.isGuest) {
        setShowAuthGate(true);
        return;
      }
      await executePurchase();
    } catch {
      await executePurchase();
    }
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    try {
      const oAuthUser = oAuthService.getCurrentOAuthUser();
      if (oAuthUser && !oAuthUser.isGuest && oAuthUser.sub) {
        await revenueCat.logIn(oAuthUser.sub);
      }
      const result = await revenueCat.restorePurchases();
      if (result.isPro) {
        await updateProfile({ is_pro: true });
        Alert.alert('Purchases Restored', 'Your Opal Pro entitlement was restored successfully.', [
          { text: 'OK', onPress: closeModal },
        ]);
      } else {
        Alert.alert('No Entitlement Found', 'No active subscription was found for your account.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Dismiss Bar with "X" */}
      <View style={styles.topBar}>
        <View style={{ width: 40 }} />
        <View style={styles.proCrownHeader}>
          <Crown size={18} color="#FBBF24" />
          <Text style={styles.proBadgeText}>OPAL PRO PASS</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={closeModal}
          style={styles.closeBtn}
          accessibilityLabel="Dismiss Paywall"
        >
          <X size={20} color={colors.secondaryMutedText} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Pitch */}
        <View style={styles.heroSection}>
          <Text style={styles.heroHeadline}>Reclaim 1,000+ Hours Every Year</Text>
          <Text style={styles.heroSub}>
            Join thousands who broke their screen addiction and built real-life focus.
          </Text>
        </View>

        {/* Value Proposition List */}
        <View style={styles.benefitsList}>
          <GlassCard style={styles.benefitCard}>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Zap size={20} color={colors.primaryAccent} />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>Surgical Reels & Shorts Blocker</Text>
                <Text style={styles.benefitDesc}>
                  Preserve useful messaging while blocking infinite-scroll dopamine reels.
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.benefitCard}>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <Shield size={20} color={colors.positiveAccent} />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>Unlimited Smart Schedules & GPS</Text>
                <Text style={styles.benefitDesc}>
                  Automatic location locks for office, school, and bedtime sanctuaries.
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.benefitCard}>
            <View style={styles.benefitRow}>
              <View style={[styles.benefitIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <Lock size={20} color={colors.dangerAccent} />
              </View>
              <View style={styles.benefitTextCol}>
                <Text style={styles.benefitTitle}>Deep Focus & Anti-Uninstall Guard</Text>
                <Text style={styles.benefitDesc}>
                  Unbreakable locks with friend accountability code & NFC physical keys.
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* Pricing Tiers */}
        <View style={styles.pricingSection}>
          {/* Annual Plan (Recommended) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setBillingPlan('annual')}
          >
            <GlassCard
              style={[
                styles.planCard,
                billingPlan === 'annual' && styles.planCardActive,
              ]}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>SAVE 50% • 7 DAYS FREE</Text>
              </View>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>Annual Focus Pass</Text>
                  <Text style={styles.planBillingNote}>$49.99/year after 7-day trial ($4.16/mo)</Text>
                </View>
                <View style={[styles.radioCircle, billingPlan === 'annual' && styles.radioActive]}>
                  {billingPlan === 'annual' && <View style={styles.radioDot} />}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>

          {/* Monthly Plan */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setBillingPlan('monthly')}
          >
            <GlassCard
              style={[
                styles.planCard,
                billingPlan === 'monthly' && styles.planCardActive,
              ]}
            >
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>Monthly Pass</Text>
                  <Text style={styles.planBillingNote}>$8.99/month • Cancel anytime</Text>
                </View>
                <View style={[styles.radioCircle, billingPlan === 'monthly' && styles.radioActive]}>
                  {billingPlan === 'monthly' && <View style={styles.radioDot} />}
                </View>
              </View>
            </GlassCard>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer CTA & Disclaimers */}
      <View style={styles.footer}>
        <PrimaryPillButton
          title={
            billingPlan === 'annual'
              ? 'Start 7-Day Free Trial ($49.99/yr)'
              : 'Unlock Opal Pro ($8.99/mo)'
          }
          onPress={handleStartTrial}
          loading={isProcessing}
          rightIcon={<Sparkles size={18} color={colors.primaryButtonText} />}
        />
        <Text style={styles.disclaimerText}>
          7 days free, then $49.99/yr. Cancel at least 24 hours before trial ends in App Store settings.
        </Text>
        <View style={styles.linksRow}>
          <TouchableOpacity onPress={() => setShowSignIn(true)}>
            <Text style={[styles.linkText, { color: colors.primaryAccent, fontWeight: '600' }]}>
              Already Pro? Sign In
            </Text>
          </TouchableOpacity>
          <Text style={styles.linkDivider}>•</Text>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.linkText}>Restore</Text>
          </TouchableOpacity>
          <Text style={styles.linkDivider}>•</Text>
          <TouchableOpacity onPress={() => Alert.alert('Terms of Service', 'Standard Apple EULA applies.')}>
            <Text style={styles.linkText}>Terms</Text>
          </TouchableOpacity>
          <Text style={styles.linkDivider}>•</Text>
          <TouchableOpacity onPress={() => Alert.alert('Privacy Policy', 'Zero screen data collected. 100% on-device.')}>
            <Text style={styles.linkText}>Privacy</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Pro Account Upgrade Gate Modal */}
      <ProAuthGateModal
        visible={showAuthGate}
        onClose={() => setShowAuthGate(false)}
        onSuccess={executePurchase}
        planTitle={billingPlan === 'annual' ? 'Annual Focus Pass' : 'Monthly Pass'}
      />

      {/* Returning User Sign In Modal */}
      <SignInModal
        visible={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={closeModal}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidianDeep,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 12,
  },
  proCrownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  proBadgeText: {
    ...typography.caption,
    color: '#FBBF24',
    fontWeight: '800',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 10,
    paddingBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  heroHeadline: {
    ...typography.displayLarge,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSub: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  benefitsList: {
    gap: 10,
    marginVertical: 16,
  },
  benefitCard: {
    padding: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitTextCol: {
    flex: 1,
  },
  benefitTitle: {
    ...typography.titleMedium,
    fontSize: 14,
    marginBottom: 2,
  },
  benefitDesc: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    lineHeight: 16,
  },
  pricingSection: {
    gap: 12,
    marginVertical: 12,
  },
  planCard: {
    padding: 18,
    position: 'relative',
  },
  planCardActive: {
    borderColor: colors.primaryAccent,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: colors.primaryAccent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primaryButtonText,
    letterSpacing: 0.5,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planName: {
    ...typography.titleLarge,
    fontSize: 17,
  },
  planBillingNote: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.hairlineBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: colors.primaryAccent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primaryAccent,
  },
  footer: {
    paddingHorizontal: spacing.screenPadding,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
    backgroundColor: colors.obsidianDeep,
  },
  disclaimerText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    marginTop: 10,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  linkText: {
    ...typography.bodySmall,
    fontSize: 11,
    color: colors.secondaryMutedText,
  },
  linkDivider: {
    marginHorizontal: 8,
    color: colors.secondaryMutedText,
  },
});

export default PaywallModal;
