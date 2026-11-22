import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
} from 'react-native';
import { colors, typography } from '../theme/tokens';

const { width } = Dimensions.get('window');

const APP_LOGO = require('../../../assets/images/app-logo.png');

interface StartupSplashScreenProps {
  isAppReady: boolean;
  onAnimationComplete?: () => void;
}

const BOOT_STATUS_MESSAGES = [
  'INITIALIZING COGNITIVE PROTECTION OS...',
  'CALIBRATING SYSTEM-LEVEL APP SHIELD...',
  'SYNCHRONIZING SUPABASE CLOUD TELEMETRY...',
  'FOCUS PROTOCOL ENGAGED • SYSTEM READY',
];

export const StartupSplashScreen: React.FC<StartupSplashScreenProps> = ({
  isAppReady,
  onAnimationComplete,
}) => {
  const [statusIndex, setStatusIndex] = useState(0);

  // Animated values
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowPulse = useRef(new Animated.Value(0.35)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Logo entrance (scale + fade in)
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 900,
        delay: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Ambient glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.9,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.35,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Simulated progress bar animation (0% -> 100%)
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1800,
      easing: Easing.bezier(0.2, 0.65, 0.4, 0.95),
      useNativeDriver: false,
    }).start();

    // 4. Cycle status messages
    const statusTimer = setInterval(() => {
      setStatusIndex((prev) => (prev < BOOT_STATUS_MESSAGES.length - 1 ? prev + 1 : prev));
    }, 550);

    return () => clearInterval(statusTimer);
  }, []);

  // When app signals readiness, smoothly fade out the splash screen
  useEffect(() => {
    if (isAppReady) {
      Animated.timing(screenFade, {
        toValue: 0,
        duration: 450,
        delay: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [isAppReady]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      {/* Background cyber radial glow */}
      <Animated.View
        style={[
          styles.glowCircleOuter,
          {
            opacity: glowPulse,
            transform: [{ scale: logoScale }],
          },
        ]}
      />
      <View style={styles.glowCircleInner} />

      {/* Main Brand Logo Container */}
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoWrapper,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoBorderFrame}>
            <Image
              source={APP_LOGO}
              style={styles.logoImage}
              resizeMode="cover"
              accessibilityLabel="Daily Habit App Logo"
            />
          </View>
        </Animated.View>

        {/* Brand Titles */}
        <Animated.View style={[styles.textBlock, { opacity: contentOpacity }]}>
          <Text style={styles.brandTitle}>DAILY HABIT</Text>
          <Text style={styles.brandSubtitle}>DIGITAL WELL-BEING OS</Text>
        </Animated.View>

        {/* Futuristic Telemetry & Progress Bar */}
        <Animated.View style={[styles.progressBlock, { opacity: contentOpacity }]}>
          <View style={styles.progressBarBg}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          <Text style={styles.statusText}>{BOOT_STATUS_MESSAGES[statusIndex]}</Text>
        </Animated.View>
      </View>

      {/* Bottom Security / Architecture Badge */}
      <Animated.View style={[styles.bottomFooter, { opacity: contentOpacity }]}>
        <View style={styles.securityDot} />
        <Text style={styles.footerText}>
          ZERO-LOCAL-STORAGE • SUPABASE CLOUD • HARDCORE OS SHIELD
        </Text>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#08090D',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  glowCircleOuter: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  glowCircleInner: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 16,
  },
  logoBorderFrame: {
    width: 140,
    height: 140,
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    overflow: 'hidden',
    backgroundColor: '#12141D',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  textBlock: {
    alignItems: 'center',
    marginTop: 24,
  },
  brandTitle: {
    ...typography.displayMedium,
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
    textAlign: 'center',
  },
  brandSubtitle: {
    ...typography.caption,
    color: colors.primaryAccent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginTop: 6,
    textAlign: 'center',
  },
  progressBlock: {
    alignItems: 'center',
    marginTop: 36,
    width: Math.min(width * 0.72, 280),
  },
  progressBarBg: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primaryAccent,
    borderRadius: 2,
  },
  statusText: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 12,
    textAlign: 'center',
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  securityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.positiveAccent,
    shadowColor: colors.positiveAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  footerText: {
    ...typography.caption,
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
});

export default StartupSplashScreen;
