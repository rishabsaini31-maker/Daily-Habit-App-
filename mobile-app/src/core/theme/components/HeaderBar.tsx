import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, typography, spacing } from '../tokens';

interface HeaderBarProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  showBorder?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  subtitle,
  leftAction,
  rightAction,
  showBorder = false,
}) => {
  return (
    <View style={[styles.container, showBorder && styles.bottomBorder]}>
      <View style={styles.leftContainer}>{leftAction}</View>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitleText} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.rightContainer}>{rightAction}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    backgroundColor: colors.obsidian,
  },
  bottomBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairlineBorder,
  },
  leftContainer: {
    minWidth: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    minWidth: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  titleText: {
    ...typography.titleMedium,
    color: colors.primaryText,
  },
  subtitleText: {
    ...typography.bodySmall,
    color: colors.secondaryMutedText,
  },
});

export default HeaderBar;
