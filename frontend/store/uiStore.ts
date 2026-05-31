import { create } from 'zustand';

interface UiState {
  collapsed: boolean;
  toggleCollapsed: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  collapsed: false,
  toggleCollapsed: () => set((s) => ({ collapsed: !s.collapsed })),
  mobileOpen: false,
  setMobileOpen: (v) => set({ mobileOpen: v }),
}));
