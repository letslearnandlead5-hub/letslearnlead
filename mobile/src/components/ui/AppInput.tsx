import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  containerStyle,
  rightIcon,
  showPasswordToggle,
  secureTextEntry,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePassword = () => setIsPasswordVisible((prev) => !prev);

  const isSecure = showPasswordToggle ? !isPasswordVisible : secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}>
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.textMuted}
          selectionColor={Colors.primary}
          secureTextEntry={isSecure}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity onPress={togglePassword} style={styles.iconRight}>
            <Text style={styles.toggleText}>{isPasswordVisible ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && !showPasswordToggle && (
          <View style={styles.iconRight}>{rightIcon}</View>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...Typography.label,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.card,
  },
  inputError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 15,
    fontWeight: '400',
  },
  iconRight: {
    paddingLeft: Spacing.sm,
  },
  toggleText: {
    fontSize: 18,
  },
  error: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
});
