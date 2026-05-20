/**
 * SupporterButton — メインのON/OFFボタン
 *
 * - 押すと isSupporter が切り替わる
 * - ON時: ミントグリーン + パルスリング + 影
 * - OFF時: ライトグレー
 * - 押した瞬間にHapticsで触覚フィードバック
 */

import React, { useCallback, useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store/appStore';
import { PulseRing } from './PulseRing';
import { Colors, Sizes, Shadows } from '../theme';

const BUTTON_SIZE = Sizes.buttonDiameter;
const PULSE_SIZE = BUTTON_SIZE + 60;

export function SupporterButton() {
  const { isSupporter, toggleSupporter } = useAppStore();

  // 背景色のアニメーション（OFF→ON で色が変わる）
  const colorAnim = useRef(new Animated.Value(isSupporter ? 1 : 0)).current;
  // ボタンの押し込みアニメーション
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(colorAnim, {
      toValue: isSupporter ? 1 : 0,
      useNativeDriver: false, // 色変化はnativeDriver不可
      tension: 50,
      friction: 7,
    }).start();
  }, [isSupporter]);

  const backgroundColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.off, Colors.primary],
  });

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.94,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  }, []);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 5,
    }).start();
  }, []);

  const handlePress = useCallback(async () => {
    // 触覚フィードバック
    await Haptics.impactAsync(
      isSupporter
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy
    );
    toggleSupporter();
  }, [isSupporter, toggleSupporter]);

  const shadow = isSupporter ? Shadows.buttonOn : Shadows.buttonOff;

  return (
    <View style={styles.wrapper}>
      {/* パルスリング（ON時のみ） */}
      <PulseRing isActive={isSupporter} size={PULSE_SIZE} />

      {/* メインボタン */}
      <Animated.View
        style={[
          styles.buttonOuter,
          shadow,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
          accessibilityRole="button"
          accessibilityLabel={isSupporter ? 'ゆずりサポーターON中。タップでOFFにする' : 'ゆずりサポーターOFF。タップでONにする'}
          accessibilityState={{ selected: isSupporter }}
        >
          <Animated.View style={[styles.button, { backgroundColor }]}>
            {/* アイコンエリア */}
            <Text style={[styles.icon, isSupporter ? styles.iconOn : styles.iconOff]}>
              {isSupporter ? '🤝' : '🤝'}
            </Text>

            {/* ラベル */}
            <Text style={[styles.labelTop, isSupporter && styles.labelTopOn]}>
              ゆずり
            </Text>
            <Text style={[styles.labelBottom, isSupporter && styles.labelBottomOn]}>
              サポーター
            </Text>

            {/* 状態テキスト */}
            <View style={[styles.badge, isSupporter && styles.badgeOn]}>
              <Text style={[styles.badgeText, isSupporter && styles.badgeTextOn]}>
                {isSupporter ? 'ON' : 'OFF'}
              </Text>
            </View>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: PULSE_SIZE,
    height: PULSE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonOuter: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.white,
  },
  pressable: {
    flex: 1,
    borderRadius: BUTTON_SIZE / 2,
    overflow: 'hidden',
  },
  button: {
    flex: 1,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  iconOn: {
    opacity: 1,
  },
  iconOff: {
    opacity: 0.5,
  },
  labelTop: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  labelTopOn: {
    color: Colors.white,
  },
  labelBottom: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  labelBottomOn: {
    color: Colors.white,
  },
  badge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: Colors.separator,
  },
  badgeOn: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 2,
  },
  badgeTextOn: {
    color: Colors.white,
  },
});
