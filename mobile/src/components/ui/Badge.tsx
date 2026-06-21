import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../../theme';

type BadgeVariant = 'level' | 'category' | 'medium' | 'free' | 'featured' | 'default';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

const variantConfig: Record<BadgeVariant, { bg: string; text: string }> = {
  level: { bg: '#1E2A45', text: Colors.accent },
  category: { bg: '#2A1E45', text: Colors.primaryLight },
  medium: { bg: '#1E3A2A', text: Colors.success },
  free: { bg: 'rgba(76,175,80,0.18)', text: Colors.success },
  featured: { bg: 'rgba(108,99,255,0.18)', text: Colors.primary },
  default: { bg: Colors.surface, text: Colors.textSecondary },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  style,
}) => {
  const config = variantConfig[variant];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, style]}>
      <Text style={[styles.text, { color: config.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
