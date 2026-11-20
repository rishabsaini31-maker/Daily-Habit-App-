import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, ShieldAlert } from 'lucide-react-native';

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak?: number;
  freezeCountRemaining?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  currentStreak,
  longestStreak,
  freezeCountRemaining = 0,
  size = 'md',
}) => {
  const isFlameActive = currentStreak > 0;
  const isMilestone = currentStreak >= 7;

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  const textStyle = size === 'sm' ? styles.textSm : size === 'lg' ? styles.textLg : styles.textMd;

  return (
    <View style={[styles.container, isFlameActive ? styles.containerActive : styles.containerInactive]}>
      <Flame
        size={iconSize}
        color={isFlameActive ? (isMilestone ? '#ef4444' : '#f97316') : '#64748b'}
        fill={isFlameActive ? (isMilestone ? '#ef4444' : '#f97316') : 'none'}
      />
      <Text style={[styles.text, textStyle, isFlameActive ? styles.textActive : styles.textInactive]}>
        {currentStreak} {currentStreak === 1 ? 'day' : 'days'}
      </Text>
      {freezeCountRemaining > 0 && (
        <View style={styles.freezePill}>
          <ShieldAlert size={10} color="#38bdf8" />
          <Text style={styles.freezeText}>{freezeCountRemaining}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 4,
  },
  containerActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  containerInactive: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  text: {
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
  },
  textMd: {
    fontSize: 13,
  },
  textLg: {
    fontSize: 15,
  },
  textActive: {
    color: '#fb923c',
  },
  textInactive: {
    color: '#94a3b8',
  },
  freezePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    gap: 2,
    marginLeft: 2,
  },
  freezeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
  },
});
