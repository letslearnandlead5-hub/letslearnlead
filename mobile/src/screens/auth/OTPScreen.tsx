import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import { AppButton } from '../../components/ui/AppButton';
import { Colors, Typography, Spacing, Radius, Gradients, Shadows } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'OTP'>;

export const OTPScreen: React.FC<Props> = ({ route, navigation }) => {
  const { email, purpose } = route.params || { email: 'your email', purpose: 'register' };
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputs = useRef<Array<TextInput | null>>([]);

  const handleChangeText = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next field
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Move to previous field on backspace
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the complete 6-digit code.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      // Simulate verification api call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Verification Success',
        'Your code has been verified successfully.',
        [
          {
            text: 'Continue',
            onPress: () => {
              if (purpose === 'forgot_password') {
                // Navigate to password reset screen if supported, or back to login
                navigation.navigate('Login' as any);
              } else {
                (navigation as any).replace('App');
              }
            },
          },
        ]
      );
    } catch (err: any) {
      setError('Invalid code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = () => {
    Alert.alert('Code Sent', `A new verification code has been sent to ${email}.`);
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
              <Text style={styles.subtitle}>Verification Code Required</Text>
            </View>

            {/* Form Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Verify OTP</Text>
              <Text style={styles.description}>
                Please enter the 6-digit verification code sent to {email}.
              </Text>
              
              {/* Error Banner */}
              {error && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>⚠️  {error}</Text>
                </View>
              )}

              {/* OTP Boxes */}
              <View style={styles.otpContainer}>
                {otp.map((val, idx) => (
                  <TextInput
                    key={idx}
                    ref={(ref) => { inputs.current[idx] = ref; }}
                    style={styles.otpInput}
                    value={val}
                    onChangeText={(text) => handleChangeText(text, idx)}
                    onKeyPress={(e) => handleKeyPress(e, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>

              <AppButton
                title={isLoading ? 'Verifying...' : 'Verify Code'}
                onPress={handleVerify}
                loading={isLoading}
                disabled={isLoading}
                style={styles.actionBtn}
              />

              <View style={styles.resendRow}>
                <Text style={styles.resendText}>Didn't receive code? </Text>
                <TouchableOpacity onPress={handleResend} activeOpacity={0.7}>
                  <Text style={styles.resendLink}>Resend Code</Text>
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
    position: 'relative',
    width: '100%',
  },
  backBtn: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  appName: {
    ...Typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.75)',
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 4,
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
    marginBottom: Spacing.xs,
    fontWeight: '800',
  },
  description: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 18,
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.md,
  },
  otpInput: {
    width: 44,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    backgroundColor: '#F9FAFB',
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    height: 52,
    marginTop: Spacing.md,
    ...Shadows.primary,
  },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  resendText: { color: Colors.textSecondary, fontSize: 14 },
  resendLink: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
});
