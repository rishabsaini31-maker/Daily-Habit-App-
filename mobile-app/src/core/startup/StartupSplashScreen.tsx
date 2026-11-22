import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { colors, typography } from '../theme/tokens';

const APP_LOGO = require('../../../assets/images/app-logo.png');

interface StartupSplashScreenProps {
  onContinue?: () => void;
  onAnimationComplete?: () => void;
  isAppReady?: boolean;
}

export const StartupSplashScreen: React.FC<StartupSplashScreenProps> = ({
  onContinue,
  onAnimationComplete,
}) => {
  const isDismissing = useRef(false);

  // Animated values
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.55)).current;
  const screenFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation: Logo spring and title fade-in
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 750,
        delay: 250,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Subtle pulse loop on "Tap to continue" prompt
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.55,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // When user taps anywhere on the screen
  const handleTapToContinue = () => {
    if (isDismissing.current) return;
    isDismissing.current = true;

    Animated.timing(screenFade, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      if (onContinue) {
        onContinue();
      }
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <TouchableOpacity
        activeOpacity={1}
        style={styles.touchableArea}
        onPress={handleTapToContinue}
        accessibilityLabel="Tap to continue"
        accessibilityRole="button"
      >
        {/* Centered Logo & Brand Content */}
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
        </View>

        {/* Clean "Tap to continue" Prompt */}
        <Animated.View
          style={[
            styles.tapPromptBox,
            {
              opacity: pulseAnim,
              transform: [
                {
                  scale: pulseAnim.interpolate({
                    inputRange: [0.55, 1],
                    outputRange: [0.98, 1.02],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.tapPromptText}>Tap to continue</Text>
          <ChevronRight size={15} color={colors.primaryAccent} />
        </Animated.View>
      </TouchableOpacity>
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
    backgroundColor: '#08090D', // Solid clean obsidian background
    zIndex: 9999,
  },
  touchableArea: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 64,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  logoBorderFrame: {
    width: 144,
    height: 144,
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
  tapPromptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  tapPromptText: {
    ...typography.bodyMedium,
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default StartupSplashScreen;
