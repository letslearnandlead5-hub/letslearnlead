import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { validateLoginForm } from '../../utils/validators';
import { Colors, Typography, Spacing, Gradients } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const handleLogin = async () => {
    clearError();
    const errors = validateLoginForm(email, password);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      await login({ email: email.trim().toLowerCase(), password });
    } catch (err: any) {
      if (err?.code === 'ACCOUNT_ACTIVE_ELSEWHERE') {
        Alert.alert(
          'Account Active Elsewhere',
          'This account is already active on another device. Do you want to log out from the other device and log in here?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Logout & Sign In',
              style: 'destructive',
              onPress: async () => {
                try {
                  await login({ email: email.trim().toLowerCase(), password, forceLogout: true });
                } catch (forceErr) {
                  // Handled by context
                }
              }
            }
          ]
        );
      }
    }
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

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>🎓</Text>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to continue your learning journey</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Server Error */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>⚠️  {error}</Text>
              </View>
            )}

            <AppInput
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(t) => { setEmail(t); clearError(); }}
              error={formErrors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <AppInput
              label="Password"
              placeholder="Min. 6 characters"
              value={password}
              onChangeText={(t) => { setPassword(t); clearError(); }}
              error={formErrors.password}
              showPasswordToggle
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            <AppButton
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              style={styles.loginBtn}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logo: { fontSize: 52, marginBottom: 4 },
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
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.sm,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  loginBtn: { marginTop: Spacing.sm },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: 12, fontWeight: '500' },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: { color: Colors.textSecondary, fontSize: 14 },
  registerLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
