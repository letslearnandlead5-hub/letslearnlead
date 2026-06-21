import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppButton } from './AppButton';
import { Colors, Typography, Spacing, Radius } from '../../theme';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryLabel = 'Retry',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <AppButton
          title={retryLabel}
          variant="outline"
          size="sm"
          fullWidth={false}
          onPress={onRetry}
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h5,
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
});
