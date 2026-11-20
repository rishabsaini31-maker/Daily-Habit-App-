import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  View,
} from 'react-native';
import { colors, borderRadius, layout, typography } from '../tokens';

interface PrimaryPillButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const PrimaryPillButton: React.FC<PrimaryPillButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isDanger = variant === 'danger';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.buttonBase,
        isPrimary && styles.primaryBg,
        isSecondary && styles.secondaryBg,
        isDanger && styles.dangerBg,
        isOutline && styles.outlineBg,
        isGhost && styles.ghostBg,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isPrimary ? colors.primaryButtonText : colors.primaryText}
        />
      ) : (
        <View style={styles.contentRow}>
          {leftIcon && <View style={styles.leftIconWrapper}>{leftIcon}</View>}
          <Text
            style={[
              styles.textBase,
              isPrimary && styles.primaryText,
              isSecondary && styles.secondaryText,
              isDanger && styles.dangerText,
              isOutline && styles.outlineText,
              isGhost && styles.ghostText,
              textStyle,
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View style={styles.rightIconWrapper}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    height: layout.ctaButtonHeight, // 54px pill per spec
    borderRadius: borderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  textBase: {
    ...typography.ctaButtonText,
  },
  primaryBg: {
    backgroundColor: colors.primaryButtonBg, // Pure White #FFFFFF
  },
  primaryText: {
    color: colors.primaryButtonText, // Bold #090A0F per spec
    fontWeight: '700',
  },
  secondaryBg: {
    backgroundColor: colors.secondaryButtonBg,
  },
  secondaryText: {
    color: colors.primaryText,
  },
  dangerBg: {
    backgroundColor: colors.dangerAccent,
  },
  dangerText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  outlineBg: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.hairlineBorder,
  },
  outlineText: {
    color: colors.primaryText,
  },
  ghostBg: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    color: colors.secondaryMutedText,
  },
  disabled: {
    opacity: 0.45,
  },
});

export default PrimaryPillButton;
