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
import { useAuth } from '../../context/AuthContext';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, Radius, Gradients, Shadows } from '../../theme';
import { authService } from '../../services/authService';

export const ProfileScreen = () => {
  const { user, logout, updateProfile, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}>

        {/* Header Card */}
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

        {/* Stats Row */}
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
            <Text style={styles.statValue}>{user.medium || user.stream || '—'}</Text>
            <Text style={styles.statLabel}>Stream</Text>
          </View>
        </View>

        {/* Profile Form */}
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
              }}>
              <Text style={styles.editBtn}>{editMode ? 'Cancel' : '✏️ Edit'}</Text>
            </TouchableOpacity>
          </View>

          {editMode ? (
            <>
              <AppInput label="Full Name" value={editName} onChangeText={setEditName} placeholder="Your full name" autoCapitalize="words" />
              <AppInput label="Phone Number" value={editPhone} onChangeText={setEditPhone} placeholder="Phone number" keyboardType="phone-pad" />
              <AppInput label="Grade / Class" value={editGrade} onChangeText={setEditGrade} placeholder="e.g. 10th" />
              <AppInput label="Institution" value={editInstitution} onChangeText={setEditInstitution} placeholder="Your school/college" />
              <AppButton
                title={saving ? 'Saving...' : 'Save Changes'}
                onPress={handleSaveProfile}
                loading={saving}
                disabled={saving}
              />
            </>
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

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionRow} onPress={() => setPwModal(true)}>
              <Text style={styles.actionEmoji}>🔒</Text>
              <Text style={styles.actionText}>Change Password</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
            <View style={styles.actionDivider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleLogout}>
              <Text style={styles.actionEmoji}>🚪</Text>
              <Text style={[styles.actionText, { color: Colors.error }]}>Logout</Text>
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
              <AppButton title={pwLoading ? 'Updating...' : 'Update Password'} onPress={handleChangePassword} loading={pwLoading} disabled={pwLoading} />
              <AppButton title="Cancel" variant="ghost" onPress={() => { setPwModal(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); }} style={{ marginTop: 4 }} />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

// ─── Info Row ─────────────────────────────────────────────────────────────────
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
    paddingVertical: 12,
  },
  border: { borderBottomWidth: 1, borderColor: Colors.divider },
  label: { ...Typography.bodySmall, color: Colors.textMuted, flex: 1 },
  value: { ...Typography.bodySmall, color: Colors.text, flex: 2, textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: Spacing.md },
  profileHeader: {
    alignItems: 'center',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
  },
  avatarText: { color: Colors.textOnPrimary, fontSize: 32, fontWeight: '700' },
  userName: { ...Typography.h4, color: Colors.text },
  userEmail: { ...Typography.body, color: Colors.textSecondary },
  roleBadge: {
    marginTop: Spacing.xs,
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(108,99,255,0.2)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  roleText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { ...Typography.h4, color: Colors.primary },
  statLabel: { ...Typography.caption, color: Colors.textMuted },
  statDivider: { width: 1, height: 36, backgroundColor: Colors.border },
  section: { marginBottom: Spacing.lg },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.h4, color: Colors.text },
  editBtn: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  actionEmoji: { fontSize: 18 },
  actionText: { ...Typography.body, color: Colors.text, flex: 1 },
  actionArrow: { color: Colors.textMuted, fontSize: 18 },
  actionDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: { ...Typography.h4, color: Colors.text, marginBottom: Spacing.lg, textAlign: 'center' },
});
