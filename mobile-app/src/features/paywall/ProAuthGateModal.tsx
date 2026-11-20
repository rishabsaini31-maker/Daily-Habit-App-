import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Crown,
  X,
  Mail,
  Shield,
  Cloud,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import authService from '../../services/supabase/auth';

interface ProAuthGateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  planTitle?: string;
}

type AuthStep = 'choose' | 'email_input' | 'otp_verify';

export const ProAuthGateModal: React.FC<ProAuthGateModalProps> = ({
  visible,
  onClose,
  onSuccess,
  planTitle = 'Annual Focus Pass',
}) => {
  const [step, setStep] = useState<AuthStep>('choose');
  const [email, setEmail] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setStep('choose');
    setEmail('');
    setOtpCode('');
    setLoading(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // 1. Link with Apple (Required on iOS when social sign-in is offered)
  const handleLinkApple = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.linkWithApple();
      if (res.success) {
        handleClose();
        await onSuccess();
      } else {
        setErrorMessage(res.error || 'Apple Sign-In could not be completed.');
      }
    } catch {
      setErrorMessage('Failed to connect Apple account.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Link with Google
  const handleLinkGoogle = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.linkWithGoogle();
      if (res.success) {
        handleClose();
        await onSuccess();
      } else {
        setErrorMessage(res.error || 'Google Sign-In could not be completed.');
      }
    } catch {
      setErrorMessage('Failed to connect Google account.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Request 6-digit Email OTP
  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.linkWithEmailOtp(email.trim());
      if (res.success) {
        setStep('otp_verify');
      } else {
        setErrorMessage(res.error || 'Unable to send verification code.');
      }
    } catch {
      setErrorMessage('Network error sending verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify 6-digit Email OTP
  const handleVerifyEmailOtp = async () => {
    if (otpCode.trim().length < 6) {
      setErrorMessage('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.verifyEmailOtp(email.trim(), otpCode.trim());
      if (res.success) {
        handleClose();
        await onSuccess();
      } else {
        setErrorMessage(res.error || 'Invalid code. Use 123456 in test mode.');
      }
    } catch {
      setErrorMessage('Verification failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalContent}>
          {/* Top Bar with Crown and Close */}
          <View style={styles.topBar}>
            {step !== 'choose' ? (
              <TouchableOpacity onPress={() => { setStep('choose'); setErrorMessage(null); }} style={styles.iconBtn}>
                <ArrowLeft size={18} color={colors.primaryText} />
              </TouchableOpacity>
            ) : (
              <View style={styles.crownBadge}>
                <Crown size={14} color="#FBBF24" />
                <Text style={styles.crownText}>PRO ACCOUNT GATE</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleClose} style={styles.iconBtn} accessibilityLabel="Close">
              <X size={18} color={colors.secondaryMutedText} />
            </TouchableOpacity>
          </View>

          {/* Headline & Value Explanation */}
          <View style={styles.headerSection}>
            <Text style={styles.headline}>Create Your Pro Account</Text>
            <Text style={styles.subheadline}>
              Your Pro subscription, schedules, and Gems will be permanently saved to your account.
            </Text>
          </View>

          {/* Security & Cloud Guarantees */}
          {step === 'choose' && (
            <GlassCard style={styles.guaranteeCard}>
              <View style={styles.guaranteeRow}>
                <Cloud size={16} color={colors.primaryAccent} />
                <Text style={styles.guaranteeText}>Cross-device sync & streak preservation</Text>
              </View>
              <View style={styles.guaranteeRow}>
                <Sparkles size={16} color="#FBBF24" />
                <Text style={styles.guaranteeText}>Zero data loss: anonymous metrics migrate seamlessly</Text>
              </View>
              <View style={styles.guaranteeRow}>
                <Shield size={16} color={colors.positiveAccent} />
                <Text style={styles.guaranteeText}>100% on-device private & App Store compliant</Text>
              </View>
            </GlassCard>
          )}

          {/* Error Message Banner */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Step 1: Choose Auth Method */}
          {step === 'choose' && (
            <View style={styles.buttonGroup}>
              {/* Apple Sign In (App Store Guideline 4.8 Compliance) */}
              <TouchableOpacity
                style={styles.appleBtn}
                activeOpacity={0.85}
                onPress={handleLinkApple}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <View style={styles.appleLogoIcon}>
                      <Text style={styles.appleLogoText}></Text>
                    </View>
                    <Text style={styles.appleBtnText}>Continue with Apple</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Google Sign In */}
              <TouchableOpacity
                style={styles.googleBtn}
                activeOpacity={0.85}
                onPress={handleLinkGoogle}
                disabled={loading}
              >
                <View style={styles.googleIconBadge}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </TouchableOpacity>

              {/* Continue with Email OTP */}
              <TouchableOpacity
                style={styles.emailBtn}
                activeOpacity={0.85}
                onPress={() => { setStep('email_input'); setErrorMessage(null); }}
                disabled={loading}
              >
                <Mail size={18} color={colors.primaryText} />
                <Text style={styles.emailBtnText}>Continue with Email (6-Digit OTP)</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Email Input */}
          {step === 'email_input' && (
            <View style={styles.inputStepContainer}>
              <Text style={styles.inputLabel}>Enter Your Email</Text>
              <Text style={styles.inputSublabel}>
                We will send a 6-digit verification code to connect your subscription.
              </Text>

              <View style={styles.inputWrapper}>
                <Mail size={18} color={colors.secondaryMutedText} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="name@example.com"
                  placeholderTextColor={colors.tertiaryText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <PrimaryPillButton
                title="Send 6-Digit Code"
                onPress={handleSendEmailOtp}
                loading={loading}
                style={{ marginTop: 14 }}
              />
            </View>
          )}

          {/* Step 3: 6-Digit OTP Verification */}
          {step === 'otp_verify' && (
            <View style={styles.inputStepContainer}>
              <Text style={styles.inputLabel}>Enter 6-Digit Code</Text>
              <Text style={styles.inputSublabel}>
                Sent to <Text style={{ color: colors.primaryText, fontWeight: '600' }}>{email}</Text>
              </Text>

              <View style={styles.inputWrapper}>
                <Lock size={18} color={colors.secondaryMutedText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.textInput, styles.otpInput]}
                  placeholder="123456"
                  placeholderTextColor={colors.tertiaryText}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
              </View>

              <PrimaryPillButton
                title="Verify & Unlock Pro"
                onPress={handleVerifyEmailOtp}
                loading={loading}
                style={{ marginTop: 14 }}
              />

              <TouchableOpacity
                onPress={handleSendEmailOtp}
                style={styles.resendBtn}
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend Code</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Privacy Note */}
          <Text style={styles.privacyNote}>
            Linking your account transfers all your current metrics and unlocked Gems instantly.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 5, 8, 0.88)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.obsidian,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  crownText: {
    ...typography.caption,
    color: '#FBBF24',
    fontWeight: '800',
    fontSize: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.elevatedCardSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    marginBottom: 16,
  },
  headline: {
    ...typography.displayMedium,
    fontSize: 22,
    marginBottom: 6,
  },
  subheadline: {
    ...typography.bodyMedium,
    color: colors.secondaryMutedText,
    lineHeight: 20,
  },
  guaranteeCard: {
    padding: 14,
    marginBottom: 18,
    gap: 10,
  },
  guaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  guaranteeText: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    flex: 1,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.dangerAccent,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 12,
  },
  appleBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appleLogoIcon: {
    marginBottom: 2,
  },
  appleLogoText: {
    fontSize: 20,
    color: '#000000',
    fontWeight: 'bold',
  },
  appleBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
  },
  googleBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.elevatedCardSurface,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EA4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIconText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
  },
  emailBtn: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.elevatedCardHover,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emailBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primaryText,
  },
  inputStepContainer: {
    marginVertical: 4,
  },
  inputLabel: {
    ...typography.titleMedium,
    fontSize: 16,
    marginBottom: 4,
  },
  inputSublabel: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    marginBottom: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevatedCardSurface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairlineBorder,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: colors.primaryText,
    fontSize: 15,
  },
  otpInput: {
    fontSize: 20,
    letterSpacing: 6,
    fontWeight: '700',
  },
  resendBtn: {
    marginTop: 12,
    alignItems: 'center',
  },
  resendText: {
    ...typography.bodySmall,
    color: colors.primaryAccent,
    fontWeight: '600',
  },
  privacyNote: {
    ...typography.caption,
    color: colors.tertiaryText,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 14,
  },
});

export default ProAuthGateModal;
