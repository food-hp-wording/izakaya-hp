export const Colors = {
  // ベースカラー
  background: '#FAFAFA',
  backgroundOn: '#EAF9F5',   // ON時の背景（薄いミント）
  surface: '#FFFFFF',
  separator: '#E5E5EA',

  // ブランドカラー
  primary: '#00C9A7',        // ゆずりサポーターON（ミントグリーン）
  primaryDark: '#00A88C',
  primaryLight: '#B3EDE4',
  primaryUltraLight: '#EAF9F5',

  // テキスト
  text: '#1C1C1E',
  textSecondary: '#6E6E73',
  textTertiary: '#AEAEB2',

  // 状態
  off: '#E5E5EA',            // OFF状態のボタン
  offDark: '#C7C7CC',

  // その他
  white: '#FFFFFF',
  black: '#000000',
  danger: '#FF3B30',
  badge: '#FF6B35',          // カウントバッジ（暖色）
};

export const Sizes = {
  // ボタン
  buttonDiameter: 220,
  buttonBorderRadius: 110,   // 円形

  // レイアウト
  paddingH: 24,
  paddingV: 32,

  // フォント
  fontXL: 32,
  fontL: 24,
  fontM: 18,
  fontS: 15,
  fontXS: 13,

  // カード
  cardRadius: 20,
  cardPadding: 24,
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  buttonOn: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  buttonOff: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};
