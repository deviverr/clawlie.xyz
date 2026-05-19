import { EventManager } from '../../core/EventManager';
import { WorldManager } from './WorldManager';
import { TileType } from '../../types';

export class FishingManager {
  private static instance: FishingManager;
  private eventManager: EventManager;
  private worldManager: WorldManager;

  private isFishing: boolean = false;
  private castX: number = 0;
  private castY: number = 0;
  private biteTimer: number | null = null;

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.worldManager = WorldManager.getInstance();
  }

  public static getInstance(): FishingManager {
    if (!FishingManager.instance) {
      FishingManager.instance = new FishingManager();
    }
    return FishingManager.instance;
  }

  public cast(x: number, y: number): boolean {
    const tile = this.worldManager.getTile(x, y);
    if (!tile || (tile.type !== TileType.WATER && tile.type !== TileType.DEEP_WATER)) {
      return false;
    }

    this.isFishing = true;
    this.castX = x;
    this.castY = y;
    
    const waitTime = 2000 + Math.random() * 5000;
    this.biteTimer = window.setTimeout(() => this.onBite(), waitTime);
    
    this.eventManager.emit('FISHING_CAST', { x, y });
    return true;
  }

  private onBite(): void {
    if (!this.isFishing) return;
    this.eventManager.emit('FISHING_BITE');
    
    // Give player 1.5 seconds to reel in
    this.biteTimer = window.setTimeout(() => {
        if (this.isFishing) {
            this.isFishing = false;
            this.eventManager.emit('FISHING_LOST');
        }
    }, 1500);
  }

  public reel(): string | null {
    if (!this.isFishing) return null;
    
    this.isFishing = false;
    if (this.biteTimer) {
        clearTimeout(this.biteTimer);
        this.biteTimer = null;
    }

    const fishTypes = ['bass', 'trout', 'salmon', 'junk', 'treasure'];
    const caught = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    
    this.eventManager.emit('FISHING_CAUGHT', caught);
    return caught;
  }

  public cancel(): void {
    this.isFishing = false;
    if (this.biteTimer) {
        clearTimeout(this.biteTimer);
        this.biteTimer = null;
    }
  }

  public get fishingState() {
      return { isFishing: this.isFishing, x: this.castX, y: this.castY };
  }
}
