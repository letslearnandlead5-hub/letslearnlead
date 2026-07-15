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
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { validateLoginForm } from '../../utils/validators';
import { Colors, Typography, Spacing, Radius, Gradients, Shadows } from '../../theme';

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1C1D3A" translucent />
      <LinearGradient colors={Gradients.splash as [string, string, string]} style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            {/* Premium Header */}
            <View style={styles.header}>
              <View style={styles.logoBadge}>
                <Text style={styles.logoEmoji}>🎓</Text>
              </View>
              <Text style={styles.appName}>Let's Learn & Lead</Text>
              <Text style={styles.subtitle}>Unlock Your Potential. Anywhere, Anytime.</Text>
            </View>

            {/* Login Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign In</Text>
              
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

              <TouchableOpacity style={styles.forgotBtn} activeOpacity={0.7}>
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
                <Text style={styles.dividerText}>NEW TO OUR PLATFORM?</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Register link */}
              <View style={styles.registerRow}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    ...Shadows.primary,
  },
  logoEmoji: { fontSize: 44 },
  appName: {
    ...Typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    padding: Spacing.lg,
    ...Shadows.lg,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  cardTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
    fontWeight: '800',
  },
  errorBanner: {
    backgroundColor: Colors.errorSoft,
    borderRadius: Radius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.2)',
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    marginTop: -Spacing.xs,
  },
  forgotText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 52,
    ...Shadows.primary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.divider },
  dividerText: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: { color: Colors.textSecondary, fontSize: 14 },
  registerLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
