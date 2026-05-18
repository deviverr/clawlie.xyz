import { EventManager } from '../../core/EventManager';

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  currency: 'gold' | 'gems';
  category: 'cosmetic' | 'boost' | 'expansion';
}

export class MonetizationManager {
  private static instance: MonetizationManager;
  private eventManager: EventManager;

  private premiumCurrency: number = 0;
  private shopItems: ShopItem[] = [
    { id: 'skin_golden_hoe', name: 'Golden Hoe Skin', price: 100, currency: 'gems', category: 'cosmetic' },
    { id: 'boost_growth_2x', name: '2x Growth Boost (1h)', price: 50, currency: 'gems', category: 'boost' },
    { id: 'expand_farm_small', name: 'Farm Expansion (+10x10)', price: 5000, currency: 'gold', category: 'expansion' }
  ];

  private constructor() {
    this.eventManager = EventManager.getInstance();
  }

  public static getInstance(): MonetizationManager {
    if (!MonetizationManager.instance) {
      MonetizationManager.instance = new MonetizationManager();
    }
    return MonetizationManager.instance;
  }

  public getPremiumCurrency(): number {
    return this.premiumCurrency;
  }

  public addPremiumCurrency(amount: number): void {
    this.premiumCurrency += amount;
    this.eventManager.emit('PREMIUM_CURRENCY_CHANGED', this.premiumCurrency);
  }

  public getShopItems(): ShopItem[] {
    return this.shopItems;
  }

  public purchaseItem(itemId: string): boolean {
    const item = this.shopItems.find(i => i.id === itemId);
    if (!item) return false;

    if (item.currency === 'gems') {
      if (this.premiumCurrency >= item.price) {
        this.premiumCurrency -= item.price;
        this.eventManager.emit('PREMIUM_CURRENCY_CHANGED', this.premiumCurrency);
        this.eventManager.emit('PURCHASE_SUCCESS', item);
        return true;
      }
    }
    // Gold handled by EconomyManager (simulated integration)
    return false;
  }

  public watchRewardedAd(callback: (success: boolean) => void): void {
    console.log('[Ad] Showing Rewarded Video...');
    setTimeout(() => {
       console.log('[Ad] Ad Finished!');
       this.addPremiumCurrency(5);
       callback(true);
    }, 2000);
  }
}
