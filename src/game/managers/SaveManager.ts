import { MockBackend } from '../../services/MockBackend';
import { WorldManager } from './WorldManager';
import { InventoryManager } from './InventoryManager';
import { EconomyManager } from './EconomyManager';
import { TimeManager } from './TimeManager';

export class SaveManager {
  private static instance: SaveManager;
  private backend: MockBackend;
  
  // Dependencies
  private world: WorldManager;
  private inventory: InventoryManager;
  private economy: EconomyManager;
  private time: TimeManager;

  private constructor() {
    this.backend = MockBackend.getInstance();
    this.world = WorldManager.getInstance();
    this.inventory = InventoryManager.getInstance();
    this.economy = EconomyManager.getInstance();
    this.time = TimeManager.getInstance();

    // Auto-save every minute? Or manual.
    // Let's expose save/load.
  }

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public async saveGame(): Promise<boolean> {
    const data = {
      version: 1,
      timestamp: Date.now(),
      world: this.world.serialize(),
      inventory: Array.from(this.inventory.getItems().entries()),
      money: this.economy.getMoney(),
      time: {
        day: this.time.day,
        hour: this.time.hour,
        minute: this.time.minute
      }
    };
    return await this.backend.saveGame(data);
  }

  public async loadGame(): Promise<boolean> {
    const data = await this.backend.loadGame();
    if (!data) return false;

    console.log('Loading Save...', data);

    if (data.world) this.world.deserialize(data.world);
    
    if (data.inventory) {
      // Clear and rebuild inventory
      // We don't have a clean set method, so we might need to iterate or add one.
      // For now, let's assume InventoryManager needs a deserialize method or we hack it.
      // Cleaner: Add deserialize to InventoryManager.
      // Hack for now:
      const items = new Map<string, number>(data.inventory);
      // We need to inject this map into InventoryManager.
      // I'll add loadState method to InventoryManager.
      (this.inventory as any).loadState(items); 
    }

    if (data.money !== undefined) {
      // Need setMoney method or hack.
      // I'll add loadState to EconomyManager.
      (this.economy as any).loadState(data.money);
    }

    if (data.time) {
      this.time.day = data.time.day;
      this.time.hour = data.time.hour;
      this.time.minute = data.time.minute;
    }

    return true;
  }
}
