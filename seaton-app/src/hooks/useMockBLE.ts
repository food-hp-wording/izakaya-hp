/**
 * useMockBLE — Expo Go用のモックBLE
 *
 * 本物のBLEは開発ビルドが必要。
 * このhookはUIのテスト用に、ランダムにサポーター数が変化するシミュレーションを行う。
 * src/constants/ble.ts の USE_MOCK_BLE = true のときに使われる。
 */

import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';

export function useMockBLE() {
  const { isSupporter, setNearbyCount, setBleStatus } = useAppStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentCountRef = useRef(0);

  useEffect(() => {
    setBleStatus('scanning');

    // 起動直後に1-2人を検出するシミュレーション
    const initialTimeout = setTimeout(() => {
      const initial = Math.floor(Math.random() * 2) + 1;
      currentCountRef.current = initial;
      setNearbyCount(initial);
    }, 1500);

    // 15-30秒ごとにランダムに変化
    intervalRef.current = setInterval(() => {
      const change = Math.random();

      if (change < 0.3 && currentCountRef.current > 0) {
        // 30%の確率で1人減る
        currentCountRef.current -= 1;
      } else if (change < 0.6 && currentCountRef.current < 5) {
        // 30%の確率で1人増える
        currentCountRef.current += 1;
      }
      // 40%は変化なし

      setNearbyCount(currentCountRef.current);
    }, 20_000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // isSupporter が変化しても、モックでは自分自身はカウントしない
  // （本物のBLEでも自分のデバイスはスキャン結果に含まれない）
  useEffect(() => {
    if (!isSupporter) {
      // OFFにした場合、既存カウントはそのまま（他の人は関係ない）
    }
  }, [isSupporter]);

  return {
    isMock: true,
  };
}
