import { BrowserWindow, IpcMainEvent } from 'electron';
import { AppSettings } from '../../shared/types';
import { IOverlayMode } from '../IOverlayMode';

export class BorderlessMode implements IOverlayMode {
  private window: BrowserWindow | null = null;
  private opacity: number;
  private clickThrough: boolean;

  constructor(
    private settings: AppSettings,
    private onEvent: (name: string, data: unknown) => void
  ) {
    this.opacity = settings.opacity;
    this.clickThrough = settings.clickThrough;
  }

  isAvailable(): boolean {
    return true; // Always available — pure Electron, no native deps
  }

  async activate(window: BrowserWindow): Promise<void> {
    this.window = window;

    // Apply current settings
    window.setOpacity(this.opacity);
    window.setIgnoreMouseEvents(this.clickThrough, { forward: true });
    window.setAlwaysOnTop(true, 'screen-saver');

    console.log('[BorderlessMode] Activated — window is transparent, always-on-top');
  }

  async deactivate(): Promise<void> {
    // Nothing to tear down for borderless mode
    this.window = null;
    console.log('[BorderlessMode] Deactivated');
  }

  setOpacity(value: number): void {
    this.opacity = Math.max(0.1, Math.min(1, value));
    this.window?.setOpacity(this.opacity);
  }

  setClickThrough(enabled: boolean): void {
    this.clickThrough = enabled;
    if (this.window) {
      this.window.setIgnoreMouseEvents(enabled, { forward: true });
    }
  }
}
