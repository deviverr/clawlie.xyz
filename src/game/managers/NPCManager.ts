import { EventManager } from '../../core/EventManager';
import { AssetLoader } from '../../utils/AssetLoader';

export interface NPC {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  locationId: string;
  dialogue: string[];
  portrait: string;
  currentQuest?: string;
}

export class NPCManager {
  private static instance: NPCManager;
  private eventManager: EventManager;
  private assetLoader: AssetLoader;
  private npcs: NPC[] = [];

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.assetLoader = AssetLoader.getInstance();
    this.spawnDefaultNPCs();
  }

  public static getInstance(): NPCManager {
    if (!NPCManager.instance) {
      NPCManager.instance = new NPCManager();
    }
    return NPCManager.instance;
  }

  private spawnDefaultNPCs(): void {
    this.npcs.push({
      id: 'mayor_lewis',
      name: 'Mayor Lewis',
      role: 'Town Mayor',
      x: 60 * 32,
      y: 60 * 32,
      locationId: 'town',
      portrait: this.assetLoader.resolveAssetPath('assets/sprites/blue_character/full_sprite_blue.png'),
      dialogue: [
        "Welcome to Clawlie.XYZ!",
        "It's a beautiful day for farming.",
        "How is your farm coming along?"
      ],
      currentQuest: 'first_harvest'
    });

    this.npcs.push({
      id: 'marnie',
      name: 'Marnie',
      role: 'Animal Specialist',
      x: 55 * 32,
      y: 45 * 32,
      locationId: 'farm',
      portrait: this.assetLoader.resolveAssetPath('assets/sprites/green_character/full_sprite_green.png'),
      dialogue: [
        "I love animals, don't you?",
        "Make sure to feed your chickens every day!",
        "If you need more hay, come visit me."
      ]
    });
  }

  public getNPCs(): NPC[] {
    return this.npcs;
  }

  public getNPC(id: string): NPC | undefined {
    return this.npcs.find(n => n.id === id);
  }

  public interact(id: string): string {
    const npc = this.getNPC(id);
    if (!npc) return "No one here...";
    
    const line = npc.dialogue[Math.floor(Math.random() * npc.dialogue.length)];
    this.eventManager.emit('NPC_INTERACTED', { id, name: npc.name, line });
    return line;
  }

  public update(dt: number): void {
    // Basic NPC wandering (smooth)
    this.npcs.forEach(npc => {
      // Create a target destination occasionally
      if (!(npc as any).targetX) {
         if (Math.random() < 0.01) {
             (npc as any).targetX = npc.x + (Math.random() - 0.5) * 100;
             (npc as any).targetY = npc.y + (Math.random() - 0.5) * 100;
         }
      } else {
         const dx = (npc as any).targetX - npc.x;
         const dy = (npc as any).targetY - npc.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         if (dist < 5) {
             (npc as any).targetX = null;
         } else {
             npc.x += (dx / dist) * 20 * dt;
             npc.y += (dy / dist) * 20 * dt;
         }
      }
    });
  }
}
