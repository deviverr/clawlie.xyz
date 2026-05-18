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
      x: 400,
      y: 400,
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
      x: 800,
      y: 300,
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

  public update(_dt: number): void {
    // Basic NPC wandering
    this.npcs.forEach(npc => {
      if (Math.random() < 0.005) {
        npc.x += (Math.random() - 0.5) * 50;
        npc.y += (Math.random() - 0.5) * 50;
      }
    });
  }
}
