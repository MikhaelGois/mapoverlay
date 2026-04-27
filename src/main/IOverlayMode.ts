import { BrowserWindow } from 'electron';

export interface IOverlayMode {
  activate(window: BrowserWindow): Promise<void>;
  deactivate(): Promise<void>;
  setOpacity(value: number): void;
  setClickThrough(enabled: boolean): void;
  isAvailable(): boolean;
}
