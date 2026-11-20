import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, layout } from '../tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'glass' | 'accent' | 'danger';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  style,
  variant = 'elevated',
}) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'glass' && styles.glass,
        variant === 'accent' && styles.accentBorder,
        variant === 'danger' && styles.dangerBorder,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.card, // 24px per spec
    padding: layout.cardPadding, // 20px per spec
    borderWidth: layout.hairlineBorderWidth, // 1px hairline border per spec
    borderColor: colors.hairlineBorder, // #1E2230
  },
  elevated: {
    backgroundColor: colors.elevatedCardSurface, // #12141D
  },
  glass: {
    backgroundColor: colors.glassSurface,
  },
  accentBorder: {
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.primaryAccent,
  },
  dangerBorder: {
    backgroundColor: colors.elevatedCardSurface,
    borderColor: colors.dangerAccent,
  },
});

export default GlassCard;
