import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
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
  size = 200,
  strokeWidth = 14,
  subtitle = 'Focus Score',
  label = 'Optimal Focus',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Defs>
          <LinearGradient id="focusGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={colors.primaryAccent} stopOpacity="1" />
            <Stop offset="100%" stopColor={colors.positiveAccent} stopOpacity="1" />
          </LinearGradient>
          <LinearGradient id="bgRing" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#1E2230" stopOpacity="0.6" />
            <Stop offset="100%" stopColor="#12141D" stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        {/* Background Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#bgRing)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Progress Arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#focusGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
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
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginVertical: 12,
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
    fontSize: 54,
    fontWeight: '800',
    color: colors.primaryText,
    letterSpacing: -1,
  },
  subtitleText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.secondaryMutedText,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -2,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primaryAccent,
    marginRight: 6,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primaryAccent,
  },
});

export default FocusRing;
