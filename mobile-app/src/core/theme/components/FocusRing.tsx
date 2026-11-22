import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Svg, { Circle, Line, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { colors } from '../tokens';

interface FocusRingProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  subtitle?: string;
  label?: string;
}

export const FocusRing: React.FC<FocusRingProps> = ({
  score,
  size = 220,
  strokeWidth = 12,
  subtitle = 'Daily Focus Score',
  label = 'Optimal Focus',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

  const cx = size / 2;
  const cy = size / 2;
  const tickRadius = radius - strokeWidth / 2 - 8;

  // Generate crisp inner precision tick marks (40 ticks)
  const innerTicks = useMemo(() => {
    const ticks = [];
    const count = 40;
    const activeThreshold = Math.round((clampedScore / 100) * count);

    for (let i = 0; i < count; i++) {
      const angleDeg = i * (360 / count) - 90;
      const angleRad = (angleDeg * Math.PI) / 180;
      const isMajor = i % 5 === 0;
      const length = isMajor ? 5 : 3;

      const x1 = cx + tickRadius * Math.cos(angleRad);
      const y1 = cy + tickRadius * Math.sin(angleRad);
      const x2 = cx + (tickRadius - length) * Math.cos(angleRad);
      const y2 = cy + (tickRadius - length) * Math.sin(angleRad);

      const isActive = i <= activeThreshold;
      const strokeColor = isActive
        ? isMajor
          ? colors.primaryAccent
          : 'rgba(56, 189, 248, 0.4)'
        : isMajor
        ? 'rgba(255, 255, 255, 0.15)'
        : 'rgba(255, 255, 255, 0.05)';

      ticks.push(
        <Line
          key={`focus-tick-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={isMajor ? 1.5 : 1}
          strokeLinecap="round"
        />
      );
    }
    return ticks;
  }, [cx, cy, tickRadius, clampedScore]);

  return (
    <View style={[styles.container, { width: size + 24, height: size + 24 }]}>
      {/* Subtle Outer Glow Aura */}
      <View
        style={[
          styles.outerGlowRing,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
          },
        ]}
      />

      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <LinearGradient id="focusGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#38BDF8" stopOpacity="1" />
              <Stop offset="50%" stopColor="#2DD4BF" stopOpacity="1" />
              <Stop offset="100%" stopColor="#10B981" stopOpacity="1" />
            </LinearGradient>
            <LinearGradient id="bgRing" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#1A2030" stopOpacity="0.8" />
              <Stop offset="100%" stopColor="#0F131C" stopOpacity="0.95" />
            </LinearGradient>
          </Defs>

          {/* Background Outer Guide Track */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius + strokeWidth / 2 + 2}
            stroke="rgba(255, 255, 255, 0.04)"
            strokeWidth={1}
            fill="none"
          />

          {/* Background Track */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="url(#bgRing)"
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Crisp Inner Precision Ticks */}
          <G>{innerTicks}</G>

          {/* Progress Arc */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke="url(#focusGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        </Svg>

        {/* Center Metrics Content */}
        <View style={styles.centerTextContainer}>
          <Text style={styles.scoreText}>{clampedScore}</Text>
          <Text style={styles.subtitleText}>{subtitle}</Text>
          {label ? (
            <View style={styles.labelBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.labelText}>{label}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 8,
  },
  outerGlowRing: {
    position: 'absolute',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerTextContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 52,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
    ...Platform.select({
      ios: { fontFamily: 'Menlo' },
      android: { fontFamily: 'monospace' },
      default: { fontFamily: 'monospace' },
    }),
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondaryMutedText,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: -2,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryAccent,
    letterSpacing: 0.3,
  },
});

export default FocusRing;
