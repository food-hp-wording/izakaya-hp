/**
 * DeviceBadge — ゆずりサポーター1人分のバッジ表示（将来用）
 *
 * 現在のMVPでは数だけ表示するが、将来個別バッジを並べる場合に使う。
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme';

interface Props {
  rssi?: number;
}

export function DeviceBadge({ rssi }: Props) {
  const getSignalStrength = (r?: number) => {
    if (!r) return '●●●';
    if (r > -60) return '●●●';
    if (r > -70) return '●●○';
    return '●○○';
  };

  return (
    <View style={styles.badge}>
      <Text style={styles.icon}>🤝</Text>
      <Text style={styles.signal}>{getSignalStrength(rssi)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryUltraLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primaryLight,
  },
  icon: {
    fontSize: 20,
  },
  signal: {
    fontSize: 8,
    color: Colors.primary,
    letterSpacing: -1,
  },
});
