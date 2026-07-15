import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Clipboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PaymentsStackParamList } from '../../types';
import { paymentService, CoursePaymentInfo } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors } from '../../theme';

type Props = NativeStackScreenProps<PaymentsStackParamList, 'PaymentSubmit'>;

export const PaymentSubmitScreen: React.FC<Props> = ({ route, navigation }) => {
  const { courseId, courseTitle } = route.params;
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [courseInfo, setCourseInfo] = useState<CoursePaymentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [studentName, setStudentName] = useState(user?.name || '');
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [studentPhone, setStudentPhone] = useState(user?.phone || '');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'info' | 'form'>('info');

  useEffect(() => { loadCourseInfo(); }, []);

  const loadCourseInfo = async () => {
    try {
      const res = await paymentService.getCoursePaymentInfo(courseId);
      setCourseInfo(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to load payment info.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyUPI = () => {
    if (courseInfo?.upiId) {
      Clipboard.setString(courseInfo.upiId);
      Alert.alert('Copied!', 'UPI ID copied to clipboard.');
    }
  };

  const validateForm = (): boolean => {
    if (!studentName.trim()) { Alert.alert('Required', 'Please enter your full name.'); return false; }
    if (!studentEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(studentEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.'); return false;
    }
    const phone = studentPhone.replace(/\s/g, '');
    if (!/^[6-9]\d{9}$/.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number.'); return false;
    }
    if (!transactionId.trim() || transactionId.trim().length < 6) {
      Alert.alert('Required', 'Please enter a valid Transaction ID (min 6 characters).'); return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await paymentService.submitPayment({
        courseId,
        studentName: studentName.trim(),
        studentEmail: studentEmail.trim().toLowerCase(),
        studentPhone: studentPhone.trim(),
        transactionId: transactionId.trim(),
        notes: notes.trim() || undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Submission Failed', err.userMessage || 'Could not submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSpinner fullScreen message="Loading payment info…" />;

  // Success state
  if (submitted) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.successScroll}>
          <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.successCircle}>
            <Text style={styles.successTick}>✓</Text>
          </LinearGradient>
          <Text style={styles.successTitle}>Payment Submitted!</Text>
          <Text style={styles.successSub}>
            Thank you! Your payment for{'\n'}
            <Text style={{ fontWeight: '800' }}>{courseTitle}</Text>
            {'\n'}has been submitted for verification.
          </Text>
          <View style={styles.successInfoBox}>
            <Text style={styles.successInfoRow}>📧 Confirmation sent to your email</Text>
            <Text style={styles.successInfoRow}>⏰ Verification: 24–48 hours</Text>
            <Text style={styles.successInfoRow}>🔔 We'll notify you when approved</Text>
          </View>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.navigate('PaymentsList')}>
            <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.doneBtnGrad}>
              <Text style={styles.doneBtnText}>View My Payments</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeLink} onPress={() => navigation.navigate('PaymentsList')}>
            <Text style={styles.homeLinkText}>Go Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const price = courseInfo?.price || 0;
  const upiId = courseInfo?.upiId;
  const currencySymbol = courseInfo?.currency === 'INR' ? '₹' : (courseInfo?.currency || '₹');

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" translucent />

      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💳 Pay & Enroll</Text>
        <Text style={styles.headerSub} numberOfLines={1}>{courseTitle}</Text>
        {price > 0 && (
          <View style={styles.priceChip}>
            <Text style={styles.priceChipText}>{currencySymbol}{price.toLocaleString('en-IN')}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Step toggle */}
      <View style={styles.stepRow}>
        <TouchableOpacity
          style={[styles.stepBtn, step === 'info' && styles.stepBtnActive]}
          onPress={() => setStep('info')}>
          <Text style={[styles.stepBtnText, step === 'info' && styles.stepBtnTextActive]}>
            1. Pay via UPI/QR
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.stepBtn, step === 'form' && styles.stepBtnActive]}
          onPress={() => setStep('form')}>
          <Text style={[styles.stepBtnText, step === 'form' && styles.stepBtnTextActive]}>
            2. Submit Details
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        {/* ── Step 1: Payment Info ────────────────────────────────────────── */}
        {step === 'info' && (
          <View style={styles.stepContent}>
            {/* QR Code */}
            {courseInfo?.qrImage ? (
              <View style={styles.qrBox}>
                <Text style={styles.qrLabel}>Scan QR to Pay</Text>
                <Image
                  source={{ uri: courseInfo.qrImage }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={styles.noQrBox}>
                <Text style={styles.noQrText}>📷 QR code will be displayed here</Text>
              </View>
            )}

            {/* UPI ID */}
            {upiId && (
              <View style={styles.upiBox}>
                <Text style={styles.upiLabel}>Or Pay via UPI ID</Text>
                <View style={styles.upiRow}>
                  <Text style={styles.upiId}>{upiId}</Text>
                  <TouchableOpacity style={styles.copyBtn} onPress={handleCopyUPI}>
                    <Text style={styles.copyBtnText}>📋 Copy</Text>
                  </TouchableOpacity>
                </View>
                {courseInfo?.merchantName && (
                  <Text style={styles.merchantName}>Merchant: {courseInfo.merchantName}</Text>
                )}
              </View>
            )}

            {/* Instructions */}
            {courseInfo?.paymentInstructions && (
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>📋 Payment Instructions</Text>
                <Text style={styles.instructionsText}>{courseInfo.paymentInstructions}</Text>
              </View>
            )}

            {/* Amount reminder */}
            {price > 0 && (
              <View style={styles.amountReminder}>
                <Text style={styles.amountReminderText}>
                  💰 Pay exactly{' '}
                  <Text style={{ fontWeight: '800', color: '#4F46E5' }}>
                    {currencySymbol}{price.toLocaleString('en-IN')}
                  </Text>
                  {' '}to avoid delays
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => setStep('form')}
              activeOpacity={0.9}>
              <LinearGradient colors={['#4F46E5', '#6366F1']} style={styles.nextBtnGrad}>
                <Text style={styles.nextBtnText}>I've Paid → Enter Details</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Step 2: Submit form ─────────────────────────────────────────── */}
        {step === 'form' && (
          <View style={styles.stepContent}>
            <View style={styles.formCard}>
              <Text style={styles.formCardTitle}>📝 Payment Details</Text>

              {[
                { label: 'Full Name *', val: studentName, set: setStudentName, placeholder: 'Your full name', keyboardType: 'default' as any },
                { label: 'Email *', val: studentEmail, set: setStudentEmail, placeholder: 'your@email.com', keyboardType: 'email-address' as any },
                { label: 'Phone Number *', val: studentPhone, set: setStudentPhone, placeholder: '10-digit Indian number', keyboardType: 'phone-pad' as any },
                { label: 'Transaction / UTR ID *', val: transactionId, set: setTransactionId, placeholder: 'e.g. TXN123456', keyboardType: 'default' as any },
              ].map(field => (
                <View key={field.label} style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <TextInput
                    style={styles.input}
                    value={field.val}
                    onChangeText={field.set}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    keyboardType={field.keyboardType}
                    autoCapitalize={field.keyboardType === 'email-address' ? 'none' : 'words'}
                  />
                </View>
              ))}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any additional notes…"
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  maxLength={300}
                />
              </View>

              {/* Warning */}
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  ⚠️ Make sure the Transaction / UTR ID is correct. Wrong ID may delay verification.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtnWrap}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.9}>
              <LinearGradient colors={['#22C55E', '#16A34A']} style={styles.submitBtnGrad}>
                <Text style={styles.submitBtnText}>
                  {submitting ? '⏳ Submitting…' : '✅ Submit Payment'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  // ── Header ───────────────────────────────────────────────────────────────────
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  backText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  priceChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20,
  },
  priceChipText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  // ── Step Toggle ───────────────────────────────────────────────────────────────
  stepRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  stepBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10,
  },
  stepBtnActive: { backgroundColor: '#4F46E5' },
  stepBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  stepBtnTextActive: { color: '#fff' },
  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: { paddingTop: 16 },
  stepContent: { paddingHorizontal: 16 },
  // ── QR / UPI ─────────────────────────────────────────────────────────────────
  qrBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    alignItems: 'center', marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  qrLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: 14 },
  qrImage: { width: 220, height: 220 },
  noQrBox: {
    backgroundColor: '#F3F4F6', borderRadius: 16, padding: 40,
    alignItems: 'center', marginBottom: 14,
  },
  noQrText: { fontSize: 14, color: Colors.textMuted },
  upiBox: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  upiLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.4 },
  upiRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6 },
  upiId: { fontSize: 16, fontWeight: '800', color: Colors.text, flex: 1 },
  copyBtn: { backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  copyBtnText: { fontSize: 13, fontWeight: '600', color: '#4F46E5' },
  merchantName: { fontSize: 12, color: Colors.textSecondary },
  instructionsBox: {
    backgroundColor: '#EEF2FF', borderRadius: 14, padding: 14, marginBottom: 14,
    borderWidth: 1, borderColor: '#C7D2FE',
  },
  instructionsTitle: { fontSize: 13, fontWeight: '700', color: '#4F46E5', marginBottom: 8 },
  instructionsText: { fontSize: 13, color: '#3730A3', lineHeight: 20 },
  amountReminder: {
    backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginBottom: 20,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  amountReminderText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
  nextBtn: { borderRadius: 14, overflow: 'hidden', marginBottom: 20 },
  nextBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // ── Form ─────────────────────────────────────────────────────────────────────
  formCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  formCardTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  fieldGroup: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  input: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    padding: 12, fontSize: 14, color: Colors.text, backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  warningBox: {
    backgroundColor: '#FFFBEB', borderRadius: 10, padding: 12, marginTop: 8,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  warningText: { fontSize: 12, color: '#92400E', lineHeight: 18 },
  submitBtnWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  submitBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // ── Success ───────────────────────────────────────────────────────────────────
  successScroll: { alignItems: 'center', padding: 32 },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#22C55E', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  successTick: { fontSize: 48, color: '#fff', fontWeight: '700' },
  successTitle: { fontSize: 26, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  successSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  successInfoBox: {
    backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#BBF7D0',
    width: '100%', gap: 10, marginBottom: 28,
  },
  successInfoRow: { fontSize: 14, color: '#15803D', lineHeight: 20 },
  doneBtn: { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  doneBtnGrad: { paddingVertical: 15, alignItems: 'center' },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  homeLink: { padding: 10 },
  homeLinkText: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
});
