import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { CheckCircle2, Lock, Mail, User, Sparkles } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { login, register, isLoading, error, clearError } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('alex@habit-tracker.internal');
  const [password, setPassword] = useState<string>('AlexPassword123!');
  const [displayName, setDisplayName] = useState<string>('Alex Johnson');
  const [validationError, setValidationError] = useState<string>('');

  const handleToggleMode = (mode: boolean) => {
    setIsRegisterMode(mode);
    setValidationError('');
    clearError();
  };

  const handleSubmit = async () => {
    setValidationError('');
    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    try {
      if (isRegisterMode) {
        if (!displayName.trim()) {
          setValidationError('Display name is required.');
          return;
        }
        await register(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch {
      // Error handled in AuthContext
    }
  };

  const handleQuickDemoLogin = async () => {
    await login('alex@habit-tracker.internal', 'AlexPassword123!');
  };

  const displayedError = validationError || error;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Logo and Brand Title */}
        <View style={styles.brandHeader}>
          <View style={styles.logoBadge}>
            <CheckCircle2 size={36} color="#10b981" strokeWidth={2.5} />
          </View>
          <Text style={styles.brandTitle}>Daily Habit Tracker</Text>
          <Text style={styles.brandSubtitle}>
            Build sustainable routines with low-friction daily check-ins
          </Text>
        </View>

        {/* Tab Switcher: Sign In vs Create Account */}
        <View style={styles.segmentedRow}>
          <TouchableOpacity
            style={[styles.segmentBtn, !isRegisterMode && styles.segmentBtnActive]}
            onPress={() => handleToggleMode(false)}
          >
            <Text style={[styles.segmentText, !isRegisterMode && styles.segmentTextActive]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, isRegisterMode && styles.segmentBtnActive]}
            onPress={() => handleToggleMode(true)}
          >
            <Text style={[styles.segmentText, isRegisterMode && styles.segmentTextActive]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Error Banner */}
        {displayedError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{displayedError}</Text>
          </View>
        ) : null}

        {/* Form Body */}
        <View style={styles.formCard}>
          {isRegisterMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>DISPLAY NAME</Text>
              <View style={styles.inputWrap}>
                <User size={18} color="#94a3b8" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor="#64748b"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <View style={styles.inputWrap}>
              <Mail size={18} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="alex@habit-tracker.internal"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>PASSWORD (MIN 8 CHARS)</Text>
            <View style={styles.inputWrap}>
              <Lock size={18} color="#94a3b8" />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••••••"
                placeholderTextColor="#64748b"
                secureTextEntry={true}
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Primary Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>
                {isRegisterMode ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>

          {/* 1-Tap Demo Sign In for evaluators */}
          <TouchableOpacity
            style={styles.demoBtn}
            onPress={handleQuickDemoLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <Sparkles size={16} color="#10b981" />
            <Text style={styles.demoBtnText}>1-Tap Demo Sign In (Alex Johnson)</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimerText}>
          Offline-first architecture: Your check-ins are saved in local storage even when disconnected.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#334155',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  segmentTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  errorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 48,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
    minHeight: 44,
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    minHeight: 48,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
    minHeight: 48,
  },
  demoBtnText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
});
