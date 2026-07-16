import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StatusBar,
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

type Props = NativeStackScreenProps<any, 'Register'>;

export const RegisterScreen: React.FC<Props> = ({ route, navigation }) => {
  const { setAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Redirection parameters passed from the bottom sheet
  const redirectTo = route.params?.redirectTo;
  const onSuccess = route.params?.onSuccess;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordVal = watch('password');

  const onSubmit = async (formData: any) => {
    setServerError(null);
    setIsLoading(true);
    try {
      const deviceId = await getDeviceId();
      const deviceInfo = getDeviceInfo();
      const response = await authService.register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        deviceId,
        deviceInfo,
      } as any);

      if (response.success && response.token && response.user) {
        // Save auth to Zustand & SecureStore
        await setAuth(response.user, response.token, response.token);

        // Execute redirection
        if (redirectTo) {
          navigation.navigate(redirectTo.name, redirectTo.params);
        } else {
          navigation.replace('App');
        }

        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setServerError(err.userMessage || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
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

            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>
              <Text style={styles.appName}>Let's Learn & Lead</Text>
              <Text style={styles.subtitle}>Unlock Your Potential. Anywhere, Anytime.</Text>
            </View>

            {/* Register Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sign Up</Text>
              
              {/* Server Error */}
              {serverError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠️  {serverError}</Text>
                </View>
              )}

              <Controller
                control={control}
                rules={{
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                }}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Full Name"
                    placeholder="Your full name"
                    value={value}
                    onChangeText={onChange}
                    error={errors.name?.message}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                )}
              />

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
                    returnKeyType="next"
                  />
                )}
              />

              <Controller
                control={control}
                rules={{
                  required: 'Please confirm your password',
                  validate: (val) => val === passwordVal || 'Passwords do not match',
                }}
                name="confirmPassword"
                render={({ field: { onChange, value } }) => (
                  <AppInput
                    label="Confirm Password"
                    placeholder="Repeat password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.confirmPassword?.message}
                    showPasswordToggle
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />

              <AppButton
                title={isLoading ? 'Signing up...' : 'Sign Up'}
                onPress={handleSubmit(onSubmit)}
                loading={isLoading}
                disabled={isLoading}
                style={styles.registerBtn}
              />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ALREADY HAVE AN ACCOUNT?</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Login link */}
              <View style={styles.loginRow}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
                  <Text style={styles.loginLink}>Sign In</Text>
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
  backBtn: {
    position: 'absolute',
    left: 0,
    top: -20,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
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
  registerBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 52,
    marginTop: Spacing.md,
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
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: { color: Colors.textSecondary, fontSize: 14 },
  loginLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
