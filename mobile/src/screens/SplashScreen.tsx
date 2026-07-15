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
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Gradients, Radius, Shadows, Spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { isAuthenticated } = useAuth();
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(20)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Elegant slide & fade animation sequence
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

    // Navigate to next screen
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigation.replace('App');
      } else {
        navigation.replace('Auth');
      }
    }, 2400);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

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
