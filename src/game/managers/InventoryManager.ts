import { EventManager } from '../../core/EventManager';

export class InventoryManager {
  private static instance: InventoryManager;
  private eventManager: EventManager;
  private items: Map<string, number>; // ItemId -> Quantity

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.items = new Map();
    // Starter items
    this.addItem('wheat_seed', 5);
    this.addItem('corn_seed', 2);
  }

  public static getInstance(): InventoryManager {
    if (!InventoryManager.instance) {
      InventoryManager.instance = new InventoryManager();
    }
    return InventoryManager.instance;
  }

  public addItem(itemId: string, amount: number = 1): void {
    const current = this.items.get(itemId) || 0;
    this.items.set(itemId, current + amount);
    this.eventManager.emit('INVENTORY_CHANGED', this.items);
  }

  public removeItem(itemId: string, amount: number = 1): boolean {
    const current = this.items.get(itemId) || 0;
    if (current < amount) return false;
    
    this.items.set(itemId, current - amount);
    if (this.items.get(itemId) === 0) {
      this.items.delete(itemId);
    }
    this.eventManager.emit('INVENTORY_CHANGED', this.items);
    return true;
  }

  public hasItem(itemId: string, amount: number = 1): boolean {
    const current = this.items.get(itemId) || 0;
    return current >= amount;
  }

  public getCount(itemId: string): number {
    return this.items.get(itemId) || 0;
  }
  
  public getItems(): Map<string, number> {
    return this.items;
  }

  public loadState(items: Map<string, number>): void {
    this.items = items;
    this.eventManager.emit('INVENTORY_CHANGED', this.items);
  }
}
