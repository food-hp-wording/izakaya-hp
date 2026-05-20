/**
 * NearbyCounter — 近くのゆずりサポーター数を表示するカード
 *
 * - 数が0のとき: 「周囲に待機中...」
 * - 数が1以上: 「近くに N人のサポーターがいます」
 * - カウントが変化するとき: 数字がぽんと跳ねるアニメーション
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../store/appStore';
import { Colors, Sizes, Shadows } from '../theme';

export function NearbyCounter() {
  const { nearbyCount, bleStatus } = useAppStore();

  // カウント変化時のバウンスアニメーション
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const prevCountRef = useRef(nearbyCount);

  useEffect(() => {
    if (nearbyCount !== prevCountRef.current) {
      prevCountRef.current = nearbyCount;

      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 200,
          friction: 5,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
      ]).start();
    }
  }, [nearbyCount]);

  const getMessage = () => {
    if (bleStatus === 'error') {
      return { count: null, text: 'Bluetoothを\nオンにしてください' };
    }
    if (nearbyCount === 0) {
      return { count: null, text: '周囲をスキャン中...' };
    }
    if (nearbyCount === 1) {
      return { count: 1, text: '人のサポーターが\n近くにいます' };
    }
    return { count: nearbyCount, text: '人のサポーターが\n近くにいます' };
  };

  const { count, text } = getMessage();

  return (
    <View style={[styles.card, Shadows.card]}>
      {/* スキャン中インジケーター */}
      <View style={styles.indicator}>
        <View style={[styles.dot, nearbyCount > 0 && styles.dotActive]} />
        <Text style={styles.indicatorText}>
          {nearbyCount > 0 ? 'サポーター検出中' : 'スキャン中'}
        </Text>
      </View>

      <View style={styles.countRow}>
        {count !== null && (
          <Animated.Text
            style={[styles.countNumber, { transform: [{ scale: bounceAnim }] }]}
          >
            {count}
          </Animated.Text>
        )}

        <Text style={[styles.countText, count === null && styles.countTextCenter]}>
          {text}
        </Text>
      </View>

      {nearbyCount > 0 && (
        <Text style={styles.subText}>
          席を譲れる方が近くにいます
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Sizes.cardRadius,
    padding: Sizes.cardPadding,
    width: '100%',
    gap: 12,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  indicatorText: {
    fontSize: Sizes.fontXS,
    color: Colors.textTertiary,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -2,
    lineHeight: 64,
  },
  countText: {
    fontSize: Sizes.fontM,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 28,
    flex: 1,
  },
  countTextCenter: {
    fontSize: Sizes.fontS,
    color: Colors.textSecondary,
  },
  subText: {
    fontSize: Sizes.fontXS,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
