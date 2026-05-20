/**
 * useBLE — 本物のBLE実装（開発ビルド専用）
 *
 * ⚠️ このファイルは Expo Go では動きません。
 * 使うには:
 *   1. npm install react-native-ble-plx react-native-ble-advertiser
 *   2. npx expo prebuild
 *   3. npx expo run:ios  (Mac + Xcode が必要)
 *
 * 現在は USE_MOCK_BLE = true なのでこの hook は呼ばれません。
 * 開発ビルドに移行するときにこのファイルを本物の実装に差し替えてください。
 */

import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

export function useBLE() {
  const { setBleStatus, setBleError } = useAppStore();

  useEffect(() => {
    setBleStatus('unavailable');
    setBleError('BLEは開発ビルドでのみ使えます。USE_MOCK_BLE = true にしてください。');
    console.warn('[BLE] Expo Goではネイティブモジュールが使えません。SETUP.mdを参照してください。');
  }, []);

  return { isMock: false };
}
