# overlay-native — goverlay Native Addon

This folder houses the native binaries needed for **Injection Mode** (DX hook into exclusive fullscreen games).

## What goes here

```
overlay-native/
  electron-overlay.node   ← built from goverlay (required)
  n_overlay.x64.dll       ← prebuilt, copy from goverlay/prebuilt/
  n_ovhelper.x64.exe      ← prebuilt, copy from goverlay/prebuilt/
```

Without these files the app runs fine in **Borderless Mode** only.

## Build Steps (one-time)

### Prerequisites
- Windows 10/11
- [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) — select **Desktop development with C++**
- [CMake](https://cmake.org/download/) (add to PATH)
- Node.js 20 (same version used for Electron 30)

### 1. Clone goverlay
```bat
git clone https://github.com/hiitiger/goverlay.git
cd goverlay
```

### 2. Build the native addon
```bat
npm install
npm run build:addon:x64
```

### 3. Copy files into this project
```bat
copy goverlay\electron-overlay\build\Release\electron-overlay.node  ..\overlay-native\
copy goverlay\game-overlay\prebuilt\n_overlay.x64.dll               ..\overlay-native\
copy goverlay\game-overlay\prebuilt\n_ovhelper.x64.exe              ..\overlay-native\
```

### 4. Restart the app
The **Injection** button in the overlay UI will become available automatically.

## ⚠️ Anti-cheat warning
Games with **Easy Anti-Cheat** or **BattlEye** (Fortnite, Rust, etc.) may flag DLL injection.
The app auto-detects known anti-cheat games and forces **Borderless Mode** for them.
Use Injection Mode only for games without anti-cheat.
