import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAuthStore } from '../store/useAuthStore';
import { Colors, Typography, Gradients, Radius, Shadows, Spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const MIN_SPLASH_MS = 2000; // always show splash for at least 2 seconds

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Track whether minimum display time has elapsed
  const minTimeElapsed = useRef(false);
  // Track whether auth has finished loading
  const authReady = useRef(false);
  // Guard against calling navigate twice
  const navigated = useRef(false);

  const tryNavigate = () => {
    if (minTimeElapsed.current && authReady.current && !navigated.current) {
      navigated.current = true;
      navigation.replace('App');
    }
  };

  useEffect(() => {
    // Start the brand animation
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(contentTranslateY, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Minimum splash display timer
    const timer = setTimeout(() => {
      minTimeElapsed.current = true;
      tryNavigate();
    }, MIN_SPLASH_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  // Watch for auth loading to complete
  useEffect(() => {
    if (!isLoading) {
      authReady.current = true;
      tryNavigate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient
        colors={Gradients.splash as [string, string, string]}
        style={styles.gradient}>
        
        {/* Animated Brand Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🎓</Text>
          </View>
        </Animated.View>

        {/* Animated App Name & Tagline */}
        <Animated.View 
          style={[
            styles.contentContainer,
            { 
              opacity: contentOpacity, 
              transform: [{ translateY: contentTranslateY }] 
            }
          ]}>
          <Text style={styles.appName}>Let's Learn & Lead</Text>
          <Text style={styles.tagline}>Your Path to Excellence</Text>
        </Animated.View>

        {/* Muted Page indicator/footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Version 2.0 • Premium Learning Platform</Text>
        </View>

      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoBadge: {
    width: 110,
    height: 110,
    borderRadius: Radius.xxl,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },
  logoEmoji: {
    fontSize: 56,
  },
  contentContainer: {
    alignItems: 'center',
  },
  appName: {
    ...Typography.h1,
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 32,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  tagline: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: Spacing.sm,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
