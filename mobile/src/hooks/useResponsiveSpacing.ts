import { useWindowDimensions, PixelRatio } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const useResponsiveSpacing = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // Base dimensions based on standard screen (e.g. iPhone X / standard Android)
  const isTablet = width >= 768;
  const isSmallScreen = width < 360;

  // Responsive scale factor
  const scale = width / 375;

  // Function to get responsive size (scaled or bounded)
  const getResponsiveSize = (size: number, maxMultiplier = 1.5) => {
    const scaledSize = size * scale;
    if (isTablet) {
      return Math.min(scaledSize, size * maxMultiplier);
    }
    return Math.round(PixelRatio.roundToNearestPixel(scaledSize));
  };

  // Safe area bottom inset, guaranteeing a sensible default if zero
  const bottomInset = insets.bottom > 0 ? insets.bottom : 16;
  const topInset = insets.top > 0 ? insets.top : 24;

  // Tab bar height recommendation: 64 base height + safe area bottom inset
  // Adjusts dynamically for button navigations vs gesture inputs
  const tabBarHeight = 64 + insets.bottom;

  return {
    width,
    height,
    isTablet,
    isSmallScreen,
    scale,
    insets,
    bottomInset,
    topInset,
    tabBarHeight,
    getResponsiveSize,
    spacing: {
      xs: getResponsiveSize(4),
      sm: getResponsiveSize(8),
      md: getResponsiveSize(16),
      lg: getResponsiveSize(24),
      xl: getResponsiveSize(32),
      xxl: getResponsiveSize(48),
    },
  };
};
