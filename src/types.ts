// Global Types

export enum TileType {
  GRASS = 'grass',
  SOIL = 'soil',
  WATER = 'water',
  STONE = 'stone',
  WOOD = 'wood',
  CARPET = 'carpet',
  WALL = 'wall',
  FLOOR = 'floor',
  CASINO_TABLE = 'casino_table',
  TREE = 'tree',
  SAND = 'sand',
  FOREST = 'forest',
  DEEP_WATER = 'deep_water'
}

export interface Tile {
  x: number; // Grid X
  y: number; // Grid Y
  type: TileType;
  cropId: string | null;
  cropStage: number; // 0 to maxStage
  waterLevel: number; // 0 to 100
  lastWatered: number; // Timestamp
  isTilled: boolean;
}

export interface CropConfig {
  id: string;
  name: string;
  stages: number; // How many growth stages (e.g. 4: Seed -> Sprout -> Small -> Mature)
  growthTime: number; // Seconds per stage
  harvestYield: number; // Min yield
  sellPrice: number;
  seedPrice: number;
  season: string[]; // ['spring', 'summer']
}

export interface Item {
  id: string;
  name: string;
  type: 'seed' | 'crop' | 'tool' | 'material';
  icon: string; // Asset key
  description: string;
}

export interface PlayerState {
  inventory: { [itemId: string]: number };
  money: number;
  xp: number;
  level: number;
}
