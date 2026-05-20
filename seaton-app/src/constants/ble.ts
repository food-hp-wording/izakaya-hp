// SEATONアプリを識別するBLE Service UUID
// このUUIDをアドバタイズ/スキャンすることで、SEATONユーザー同士を検出する
export const SEATON_SERVICE_UUID = '00001234-0000-1000-8000-00805F9B34FB';

// RSSI閾値: この値より大きいRSSIの端末だけカウント
// -75dBm ≒ 約5-8m。電車の座席幅に最適
export const RSSI_THRESHOLD = -75;

// デバイスのタイムアウト: 最後に見えてからこの時間が経過したら削除
export const DEVICE_TIMEOUT_MS = 120_000; // 2分

// スキャン間隔
export const SCAN_INTERVAL_MS = 10_000; // 10秒ごとに再スキャン

// モックモード: Expo Goで動作確認する場合はtrue
// 開発ビルドでBLEを使う場合はfalse
export const USE_MOCK_BLE = true; // Expo Goでテストする間はtrue
