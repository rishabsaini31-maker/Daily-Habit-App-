import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  current: number;
  total: number;
  unit?: string;
  color?: string;
  showLabels?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  unit,
  color = '#10b981',
  showLabels = true,
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labelRow}>
          <Text style={styles.progressText}>
            {current} {unit ? `${unit} ` : ''}/ {total} {unit ? unit : ''}
          </Text>
          <Text style={[styles.percentageText, { color }]}>{percentage}%</Text>
        </View>
      )}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${percentage}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 4,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
