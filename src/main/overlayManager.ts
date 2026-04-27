import { BrowserWindow, ipcMain, globalShortcut, app, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import Store from 'electron-store';
import { AppSettings, DEFAULT_SETTINGS, IPC, OverlayMode } from '../shared/types';
import gameConfigs from '../shared/gameConfig.json';
import { IOverlayMode } from './IOverlayMode';
import { BorderlessMode } from './modes/borderless';
import { InjectionMode } from './modes/injection';

export class OverlayManager {
  private store: Store<AppSettings>;
  private settings: AppSettings;
  private activeMode: IOverlayMode | null = null;
  private borderlessMode: BorderlessMode;
  private injectionMode: InjectionMode;
  private tray: Tray | null = null;
  private controlWindow: BrowserWindow | null = null;

  constructor() {
    this.store = new Store<AppSettings>({ defaults: DEFAULT_SETTINGS });
    this.settings = this.store.store;
    this.borderlessMode = new BorderlessMode(this.settings, this.onEvent.bind(this));
    this.injectionMode = new InjectionMode(this.settings, this.onEvent.bind(this));
  }

  private onEvent(name: string, _data: unknown): void {
    if (name === 'toggleInput') {
      const enabled = !this.settings.clickThrough;
      this.settings.clickThrough = enabled;
      this.activeMode?.setClickThrough(enabled);
      this.notifyRenderer(IPC.CLICK_THROUGH_CHANGED, { enabled });
    }
  }

  async init(): Promise<void> {
    this.setupIPC();
    await this.createControlWindow();
    await this.activateMode(this.settings.mode);
    this.setupTray();
    this.registerHotkey();
  }

  private async createControlWindow(): Promise<void> {
    this.controlWindow = new BrowserWindow({
      width: this.settings.windowBounds.width,
      height: this.settings.windowBounds.height,
      x: this.settings.windowBounds.x,
      y: this.settings.windowBounds.y,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: false,
      resizable: true,
      movable: true,
      hasShadow: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webviewTag: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    this.controlWindow.setAlwaysOnTop(true, 'screen-saver');

    // __dirname = dist/main/main/ → ../../renderer = dist/renderer/
    const rendererPath = path.join(__dirname, '../../renderer/overlay.html');
    await this.controlWindow.loadFile(rendererPath);

    if (process.argv.includes('--dev')) {
      this.controlWindow.webContents.openDevTools({ mode: 'detach' });
    }

    this.controlWindow.on('moved', () => this.saveWindowBounds());
    this.controlWindow.on('resized', () => this.saveWindowBounds());
    this.controlWindow.on('close', (e: Electron.Event) => {
      e.preventDefault();
      this.controlWindow?.hide();
    });
  }

  private async activateMode(mode: OverlayMode): Promise<void> {
    if (this.activeMode) {
      await this.activeMode.deactivate();
    }

    if (mode === 'injection' && !this.injectionMode.isAvailable()) {
      console.warn('[OverlayManager] Injection mode not available, falling back to borderless');
      mode = 'borderless';
    }

    this.activeMode = mode === 'injection' ? this.injectionMode : this.borderlessMode;
    this.settings.mode = mode;
    this.store.set('mode', mode);

    await this.activeMode.activate(this.controlWindow!);
    this.notifyRenderer(IPC.MODE_CHANGED, { mode, injectionAvailable: this.injectionMode.isAvailable() });
  }

  private setupIPC(): void {
    ipcMain.handle(IPC.GET_GAME_CATALOG, () => {
      const catalogPath = path.join(__dirname, '../shared/gameCatalog.json');
      const fallbackMapgenie = (gameConfigs as Array<{ slug: string; name: string }>).map((g) => ({
        provider: 'mapgenie',
        slug: g.slug,
        name: g.name,
        url: `https://mapgenie.io/${g.slug}`,
      }));

      const tcnoFallback = [
        { provider: 'tcno', slug: 'abi', name: 'Arena Breakout: Infinite', url: 'https://maps.tcno.co/abi' },
        { provider: 'tcno', slug: 'arc', name: 'ARC Raiders', url: 'https://maps.tcno.co/arc' },
        { provider: 'tcno', slug: 'df', name: 'Delta Force', url: 'https://maps.tcno.co/df' },
        { provider: 'tcno', slug: 'dune', name: 'Dune: Awakening', url: 'https://maps.tcno.co/dune' },
        { provider: 'tcno', slug: 'gzw', name: 'Gray Zone Warfare', url: 'https://maps.tcno.co/gzw' },
        { provider: 'tcno', slug: 's1', name: 'Schedule 1', url: 'https://maps.tcno.co/s1' },
      ];

      if (!fs.existsSync(catalogPath)) {
        return { generatedAt: null, mapgenie: fallbackMapgenie, tcno: tcnoFallback };
      }

      try {
        const raw = fs.readFileSync(catalogPath, 'utf8').replace(/^\uFEFF/, '');
        const parsed = JSON.parse(raw);
        const mapgenie = Array.isArray(parsed?.mapgenie) && parsed.mapgenie.length > 0 ? parsed.mapgenie : fallbackMapgenie;
        const tcno = Array.isArray(parsed?.tcno) && parsed.tcno.length > 0 ? parsed.tcno : tcnoFallback;
        return { generatedAt: parsed?.generatedAt ?? null, mapgenie, tcno };
      } catch {
        return { generatedAt: null, mapgenie: fallbackMapgenie, tcno: tcnoFallback };
      }
    });

    ipcMain.handle(IPC.GET_SETTINGS, () => ({
      ...this.settings,
      injectionAvailable: this.injectionMode.isAvailable(),
    }));

    ipcMain.on(IPC.SAVE_SETTINGS, (_e: Electron.IpcMainEvent, partial: Partial<AppSettings>) => {
      Object.assign(this.settings, partial);
      this.store.store = this.settings;
    });

    ipcMain.on(IPC.SET_OPACITY, (_e: Electron.IpcMainEvent, opacity: number) => {
      this.settings.opacity = opacity;
      this.store.set('opacity', opacity);
      this.activeMode?.setOpacity(opacity);
    });

    ipcMain.on(IPC.SET_CLICK_THROUGH, (_e: Electron.IpcMainEvent, enabled: boolean) => {
      this.settings.clickThrough = enabled;
      this.activeMode?.setClickThrough(enabled);
      this.notifyRenderer(IPC.CLICK_THROUGH_CHANGED, { enabled });
    });

    ipcMain.on(IPC.SET_MODE, (_e: Electron.IpcMainEvent, mode: OverlayMode) => {
      this.activateMode(mode).catch(console.error);
    });

    ipcMain.on(IPC.NAVIGATE_MAP, (_e: Electron.IpcMainEvent, { provider, gameSlug, mapSlug }: { provider: 'mapgenie' | 'tcno'; gameSlug: string; mapSlug: string }) => {
      this.settings.lastProvider = provider;
      this.settings.lastGameSlug = gameSlug;
      this.settings.lastMapSlug = mapSlug;
      this.store.set('lastProvider', provider);
      this.store.set('lastGameSlug', gameSlug);
      this.store.set('lastMapSlug', mapSlug);
    });

    ipcMain.on(IPC.MINIMIZE_WINDOW, () => {
      this.controlWindow?.minimize();
    });

    ipcMain.on(IPC.HIDE_WINDOW, () => {
      this.controlWindow?.hide();
    });

    ipcMain.on(IPC.TOGGLE_DEVTOOLS, () => {
      this.controlWindow?.webContents.toggleDevTools();
    });
  }

  private setupTray(): void {
    const iconPath = path.join(__dirname, '../../../assets/icon-tray.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    this.tray = new Tray(icon);

    const buildMenu = (): Menu => Menu.buildFromTemplate([
      { label: 'MapGenie Overlay', enabled: false },
      { type: 'separator' },
      {
        label: 'Show Overlay',
        click: () => { this.controlWindow?.show(); this.controlWindow?.focus(); },
      },
      {
        label: 'Click-Through',
        type: 'checkbox',
        checked: this.settings.clickThrough,
        click: (item: Electron.MenuItem) => {
          this.settings.clickThrough = item.checked;
          this.activeMode?.setClickThrough(item.checked);
          this.notifyRenderer(IPC.CLICK_THROUGH_CHANGED, { enabled: item.checked });
          this.tray?.setContextMenu(buildMenu());
        },
      },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.exit(0); } },
    ]);

    this.tray.setToolTip('MapGenie Overlay');
    this.tray.setContextMenu(buildMenu());
    this.tray.on('double-click', () => {
      this.controlWindow?.show();
      this.controlWindow?.focus();
    });
  }

  private registerHotkey(): void {
    const hotkey = this.settings.hotkey;
    const registered = globalShortcut.register(hotkey, () => this.toggleVisibility());
    if (!registered) {
      console.warn(`[OverlayManager] Could not register hotkey: ${hotkey}, trying fallback`);
      globalShortcut.register('Ctrl+Shift+M', () => this.toggleVisibility());
    }
  }

  private toggleVisibility(): void {
    if (!this.controlWindow) return;
    if (this.controlWindow.isVisible()) {
      this.controlWindow.hide();
    } else {
      this.controlWindow.show();
      this.controlWindow.focus();
    }
  }

  private saveWindowBounds(): void {
    if (!this.controlWindow) return;
    const bounds = this.controlWindow.getBounds();
    this.settings.windowBounds = bounds;
    this.store.set('windowBounds', bounds);
  }

  private notifyRenderer(channel: string, data: unknown): void {
    if (this.controlWindow && !this.controlWindow.isDestroyed()) {
      this.controlWindow.webContents.send(channel, data);
    }
  }

  destroy(): void {
    globalShortcut.unregisterAll();
    this.activeMode?.deactivate().catch(console.error);
    this.tray?.destroy();
  }
}
