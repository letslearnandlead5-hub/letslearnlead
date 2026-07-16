import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useAuthModalStore } from '../../store/useAuthModalStore';
import { navigationRef } from '../../navigation/navigationRef';
import { Colors, Typography, Spacing, Radius, Shadows } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const AuthRequiredBottomSheet = () => {
  const { isVisible, redirectTo, onSuccess, closeModal } = useAuthModalStore();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible, fadeAnim, slideAnim]);

  if (!isVisible) return null;

  const handleLogin = () => {
    closeModal();
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('Auth', {
        screen: 'Login',
        params: { redirectTo, onSuccess },
      });
    }
  };

  const handleRegister = () => {
    closeModal();
    if (navigationRef.isReady()) {
      (navigationRef as any).navigate('Auth', {
        screen: 'Register',
        params: { redirectTo, onSuccess },
      });
    }
  };

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={closeModal}>
      <View style={styles.container}>
        <TouchableWithoutFeedback onPress={closeModal}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}>
          <View style={styles.dragPill} />
          
          <Text style={styles.title}>🔒 Login Required</Text>
          <Text style={styles.message}>
            Please login to continue your learning journey on Let's Learn Lead.
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
              <Text style={styles.loginText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} activeOpacity={0.85}>
              <Text style={styles.registerText}>Create an Account</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={closeModal} activeOpacity={0.7}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: 14,
    paddingBottom: Spacing.xl + 12,
    alignItems: 'center',
    ...Shadows.lg,
  },
  dragPill: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  title: {
    ...Typography.h3,
    color: Colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    ...Shadows.primary,
  },
  loginText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  registerButton: {
    backgroundColor: Colors.surface,
    paddingVertical: 14,
    borderRadius: Radius.full,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  registerText: {
    ...Typography.button,
    color: Colors.text,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: {
    ...Typography.bodyMedium,
    color: Colors.textMuted,
    fontWeight: '600',
  },
});
