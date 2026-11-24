import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, borderRadius, layout } from '../tokens';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'subtle' | 'glass' | 'accent' | 'danger';
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
        variant === 'subtle' && styles.subtle,
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
    borderRadius: borderRadius.card, // 20px per Figma
    padding: layout.cardPadding, // 18px per Figma
    borderWidth: layout.hairlineBorderWidth, // 1px hairline border
    borderColor: colors.hairlineBorder, // #29364B
  },
  elevated: {
    backgroundColor: colors.elevatedCardSurface, // #121D2B
  },
  subtle: {
    backgroundColor: colors.elevatedCardSubtle, // #152131
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
