/**
 * useActiveBLE — BLE実装の選択
 *
 * USE_MOCK_BLE フラグに応じてモックか本物かを選ぶ。
 * モジュールロード時に決定されるため、Reactのフックルール（条件分岐禁止）に違反しない。
 *
 * 使い方:
 *   import { useActiveBLE } from '../hooks/useActiveBLE';
 *   useActiveBLE(); // ← これだけでOK
 */

import { USE_MOCK_BLE } from '../constants/ble';
import { useMockBLE } from './useMockBLE';
import { useBLE } from './useBLE';

// ビルド時定数で選択。レンダー間で変わらないのでReukのルール上問題なし
export const useActiveBLE = USE_MOCK_BLE ? useMockBLE : useBLE;
