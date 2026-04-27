// IPC channel names
export const IPC = {
    // renderer → main
    SET_OPACITY: 'set-opacity',
    SET_CLICK_THROUGH: 'set-click-through',
    SET_MODE: 'set-mode',
    NAVIGATE_MAP: 'navigate-map',
    GET_SETTINGS: 'get-settings',
    SAVE_SETTINGS: 'save-settings',
    TOGGLE_DEVTOOLS: 'toggle-devtools',
    // main → renderer
    GAME_DETECTED: 'game-detected',
    GAME_LOST: 'game-lost',
    MODE_CHANGED: 'mode-changed',
    SETTINGS_LOADED: 'settings-loaded',
    CLICK_THROUGH_CHANGED: 'click-through-changed',
};
export const DEFAULT_SETTINGS = {
    mode: 'borderless',
    opacity: 0.85,
    hotkey: 'Ctrl+Shift+M',
    clickThrough: false,
    lastGameSlug: null,
    lastMapSlug: null,
    windowBounds: { x: 100, y: 100, width: 1100, height: 750 },
    autoDetectGame: true,
    startMinimized: false,
};
//# sourceMappingURL=types.js.map