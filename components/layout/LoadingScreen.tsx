import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { FontWeight } from '@/constants/Typography';

const SCREEN_WIDTH = Dimensions.get('window').width;
const BAR_WIDTH = SCREEN_WIDTH * 0.6;
const INDICATOR_WIDTH = BAR_WIDTH * 0.4;

export function LoadingScreen() {
  const { colors } = useTheme();
  const translateX = useRef(new Animated.Value(-INDICATOR_WIDTH)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: BAR_WIDTH,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -INDICATOR_WIDTH,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppText variant="h2" style={[styles.title, { color: colors.primary }]}>
        Ressources
      </AppText>
      <AppText variant="h2" style={[styles.title, { color: colors.text, marginTop: 0 }]}>
        Relationnelles
      </AppText>

      <View style={[styles.track, { backgroundColor: colors.borderLight }]}>
        <Animated.View
          style={[
            styles.indicator,
            { backgroundColor: colors.primary, transform: [{ translateX }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: FontWeight.bold,
    textAlign: 'center',
    marginTop: 2,
  },
  track: {
    width: BAR_WIDTH,
    height: 4,
    borderRadius: 2,
    marginTop: 32,
    overflow: 'hidden',
  },
  indicator: {
    width: INDICATOR_WIDTH,
    height: '100%',
    borderRadius: 2,
  },
});
