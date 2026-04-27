import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppSettings } from '../../shared/types';
import { IOverlayMode } from '../IOverlayMode';

/**
 * InjectionMode uses the goverlay library (hiitiger/goverlay) to inject
 * a DirectX hook into the running game process, enabling the overlay to
 * work even in exclusive fullscreen mode.
 *
 * Requirements:
 *   - overlay-native/electron-overlay.node  (built from goverlay)
 *   - overlay-native/n_overlay.x64.dll      (prebuilt, from goverlay repo)
 *   - overlay-native/n_ovhelper.x64.exe     (prebuilt, from goverlay repo)
 *
 * To build: see README — requires VS Build Tools 2022 + CMake.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ElectronOverlayAddon = any;

export class InjectionMode implements IOverlayMode {
  private window: BrowserWindow | null = null;
  private overlay: ElectronOverlayAddon | null = null;
  private overlayWindowId: number | null = null;
  private opacity: number;
  private injectedPid: number | null = null;
  private available: boolean;
  private addonPath: string;

  constructor(
    private settings: AppSettings,
    private onEvent: (name: string, data: unknown) => void
  ) {
    this.opacity = settings.opacity;

    // Resolve addon path relative to app root
    const appRoot = path.join(__dirname, '../../../');
    this.addonPath = path.join(appRoot, 'overlay-native', 'electron-overlay.node');
    this.available = fs.existsSync(this.addonPath);

    if (this.available) {
      console.log('[InjectionMode] Native addon found at:', this.addonPath);
    } else {
      console.warn('[InjectionMode] Native addon NOT found. Run build steps in overlay-native/. Path checked:', this.addonPath);
    }
  }

  isAvailable(): boolean {
    return this.available;
  }

  async activate(window: BrowserWindow): Promise<void> {
    if (!this.available) throw new Error('InjectionMode not available — overlay-native addon missing');

    this.window = window;

    // Dynamically load the native addon
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    this.overlay = require(this.addonPath);

    this.overlay.start();

    // Register hotkey F2 to toggle input capture in-game
    this.overlay.setHotkeys([
      { name: 'toggleInput', keyCode: 113 /* F2 */ },
    ]);

    // Listen for input events from the injected DLL
    this.overlay.on('game.input', (event: unknown) => {
      if (!this.window) return;
      const translated = this.overlay.translateInputEvent(event);
      if (translated) this.window.webContents.sendInputEvent(translated);
    });

    this.overlay.on('game.hotkey.down', (hotkey: { name: string }) => {
      if (hotkey.name === 'toggleInput') {
        this.onEvent('toggleInput', {});
      }
    });

    this.overlay.on('game.window.focused', (info: { pid: number; path: string }) => {
      this.injectIntoGame(info.pid, info.path);
    });

    // Enable offscreen rendering so we can send framebuffers to the DLL
    window.webContents.setFrameRate(60);
    window.webContents.on('paint', (_, __, image) => {
      if (this.overlayWindowId === null) return;
      const size = image.getSize();
      this.overlay.sendFrameBuffer(
        this.overlayWindowId,
        image.getBitmap(),
        size.width,
        size.height
      );
    });

    // Register the overlay window with goverlay
    this.overlayWindowId = this.overlay.addWindow(window.id, {
      name: 'mapgenie-overlay',
      transparent: true,
      resizable: true,
    });

    console.log('[InjectionMode] Activated, overlayWindowId:', this.overlayWindowId);
  }

  async deactivate(): Promise<void> {
    if (this.overlay) {
      try {
        if (this.injectedPid !== null) {
          this.overlay.uninjectProcess({ pid: this.injectedPid });
          this.injectedPid = null;
        }
        this.overlay.stop();
      } catch (e) {
        console.error('[InjectionMode] Error during deactivate:', e);
      }
      this.overlay = null;
    }
    this.overlayWindowId = null;
    this.window = null;
    console.log('[InjectionMode] Deactivated');
  }

  injectIntoGame(pid: number, executablePath: string): void {
    if (!this.overlay || this.injectedPid === pid) return;
    try {
      this.overlay.injectProcess({ pid, path: executablePath });
      this.injectedPid = pid;
      console.log('[InjectionMode] Injected into PID:', pid);
    } catch (e) {
      console.error('[InjectionMode] Injection failed:', e);
    }
  }

  setOpacity(value: number): void {
    this.opacity = Math.max(0.1, Math.min(1, value));
    // In injection mode opacity is handled via the framebuffer alpha channel
    // We store it and apply via CSS in the renderer instead
  }

  setClickThrough(enabled: boolean): void {
    if (!this.overlay || this.overlayWindowId === null) return;
    // goverlay supports per-window passthrough
    this.overlay.setWindowClickable(this.overlayWindowId, !enabled);
  }
}
