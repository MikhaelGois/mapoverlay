# MapGenie Overlay

A transparent, always-on-top Electron overlay for displaying interactive maps from MapGenie.io and TCNO.co directly on your desktop while gaming.

## Features

✨ **Always-on-Top Transparent Overlay** - View maps without leaving the game
🎮 **177+ Games Supported** - Extensive catalog from MapGenie.io 
🗺️ **Dual Map Providers** - Switch between MapGenie and TCNO maps
🔍 **Smart Search** - Real-time filtering for games and maps
🎛️ **Opacity Control** - Adjust transparency on the fly
✂️ **Click-Through Mode** - Disable clicking the overlay to interact with the game
🌍 **Borderless & Injection Modes** - Choose your overlay style
🌓 **System Tray Integration** - Minimize to tray with hotkey support (Ctrl+Shift+M)

## Installation

### Option 1: Download Executable (Windows)
1. Download the latest `.exe` installer from [Releases](https://github.com/MikhaelGois/mapoverlay/releases)
2. Run the installer and follow the setup wizard
3. Launch from Start Menu or desktop shortcut

### Option 2: Clone & Build from Source
```bash
git clone https://github.com/MikhaelGois/mapoverlay.git
cd mapoverlay
npm install
npm start
```

## Usage

1. **Launch the App**: Start MapGenie Overlay
2. **Select a Game**: Choose from the dropdown (177+ games available)
3. **Select a Map**: Pick the specific map for that game
4. **View Map**: Map opens in the overlay
5. **Adjust Settings**:
   - Opacity slider: Change transparency
   - Click-Through (F2): Toggle clicking through the overlay
   - Borderless/Injection: Switch overlay mode
   - Minimize (─): Hide to system tray
   - Close (✕): Exit the app

### Hotkeys
- **Ctrl+Shift+M**: Toggle overlay visibility
- **F2**: Toggle click-through mode
- **Enter** (in game/map dropdown): Load selected map

## Development

### Prerequisites
- Node.js 16+ and npm
- Windows (NSIS installer support)

### Build Commands
```bash
# Install dependencies
npm install

# Development (watch mode with live reload)
npm run dev

# Build TypeScript
npm run build

# Build & run with Electron
npm start

# Create installer executable
npm run dist

# Create portable package
npm run pack
```

### Project Structure
```
mapoverlay/
├── src/
│   ├── main/              # Electron main process
│   │   ├── index.ts       # App entry point
│   │   ├── preload.ts     # IPC bridge for renderer
│   │   ├── overlayManager.ts  # Core overlay orchestrator
│   │   ├── modes/         # Overlay implementation modes (borderless, injection)
│   │   └── shared/        # Shared data
│   ├── renderer/          # UI & renderer process
│   │   ├── overlay.html   # UI template
│   │   ├── overlay.css    # Styling
│   │   └── overlay.ts     # Renderer logic
│   └── shared/
│       ├── types.ts       # TypeScript interfaces
│       ├── gameConfig.json     # Default games
│       └── gameCatalog.json    # Full game catalog (177+ games)
├── dist/                  # Compiled output
├── build/                 # Distribution artifacts
├── package.json           # Project metadata & scripts
├── tsconfig.main.json     # Main process TypeScript config
└── tsconfig.renderer.json # Renderer TypeScript config
```

### Key Components

**OverlayManager** (`src/main/overlayManager.ts`)
- Central orchestrator for the overlay
- Manages window lifecycle, IPC handlers, tray menu, hotkeys
- Switches between Borderless and Injection modes
- Handles game catalog loading (3-layer fallback system)

**Renderer** (`src/renderer/overlay.ts`)
- Game & map dropdown logic
- Search filtering
- Opacity & click-through controls
- IPC communication with main process
- Multi-layer catalog loading with fallbacks

**Modes**
- **Borderless** (`src/main/modes/borderless.ts`): Transparent always-on-top window
- **Injection** (`src/main/modes/injection.ts`): DirectX hook for fullscreen embedding (optional)

## Configuration

Settings are automatically saved to your user data directory:
- **Windows**: `C:\Users\<YourUser>\AppData\Roaming\mapgenie-overlay\`

Default settings:
- Opacity: 85%
- Mode: Borderless
- Click-Through: Off
- Hotkey: Ctrl+Shift+M

## Troubleshooting

### Games not appearing in dropdown
- The app loads from three sources: MapGenie catalog, TCNO provider, or hardcoded fallback
- If a specific game is missing, create an issue with the game name

### Map not loading
- Check internet connection
- Ensure the game/map combo is valid on mapgenie.io
- Try switching between MapGenie and TCNO providers

### Buttons not responding
- Try restarting the app
- Check that the overlay window is in focus

### Opacity not changing
- The slider has immediate visual feedback (applies CSS opacity)
- IPC command is sent to persist the setting

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [MapGenie.io](https://mapgenie.io) - Comprehensive game map database
- [TCNO.co](https://maps.tcno.co) - Alternative map provider
- [Electron](https://www.electronjs.org/) - Desktop app framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript

## Support

For issues, feature requests, or questions:
- 🐛 [GitHub Issues](https://github.com/MikhaelGois/mapoverlay/issues)
- 💬 [GitHub Discussions](https://github.com/MikhaelGois/mapoverlay/discussions)

---

**Made with ❤️ for gamers who map.**
