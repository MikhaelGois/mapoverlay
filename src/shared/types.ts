export type OverlayMode = 'borderless' | 'injection';
export type MapProvider = 'mapgenie' | 'tcno';

export interface GameConfig {
  slug: string;
  name: string;
  defaultMap: string;
  defaultMapSlug: string;
  hasAntiCheat: boolean;
  suggestedMode: OverlayMode;
  processes: string[];
}

export interface AppSettings {
  mode: OverlayMode;
  opacity: number;
  hotkey: string;
  clickThrough: boolean;
  lastProvider: MapProvider;
  lastGameSlug: string | null;
  lastMapSlug: string | null;
  windowBounds: { x: number; y: number; width: number; height: number };
  autoDetectGame: boolean;
  startMinimized: boolean;
}

export interface DetectedGame {
  config: GameConfig;
  pid: number;
  executablePath: string;
}

// IPC channel names
export const IPC = {
  // renderer → main
  SET_OPACITY: 'set-opacity',
  SET_CLICK_THROUGH: 'set-click-through',
  SET_MODE: 'set-mode',
  NAVIGATE_MAP: 'navigate-map',
  GET_GAME_CATALOG: 'get-game-catalog',
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
  MINIMIZE_WINDOW: 'minimize-window',
  HIDE_WINDOW: 'hide-window',
  TOGGLE_DEVTOOLS: 'toggle-devtools',

  // main → renderer
  GAME_DETECTED: 'game-detected',
  GAME_LOST: 'game-lost',
  MODE_CHANGED: 'mode-changed',
  SETTINGS_LOADED: 'settings-loaded',
  CLICK_THROUGH_CHANGED: 'click-through-changed',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  mode: 'borderless',
  opacity: 0.85,
  hotkey: 'Ctrl+Shift+M',
  clickThrough: false,
  lastProvider: 'mapgenie',
  lastGameSlug: null,
  lastMapSlug: null,
  windowBounds: { x: 100, y: 100, width: 1100, height: 750 },
  autoDetectGame: true,
  startMinimized: false,
};
