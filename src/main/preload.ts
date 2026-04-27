import { contextBridge, ipcRenderer } from 'electron';

// Keep IPC channel names local to preload so this bridge never fails because of import resolution.
const IPC = {
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
  MODE_CHANGED: 'mode-changed',
  CLICK_THROUGH_CHANGED: 'click-through-changed',
} as const;

contextBridge.exposeInMainWorld('overlayAPI', {
  // Getters
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),
  getGameCatalog: () => ipcRenderer.invoke(IPC.GET_GAME_CATALOG),

  // Actions
  setOpacity: (value: number) => ipcRenderer.send(IPC.SET_OPACITY, value),
  setClickThrough: (enabled: boolean) => ipcRenderer.send(IPC.SET_CLICK_THROUGH, enabled),
  setMode: (mode: string) => ipcRenderer.send(IPC.SET_MODE, mode),
  navigateMap: (provider: 'mapgenie' | 'tcno', gameSlug: string, mapSlug: string) =>
    ipcRenderer.send(IPC.NAVIGATE_MAP, { provider, gameSlug, mapSlug }),
  saveSettings: (partial: Record<string, unknown>) => ipcRenderer.send(IPC.SAVE_SETTINGS, partial),
  minimizeWindow: () => ipcRenderer.send(IPC.MINIMIZE_WINDOW),
  hideWindow: () => ipcRenderer.send(IPC.HIDE_WINDOW),
  toggleDevTools: () => ipcRenderer.send(IPC.TOGGLE_DEVTOOLS),

  // Events
  onModeChanged: (cb: (data: unknown) => void) => ipcRenderer.on(IPC.MODE_CHANGED, (_e, data) => cb(data)),
  onClickThroughChanged: (cb: (data: unknown) => void) => ipcRenderer.on(IPC.CLICK_THROUGH_CHANGED, (_e, data) => cb(data)),
});
