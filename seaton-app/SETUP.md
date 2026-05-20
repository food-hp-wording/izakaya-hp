# SEATON — 設計書 & セットアップガイド

> 「席を譲りたい人を可視化する」善意の可視化アプリ

---

## 1. 最適な技術構成

| 役割 | 採用技術 | 理由 |
|------|----------|------|
| フレームワーク | **Expo SDK 51 + TypeScript** | 初心者でも環境構築が最速。JSなので可読性高い |
| ナビゲーション | **Expo Router v3** | ファイルベースで直感的 |
| BLE スキャン | **react-native-ble-plx** | 最もメンテされているRN BLEライブラリ |
| BLE アドバタイズ | **react-native-ble-advertiser** | iOS/Android両対応の周辺機器モード |
| 状態管理 | **Zustand** | Redux比でコード量1/3。初心者にやさしい |
| 触覚フィードバック | **expo-haptics** | ボタンON時の振動 |
| テスト配布 | **EAS Build + TestFlight** | App Store不要でチームに配布可能 |
| モックモード | **useMockBLE hook** | Expo GoでUI確認用 |

---

## 2. なぜこの構成なのか

### React Native + Expo を選んだ理由

```
SwiftUI       → Macが必要、Xcode必須、学習コスト高
Flutter       → Dart言語を習得が必要
React Native  → JavaScript/TypeScript。Webの知識が活かせる
Expo          → React Nativeのセットアップを全部やってくれる
```

**BLE だけは Expo Go では動かない**（ネイティブAPIのため）。
でもUIの確認はExpo Goのモックモードでできる。
本番BLEはEAS Buildで開発用ビルドを作ればOK。

### なぜサーバーレス（BLEのみ）か

- GPS → 電車内で精度×、プライバシー問題
- サーバー → 初期コスト、認証、スケール問題
- BLE → オフライン動作、リアルタイム、数m精度、無料

---

## 3. 全体アーキテクチャ

```
┌─────────────────────────────────────────┐
│              iPhone A（サポーター）        │
│  ┌──────────┐    ┌────────────────────┐ │
│  │ UI Layer  │    │   BLE Layer        │ │
│  │ (React)   │◄──►│ Advertiser (ON時)  │ │
│  └──────────┘    │ Scanner (常時)     │ │
│                  └────────────────────┘ │
└─────────────────────────────────────────┘
         │ BLE Advertisement (5m圏内)
         ▼
┌─────────────────────────────────────────┐
│              iPhone B（閲覧者）           │
│  ┌──────────┐    ┌────────────────────┐ │
│  │ UI Layer  │    │   BLE Layer        │ │
│  │ 「3人いる」│◄──│ Scanner            │ │
│  └──────────┘    │ (SEATON UUIDを検出)│ │
│                  └────────────────────┘ │
└─────────────────────────────────────────┘

サーバー不要。完全P2P。オフライン動作。
```

### BLE フロー

```
サポーターON → BLE Advertise開始
              Service UUID: 1234（SEATON独自）
              
他のデバイス → UUID 1234 をスキャン
            → 発見したデバイスをRSSIでフィルタ（-75dBm以上 ≒ 約5m以内）
            → 2分以上見えなくなったデバイスは削除
            → 残った数 = 近くのサポーター数
```

---

## 4. 画面一覧

### MVP: 画面は1枚のみ

```
┌──────────────────────┐
│ SEATON               │  ← ロゴ
│                      │
│  ────────────────    │
│                      │
│     ┌──────────┐     │
│     │          │     │  ← パルスリング（ON時）
│     │  ゆずり  │     │
│  ○──│サポーター│──○  │  ← 大きな円形ボタン
│     │   OFF    │     │
│     │          │     │
│     └──────────┘     │
│                      │
│  ────────────────    │
│                      │
│  ┌────────────────┐  │
│  │  近くに 3人   │  │  ← サポーターカウンター
│  │  のサポーターが │  │
│  │  います        │  │
│  └────────────────┘  │
│                      │
│ ボタンを押すと        │
│ 周りの方に            │
│ 伝わります            │  ← フッターテキスト
└──────────────────────┘
```

**ON状態:**
- 背景: 薄いミント (#E8FBF7)
- ボタン: ミント (#00C9A7)
- パルスリングアニメーション

**OFF状態:**
- 背景: 白 (#FAFAFA)
- ボタン: ライトグレー (#E5E5EA)

---

## 5. DB設計

**MVP段階ではDB不要。** BLEのみで完結。

将来追加するなら Supabase:

```sql
-- ユーザーテーブル（将来）
users (
  id uuid PRIMARY KEY,
  device_id text UNIQUE,  -- BLEデバイスID（匿名）
  created_at timestamptz
)

-- 譲渡ログ（将来）
handoffs (
  id uuid PRIMARY KEY,
  supporter_device_id text,
  recipient_device_id text,
  created_at timestamptz
)

-- ありがとうログ（将来）
thanks (
  id uuid PRIMARY KEY,
  from_device_id text,
  to_device_id text,
  created_at timestamptz
)
```

---

## 6. BLE実装方針

### サービスUUID
```
SEATON Service UUID: 00001234-0000-1000-8000-00805F9B34FB
```
この UUID をアドバタイズすることで「SEATONアプリが動いている端末」として識別。

### アドバタイズ（自分を発信）
```typescript
// react-native-ble-advertiser を使用
BLEAdvertiser.broadcast(SERVICE_UUID, [], {
  advertiseMode: BLEAdvertiser.ADVERTISE_MODE_LOW_LATENCY,
  txPowerLevel: BLEAdvertiser.ADVERTISE_TX_POWER_HIGH,
  connectable: false,  // 接続不要。発見だけでOK
  includeDeviceName: false,  // プライバシー保護
});
```

### スキャン（周囲を検知）
```typescript
// react-native-ble-plx を使用
manager.startDeviceScan(
  [SERVICE_UUID],  // SEATONのUUIDだけ探す
  { scanMode: ScanMode.LowLatency },
  (error, device) => {
    if (device && device.rssi > RSSI_THRESHOLD) {
      // 近くにいるとみなす（RSSI > -75dBm ≒ 約5m）
      addDevice(device.id);
    }
  }
);
```

### デバイス管理
- 発見 → Map に追加（key: deviceId, value: 最終発見時刻）
- 2分ごとに古いデバイスを削除
- Map のサイズ = 近くのサポーター数

### RSSI と距離の目安
```
-50 dBm → 約1m以内
-65 dBm → 約3m以内  
-75 dBm → 約5-8m（推奨閾値）
-85 dBm → 約10-15m
-95 dBm → 壁を越えた先など
```
電車の車両幅は約3mなので、-70 〜 -75 dBmがちょうど良い。

---

## 7. 実装優先順位

```
Day 1-2: UIのみ（Expo Go動作）
  ✓ ボタンON/OFF
  ✓ アニメーション
  ✓ モックカウンター
  ✓ 日本語テキスト

Day 3-4: BLE統合（開発ビルド）
  ✓ 権限取得
  ✓ スキャン
  ✓ アドバタイズ
  ✓ デバイスカウント

Day 5: テスト
  ✓ 2台のiPhoneで実機テスト
  ✓ 電車内テスト（湘南新宿ライン）

Day 6-7: TestFlight
  ✓ EAS Build
  ✓ App Store Connect設定
  ✓ TestFlight配布
```

---

## 8. MVPで削るべきもの

削る（後回し）:
- ❌ ユーザー認証
- ❌ プロフィール設定
- ❌ ありがとう送信
- ❌ 履歴・ログ
- ❌ 通知（Push/Local）
- ❌ Android対応
- ❌ Apple Watch
- ❌ アニメーション過多
- ❌ オンボーディング画面
- ❌ 設定画面

残す（MVP必須）:
- ✅ ON/OFFボタン
- ✅ 近くのカウント表示
- ✅ シンプルな日本語UI
- ✅ BLE（または Mock）

---

## 9. 開発工数感

| タスク | 工数 |
|--------|------|
| Expo環境構築 | 1h |
| UI実装（画面1枚） | 3h |
| アニメーション | 2h |
| BLE実装（スキャン） | 3h |
| BLE実装（アドバタイズ） | 2h |
| 実機デバッグ | 3h |
| EAS Build設定 | 1h |
| TestFlight登録 | 1h |
| **合計** | **約16h（2-3日）** |

---

## 10. ディレクトリ構成

```
seaton-app/
├── app/
│   ├── _layout.tsx          # ルートレイアウト（SafeArea等）
│   └── index.tsx            # メイン画面（唯一の画面）
├── src/
│   ├── components/
│   │   ├── SupporterButton.tsx   # メインのON/OFFボタン
│   │   ├── PulseRing.tsx         # パルスアニメーション
│   │   ├── NearbyCounter.tsx     # サポーター数表示
│   │   └── DeviceBadge.tsx       # 個別デバイス表示
│   ├── hooks/
│   │   ├── useBLE.ts            # 本番BLE（開発ビルド用）
│   │   └── useMockBLE.ts        # モックBLE（Expo Go用）
│   ├── store/
│   │   └── appStore.ts          # Zustand ストア
│   ├── constants/
│   │   └── ble.ts               # BLE定数（UUID等）
│   └── theme/
│       └── index.ts             # 色・サイズ定数
├── assets/
│   └── icon.png
├── app.json                     # Expoアプリ設定
├── eas.json                     # EAS Build設定
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## 11. 必要ライブラリ

```bash
# コア
npx create-expo-app seaton-app --template blank-typescript
cd seaton-app

# BLE
npx expo install react-native-ble-plx
npm install react-native-ble-advertiser

# 状態管理
npm install zustand

# UI補助
npx expo install expo-haptics expo-keep-awake expo-status-bar

# ビルド設定
npx expo install expo-build-properties

# EAS CLI（グローバル）
npm install -g eas-cli
```

**app.json に追加が必要:**
```json
{
  "expo": {
    "plugins": [
      ["expo-build-properties", {
        "ios": {
          "deploymentTarget": "13.4"
        }
      }],
      ["react-native-ble-plx", {
        "isBackgroundEnabled": false,
        "modes": ["central", "peripheral"],
        "bluetoothAlwaysPermission": "SEATONは近くのサポーターを検出するためBluetoothを使用します"
      }]
    ]
  }
}
```

---

## 12. UIコンポーネント設計

```
index.tsx
├── <SafeAreaView>           # セーフエリア対応
│   ├── <Header>             # "SEATON" ロゴ
│   ├── <View> (center)      # 中央コンテンツ
│   │   ├── <StatusMessage>  # 現在の状態テキスト
│   │   ├── <SupporterButton>  # メインボタン
│   │   │   └── <PulseRing>  # ON時のパルスリング
│   │   └── <NearbyCounter>  # サポーター数カード
│   └── <Footer>             # 説明テキスト
```

---

## 13. 状態管理（Zustand）

```typescript
interface AppState {
  isSupporter: boolean;      // ON/OFF
  nearbyCount: number;       // 近くのサポーター数
  bleStatus: 'idle' | 'scanning' | 'advertising' | 'error';
  
  // アクション
  toggleSupporter: () => void;
  setNearbyCount: (n: number) => void;
  setBleStatus: (s: string) => void;
}
```

シンプルにフラット構造。ネストしない。

---

## 14. 詰まりやすいポイント

### BLE関連
```
❌ よくある失敗: Expo Goで BLE を使おうとする
✅ 解決: 開発ビルド（expo run:ios or EAS Build）を使う

❌ よくある失敗: iOS 13以降で権限が取れない
✅ 解決: Info.plist に NSBluetoothAlwaysUsageDescription が必要
        Expo では app.json の plugins で設定

❌ よくある失敗: シミュレーターでBLEが動かない
✅ 解決: 実機必須。シミュレーターはBLE非対応

❌ よくある失敗: iPhoneがアドバタイズを止める
✅ 解決: フォアグラウンドで動作させる。バックグラウンドは制限あり
```

### Expo関連
```
❌ よくある失敗: npx expo start でBLEライブラリエラー
✅ 解決: expo prebuild → expo run:ios の順で実行

❌ よくある失敗: EAS Buildが遅い（30-60分）
✅ 解決: 最初は expo run:ios でローカルビルドを試す（Xcode必要）
```

### その他
```
❌ よくある失敗: 2台のiPhoneで検出できない
✅ 解決: 両方とも同じアプリをインストールし、
        一方がアドバタイズ、他方がスキャン中であること確認

❌ よくある失敗: RSSI値がバラバラで安定しない
✅ 解決: 複数回の平均を取るか、ローパスフィルタを適用
```

---

## 15. App Store審査で危険なポイント

```
⚠️  Bluetooth使用目的の説明が曖昧
→ 「近くの席を譲れる人を発見するため」と明記

⚠️  バックグラウンドBLEの申告漏れ
→ UIBackgroundModes に bluetooth-central / peripheral を正しく設定

⚠️  プライバシーポリシーなし
→ Bluetoothデータの取り扱いを記載したポリシーが必要

⚠️  個人を特定できる情報の送信
→ デバイスIDや名前をアドバタイズしないこと（SEATONは匿名UUIDのみ）

⚠️  「センシティブな状況」での使用
→ 「電車内」「高齢者向け」は問題なし。医療アプリではない

✅  安全なポイント:
- 位置情報不使用
- ユーザー認証なし
- サーバーへのデータ送信なし（BLEのみ）
- 広告なし
```

---

## 16. Expo Goでできること・できないこと

| 機能 | Expo Go | 開発ビルド |
|------|---------|------------|
| UIの確認 | ✅ | ✅ |
| アニメーション | ✅ | ✅ |
| Haptics（振動） | ✅ | ✅ |
| モックBLE | ✅ | ✅ |
| **本物のBLE** | **❌** | **✅** |
| TestFlight配布 | ❌ | ✅ |

**Expo Goでの開発推奨フロー:**
1. Expo GoでUI/UX確認（モックモード）
2. 見た目が確定したらEAS Buildで開発ビルド作成
3. 実機2台でBLEテスト
4. OKならTestFlight配布

---

## 17. TestFlight公開までの流れ

```bash
# 1. EASアカウント作成
# https://expo.dev にアクセスして無料登録

# 2. EAS CLIインストール
npm install -g eas-cli

# 3. ログイン
eas login

# 4. プロジェクト初期化
eas init

# 5. ビルド設定（eas.json を確認）

# 6. 開発ビルド作成（最初はこれ）
eas build --platform ios --profile development

# 7. TestFlight用ビルド
eas build --platform ios --profile preview

# 8. App Store Connectに自動アップロード
eas submit --platform ios

# 9. TestFlightでテスター招待
# App Store Connect > TestFlight > テスター追加
```

**Apple Developer アカウントが必要（年間$99）**
→ TestFlight公開だけなら必須。Expo Goなら不要。

---

## 18. Day1-7 ロードマップ

```
Day 1: 環境構築 + UIのみ実装
  - Node.js, Expo CLI インストール
  - create-expo-app でプロジェクト作成
  - ボタン、アニメーション実装
  - Expo Goで動作確認

Day 2: モックBLEでUI完成
  - useMockBLE hook で疑似的なサポーター検出
  - 全画面要素の完成
  - 日本語テキスト調整

Day 3: 本物BLE実装（スキャン）
  - react-native-ble-plx インストール
  - expo prebuild
  - 権限設定
  - スキャン実装

Day 4: 本物BLE実装（アドバタイズ）
  - react-native-ble-advertiser インストール
  - アドバタイズ実装
  - ON/OFFに連動

Day 5: 実機テスト
  - iPhone 2台でペアテスト
  - 電車内でテスト（湘南新宿ライン推奨）
  - RSSI閾値調整

Day 6: TestFlight準備
  - EASアカウント設定
  - eas.json設定
  - プレビュービルド作成

Day 7: TestFlight公開
  - App Store Connect設定
  - テスター招待
  - フィードバック収集開始
```
