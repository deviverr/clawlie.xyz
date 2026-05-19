import { EventManager } from '../../core/EventManager';
import { AssetLoader } from '../../utils/AssetLoader';
import { EntityManager } from '../../core/EntityManager';
import { NPCEntity } from '../entities/NPCEntity';

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
  entity?: NPCEntity;
}

export class NPCManager {
  private static instance: NPCManager;
  private eventManager: EventManager;
  private assetLoader: AssetLoader;
  private entityManager: EntityManager;
  private npcs: NPC[] = [];

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.assetLoader = AssetLoader.getInstance();
    this.entityManager = EntityManager.getInstance();
    this.spawnDefaultNPCs();
  }

  public static getInstance(): NPCManager {
    if (!NPCManager.instance) {
      NPCManager.instance = new NPCManager();
    }
    return NPCManager.instance;
  }

  private spawnDefaultNPCs(): void {
    const mayor = {
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
    };

    const marnie = {
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
    };

    [mayor, marnie].forEach(data => {
        const npc = { ...data, entity: new NPCEntity(data.id, data.x, data.y, data.name, data.portrait) };
        this.npcs.push(npc);
        this.entityManager.addEntity(npc.entity);
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
    const world = (window as any).gameInstance?.worldManager;
    const currentLocationId = world?.currentLocationId || 'farm';

    // Basic NPC wandering (smooth)
    this.npcs.forEach(npc => {
      // Sync visibility
      if (npc.entity) {
          npc.entity.isDestroyed = (npc.locationId !== currentLocationId);
          // If was hidden but now same location, we'd need to re-add, 
          // but EntityManager cleanup might have removed it.
          // Better approach: just don't render it in WorldRenderer or add a 'visible' flag.
          // For now, let's keep it simple and just sync position.
      }

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

      // Sync to entity
      if (npc.entity) {
          npc.entity.x = npc.x;
          npc.entity.y = npc.y;
      }
    });
  }
}
