import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress }) => {
  if (selected) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <LinearGradient
          colors={['#0D7EFF', '#4DA3FF']}
          style={styles.chipSelected}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}>
          <Text style={styles.chipTextSelected}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.chip}
      onPress={onPress}
      activeOpacity={0.7}>
      <Text style={styles.chipText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipSelected: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    ...Shadows.sm,
  },
  chipText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
  chipTextSelected: {
    ...Typography.body,
    color: Colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
});
