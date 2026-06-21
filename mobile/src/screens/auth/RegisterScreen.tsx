import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { validateRegisterForm } from '../../utils/validators';
import { Colors, Typography, Spacing, Gradients } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleRegister = async () => {
    clearError();
    const errors = validateRegisterForm(name, email, password, confirmPassword);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });
    } catch {
      // Error handled by AuthContext
    }
  };

  const onChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    clearError();
  };

  return (
    <LinearGradient colors={Gradients.splash as [string, string, string]} style={styles.gradient}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>✨</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of learners today</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️  {error}</Text>
              </View>
            )}

            <AppInput
              label="Full Name"
              placeholder="Your full name"
              value={name}
              onChangeText={onChange(setName)}
              error={formErrors.name}
              returnKeyType="next"
              autoCapitalize="words"
            />

            <AppInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={onChange(setEmail)}
              error={formErrors.email}
              keyboardType="email-address"
              returnKeyType="next"
            />

            <AppInput
              label="Password"
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={onChange(setPassword)}
              error={formErrors.password}
              showPasswordToggle
              returnKeyType="next"
            />

            <AppInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={onChange(setConfirmPassword)}
              error={formErrors.confirmPassword}
              showPasswordToggle
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <AppButton
              title={isLoading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              loading={isLoading}
              disabled={isLoading}
              style={styles.registerBtn}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Sign In</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.terms}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  backBtn: { marginBottom: Spacing.md },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '500' },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logo: { fontSize: 48, marginBottom: 4 },
  title: { ...Typography.h2, color: Colors.text },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  errorBanner: {
    backgroundColor: 'rgba(244,67,54,0.12)',
    borderRadius: 10,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(244,67,54,0.3)',
  },
  errorBannerText: { color: Colors.error, fontSize: 13, lineHeight: 18 },
  registerBtn: { marginTop: Spacing.sm },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  loginText: { color: Colors.textSecondary, fontSize: 14 },
  loginLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  terms: {
    color: Colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 16,
  },
  termsLink: { color: Colors.primary },
});
