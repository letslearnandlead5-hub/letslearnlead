import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Radius, Spacing, Shadows, Gradients } from '../../theme';

interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  style,
  textStyle,
  fullWidth = true,
  disabled,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md, borderRadius: Radius.sm },
    md: { paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: Radius.md },
    lg: { paddingVertical: 18, paddingHorizontal: Spacing.xl, borderRadius: Radius.lg },
  };

  const textSizes: Record<string, TextStyle> = {
    sm: { fontSize: 13, fontWeight: '600' },
    md: { fontSize: 15, fontWeight: '700' },
    lg: { fontSize: 17, fontWeight: '700' },
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        disabled={isDisabled}
        style={[fullWidth && styles.fullWidth, style]}
        {...props}>
        <LinearGradient
          colors={isDisabled ? ['#D1D5DB', '#9CA3AF'] : (Gradients.primary as [string, string])}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, sizeStyles[size], Shadows.sm]}>
          {loading ? (
            <ActivityIndicator color={Colors.textOnPrimary} size="small" />
          ) : (
            <Text style={[styles.primaryText, textSizes[size], textStyle]}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyles: Record<string, ViewStyle> = {
    secondary: {
      backgroundColor: Colors.cardElevated,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: Colors.primary,
    },
    ghost: {
      backgroundColor: 'transparent',
    },
  };

  const variantTextColors: Record<string, string> = {
    secondary: Colors.text,
    outline: Colors.primary,
    ghost: Colors.textSecondary,
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      disabled={isDisabled}
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={variantTextColors[variant]} size="small" />
      ) : (
        <Text
          style={[
            styles.variantText,
            textSizes[size],
            { color: variantTextColors[variant] },
            textStyle,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  primaryText: {
    color: Colors.textOnPrimary,
    letterSpacing: 0.5,
  },
  variantText: {
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.5,
  },
});
