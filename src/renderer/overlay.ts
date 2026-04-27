type Provider = 'mapgenie' | 'tcno';

interface CatalogEntry {
  provider: Provider;
  slug: string;
  name: string;
  url: string;
}

interface GameCatalog {
  generatedAt: string | null;
  mapgenie: CatalogEntry[];
  tcno: CatalogEntry[];
}

interface OverlayAPI {
  getSettings?: () => Promise<any>;
  getGameCatalog?: () => Promise<any>;
  setOpacity?: (value: number) => void;
  setClickThrough?: (enabled: boolean) => void;
  setMode?: (mode: string) => void;
  navigateMap?: (provider: Provider, gameSlug: string, mapSlug: string) => void;
  minimizeWindow?: () => void;
  hideWindow?: () => void;
  onModeChanged?: (cb: (data: any) => void) => void;
  onClickThroughChanged?: (cb: (data: any) => void) => void;
}

const KNOWN_MAP_SLUGS: Record<string, Array<{ slug: string; name: string }>> = {
  'elden-ring': [
    { slug: 'the-lands-between', name: 'The Lands Between' },
    { slug: 'siofra-river', name: 'Siofra River' },
    { slug: 'ainsel-river', name: 'Ainsel River' },
  ],
  'the-witcher-3': [
    { slug: 'velen-novigrad', name: 'Velen & Novigrad' },
    { slug: 'skellige', name: 'Skellige' },
    { slug: 'toussaint', name: 'Toussaint' },
  ],
  'cyberpunk-2077': [{ slug: 'night-city', name: 'Night City' }],
  'red-dead-redemption-2': [{ slug: 'new-hanover', name: 'New Hanover' }],
};

const MAPGENIE_FALLBACK: CatalogEntry[] = [
  { provider: 'mapgenie', slug: 'elden-ring', name: 'Elden Ring', url: 'https://mapgenie.io/elden-ring' },
  { provider: 'mapgenie', slug: 'the-witcher-3', name: 'The Witcher 3', url: 'https://mapgenie.io/the-witcher-3' },
  { provider: 'mapgenie', slug: 'cyberpunk-2077', name: 'Cyberpunk 2077', url: 'https://mapgenie.io/cyberpunk-2077' },
  { provider: 'mapgenie', slug: 'red-dead-redemption-2', name: 'Red Dead Redemption 2', url: 'https://mapgenie.io/red-dead-redemption-2' },
  { provider: 'mapgenie', slug: 'baldurs-gate-3', name: "Baldur's Gate 3", url: 'https://mapgenie.io/baldurs-gate-3' },
  { provider: 'mapgenie', slug: 'hogwarts-legacy', name: 'Hogwarts Legacy', url: 'https://mapgenie.io/hogwarts-legacy' },
  { provider: 'mapgenie', slug: 'assassins-creed-odyssey', name: 'Assassin\'s Creed Odyssey', url: 'https://mapgenie.io/assassins-creed-odyssey' },
  { provider: 'mapgenie', slug: 'assassins-creed-valhalla', name: 'Assassin\'s Creed Valhalla', url: 'https://mapgenie.io/assassins-creed-valhalla' },
  { provider: 'mapgenie', slug: 'ghost-of-tsushima', name: 'Ghost of Tsushima', url: 'https://mapgenie.io/ghost-of-tsushima' },
  { provider: 'mapgenie', slug: 'stalker-2-heart-of-chornobyl', name: 'S.T.A.L.K.E.R. 2', url: 'https://mapgenie.io/stalker-2-heart-of-chornobyl' },
];

const TCNO_FALLBACK: CatalogEntry[] = [
  { provider: 'tcno', slug: 'arc', name: 'ARC Raiders', url: 'https://maps.tcno.co/arc' },
  { provider: 'tcno', slug: 'abi', name: 'Arena Breakout: Infinite', url: 'https://maps.tcno.co/abi' },
  { provider: 'tcno', slug: 'df', name: 'Delta Force', url: 'https://maps.tcno.co/df' },
  { provider: 'tcno', slug: 'dune', name: 'Dune: Awakening', url: 'https://maps.tcno.co/dune' },
  { provider: 'tcno', slug: 'gzw', name: 'Gray Zone Warfare', url: 'https://maps.tcno.co/gzw' },
  { provider: 'tcno', slug: 's1', name: 'Schedule 1', url: 'https://maps.tcno.co/s1' },
];

const SUPPLEMENTAL_MAPGENIE: CatalogEntry[] = [
  { provider: 'mapgenie', slug: 'fortnite', name: 'Fortnite', url: 'https://mapgenie.io/fortnite' },
  { provider: 'mapgenie', slug: 'escape-from-tarkov', name: 'Escape from Tarkov', url: 'https://mapgenie.io/escape-from-tarkov' },
  { provider: 'mapgenie', slug: 'dragon-quest-xi', name: 'Dragon Quest XI', url: 'https://mapgenie.io/dragon-quest-xi' },
  { provider: 'mapgenie', slug: 'dragon-quest-3-hd-2d-remake', name: 'Dragon Quest 3 HD-2D Remake', url: 'https://mapgenie.io/dragon-quest-3-hd-2d-remake' },
  { provider: 'mapgenie', slug: 'red-dead-redemption-2', name: 'Red Dead Redemption 2', url: 'https://mapgenie.io/red-dead-redemption-2' },
];

const sourceSelect = document.getElementById('source-select') as HTMLSelectElement;
const gameSearch = document.getElementById('game-search') as HTMLInputElement;
const gameSelect = document.getElementById('game-select') as HTMLSelectElement;
const mapSearch = document.getElementById('map-search') as HTMLInputElement;
const mapSelect = document.getElementById('map-select') as HTMLSelectElement;
const btnGo = document.getElementById('btn-go') as HTMLButtonElement;
const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
const opacityValue = document.getElementById('opacity-value') as HTMLSpanElement;
const btnClickthrough = document.getElementById('btn-clickthrough') as HTMLButtonElement;
const btnBorderless = document.getElementById('btn-borderless') as HTMLButtonElement;
const btnInjection = document.getElementById('btn-injection') as HTMLButtonElement;
const btnMinimize = document.getElementById('btn-minimize') as HTMLButtonElement;
const btnClose = document.getElementById('btn-close') as HTMLButtonElement;
const notificationBar = document.getElementById('notification-bar') as HTMLDivElement;
const notificationText = document.getElementById('notification-text') as HTMLSpanElement;
const notificationDismiss = document.getElementById('notification-dismiss') as HTMLButtonElement;
const mapWebview = document.getElementById('map-webview') as HTMLElement & { src: string };
const placeholder = document.getElementById('placeholder') as HTMLDivElement;
const webviewContainer = document.getElementById('webview-container') as HTMLDivElement;

const api: OverlayAPI = ((window as any).overlayAPI ?? {}) as OverlayAPI;

let clickThrough = false;
let injectionAvailable = false;
let catalog: GameCatalog = {
  generatedAt: null,
  mapgenie: MAPGENIE_FALLBACK,
  tcno: TCNO_FALLBACK,
};

let currentMapOptions: Array<{ slug: string; name: string }> = [];

async function init() {
  setupEventListeners();

  const settings = await safeLoadSettings();
  const fetchedCatalog = await safeLoadCatalog();

  catalog = normalizeCatalog(fetchedCatalog);
  applySettings(settings);
  renderGameOptions(settings.lastGameSlug ?? null);

  api.onModeChanged?.((data: any) => updateModeUI(data.mode, data.injectionAvailable));
  api.onClickThroughChanged?.((data: any) => setClickThroughUI(data.enabled));

  if (providerGames().length === 0) {
    showNotification('Falha ao carregar catálogo de jogos.', 'warning');
  }
}

async function safeLoadSettings(): Promise<any> {
  try {
    if (!api.getSettings) return defaultSettings();
    const settings = await api.getSettings();
    return { ...defaultSettings(), ...(settings ?? {}) };
  } catch {
    return defaultSettings();
  }
}

async function safeLoadCatalog(): Promise<any> {
  try {
    if (api.getGameCatalog) {
      const fromIpc = await api.getGameCatalog();
      if (Array.isArray(fromIpc?.mapgenie) && fromIpc.mapgenie.length > 0) {
        return fromIpc;
      }
    }
  } catch {
    // ignore and try local file fallback
  }

  const fileCandidates = [
    '../main/shared/gameCatalog.json',
    '../../main/shared/gameCatalog.json',
    '../shared/gameCatalog.json',
    '../../shared/gameCatalog.json',
  ];

  for (const rel of fileCandidates) {
    try {
      const resp = await fetch(rel, { cache: 'no-store' });
      if (!resp.ok) continue;
      const data = await resp.json();
      if (Array.isArray(data?.mapgenie) && data.mapgenie.length > 0) {
        return data;
      }
    } catch {
      // try next path
    }
  }

  return { generatedAt: null, mapgenie: MAPGENIE_FALLBACK, tcno: TCNO_FALLBACK };
}

function defaultSettings() {
  return {
    mode: 'borderless',
    opacity: 0.85,
    clickThrough: false,
    lastProvider: 'mapgenie',
    lastGameSlug: null,
    lastMapSlug: null,
    injectionAvailable: false,
  };
}

function normalizeCatalog(data: any): GameCatalog {
  const mapgenieBase = Array.isArray(data?.mapgenie) && data.mapgenie.length > 0 ? data.mapgenie : MAPGENIE_FALLBACK;
  const tcnoBase = Array.isArray(data?.tcno) && data.tcno.length > 0 ? data.tcno : TCNO_FALLBACK;

  const dedupe = (items: CatalogEntry[]) => {
    const map = new Map<string, CatalogEntry>();
    for (const item of items) {
      map.set(`${item.provider}:${item.slug}`.toLowerCase(), item);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  };

  const mapgenie = dedupe([...mapgenieBase, ...SUPPLEMENTAL_MAPGENIE]);
  const tcno = dedupe(tcnoBase);

  return {
    generatedAt: data?.generatedAt ?? null,
    mapgenie,
    tcno,
  };
}

function applySettings(settings: any) {
  injectionAvailable = settings.injectionAvailable ?? false;

  const pct = Math.max(10, Math.min(100, Math.round((settings.opacity ?? 0.85) * 100)));
  opacitySlider.value = String(pct);
  opacityValue.textContent = `${pct}%`;
  applyOpacityVisual(pct / 100);

  updateModeUI(settings.mode ?? 'borderless', injectionAvailable);
  setClickThroughUI(settings.clickThrough ?? false);

  sourceSelect.value = settings.lastProvider === 'tcno' ? 'tcno' : 'mapgenie';
  gameSearch.value = '';
  mapSearch.value = '';
}

function providerGames(): CatalogEntry[] {
  return sourceSelect.value === 'tcno' ? catalog.tcno : catalog.mapgenie;
}

function renderGameOptions(selectedSlug: string | null) {
  const search = gameSearch.value.trim().toLowerCase();
  const games = providerGames().filter((g) => !search || g.name.toLowerCase().includes(search) || g.slug.toLowerCase().includes(search));

  gameSelect.innerHTML = '<option value="">— Select Game —</option>';
  for (const game of games) {
    const opt = document.createElement('option');
    opt.value = game.slug;
    opt.textContent = game.name;
    gameSelect.appendChild(opt);
  }

  if (selectedSlug && games.some((g) => g.slug === selectedSlug)) {
    gameSelect.value = selectedSlug;
  } else if (games.length > 0) {
    gameSelect.value = games[0].slug;
  } else {
    gameSelect.value = '';
  }

  buildMapOptions(gameSelect.value || null, null);
  renderMapOptions();
}

function buildMapOptions(gameSlug: string | null, selectedMap: string | null) {
  currentMapOptions = [];

  if (!gameSlug) {
    mapSelect.disabled = true;
    return;
  }

  if (sourceSelect.value === 'tcno') {
    currentMapOptions = [{ slug: '__provider_root__', name: 'Main Map' }];
  } else {
    const known = KNOWN_MAP_SLUGS[gameSlug] ?? [];
    currentMapOptions = known.length > 0
      ? known
      : [{ slug: '__game_root__', name: 'Open Game Page (select map inside site)' }];
  }

  renderMapOptions(selectedMap);
}

function renderMapOptions(selectedMap?: string | null) {
  const search = mapSearch.value.trim().toLowerCase();
  const maps = currentMapOptions.filter((m) => !search || m.name.toLowerCase().includes(search) || m.slug.toLowerCase().includes(search));

  mapSelect.innerHTML = '<option value="">— Select Map —</option>';
  for (const m of maps) {
    const opt = document.createElement('option');
    opt.value = m.slug;
    opt.textContent = m.name;
    mapSelect.appendChild(opt);
  }

  mapSelect.disabled = maps.length === 0;
  if (maps.length > 0) {
    if (selectedMap && maps.some((m) => m.slug === selectedMap)) {
      mapSelect.value = selectedMap;
    } else {
      mapSelect.value = maps[0].slug;
    }
  }
}

function setupEventListeners() {
  sourceSelect.addEventListener('change', () => {
    gameSearch.value = '';
    mapSearch.value = '';
    renderGameOptions(null);
    showNotification(sourceSelect.value === 'tcno' ? 'Fonte: TCNO Maps' : 'Fonte: MapGenie', 'info', 1500);
  });

  gameSearch.addEventListener('input', () => renderGameOptions(null));

  gameSelect.addEventListener('change', () => {
    mapSearch.value = '';
    buildMapOptions(gameSelect.value || null, null);
  });

  mapSearch.addEventListener('input', () => renderMapOptions(null));

  btnGo.addEventListener('click', () => loadSelectedMap());
  mapSelect.addEventListener('dblclick', () => loadSelectedMap());

  opacitySlider.addEventListener('input', () => {
    const pct = Number(opacitySlider.value);
    const alpha = Math.max(0.1, Math.min(1, pct / 100));
    opacityValue.textContent = `${pct}%`;

    applyOpacityVisual(alpha);
    api.setOpacity?.(alpha);
  });

  btnClickthrough.addEventListener('click', () => {
    clickThrough = !clickThrough;
    api.setClickThrough?.(clickThrough);
    setClickThroughUI(clickThrough);
  });

  btnBorderless.addEventListener('click', () => {
    api.setMode?.('borderless');
    updateModeUI('borderless', injectionAvailable);
  });

  btnInjection.addEventListener('click', () => {
    if (!injectionAvailable) {
      showNotification('Injection indisponível (native addon ausente).', 'warning', 2200);
      return;
    }
    api.setMode?.('injection');
    updateModeUI('injection', injectionAvailable);
  });

  btnMinimize.addEventListener('click', () => {
    if (api.minimizeWindow) {
      api.minimizeWindow();
      return;
    }

    if (api.hideWindow) {
      api.hideWindow();
      return;
    }

    window.close();
  });

  btnClose.addEventListener('click', () => {
    if (api.hideWindow) {
      api.hideWindow();
      return;
    }

    window.close();
  });

  notificationDismiss.addEventListener('click', () => hideNotification());

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F2') {
      clickThrough = !clickThrough;
      api.setClickThrough?.(clickThrough);
      setClickThroughUI(clickThrough);
    }

    if (e.key === 'Enter' && document.activeElement !== gameSearch && document.activeElement !== mapSearch) {
      loadSelectedMap();
    }
  });
}

function loadSelectedMap() {
  const provider = sourceSelect.value as Provider;
  const gameSlug = gameSelect.value;
  const mapSlug = mapSelect.value;

  if (!gameSlug) {
    showNotification('Selecione um jogo.', 'warning', 1800);
    return;
  }

  const url = buildUrl(provider, gameSlug, mapSlug);
  placeholder.style.display = 'none';
  mapWebview.style.display = 'flex';
  mapWebview.src = url;

  api.navigateMap?.(provider, gameSlug, mapSlug);
}

function buildUrl(provider: Provider, gameSlug: string, mapSlug: string): string {
  if (provider === 'tcno') {
    return `https://maps.tcno.co/${gameSlug}`;
  }

  if (!mapSlug || mapSlug === '__game_root__') {
    return `https://mapgenie.io/${gameSlug}`;
  }

  return `https://mapgenie.io/${gameSlug}/maps/${mapSlug}`;
}

function applyOpacityVisual(alpha: number) {
  // Visual fallback in renderer for instant feedback even if IPC fails
  webviewContainer.style.opacity = String(alpha);
  (document.getElementById('control-bar') as HTMLElement).style.opacity = String(Math.max(0.55, alpha));
  notificationBar.style.opacity = String(Math.max(0.65, alpha));
}

function updateModeUI(mode: string, injAvailable: boolean) {
  injectionAvailable = injAvailable;
  btnBorderless.classList.toggle('active', mode === 'borderless');
  btnInjection.classList.toggle('active', mode === 'injection');
  btnInjection.disabled = !injAvailable;
}

function setClickThroughUI(enabled: boolean) {
  clickThrough = enabled;
  btnClickthrough.classList.toggle('active', enabled);
  document.body.classList.toggle('click-through', enabled);
  const icon = document.getElementById('clickthrough-icon');
  if (icon) icon.textContent = enabled ? '🔒' : '🖱️';
}

function showNotification(msg: string, type: 'info' | 'warning' = 'info', autoDismissMs?: number) {
  notificationText.textContent = msg;
  notificationBar.className = `notification-bar ${type}`;
  notificationBar.classList.remove('hidden');
  webviewContainer.classList.add('with-notification');

  if (autoDismissMs) {
    window.setTimeout(() => hideNotification(), autoDismissMs);
  }
}

function hideNotification() {
  notificationBar.classList.add('hidden');
  webviewContainer.classList.remove('with-notification');
}

init().catch((err) => {
  console.error(err);
  showNotification('Erro ao iniciar interface do overlay.', 'warning');
});
