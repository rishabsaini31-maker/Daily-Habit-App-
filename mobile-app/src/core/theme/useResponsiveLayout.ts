import { useWindowDimensions, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './tokens';

export interface ResponsiveLayout {
  topInset: number;
  bottomInset: number;
  leftInset: number;
  rightInset: number;
  width: number;
  height: number;
  isPhone: boolean;
  isTablet: boolean;
  isMacOrDesktop: boolean;
  isWide: boolean;
  contentMaxWidth: number | '100%';
  tabBarHeight: number;
  responsiveContainerStyle: {
    width: '100%';
    maxWidth: number | undefined;
    alignSelf: 'center';
  };
}

export function useResponsiveLayout(): ResponsiveLayout {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const isWide = width >= 768;
  const isTablet = width >= 768 && width < 1024;
  const isMacOrDesktop = width >= 1024 || Platform.OS === 'macos' || Platform.OS === 'web';
  const isPhone = width < 768;

  // Dynamic top safe-area inset (handles iPhone Dynamic Island ~59px, Notch ~47px, Android punch holes & status bar, Mac/Web padding)
  let topInset = insets.top;
  if (isMacOrDesktop) {
    topInset = Math.max(insets.top, 20);
  } else if (Platform.OS === 'android') {
    const androidStatusBar = StatusBar.currentHeight || 24;
    topInset = Math.max(insets.top, androidStatusBar);
  } else if (Platform.OS === 'ios') {
    // If safe area context hasn't populated yet, fallback to sensible notch default
    topInset = insets.top > 0 ? insets.top : 44;
  }

  // Dynamic bottom safe-area inset (handles iPhone Home Indicator ~34px, Android gesture navigation ~16-24px, Desktop ~16px)
  let bottomInset = insets.bottom;
  if (isMacOrDesktop) {
    bottomInset = Math.max(insets.bottom, 16);
  } else if (Platform.OS === 'ios') {
    bottomInset = insets.bottom > 0 ? insets.bottom : 20;
  } else if (Platform.OS === 'android') {
    bottomInset = Math.max(insets.bottom, 12);
  }

  // Max width constraint so iPad & Mac displays don't stretch cards and rings unnaturally
  const contentMaxWidth = isWide ? Math.min(Math.round(width * 0.88), 680) : '100%';
  const tabBarHeight = 58 + bottomInset;

  return {
    topInset,
    bottomInset,
    leftInset: insets.left,
    rightInset: insets.right,
    width,
    height,
    isPhone,
    isTablet,
    isMacOrDesktop,
    isWide,
    contentMaxWidth,
    tabBarHeight,
    responsiveContainerStyle: {
      width: '100%',
      maxWidth: isWide ? 680 : undefined,
      alignSelf: 'center',
    },
  };
}

export default useResponsiveLayout;
