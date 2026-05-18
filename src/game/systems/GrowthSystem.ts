import { EventManager } from '../../core/EventManager';
import { WorldManager } from '../managers/WorldManager';
import { CROPS } from '../../config/crops';

export class GrowthSystem {
  private world: WorldManager;
  private eventManager: EventManager;

  constructor() {
    this.world = WorldManager.getInstance();
    this.eventManager = EventManager.getInstance();
    
    this.eventManager.on<number>('HOUR_PASS', (hour) => this.onHourPass(hour));
  }

  private onHourPass(_hour: number): void {
    // Iterate all tiles (Simple approach)
    for (let x = 0; x < this.world.width; x++) {
      for (let y = 0; y < this.world.height; y++) {
        const tile = this.world.getTile(x, y);
        if (!tile || !tile.cropId) continue;

        const config = CROPS[tile.cropId];
        if (!config) continue;

        if (tile.waterLevel > 0) {
          if (tile.cropStage < config.stages) {
            this.world.setTile(x, y, { cropStage: tile.cropStage + 1 });
          }

          this.world.setTile(x, y, { waterLevel: Math.max(0, tile.waterLevel - 25) });
        }
      }
    }
  }
}
