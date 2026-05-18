import { EventManager } from '../../core/EventManager';

export class EconomyManager {
  private static instance: EconomyManager;
  private eventManager: EventManager;
  private money: number = 100; // Starting money

  private constructor() {
    this.eventManager = EventManager.getInstance();
  }

  public static getInstance(): EconomyManager {
    if (!EconomyManager.instance) {
      EconomyManager.instance = new EconomyManager();
    }
    return EconomyManager.instance;
  }

  public addMoney(amount: number): void {
    this.money += amount;
    this.eventManager.emit('MONEY_CHANGED', this.money);
  }

  public spendMoney(amount: number): boolean {
    if (this.money >= amount) {
      this.money -= amount;
      this.eventManager.emit('MONEY_CHANGED', this.money);
      return true;
    }
    return false;
  }

  public getMoney(): number {
    return this.money;
  }

  public loadState(amount: number): void {
    this.money = amount;
    this.eventManager.emit('MONEY_CHANGED', this.money);
  }
}
