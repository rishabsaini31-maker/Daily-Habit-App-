import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import { colors } from '../tokens';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  contentStyle,
}) => {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.obsidian}
        translucent={Platform.OS === 'android'}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.obsidian, // #08090D per spec
  },
  content: {
    flex: 1,
    backgroundColor: colors.obsidian,
  },
});

export default ScreenContainer;
