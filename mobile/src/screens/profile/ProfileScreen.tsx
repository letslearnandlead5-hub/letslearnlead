import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../context/AuthContext';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Gradients, Shadows } from '../../theme';
import { useResponsiveSpacing } from '../../hooks/useResponsiveSpacing';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { authService } from '../../services/authService';
import { ProfileStackParamList } from '../../types';

type ProfileNavProp = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export const ProfileScreen = () => {
  const navigation = useNavigation<ProfileNavProp>();
  const { user, logout, updateProfile } = useAuth();
  const { insets, topInset, tabBarHeight } = useResponsiveSpacing();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editGrade, setEditGrade] = useState(user?.grade || '');
  const [editInstitution, setEditInstitution] = useState(user?.institution || '');
  const [saving, setSaving] = useState(false);

  const [pwModal, setPwModal] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim() || editName.trim().length < 2) {
      Alert.alert('Error', 'Name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: editName.trim(),
        phone: editPhone.trim(),
        grade: editGrade.trim(),
        institution: editInstitution.trim(),
      });
      setEditMode(false);
      Alert.alert('✅ Profile Updated', 'Your profile has been saved successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPw.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.');
      return;
    }
    setPwLoading(true);
    try {
      await authService.changePassword(currentPw, newPw);
      setPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      Alert.alert('✅ Password Changed', 'Your password has been updated.');
    } catch (err: any) {
      Alert.alert('Error', err.userMessage || 'Failed to change password.');
    } finally {
      setPwLoading(false);
    }
  };

  if (!user) return <LoadingSpinner fullScreen />;

  const initials = user.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <ScreenContainer edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topInset + 16, paddingBottom: tabBarHeight + 16 },
        ]}>

        {/* Premium Profile Header Card */}
        <LinearGradient
          colors={Gradients.primary as [string, string]}
          style={styles.profileHeader}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user.role?.toUpperCase()}</Text>
          </View>
        </LinearGradient>

        {/* Clean Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.enrolledCourses?.length || 0}</Text>
            <Text style={styles.statLabel}>Enrolled</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.grade || '—'}</Text>
            <Text style={styles.statLabel}>Grade</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{user.medium || 'English'}</Text>
            <Text style={styles.statLabel}>Medium</Text>
          </View>
        </View>

        {/* Learning Hub & Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Hub</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('CertificatesList')} activeOpacity={0.7}>
              <View style={[styles.actionIconBg, { backgroundColor: Colors.primarySoft }]}>
                <Text style={styles.actionEmoji}>🎓</Text>
              </View>
              <View style={styles.actionMeta}>
                <Text style={styles.actionText}>My Certificates</Text>
                <Text style={styles.actionSub}>View & share course achievements</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('PaymentsList')} activeOpacity={0.7}>
              <View style={[styles.actionIconBg, { backgroundColor: Colors.warningSoft }]}>
                <Text style={styles.actionEmoji}>💳</Text>
              </View>
              <View style={styles.actionMeta}>
                <Text style={styles.actionText}>My Payments & Receipts</Text>
                <Text style={styles.actionSub}>Payment status & history</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.actionDivider} />

            <TouchableOpacity style={styles.actionRow} onPress={() => navigation.navigate('NotesList')} activeOpacity={0.7}>
              <View style={[styles.actionIconBg, { backgroundColor: Colors.successSoft }]}>
                <Text style={styles.actionEmoji}>📂</Text>
              </View>
              <View style={styles.actionMeta}>
                <Text style={styles.actionText}>Study Notes Library</Text>
                <Text style={styles.actionSub}>Download course PDFs & guides</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info Form */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            <TouchableOpacity
              onPress={() => {
                if (editMode) {
                  setEditName(user.name || '');
                  setEditPhone(user.phone || '');
                  setEditGrade(user.grade || '');
                  setEditInstitution(user.institution || '');
                }
                setEditMode(!editMode);
              }}
              activeOpacity={0.7}>
              <Text style={styles.editBtn}>{editMode ? 'Cancel' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editMode ? (
            <View style={styles.editForm}>
              <AppInput label="Full Name" value={editName} onChangeText={setEditName} placeholder="Your full name" autoCapitalize="words" />
              <AppInput label="Phone Number" value={editPhone} onChangeText={setEditPhone} placeholder="Phone number" keyboardType="phone-pad" />
              <AppInput label="Grade / Class" value={editGrade} onChangeText={setEditGrade} placeholder="e.g. 10th" />
              <AppInput label="Institution" value={editInstitution} onChangeText={setEditInstitution} placeholder="Your school/college" />
              <AppButton
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleSaveProfile}
                loading={saving}
                disabled={saving}
                style={{ backgroundColor: Colors.primary }}
              />
            </View>
          ) : (
            <View style={styles.infoCard}>
              <InfoRow label="Name" value={user.name} />
              <InfoRow label="Email" value={user.email} />
              <InfoRow label="Phone" value={user.phone || 'Not set'} />
              <InfoRow label="Grade" value={user.grade || 'Not set'} />
              <InfoRow label="Institution" value={user.institution || 'Not set'} />
              <InfoRow label="State" value={user.state || 'Not set'} last />
            </View>
          )}
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionRow} onPress={() => setPwModal(true)} activeOpacity={0.7}>
              <View style={[styles.actionIconBg, { backgroundColor: Colors.divider }]}>
                <Text style={styles.actionEmoji}>🔒</Text>
              </View>
              <View style={styles.actionMeta}>
                <Text style={styles.actionText}>Change Password</Text>
                <Text style={styles.actionSub}>Update your password safely</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.actionDivider} />
            
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout} activeOpacity={0.7}>
              <View style={[styles.actionIconBg, { backgroundColor: Colors.errorSoft }]}>
                <Text style={styles.actionEmoji}>🚪</Text>
              </View>
              <View style={styles.actionMeta}>
                <Text style={[styles.actionText, { color: Colors.error }]}>Logout</Text>
                <Text style={styles.actionSub}>Sign out from this device</Text>
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal visible={pwModal} transparent animationType="slide" onRequestClose={() => setPwModal(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>🔒 Change Password</Text>
              <AppInput label="Current Password" value={currentPw} onChangeText={setCurrentPw} showPasswordToggle placeholder="Current password" />
              <AppInput label="New Password" value={newPw} onChangeText={setNewPw} showPasswordToggle placeholder="Min. 6 characters" />
              <AppInput label="Confirm New Password" value={confirmPw} onChangeText={setConfirmPw} showPasswordToggle placeholder="Re-enter new password" />
              <AppButton title={pwLoading ? 'Updating...' : 'Update Password'} onPress={handleChangePassword} loading={pwLoading} disabled={pwLoading} style={{ backgroundColor: Colors.primary }} />
              <AppButton title="Cancel" variant="ghost" onPress={() => { setPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }} style={{ marginTop: 4 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const InfoRow = ({ label, value, last }: { label: string; value?: string; last?: boolean }) => (
  <View style={[infoStyles.row, !last && infoStyles.border]}>
    <Text style={infoStyles.label}>{label}</Text>
    <Text style={infoStyles.value}>{value || '—'}</Text>
  </View>
);

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  border: { borderBottomWidth: 1, borderColor: Colors.divider },
  label: { ...Typography.bodySmall, color: Colors.textSecondary, flex: 1 },
  value: { ...Typography.bodySmall, color: Colors.text, flex: 2, textAlign: 'right', fontWeight: '500' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.md },
  profileHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarText: {
    ...Typography.h2,
    color: Colors.textOnPrimary,
  },
  userName: {
    ...Typography.h4,
    color: Colors.textOnPrimary,
    marginBottom: 2,
    fontWeight: '700',
  },
  userEmail: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  roleText: {
    ...Typography.caption,
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { ...Typography.h5, color: Colors.primary, fontWeight: '700' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.divider, height: '80%', alignSelf: 'center' },
  section: { marginBottom: Spacing.lg },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h5, color: Colors.text, marginBottom: Spacing.xs, fontWeight: '700' },
  editBtn: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  editForm: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 20 },
  actionMeta: { flex: 1 },
  actionText: { ...Typography.bodySmall, fontWeight: '700', color: Colors.text },
  actionSub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  actionArrow: { fontSize: 20, color: Colors.textMuted, fontWeight: '300' },
  actionDivider: { height: 1, backgroundColor: Colors.divider },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  modalTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.sm, fontWeight: '800' },
});
