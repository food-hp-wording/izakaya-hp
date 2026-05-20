/**
 * PulseRing — ON時にボタンの周りで脈動するリングアニメーション
 *
 * 3つのリングが時間差で広がり、善意の波紋を表現する。
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors, Sizes } from '../theme';

interface Props {
  isActive: boolean;
  size: number;
  color?: string;
}

function SingleRing({
  delay,
  size,
  color,
}: {
  delay: number;
  size: number;
  color: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animate = () => {
      scaleAnim.setValue(1);
      opacityAnim.setValue(0.6);

      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const timeout = setTimeout(() => {
      animate();
      const interval = setInterval(animate, 2000);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timeout);
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

export function PulseRing({ isActive, size, color = Colors.primary }: Props) {
  if (!isActive) return null;

  return (
    <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
      <SingleRing delay={0} size={size} color={color} />
      <SingleRing delay={600} size={size} color={color} />
      <SingleRing delay={1200} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
});
