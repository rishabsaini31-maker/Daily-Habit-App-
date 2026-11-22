import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, Line, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { colors, typography } from '../tokens';
import { ShieldCheck, Lock, Gem, Sparkles } from 'lucide-react-native';

interface ChronographClockProps {
  totalSeconds: number;
  remainingSeconds: number;
  size?: number;
  strokeWidth?: number;
  strictness?: 'normal' | 'deep_focus' | 'friend_or_nfc';
  interactive?: boolean;
  onSelectDurationMinutes?: (minutes: number) => void;
  blockedAppsCount?: number;
  gemsEarning?: number;
  isLockedSession?: boolean;
}

export const ChronographClock: React.FC<ChronographClockProps> = ({
  totalSeconds,
  remainingSeconds,
  size = 260,
  strokeWidth = 8,
  strictness = 'normal',
  interactive = false,
  onSelectDurationMinutes,
  blockedAppsCount = 0,
  gemsEarning = 15,
  isLockedSession = false,
}) => {
  // 1. Ambient breathing glow animation
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const glowScale = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 0.65,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(glowScale, {
            toValue: 1.05,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(glowScale, {
            toValue: 0.96,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  // 2. Chronograph geometry & progress calculations
  const cx = size / 2;
  const cy = size / 2;
  const outerBezelRadius = size / 2 - 10;
  const dialRadius = outerBezelRadius - 14;
  const arcRadius = dialRadius - 8;
  const arcCircumference = 2 * Math.PI * arcRadius;

  const safeTotal = Math.max(1, totalSeconds);
  const progress = Math.max(0, Math.min(1, remainingSeconds / safeTotal));
  const strokeDashoffset = arcCircumference * (1 - progress);

  // Tabular Time calculation (MM:SS or HH:MM:SS)
  const safeSeconds = Math.max(0, remainingSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const mins = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  const formattedTime = useMemo(() => {
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, [hours, mins, secs]);

  // "Ends at X:XX PM" timestamp calculation
  const endsAtText = useMemo(() => {
    const endTimestamp = new Date(Date.now() + safeSeconds * 1000);
    return endTimestamp.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [safeSeconds]);

  // Generate 60 high-craft precision chronograph dial tick marks
  const ticks = useMemo(() => {
    const tickItems = [];
    const totalTicks = 60;
    const activeTicksCount = Math.round(progress * totalTicks);

    for (let i = 0; i < totalTicks; i++) {
      const angleDeg = i * 6 - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      const tickLength = isMajor ? 9 : 4.5;

      const x1 = cx + dialRadius * Math.cos(angleRad);
      const y1 = cy + dialRadius * Math.sin(angleRad);
      const x2 = cx + (dialRadius - tickLength) * Math.cos(angleRad);
      const y2 = cy + (dialRadius - tickLength) * Math.sin(angleRad);

      const isActive = i <= activeTicksCount;
      let strokeColor = 'rgba(255, 255, 255, 0.12)';
      let strokeWidthVal = 1;

      if (isActive) {
        if (strictness === 'deep_focus') {
          strokeColor = isMajor ? '#FBBF24' : 'rgba(251, 191, 36, 0.65)';
        } else {
          strokeColor = isMajor ? colors.primaryAccent : colors.positiveAccent;
        }
        strokeWidthVal = isMajor ? 2.2 : 1.2;
      } else if (isMajor) {
        strokeColor = 'rgba(255, 255, 255, 0.28)';
        strokeWidthVal = 1.8;
      }

      tickItems.push(
        <Line
          key={`tick-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidthVal}
          strokeLinecap="round"
        />
      );
    }
    return tickItems;
  }, [cx, cy, dialRadius, progress, strictness]);

  const isDeepFocus = strictness === 'deep_focus';

  return (
    <View style={[styles.rootContainer, { width: size + 36, height: size + 36 }]}>
      {/* 1. Ambient Breathing Emerald / Cyan Radial Glow */}
      <Animated.View
        style={[
          styles.ambientGlowContainer,
          {
            width: size + 20,
            height: size + 20,
            opacity: glowAnim,
            transform: [{ scale: glowScale }],
            backgroundColor: isDeepFocus
              ? 'rgba(251, 191, 36, 0.12)'
              : 'rgba(56, 189, 248, 0.12)',
            borderColor: isDeepFocus
              ? 'rgba(251, 191, 36, 0.22)'
              : 'rgba(16, 185, 129, 0.22)',
          },
        ]}
      />

      {/* 2. Precision Mechanical & Digital Chronograph SVG Dial */}
      <View style={[styles.svgWrapper, { width: size, height: size }]}>
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Defs>
            {/* Emerald-to-Cyan Luxury Gradient */}
            <LinearGradient id="chronoGradientNormal" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
              <Stop offset="50%" stopColor="#2DD4BF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="1" />
            </LinearGradient>

            {/* Deep Focus Gold / Amber Luxury Gradient */}
            <LinearGradient id="chronoGradientDeep" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#F59E0B" stopOpacity="1" />
              <Stop offset="50%" stopColor="#FBBF24" stopOpacity="1" />
              <Stop offset="100%" stopColor="#D97706" stopOpacity="1" />
            </LinearGradient>

            {/* Subtle Dial Track */}
            <LinearGradient id="chronoTrackGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#1A1F2C" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#0E121A" stopOpacity="0.9" />
            </LinearGradient>
          </Defs>

          {/* Outer Polished Chronograph Bezel */}
          <Circle
            cx={cx}
            cy={cy}
            r={outerBezelRadius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={1}
            fill="none"
          />

          {/* 60 High-Craft Chronograph Tick Marks */}
          <G>{ticks}</G>

          {/* Luminescent Arc Background Track */}
          <Circle
            cx={cx}
            cy={cy}
            r={arcRadius}
            stroke="url(#chronoTrackGradient)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Active Glowing Emerald-to-Cyan Arc */}
          <Circle
            cx={cx}
            cy={cy}
            r={arcRadius}
            stroke={isDeepFocus ? 'url(#chronoGradientDeep)' : 'url(#chronoGradientNormal)'}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcCircumference} ${arcCircumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${cx} ${cy})`}
          />

          {/* Inner Hairline Ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={arcRadius - 10}
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth={1}
            fill="none"
          />
        </Svg>

        {/* 3. Center Precision Digital Instrument Display */}
        <View style={styles.centerInstrumentContainer}>
          {/* Strict Tabular MM:SS Timer (Zero Horizontal Jitter) */}
          <Text
            style={[
              styles.digitalTimer,
              isDeepFocus && { color: '#FDF6B2' },
              { fontSize: size > 260 ? 46 : 38 },
            ]}
          >
            {formattedTime}
          </Text>

          {/* Sleek "Ends at X:XX PM" Badge */}
          <View style={styles.endsAtBadge}>
            <View
              style={[
                styles.endsAtDot,
                { backgroundColor: isDeepFocus ? '#FBBF24' : colors.primaryAccent },
              ]}
            />
            <Text style={styles.endsAtText}>Ends at {endsAtText}</Text>
          </View>

          {/* Strictness Pill Indicator */}
          <View
            style={[
              styles.modePill,
              isDeepFocus
                ? styles.modePillDeepFocus
                : styles.modePillNormal,
            ]}
          >
            {isDeepFocus ? (
              <Lock size={11} color="#FBBF24" />
            ) : (
              <ShieldCheck size={11} color={colors.primaryAccent} />
            )}
            <Text
              style={[
                styles.modePillText,
                isDeepFocus ? { color: '#FBBF24' } : { color: colors.primaryAccent },
              ]}
            >
              {isDeepFocus ? 'DEEP FOCUS 🔒' : 'STANDARD LOCK'}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Active Locked Session Real-Time Telemetry Badges */}
      {isLockedSession && (
        <View style={styles.sessionTelemetryRow}>
          {/* Live Shield Active Pill */}
          <View style={styles.shieldActivePill}>
            <View style={styles.pulsingEmeraldDot} />
            <Text style={styles.shieldActiveText}>
              Shield Active • {blockedAppsCount} {blockedAppsCount === 1 ? 'App' : 'Apps'} Blocked
            </Text>
          </View>

          {/* Real-time Gems Earning Counter */}
          <View style={styles.gemsCounterBadge}>
            <Sparkles size={13} color="#38BDF8" />
            <Text style={styles.gemsCounterText}>+{gemsEarning} Gems 💎</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  ambientGlowContainer: {
    position: 'absolute',
    borderRadius: 200,
    borderWidth: 1.5,
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerInstrumentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  digitalTimer: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
      default: { fontFamily: 'monospace' },
    }),
  },
  endsAtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 6,
  },
  endsAtDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  endsAtText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
  },
  modePillNormal: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  modePillDeepFocus: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderColor: 'rgba(251, 191, 36, 0.35)',
  },
  modePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sessionTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 14,
    flexWrap: 'wrap',
  },
  shieldActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  pulsingEmeraldDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  shieldActiveText: {
    ...typography.caption,
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12,
  },
  gemsCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  gemsCounterText: {
    ...typography.caption,
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 12,
  },
});

export default ChronographClock;
