import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Gradients } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo in
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace('App');
      } else {
        navigation.replace('Auth');
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  return (
    <LinearGradient
      colors={Gradients.splash as [string, string, string]}
      style={styles.container}>
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: logoOpacity, transform: [{ scale: logoScale }] },
        ]}>
        {/* Logo Icon */}
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>🎓</Text>
        </View>

        <Text style={styles.appName}>Let's{'\n'}L-earn & Lead</Text>
        <Text style={styles.tagline}>Your Journey to Excellence</Text>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: subtitleOpacity }]}>
        <View style={styles.dot} />
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
      </Animated.View>
    </LinearGradient>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  logoEmoji: {
    fontSize: 52,
  },
  appName: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 40,
    letterSpacing: -1,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontSize: 12,
  },
  footer: {
    position: 'absolute',
    bottom: height * 0.08,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textMuted,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
});
