import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import {
  Check,
  ChevronLeft,
  ArrowRight,
  Gamepad2,
  ShoppingBag,
  Newspaper,
  Compass,
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../core/theme/tokens';
import GlassCard from '../../core/theme/components/GlassCard';
import PrimaryPillButton from '../../core/theme/components/PrimaryPillButton';
import { useOnboarding } from './OnboardingContext';
import { useNativeBlocker } from '../../services/native_blocker/NativeBlockerContext';

interface DistractionOption {
  id: string;
  name: string;
  category: string;
  packageKeywords: string[];
  fallbackIcon: React.ReactNode;
}

const DISTRACTION_OPTIONS: DistractionOption[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    category: 'Social',
    packageKeywords: ['instagram'],
    fallbackIcon: <Compass size={20} color="#FFFFFF" />,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    category: 'Social',
    packageKeywords: ['tiktok', 'musically'],
    fallbackIcon: <Compass size={20} color="#FFFFFF" />,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    category: 'Video',
    packageKeywords: ['youtube'],
    fallbackIcon: <Compass size={20} color="#FFFFFF" />,
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    category: 'Social',
    packageKeywords: ['twitter'],
    fallbackIcon: <Compass size={20} color="#FFFFFF" />,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    category: 'Forum',
    packageKeywords: ['reddit'],
    fallbackIcon: <Compass size={20} color="#FFFFFF" />,
  },
  {
    id: 'games',
    name: 'Mobile games',
    category: 'Gaming',
    packageKeywords: ['game', 'pubg', 'roblox'],
    fallbackIcon: <Gamepad2 size={20} color={colors.monochromeLight} />,
  },
  {
    id: 'shopping',
    name: 'Shopping',
    category: 'Shopping',
    packageKeywords: ['amazon', 'shein', 'flipkart', 'shopping'],
    fallbackIcon: <ShoppingBag size={20} color={colors.monochromeLight} />,
  },
  {
    id: 'news',
    name: 'News',
    category: 'News',
    packageKeywords: ['news', 'nytimes', 'bbc'],
    fallbackIcon: <Newspaper size={20} color={colors.monochromeLight} />,
  },
];

export const Step2DistractionQuiz: React.FC = () => {
  const { selectedApps, toggleAppSelection, nextStep, prevStep } = useOnboarding();
  const { apps: nativeApps } = useNativeBlocker();

  // Find real installed app icon if available
  const getAppIcon = (item: DistractionOption) => {
    if (nativeApps && nativeApps.length > 0) {
      const match = nativeApps.find((app) =>
        item.packageKeywords.some((kw) =>
          app.id.toLowerCase().includes(kw) ||
          app.name.toLowerCase().includes(kw)
        )
      );
      if (match?.iconBase64) {
        return (
          <Image
            source={{ uri: `data:image/png;base64,${match.iconBase64}` }}
            style={styles.realAppIcon}
            resizeMode="contain"
          />
        );
      }
    }
    return item.fallbackIcon;
  };

  return (
    <View style={styles.container}>
      {/* Figma Screen 02 Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={prevStep} style={styles.backButton} accessibilityLabel="Back">
            <ChevronLeft size={20} color={colors.secondaryMutedText} />
          </TouchableOpacity>
          <Text style={styles.stepIndicator}>Focus setup</Text>
          <Text style={styles.stepCount}>1 of 3</Text>
        </View>
        {/* 3-segment progress indicator */}
        <View style={styles.progressBar}>
          <View style={[styles.progressSegment, styles.progressSegmentActive]} />
          <View style={styles.progressSegment} />
          <View style={styles.progressSegment} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Choose apps to limit</Text>
        <Text style={styles.subtitle}>
          Select one or more. You can change these later.
        </Text>

        {/* 2-Column Grid matching Figma 171x97 px cards */}
        <View style={styles.grid}>
          {DISTRACTION_OPTIONS.map((item) => {
            const isSelected = selectedApps.includes(item.id);
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => toggleAppSelection(item.id)}
                style={styles.cardWrapper}
              >
                <GlassCard
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.iconBackplate}>
                      {getAppIcon(item)}
                    </View>
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleActive,
                      ]}
                    >
                      {isSelected && <Check size={13} color="#10182D" strokeWidth={3} />}
                    </View>
                  </View>
                  <Text style={styles.appName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <Text style={styles.selectionNote}>
          {selectedApps.length} apps selected · Change these anytime
        </Text>
        <PrimaryPillButton
          title="Continue"
          onPress={nextStep}
          disabled={selectedApps.length === 0}
          rightIcon={<ArrowRight size={18} color="#10182D" />}
        />
        <Text style={styles.footnote}>
          Only the apps you choose will be limited.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: colors.elevatedCardSurface,
  },
  stepIndicator: {
    ...typography.bodyMedium,
    color: colors.primaryText,
    flex: 1,
    marginLeft: 12,
    fontWeight: '600',
  },
  stepCount: {
    ...typography.caption,
    color: colors.secondaryMutedText,
    fontSize: 12,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    backgroundColor: colors.hairlineBorder,
    borderRadius: 2,
  },
  progressSegmentActive: {
    backgroundColor: colors.primaryAccent,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondaryMutedText,
    lineHeight: 20,
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  cardWrapper: {
    width: '50%',
    padding: 6,
  },
  card: {
    height: 100,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    backgroundColor: '#121D2B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardSelected: {
    borderColor: 'rgba(181, 197, 255, 0.6)',
    backgroundColor: '#1C2D47',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBackplate: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#161920',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  realAppIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.primaryAccent,
    borderColor: colors.primaryAccent,
  },
  appName: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.obsidian,
    borderTopWidth: 1,
    borderTopColor: colors.hairlineBorder,
  },
  selectionNote: {
    fontSize: 12,
    color: colors.secondaryMutedText,
    textAlign: 'center',
    marginBottom: 10,
  },
  footnote: {
    fontSize: 11,
    color: colors.tertiaryText,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default Step2DistractionQuiz;
