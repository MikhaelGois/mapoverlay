import { app, BrowserWindow } from 'electron';
import { OverlayManager } from './overlayManager';

// Keep single instance
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let manager: OverlayManager | null = null;

app.whenReady().then(async () => {
  // Required for transparent windows on some Linux/Windows configs
  app.commandLine.appendSwitch('enable-transparent-visuals');
  app.commandLine.appendSwitch('disable-gpu-compositing');

  manager = new OverlayManager();
  await manager.init();
});

app.on('second-instance', () => {
  // Focus existing window when user tries to open a second instance
  BrowserWindow.getAllWindows().forEach((w) => {
    if (w.isMinimized()) w.restore();
    w.show();
    w.focus();
  });
});

app.on('window-all-closed', (e: Event) => {
  // Don't quit when all windows are closed — live in tray instead
  e.preventDefault();
});

app.on('before-quit', () => {
  manager?.destroy();
});

app.on('will-quit', () => {
  manager?.destroy();
});
