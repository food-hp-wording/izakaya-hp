/**
 * index.tsx — SEATONのメイン（唯一）画面
 *
 * MVP: この1ファイルにすべてのUIが入る。
 * 画面構成:
 *   1. ヘッダー（アプリ名 + モードバッジ）
 *   2. ステータスメッセージ
 *   3. メインボタン（SupporterButton）
 *   4. 近くのカウント（NearbyCounter）
 *   5. フッター（説明テキスト）
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import { useAppStore } from '../src/store/appStore';
import { SupporterButton } from '../src/components/SupporterButton';
import { NearbyCounter } from '../src/components/NearbyCounter';
import { Colors, Sizes } from '../src/theme';
import { USE_MOCK_BLE } from '../src/constants/ble';
import { useActiveBLE } from '../src/hooks/useActiveBLE';

function AnimatedBackground({ children }: { children: React.ReactNode }) {
  const { isSupporter } = useAppStore();
  const bgAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(bgAnim, {
      toValue: isSupporter ? 1 : 0,
      useNativeDriver: false,
      tension: 30,
      friction: 10,
    }).start();
  }, [isSupporter]);

  const backgroundColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.background, Colors.backgroundOn],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor }]}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { isSupporter, nearbyCount } = useAppStore();

  // サポーターON中は画面スリープを防ぐ（電車で使う想定）
  useKeepAwake();

  // BLE初期化（USE_MOCK_BLE に応じてモックか本物を自動選択）
  useActiveBLE();

  const statusMessage = isSupporter
    ? '周りの方に伝わっています'
    : 'ボタンを押して\n善意を伝えましょう';

  return (
    <AnimatedBackground>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>

          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.appName}>SEATON</Text>
            {USE_MOCK_BLE && (
              <View style={styles.mockBadge}>
                <Text style={styles.mockBadgeText}>デモモード</Text>
              </View>
            )}
          </View>

          {/* ステータスメッセージ */}
          <Text style={[styles.statusText, isSupporter && styles.statusTextOn]}>
            {statusMessage}
          </Text>

          {/* メインボタン */}
          <View style={styles.buttonArea}>
            <SupporterButton />
          </View>

          {/* サポーターカウンター */}
          <View style={styles.counterArea}>
            <NearbyCounter />
          </View>

          {/* フッター */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSupporter
                ? `あなたのやさしさが\n${nearbyCount > 0 ? `${nearbyCount}人に` : '周りに'}届いています`
                : '個人情報は一切取得しません'}
            </Text>
          </View>

        </View>
      </SafeAreaView>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: Sizes.paddingH,
    paddingTop: 8,
    paddingBottom: 24,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: 3,
  },
  mockBadge: {
    backgroundColor: Colors.badge + '20',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.badge + '40',
  },
  mockBadgeText: {
    fontSize: 11,
    color: Colors.badge,
    fontWeight: '600',
  },
  statusText: {
    fontSize: Sizes.fontS,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16,
  },
  statusTextOn: {
    color: Colors.primaryDark,
    fontWeight: '500',
  },
  buttonArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 360,
    minHeight: 280,
  },
  counterArea: {
    width: '100%',
    marginTop: 8,
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: Sizes.fontXS,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
