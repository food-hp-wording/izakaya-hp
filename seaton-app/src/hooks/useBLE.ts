/**
 * useBLE — 本物のBLE実装
 *
 * 必要: 開発ビルド（expo run:ios or EAS Build）
 * 必要: 実機iPhoneでテスト（シミュレーター不可）
 *
 * 動作:
 * 1. 起動時: BLE権限を要求、スキャン開始
 * 2. isSupporter=true: アドバタイズ開始（自分の存在を周囲に発信）
 * 3. 周囲デバイスを検出: RSSI閾値でフィルタ、タイムアウト管理
 * 4. nearbyCount を更新
 */

import { useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import { BleManager, State, ScanMode } from 'react-native-ble-plx';
import { useAppStore } from '../store/appStore';
import {
  SEATON_SERVICE_UUID,
  RSSI_THRESHOLD,
  DEVICE_TIMEOUT_MS,
} from '../constants/ble';

// BLEAdvertiser は開発ビルドでのみ利用可能
let BLEAdvertiser: {
  broadcast: (uuid: string, uuids: string[], options: Record<string, unknown>) => void;
  stopBroadcast: () => void;
  ADVERTISE_MODE_LOW_LATENCY: number;
  ADVERTISE_TX_POWER_HIGH: number;
} | null = null;

try {
  BLEAdvertiser = require('react-native-ble-advertiser').default;
} catch {
  console.warn('[BLE] react-native-ble-advertiser が見つかりません。アドバタイズは無効です。');
}

// 発見したデバイス: deviceId → 最終発見時刻
type DeviceMap = Map<string, number>;

export function useBLE() {
  const { isSupporter, setNearbyCount, setBleStatus, setBleError } = useAppStore();

  const managerRef = useRef<BleManager | null>(null);
  const devicesRef = useRef<DeviceMap>(new Map());
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAdvertisingRef = useRef(false);

  // デバイスマップからカウントを更新
  const updateCount = useCallback(() => {
    setNearbyCount(devicesRef.current.size);
  }, [setNearbyCount]);

  // 古いデバイス（タイムアウト）を削除
  const cleanupStaleDevices = useCallback(() => {
    const now = Date.now();
    let changed = false;

    devicesRef.current.forEach((lastSeen, deviceId) => {
      if (now - lastSeen > DEVICE_TIMEOUT_MS) {
        devicesRef.current.delete(deviceId);
        changed = true;
      }
    });

    if (changed) updateCount();
  }, [updateCount]);

  // アドバタイズ開始（自分を周囲に発信）
  const startAdvertising = useCallback(() => {
    if (!BLEAdvertiser || isAdvertisingRef.current) return;
    if (Platform.OS !== 'ios') return;

    try {
      BLEAdvertiser.broadcast(SEATON_SERVICE_UUID, [], {
        advertiseMode: BLEAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
        txPowerLevel: BLEAdvertiser.ADVERTISE_TX_POWER_HIGH,
        connectable: false,       // 接続不要
        includeDeviceName: false, // プライバシー保護: デバイス名を含めない
      });
      isAdvertisingRef.current = true;
      console.log('[BLE] アドバタイズ開始');
    } catch (e) {
      console.error('[BLE] アドバタイズ失敗:', e);
    }
  }, []);

  // アドバタイズ停止
  const stopAdvertising = useCallback(() => {
    if (!BLEAdvertiser || !isAdvertisingRef.current) return;

    try {
      BLEAdvertiser.stopBroadcast();
      isAdvertisingRef.current = false;
      console.log('[BLE] アドバタイズ停止');
    } catch (e) {
      console.error('[BLE] アドバタイズ停止失敗:', e);
    }
  }, []);

  // BLEマネージャー初期化とスキャン開始
  useEffect(() => {
    const manager = new BleManager();
    managerRef.current = manager;

    const subscription = manager.onStateChange((state) => {
      if (state === State.PoweredOn) {
        // BLE有効 → スキャン開始
        setBleStatus('scanning');

        manager.startDeviceScan(
          [SEATON_SERVICE_UUID],
          { scanMode: ScanMode.LowLatency },
          (error, device) => {
            if (error) {
              console.error('[BLE] スキャンエラー:', error);
              setBleError(error.message);
              setBleStatus('error');
              return;
            }

            if (!device) return;

            // RSSI閾値チェック（弱すぎる信号は除外）
            const rssi = device.rssi ?? -999;
            if (rssi < RSSI_THRESHOLD) return;

            // デバイスを記録・更新
            devicesRef.current.set(device.id, Date.now());
            updateCount();
          }
        );
      } else if (state === State.PoweredOff) {
        setBleStatus('unavailable');
        setBleError('Bluetoothがオフになっています');
      }
    }, true);

    // 30秒ごとに古いデバイスを削除
    cleanupTimerRef.current = setInterval(cleanupStaleDevices, 30_000);

    return () => {
      subscription.remove();
      manager.stopDeviceScan();
      manager.destroy();
      stopAdvertising();
      if (cleanupTimerRef.current) clearInterval(cleanupTimerRef.current);
    };
  }, []);

  // isSupporter が変化したらアドバタイズを制御
  useEffect(() => {
    if (isSupporter) {
      startAdvertising();
    } else {
      stopAdvertising();
    }
  }, [isSupporter, startAdvertising, stopAdvertising]);

  return {
    isMock: false,
  };
}
