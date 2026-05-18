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
  }

  public static getInstance(): QuestManager {
    if (!QuestManager.instance) {
      QuestManager.instance = new QuestManager();
    }
    return QuestManager.instance;
  }

  public addQuest(quest: Quest): void {
    this.activeQuests.push(quest);
    this.eventManager.emit('QUEST_ADDED', quest);
  }

  private checkProgress(type: string, target: string): void {
    this.activeQuests.forEach(quest => {
      if (quest.isCompleted) return;

      const requirement = quest.requirements.find(r => r.type === type && r.target === target);
      if (requirement) {
         // Check total inventory or cumulative action
         // For now, let's just check inventory
         const count = this.inventoryManager.getCount(target);
         if (count >= requirement.count) {
           this.completeQuest(quest.id);
         }
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
}
