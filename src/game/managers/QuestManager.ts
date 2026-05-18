import { EventManager } from '../../core/EventManager';
import { InventoryManager } from './InventoryManager';
import { EconomyManager } from './EconomyManager';

export interface Quest {
  id: string;
  title: string;
  description: string;
  requirements: { type: string; target: string; count: number }[];
  rewards: { type: string; id?: string; amount: number }[];
  isCompleted: boolean;
  progress?: Record<string, number>;
}

export class QuestManager {
  private static instance: QuestManager;
  private eventManager: EventManager;
  private inventoryManager: InventoryManager;
  private economyManager: EconomyManager;

  private activeQuests: Quest[] = [];

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.inventoryManager = InventoryManager.getInstance();
    this.economyManager = EconomyManager.getInstance();

    this.eventManager.on('CROP_HARVESTED', (cropId: string) => this.checkProgress('harvest', cropId));
    this.eventManager.on('ITEM_SOLD', (itemId: string) => this.checkProgress('sell', itemId));
    this.eventManager.on('SEED_BOUGHT', (itemId: string) => this.checkProgress('buy_seed', itemId));
    this.eventManager.on('ANIMAL_PRODUCT_COLLECTED', (itemId: string) => this.checkProgress('collect_product', itemId));
  }

  public static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  public addQuest(quest: Quest): void {
    quest.progress ||= {};
    this.activeQuests.push(quest);
    this.eventManager.emit('QUEST_ADDED', quest);
  }

  private checkProgress(type: string, target: string): void {
    this.activeQuests.forEach(quest => {
      if (quest.isCompleted) return;

      const requirement = quest.requirements.find(r => r.type === type && (r.target === target || r.target === 'any'));
      if (requirement) {
         const key = this.getRequirementKey(requirement);
         quest.progress ||= {};
         quest.progress[key] = Math.min(requirement.count, (quest.progress[key] || 0) + 1);
         if (this.isQuestReady(quest)) this.completeQuest(quest.id);
      }
    });
  }

  public completeQuest(id: string): void {
    const quest = this.activeQuests.find(q => q.id === id);
    if (quest && !quest.isCompleted) {
      quest.isCompleted = true;
      
      // Give rewards
      quest.rewards.forEach(reward => {
        if (reward.type === 'money') {
          this.economyManager.addMoney(reward.amount);
        } else if (reward.type === 'item') {
          this.inventoryManager.addItem(reward.id!, reward.amount);
        }
      });

      this.eventManager.emit('QUEST_COMPLETED', quest);
      console.log(`Quest Completed: ${quest.title}`);
    }
  }

  public getActiveQuests(): Quest[] {
    return this.activeQuests;
  }

  public getProgress(quest: Quest, requirement: { type: string; target: string; count: number }): number {
    return Math.min(requirement.count, quest.progress?.[this.getRequirementKey(requirement)] || 0);
  }

  public serialize(): Quest[] {
    return this.activeQuests.map(quest => ({
      ...quest,
      requirements: quest.requirements.map(requirement => ({ ...requirement })),
      rewards: quest.rewards.map(reward => ({ ...reward })),
      progress: { ...(quest.progress || {}) }
    }));
  }

  public deserialize(quests: Quest[]): void {
    if (!Array.isArray(quests)) return;
    this.activeQuests = quests.map(quest => ({
      ...quest,
      progress: { ...(quest.progress || {}) }
    }));
    this.eventManager.emit('QUEST_ADDED', this.activeQuests);
  }

  private isQuestReady(quest: Quest): boolean {
    return quest.requirements.every(requirement => this.getProgress(quest, requirement) >= requirement.count);
  }

  private getRequirementKey(requirement: { type: string; target: string }): string {
    return `${requirement.type}:${requirement.target}`;
  }
}
