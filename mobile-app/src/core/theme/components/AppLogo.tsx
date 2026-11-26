import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';

interface AppLogoProps {
  appNameOrId: string;
  size?: number;
  iconBase64?: string | null;
  style?: any;
}

/**
 * 1. Official Instagram Logo (Brand Gradient with Camera Glyph)
 */
export const InstagramLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Defs>
      <LinearGradient id="igGrad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
        <Stop offset="0" stopColor="#FFDC80" />
        <Stop offset="0.25" stopColor="#F77737" />
        <Stop offset="0.5" stopColor="#F56040" />
        <Stop offset="0.75" stopColor="#FD1D1D" />
        <Stop offset="1" stopColor="#833AB4" />
      </LinearGradient>
    </Defs>
    {/* Gradient Background Rounded Rect */}
    <Rect x="1" y="1" width="22" height="22" rx="6.5" fill="url(#igGrad)" />
    {/* White Camera Outline */}
    <Rect x="4" y="4" width="16" height="16" rx="4.5" stroke="#FFFFFF" strokeWidth="1.8" />
    {/* Center Camera Lens */}
    <Circle cx="12" cy="12" r="3.6" stroke="#FFFFFF" strokeWidth="1.8" />
    {/* Top Right Flash Dot */}
    <Circle cx="16.5" cy="7.5" r="1.1" fill="#FFFFFF" />
  </Svg>
);

/**
 * 2. Official TikTok Logo (Glitch Offset Note)
 */
export const TikTokLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Dark rounded container */}
    <Rect width="24" height="24" rx="6" fill="#010101" />
    {/* Cyan Offset Layer */}
    <Path
      d="M17.2 7.1a5.6 5.6 0 0 1-3.6-2.1v9a4.8 4.8 0 1 1-4.8-4.8c.4 0 .9.1 1.3.2V6.6a7.4 7.4 0 0 0-1.3-.1 7.2 7.2 0 1 0 7.2 7.2V9.8a8.3 8.3 0 0 0 4.2 1.4v-2.7a5.7 5.7 0 0 1-3-.1z"
      fill="#25F4EE"
      transform="translate(-0.8, -0.6)"
    />
    {/* Red/Magenta Offset Layer */}
    <Path
      d="M17.2 7.1a5.6 5.6 0 0 1-3.6-2.1v9a4.8 4.8 0 1 1-4.8-4.8c.4 0 .9.1 1.3.2V6.6a7.4 7.4 0 0 0-1.3-.1 7.2 7.2 0 1 0 7.2 7.2V9.8a8.3 8.3 0 0 0 4.2 1.4v-2.7a5.7 5.7 0 0 1-3-.1z"
      fill="#FE2C55"
      transform="translate(0.8, 0.6)"
    />
    {/* White Main Note */}
    <Path
      d="M17.2 7.1a5.6 5.6 0 0 1-3.6-2.1v9a4.8 4.8 0 1 1-4.8-4.8c.4 0 .9.1 1.3.2V6.6a7.4 7.4 0 0 0-1.3-.1 7.2 7.2 0 1 0 7.2 7.2V9.8a8.3 8.3 0 0 0 4.2 1.4v-2.7a5.7 5.7 0 0 1-3-.1z"
      fill="#FFFFFF"
    />
  </Svg>
);

/**
 * 3. Official YouTube Logo (Red Curved Rectangle with White Play Arrow)
 */
export const YouTubeLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* YouTube Red Screen */}
    <Rect x="1" y="3.5" width="22" height="17" rx="5" fill="#FF0000" />
    {/* Centered White Play Triangle */}
    <Path d="M9.8 8.2v7.6l6.4-3.8-6.4-3.8z" fill="#FFFFFF" />
  </Svg>
);

/**
 * 4. Official X / Twitter Logo
 */
export const XTwitterLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="24" height="24" rx="6" fill="#000000" />
    <Path
      d="M16.9 4h2.5l-5.5 6.3 6.5 8.6h-5l-4-5.2-4.5 5.2H3.9l5.9-6.8L3.5 4h5.2l3.6 4.8L16.9 4zm-.9 13.4h1.4L7.5 5.4H6l10 12z"
      fill="#FFFFFF"
    />
  </Svg>
);

/**
 * 5. Official Reddit Logo (Orange Snoo Face)
 */
export const RedditLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Orange Circle */}
    <Circle cx="12" cy="12" r="11" fill="#FF4500" />
    {/* White Snoo Face */}
    <G fill="#FFFFFF">
      {/* Head oval */}
      <Circle cx="12" cy="12.5" r="5.5" />
      {/* Left ear */}
      <Circle cx="7" cy="11.5" r="2.2" />
      {/* Right ear */}
      <Circle cx="17" cy="11.5" r="2.2" />
      {/* Antenna bobble */}
      <Circle cx="16" cy="5.5" r="1.5" />
    </G>
    {/* Antenna stem */}
    <Path
      d="M12 7.5v-2c0-.5.4-.8.9-.7l2.8.5"
      stroke="#FFFFFF"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Orange Eyes */}
    <Circle cx="9.8" cy="12.5" r="1.2" fill="#FF4500" />
    <Circle cx="14.2" cy="12.5" r="1.2" fill="#FF4500" />
    {/* Smile */}
    <Path
      d="M10 14.5c.6.8 1.4 1 2 1s1.4-.2 2-1"
      stroke="#FF4500"
      strokeWidth="1.1"
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * 6. Official Snapchat Logo (Yellow Backplate with Ghost)
 */
export const SnapchatLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="24" height="24" rx="6" fill="#FFFC00" />
    {/* Ghost Silhouette */}
    <Path
      d="M12 4.2c-2.8 0-4.5 2-4.5 4.3 0 .7.2 1.8.5 2.5-.5.2-1.3.6-1.5 1.1-.3.6-.1 1.1.4 1.3.4.1.9.1 1.4-.1.3.8 1 1.4 2 1.7-.2.2-.6.5-1.1.7-.6.2-1.1.6-.9 1.1.1.4.6.6 1.4.5.9-.2 1.6-.6 2.3-1.1.7.5 1.4.9 2.3 1.1.8.1 1.3-.1 1.4-.5.2-.5-.3-.9-.9-1.1-.5-.2-.9-.5-1.1-.7 1-.3 1.7-.9 2-1.7.5.2 1 .2 1.4.1.5-.2.7-.7.4-1.3-.2-.5-1-.9-1.5-1.1.3-.7.5-1.8.5-2.5 0-2.3-1.7-4.3-4.5-4.3z"
      fill="#FFFFFF"
      stroke="#000000"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * 7. Official WhatsApp Logo (Green Circle with Phone Bubble)
 */
export const WhatsAppLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill="#25D366" />
    <Path
      d="M17.5 14.5c-.3-.2-1.7-.8-1.9-.9-.3-.1-.5-.1-.7.2-.2.3-.8.9-1 1.1-.2.2-.4.2-.7.1-.3-.2-1.3-.5-2.5-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.7.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.7-.9-2.3-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.2-1.2 2.9 0 1.7 1.2 3.3 1.4 3.5.2.3 2.5 3.8 6 5.3 1 .4 1.7.7 2.3.9.9.3 1.7.2 2.3.1.7-.1 2.2-.9 2.5-1.8.3-.8.3-1.6.2-1.8-.1-.1-.3-.2-.6-.4z"
      fill="#FFFFFF"
    />
  </Svg>
);

/**
 * 8. Official Facebook Logo (Blue Circle with 'f')
 */
export const FacebookLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill="#1877F2" />
    <Path
      d="M13.4 19v-6.3h2.1l.3-2.5h-2.4V8.6c0-.7.2-1.2 1.2-1.2h1.3V5.2c-.2 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v1.9H8.2v2.5h2.1V19h3.1z"
      fill="#FFFFFF"
    />
  </Svg>
);

/**
 * 9. Official Google Chrome Logo
 */
export const ChromeLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill="#FFFFFF" />
    {/* Red Top Segment */}
    <Path d="M12 1a11 11 0 0 0-9.8 6l5.3 9.2A5.5 5.5 0 0 1 6.5 12c0-2.4 1.5-4.4 3.6-5.1L12 1z" fill="#EA4335" />
    {/* Green Right Segment */}
    <Path d="M22.8 9.5A11 11 0 0 0 12 1l5.4 9.3a5.5 5.5 0 0 1 3.5 3.9l1.9-4.7z" fill="#34A853" />
    {/* Yellow Bottom Segment */}
    <Path d="M12 23a11 11 0 0 0 9.5-5.5l-5.3-2.9a5.5 5.5 0 0 1-7.1 1.2L2.2 7A11 11 0 0 0 12 23z" fill="#FBBC05" />
    {/* White Border */}
    <Circle cx="12" cy="12" r="5.5" fill="#FFFFFF" />
    {/* Blue Center */}
    <Circle cx="12" cy="12" r="4.2" fill="#4285F4" />
  </Svg>
);

/**
 * 10. Official Discord Logo (Blurple Clyde Face)
 */
export const DiscordLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="24" height="24" rx="6" fill="#5865F2" />
    <Path
      d="M17.4 6.5c-1-.5-2.1-.8-3.2-1 0 0-.1.2-.2.5 1.2.4 1.7.9 1.7.9-1-.5-2-.8-3-.9-1-.2-2-.2-3 0-1 .1-2 .4-3 .9 0 0 .5-.5 1.7-.9-.1-.3-.2-.5-.2-.5-1.1.2-2.2.5-3.2 1-2 3-2.5 6-2.2 8.9 1.3 1 2.6 1.6 3.9 1.6 0 0 .4-.5.8-.9-1.5-.4-2-.9-2-.9s.1.1.3.2c1.7.9 3.5 1.2 5.3 1.2s3.6-.3 5.3-1.2c.2-.1.3-.2.3-.2s-.5.5-2 .9c.4.4.8.9.8.9 1.3 0 2.6-.6 3.9-1.6.3-3-.3-6-2.3-8.9zM8.5 13.8c-.8 0-1.4-.7-1.4-1.5s.6-1.5 1.4-1.5 1.4.7 1.4 1.5-.6 1.5-1.4 1.5zm7 0c-.8 0-1.4-.7-1.4-1.5s.6-1.5 1.4-1.5 1.4.7 1.4 1.5-.6 1.5-1.4 1.5z"
      fill="#FFFFFF"
    />
  </Svg>
);

/**
 * 11. Official Pinterest Logo (Red Circle with 'P')
 */
export const PinterestLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="11" fill="#E60023" />
    <Path
      d="M12 4a8 8 0 0 0-2.8 15.5c-.1-.7-.2-1.8 0-2.6l1.2-5.1s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.9 0 1.3.7 1.3 1.5 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.8 1.5 1.8 1.8 0 3-2.3 3-5 0-2.1-1.4-3.7-4-3.7-2.9 0-4.8 2.2-4.8 4.7 0 .8.3 1.7.7 2.2.1.1.1.2 0 .4l-.3 1.1c-.1.2-.2.3-.4.2-1.4-.6-2.1-2.2-2.1-3.6 0-2.7 2.3-5.9 6.8-5.9 3.6 0 6 2.6 6 5.4 0 3.7-2.1 6.5-5.2 6.5-1 0-2-.5-2.3-1.2l-.6 2.5c-.2 1-.8 2.2-1.2 2.9A8 8 0 1 0 12 4z"
      fill="#FFFFFF"
    />
  </Svg>
);

/**
 * 12. Mobile Games Badge Logo (Gamepad on sleek gradient)
 */
export const MobileGamesLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="24" height="24" rx="6" fill="#1E2A3A" />
    <Path
      d="M6 15l1.5-6.5A3 3 0 0 1 10.4 6h3.2a3 3 0 0 1 2.9 2.5L18 15a2 2 0 0 1-2 2.5h-.7a2 2 0 0 1-1.5-.7l-1.3-1.6a.7.7 0 0 0-.5-.2h-0a.7.7 0 0 0-.5.2l-1.3 1.6a2 2 0 0 1-1.5.7H8a2 2 0 0 1-2-2.5z"
      fill="#B5C5FF"
    />
    <Circle cx="9" cy="11" r="1" fill="#10182D" />
    <Circle cx="15" cy="10" r="1" fill="#10182D" />
    <Circle cx="16" cy="12" r="1" fill="#10182D" />
  </Svg>
);

/**
 * 13. Shopping Apps Logo (Shopping Bag on warm gradient)
 */
export const ShoppingLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="24" height="24" rx="6" fill="#232732" />
    <Path
      d="M6 8h12l1 11H5L6 8z"
      fill="#A5D9C8"
    />
    <Path
      d="M9 10V6a3 3 0 0 1 6 0v4"
      stroke="#232732"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

/**
 * 14. News & Media Logo (Newspaper Badge)
 */
export const NewsLogo: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="24" height="24" rx="6" fill="#1E2633" />
    <Rect x="5" y="6" width="14" height="12" rx="2" fill="#F1F5FC" />
    <Rect x="7" y="8" width="5" height="4" rx="1" fill="#525866" />
    <Path d="M13.5 9h3M13.5 11h3M7 14h9.5M7 16h6" stroke="#525866" strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
);

/**
 * Smart Universal App Logo Component:
 * - If real installed icon base64 exists, renders the crisp native OS icon Image
 * - Otherwise renders the authentic official vector brand logo for the app
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  appNameOrId,
  size = 28,
  iconBase64,
  style,
}) => {
  // 1. If real native APK icon is present, render native image
  if (iconBase64 && iconBase64.length > 20) {
    const uri = iconBase64.startsWith('data:')
      ? iconBase64
      : `data:image/png;base64,${iconBase64}`;
    return (
      <View style={[{ width: size, height: size, borderRadius: size * 0.25, overflow: 'hidden' }, style]}>
        <Image
          source={{ uri }}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    );
  }

  // 2. Identify brand by name or package keyword
  const key = (appNameOrId || '').toLowerCase();

  let LogoComponent = InstagramLogo;

  if (key.includes('instagram')) {
    LogoComponent = InstagramLogo;
  } else if (key.includes('tiktok') || key.includes('musically')) {
    LogoComponent = TikTokLogo;
  } else if (key.includes('youtube')) {
    LogoComponent = YouTubeLogo;
  } else if (key.includes('twitter') || key === 'x' || key.includes(' x ') || key.startsWith('x ') || key.endsWith(' x')) {
    LogoComponent = XTwitterLogo;
  } else if (key.includes('reddit')) {
    LogoComponent = RedditLogo;
  } else if (key.includes('snapchat')) {
    LogoComponent = SnapchatLogo;
  } else if (key.includes('whatsapp')) {
    LogoComponent = WhatsAppLogo;
  } else if (key.includes('facebook') || key.includes('fb')) {
    LogoComponent = FacebookLogo;
  } else if (key.includes('chrome')) {
    LogoComponent = ChromeLogo;
  } else if (key.includes('discord')) {
    LogoComponent = DiscordLogo;
  } else if (key.includes('pinterest')) {
    LogoComponent = PinterestLogo;
  } else if (key.includes('game') || key.includes('roblox') || key.includes('pubg')) {
    LogoComponent = MobileGamesLogo;
  } else if (key.includes('shop') || key.includes('amazon') || key.includes('shein') || key.includes('flipkart')) {
    LogoComponent = ShoppingLogo;
  } else if (key.includes('news') || key.includes('media')) {
    LogoComponent = NewsLogo;
  } else {
    // Default crisp generic monochrome icon
    LogoComponent = MobileGamesLogo;
  }

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <LogoComponent size={size} />
    </View>
  );
};

export default AppLogo;
