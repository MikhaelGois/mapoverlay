import { EventEmitter } from 'events';
import { DetectedGame, GameConfig } from '../shared/types';
import gameConfigs from '../shared/gameConfig.json';

const POLL_INTERVAL_MS = 5000;

export class GameDetector extends EventEmitter {
  private intervalId: NodeJS.Timeout | null = null;
  private currentGame: DetectedGame | null = null;
  private processMap: Map<string, GameConfig> = new Map();

  constructor() {
    super();
    // Build a lowercase process name → config map for O(1) lookup
    for (const config of gameConfigs as GameConfig[]) {
      for (const proc of config.processes) {
        this.processMap.set(proc.toLowerCase(), config);
      }
    }
  }

  start(): void {
    if (this.intervalId) return;
    this.poll(); // immediate first check
    this.intervalId = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    console.log('[GameDetector] Started polling every', POLL_INTERVAL_MS, 'ms');
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async poll(): Promise<void> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const psList = require('ps-list') as (options?: object) => Promise<Array<{ name: string; pid: number; cmd?: string }>>;
        const processes = await psList();

      let found: DetectedGame | null = null;

      for (const proc of processes) {
        const nameLower = (proc.name ?? '').toLowerCase();
        const config = this.processMap.get(nameLower);
        if (config) {
          found = {
            config,
            pid: proc.pid,
            executablePath: (proc as { cmd?: string }).cmd ?? proc.name ?? '',
          };
          break;
        }
      }

      if (found && (!this.currentGame || this.currentGame.pid !== found.pid)) {
        this.currentGame = found;
        console.log('[GameDetector] Detected game:', found.config.name, 'PID:', found.pid);
        this.emit('detected', found);
      } else if (!found && this.currentGame) {
        console.log('[GameDetector] Game lost:', this.currentGame.config.name);
        this.currentGame = null;
        this.emit('lost');
      }
    } catch (err) {
      console.error('[GameDetector] Poll error:', err);
    }
  }

  getCurrentGame(): DetectedGame | null {
    return this.currentGame;
  }
}
