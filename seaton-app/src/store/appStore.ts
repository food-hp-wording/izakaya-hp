import { create } from 'zustand';

type BleStatus = 'idle' | 'scanning' | 'error' | 'unavailable';

interface AppState {
  // ゆずりサポーター状態
  isSupporter: boolean;

  // 近くのサポーター数
  nearbyCount: number;

  // BLE状態
  bleStatus: BleStatus;
  bleError: string | null;

  // アクション
  toggleSupporter: () => void;
  setNearbyCount: (count: number) => void;
  setBleStatus: (status: BleStatus) => void;
  setBleError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSupporter: false,
  nearbyCount: 0,
  bleStatus: 'idle',
  bleError: null,

  toggleSupporter: () =>
    set((state) => ({ isSupporter: !state.isSupporter })),

  setNearbyCount: (count) => set({ nearbyCount: count }),

  setBleStatus: (bleStatus) => set({ bleStatus }),

  setBleError: (bleError) => set({ bleError }),
}));
