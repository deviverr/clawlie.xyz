import { WorldManager } from './WorldManager';
import { Tile, TileType } from '../../types';
import { CROPS } from '../../config/crops';

export class FarmManager {
  private static instance: FarmManager;
  private world: WorldManager;

  private constructor() {
    this.world = WorldManager.getInstance();
  }

  public static getInstance(): FarmManager {
    if (!FarmManager.instance) {
      FarmManager.instance = new FarmManager();
    }
    return FarmManager.instance;
  }

  public till(tile: Tile): boolean {
    if (tile.type === TileType.GRASS) {
      this.world.setTile(tile.x, tile.y, { type: TileType.SOIL, isTilled: true });
      return true;
    }
    return false;
  }

  public plant(tile: Tile, cropId: string): boolean {
    if (tile.type !== TileType.SOIL || !tile.isTilled || tile.cropId) {
      return false; // Can't plant
    }
    if (!CROPS[cropId]) return false;

    this.world.setTile(tile.x, tile.y, {
      cropId,
      cropStage: 0,
      waterLevel: 0, // Needs water to grow
    });
    return true;
  }

  public water(tile: Tile): boolean {
    if (tile.type === TileType.SOIL && tile.isTilled) {
      this.world.setTile(tile.x, tile.y, { waterLevel: 100 });
      return true;
    }
    return false;
  }

  public harvest(tile: Tile): string | null {
    if (!tile.cropId) return null;

    const config = CROPS[tile.cropId];
    if (tile.cropStage >= config.stages) {
      // Success!
      const harvestedCrop = tile.cropId;
      this.world.setTile(tile.x, tile.y, {
        cropId: null,
        cropStage: 0,
        waterLevel: 0,
        isTilled: false // Consumed soil? Maybe keep it tilled. Let's reset for now.
      });
      return harvestedCrop;
    }
    return null;
  }
}
