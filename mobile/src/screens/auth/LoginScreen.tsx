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
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useForm, Controller } from 'react-hook-form';
import { AuthStackParamList } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { authService } from '../../services/authService';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { getDeviceId, getDeviceInfo } from '../../utils/deviceId';
import { Colors, Typography, Spacing, Radius, Gradients, Shadows } from '../../theme';

// Update type definition to support navigation params
type Props = NativeStackScreenProps<any, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ route, navigation }) => {
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Redirection parameters passed from the bottom sheet
  const redirectTo = route.params?.redirectTo;
  const onSuccess = route.params?.onSuccess;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const performLogin = async (formData: any, forceLogout = false) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const deviceId = await getDeviceId();
      const deviceInfo = getDeviceInfo();
      const response = await authService.login({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        deviceId,
        deviceInfo,
        forceLogout,
      });

      if (response.success && response.token && response.user) {
        // Save auth to Zustand & SecureStore
        await setAuth(response.user, response.token, response.token); // using token as mock refresh token for simplicity if not separated

        // Execute redirection
        if (redirectTo) {
          if (redirectTo.name.endsWith('Tab')) {
            // If redirecting to a tab, use navigate
            navigation.navigate(redirectTo.name, redirectTo.params);
          } else {
            navigation.navigate(redirectTo.name, redirectTo.params);
          }
        } else {
          navigation.replace('App');
        }

        if (onSuccess) {
          onSuccess();
        }
      }
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
              onPress: () => performLogin(formData, true),
            },
          ]
        );
      } else {
        setServerError(err.userMessage || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: any) => {
    performLogin(data);
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

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.replace('App')}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
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
              {serverError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠️  {serverError}</Text>
                </View>
              )}

              <Controller
                control={control}
                rules={{
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Please enter a valid email address',
                  },
                }}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Email Address"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                  />
                )}
              />

              <Controller
                control={control}
                rules={{
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters',
                  },
                }}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Password"
                    placeholder="Min. 6 characters"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                    showPasswordToggle
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />

              {/* Remember Me and Forgot Password Row */}
              <View style={styles.metaRow}>
                <View style={styles.rememberMeContainer}>
                  <Switch
                    value={rememberMe}
                    onValueChange={setRememberMe}
                    trackColor={{ false: Colors.border, true: Colors.primarySoft }}
                    thumbColor={rememberMe ? Colors.primary : '#f4f3f4'}
                    ios_backgroundColor="#3e3e3e"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <Text style={styles.rememberText}>Remember Me</Text>
                </View>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')} activeOpacity={0.7}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              <AppButton
                title={isLoading ? 'Signing in...' : 'Sign In'}
                onPress={handleSubmit(onSubmit)}
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
    position: 'relative',
    width: '100%',
  },
  closeBtn: {
    position: 'absolute',
    right: 0,
    top: -20,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rememberText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  forgotBtn: {
    alignSelf: 'center',
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
