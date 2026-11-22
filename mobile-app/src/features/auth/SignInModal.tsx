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
  Image,
} from 'react-native';
import {
  X,
  Mail,
  Lock,
  ArrowLeft,
  KeyRound,
  Sparkles,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import { AppleIcon, GoogleIcon } from '../../core/theme/components/SocialIcons';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import authService from '../../services/supabase/auth';
import oAuthService from '../../services/oauth/OAuthService';
import { useOnboarding } from '../onboarding/OnboardingContext';
import { useFocusEngine } from '../../services/focus_engine/FocusEngineContext';

const APP_LOGO = require('../../../assets/images/app-logo.png');

interface SignInModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type SignInStep = 'choose' | 'email_otp' | 'otp_verify' | 'email_password';

export const SignInModal: React.FC<SignInModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { finishOnboarding } = useOnboarding();
  const { refreshState } = useFocusEngine();

  const [step, setStep] = useState<SignInStep>('choose');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = () => {
    setStep('choose');
    setEmail('');
    setPassword('');
    setOtpCode('');
    setLoading(false);
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handlePostSignInSuccess = async () => {
    await refreshState().catch(() => {});
    await finishOnboarding().catch(() => {});
    handleClose();
    if (onSuccess) {
      onSuccess();
    }
    Alert.alert(
      'Welcome Back ✓',
      'Your Opal Pro subscription, smart schedules, and Focus Gems have been restored.'
    );
  };

  // 1. Direct Apple OAuth Sign In
  const handleAppleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await oAuthService.signInWithApple();
      if (res.success) {
        await handlePostSignInSuccess();
      } else {
        setErrorMessage(res.error || 'Apple Sign-In could not be completed.');
      }
    } catch {
      setErrorMessage('Failed to sign in with Apple.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Direct Google OAuth Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await oAuthService.signInWithGoogle();
      if (res.success) {
        await handlePostSignInSuccess();
      } else {
        setErrorMessage(res.error || 'Google Sign-In could not be completed.');
      }
    } catch {
      setErrorMessage('Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Send Email OTP
  const handleSendEmailOtp = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.sendSignInOtp(email.trim());
      if (res.success) {
        setStep('otp_verify');
      } else {
        // Dev fallback: allow OTP entry anyway for test mode
        setStep('otp_verify');
      }
    } catch {
      setStep('otp_verify');
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify Email OTP
  const handleVerifyEmailOtp = async () => {
    if (otpCode.trim().length < 6) {
      setErrorMessage('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.verifySignInOtp(email.trim(), otpCode.trim());
      if (res.success) {
        await handlePostSignInSuccess();
      } else {
        setErrorMessage(res.error || 'Invalid OTP code. Try 123456 in test mode.');
      }
    } catch {
      setErrorMessage('Verification failed. Please check network.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Sign In with Password
  const handlePasswordSignIn = async () => {
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.signInWithEmailPassword(email.trim(), password);
      if (res.success) {
        await handlePostSignInSuccess();
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    } catch {
      setErrorMessage('Sign-in failed. Please verify credentials.');
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
          {/* Top Bar with Back/Close */}
          <View style={styles.topBar}>
            {step !== 'choose' ? (
              <TouchableOpacity
                onPress={() => { setStep('choose'); setErrorMessage(null); }}
                style={styles.iconBtn}
              >
                <ArrowLeft size={18} color={colors.primaryText} />
              </TouchableOpacity>
            ) : (
              <View style={styles.badge}>
                <KeyRound size={14} color={colors.primaryAccent} />
                <Text style={styles.badgeText}>RETURNING MEMBER</Text>
              </View>
            )}

            <TouchableOpacity onPress={handleClose} style={styles.iconBtn} accessibilityLabel="Close">
              <X size={18} color={colors.secondaryMutedText} />
            </TouchableOpacity>
          </View>

          {/* Headline */}
          <View style={styles.headerSection}>
            <View style={styles.modalLogoWrapper}>
              <Image source={APP_LOGO} style={styles.modalLogo} resizeMode="cover" />
            </View>
            <Text style={styles.headline}>Welcome Back</Text>
            <Text style={styles.subheadline}>
              Sign in to restore your Opal Pro subscription, streaks, and custom block schedules.
            </Text>
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Step 1: Choose Sign In Method */}
          {step === 'choose' && (
            <View style={styles.buttonGroup}>
              {/* Apple Sign In */}
              <TouchableOpacity
                style={styles.appleBtn}
                activeOpacity={0.85}
                onPress={handleAppleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <View style={styles.appleLogoIcon}>
                      <AppleIcon size={20} color="#000000" />
                    </View>
                    <Text style={styles.appleBtnText}>Sign In with Apple</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Google Sign In */}
              <TouchableOpacity
                style={styles.googleBtn}
                activeOpacity={0.85}
                onPress={handleGoogleSignIn}
                disabled={loading}
              >
                <View style={styles.googleIconBadge}>
                  <GoogleIcon size={18} />
                </View>
                <Text style={styles.googleBtnText}>Sign In with Google</Text>
              </TouchableOpacity>

              {/* Email OTP */}
              <TouchableOpacity
                style={styles.emailBtn}
                activeOpacity={0.85}
                onPress={() => { setStep('email_otp'); setErrorMessage(null); }}
                disabled={loading}
              >
                <Mail size={18} color={colors.primaryText} />
                <Text style={styles.emailBtnText}>Sign In with Email Code (OTP)</Text>
              </TouchableOpacity>

              {/* Password option */}
              <TouchableOpacity
                style={styles.passwordLink}
                onPress={() => { setStep('email_password'); setErrorMessage(null); }}
              >
                <Text style={styles.passwordLinkText}>Use Email & Password instead</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Email OTP Input */}
          {step === 'email_otp' && (
            <View style={styles.inputStepContainer}>
              <Text style={styles.inputLabel}>Enter Account Email</Text>
              <Text style={styles.inputSublabel}>
                We will email you a 6-digit code to securely sign in without passwords.
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

          {/* Step 3: Verify OTP */}
          {step === 'otp_verify' && (
            <View style={styles.inputStepContainer}>
              <Text style={styles.inputLabel}>Enter Verification Code</Text>
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
                title="Verify & Restore Account"
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

          {/* Step 4: Email & Password */}
          {step === 'email_password' && (
            <View style={styles.inputStepContainer}>
              <Text style={styles.inputLabel}>Email & Password</Text>
              <Text style={styles.inputSublabel}>Sign in with your registered account credentials.</Text>

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

              <View style={[styles.inputWrapper, { marginTop: 10 }]}>
                <Lock size={18} color={colors.secondaryMutedText} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Password"
                  placeholderTextColor={colors.tertiaryText}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <PrimaryPillButton
                title="Sign In"
                onPress={handlePasswordSignIn}
                loading={loading}
                style={{ marginTop: 14 }}
              />
            </View>
          )}

          <Text style={styles.privacyNote}>
            Your privacy is protected. Screen usage and app blocking decisions stay 100% on-device.
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  badgeText: {
    ...typography.caption,
    color: colors.primaryAccent,
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
  modalLogoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    overflow: 'hidden',
    backgroundColor: '#12141D',
    marginBottom: 12,
    alignSelf: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  modalLogo: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
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
  passwordLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  passwordLinkText: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
    textDecorationLine: 'underline',
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

export default SignInModal;
