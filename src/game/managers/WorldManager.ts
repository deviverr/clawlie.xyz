import { Tile, TileType } from '../../types';
import { EventManager } from '../../core/EventManager';

export interface MapLocation {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
  exits: MapExit[];
}

export interface MapExit {
  x: number;
  y: number;
  targetLocationId: string;
  targetX: number;
  targetY: number;
}

export class WorldManager {
  private static instance: WorldManager;
  private eventManager: EventManager;
  
  public tileSize: number = 32;
  private locations: Map<string, MapLocation> = new Map();
  private currentLocationId: string = 'farm';

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.initializeLocations();
  }

  public static getInstance(): WorldManager {
    if (!WorldManager.instance) {
      WorldManager.instance = new WorldManager();
    }
    return WorldManager.instance;
  }

  private createEmptyLocation(id: string, name: string, w: number, h: number): MapLocation {
    const tiles: Tile[][] = [];
    for (let x = 0; x < w; x++) {
      tiles[x] = [];
      for (let y = 0; y < h; y++) {
        tiles[x][y] = {
          x, y, type: TileType.GRASS, cropId: null, cropStage: 0,
          waterLevel: 0, lastWatered: 0, isTilled: false
        };
      }
    }
    return { id, name, width: w, height: h, tiles, exits: [] };
  }

  private initializeLocations(): void {
    // 1. Farm (100x100)
    const farm = this.createEmptyLocation('farm', 'Your Farm', 80, 80);
    this.generateComplexTerrain(farm, {
        base: TileType.GRASS,
        water: 0.02,
        stone: 0.01,
        forest: 0.08,
        sand: 0.01
    });
    // Starting clearing for player
    this.fillArea(farm, 35, 35, 10, 10, TileType.GRASS);
    this.drawBuilding(farm, 38, 38, 4, 4, 'home'); 
    farm.exits.push({ x: 40, y: 0, targetLocationId: 'town', targetX: 40, targetY: 78 });
    farm.exits.push({ x: 40, y: 41, targetLocationId: 'house', targetX: 10, targetY: 13 });
    this.locations.set('farm', farm);

    // 2. Town (80x80)
    const town = this.createEmptyLocation('town', 'Capital City', 80, 80);
    this.fillArea(town, 0, 0, 80, 80, TileType.STONE);
    // Roads
    this.fillArea(town, 35, 0, 10, 80, TileType.FLOOR);
    this.fillArea(town, 0, 35, 80, 10, TileType.FLOOR);
    
    // City Districts
    this.drawCityBlock(town, 5, 5, 25, 25);
    this.drawCityBlock(town, 50, 5, 25, 25);
    this.drawCityBlock(town, 5, 50, 25, 25);
    this.drawCityBlock(town, 50, 50, 25, 25);

    // Key Buildings
    this.drawBuilding(town, 15, 15, 10, 8, 'casino');
    this.drawBuilding(town, 55, 15, 10, 8, 'shop');
    
    town.exits.push({ x: 40, y: 79, targetLocationId: 'farm', targetX: 40, targetY: 1 });
    town.exits.push({ x: 20, y: 22, targetLocationId: 'casino', targetX: 12, targetY: 18 });
    town.exits.push({ x: 60, y: 22, targetLocationId: 'shop_interior', targetX: 10, targetY: 13 });
    this.locations.set('town', town);

    // 3. House Interior
    const house = this.createEmptyLocation('house', 'Your Home', 20, 15);
    this.fillArea(house, 0, 0, 20, 15, TileType.WOOD);
    this.drawBorder(house, TileType.WALL);
    house.exits.push({ x: 10, y: 14, targetLocationId: 'farm', targetX: 40, targetY: 42 });
    this.locations.set('house', house);

    // 4. Casino Interior
    const casino = this.createEmptyLocation('casino', 'Diamond Casino', 25, 20);
    this.fillArea(casino, 0, 0, 25, 20, TileType.CARPET);
    this.drawBorder(casino, TileType.WALL);
    for(let i=0; i<4; i++) {
        casino.tiles[6 + i*4][6].type = TileType.CASINO_TABLE;
        casino.tiles[6 + i*4][13].type = TileType.CASINO_TABLE;
    }
    casino.exits.push({ x: 12, y: 19, targetLocationId: 'town', targetX: 20, targetY: 23 });
    this.locations.set('casino', casino);

    // 5. Shop Interior
    const shopInterior = this.createEmptyLocation('shop_interior', 'General Store', 20, 15);
    this.fillArea(shopInterior, 0, 0, 20, 15, TileType.WOOD);
    this.drawBorder(shopInterior, TileType.WALL);
    shopInterior.exits.push({ x: 10, y: 14, targetLocationId: 'town', targetX: 60, targetY: 23 });
    this.locations.set('shop_interior', shopInterior);
  }

  private generateComplexTerrain(loc: MapLocation, config: any): void {
      for (let x = 0; x < loc.width; x++) {
          for (let y = 0; y < loc.height; y++) {
              const r = Math.random();
              if (r < config.water) loc.tiles[x][y].type = TileType.WATER;
              else if (r < config.water + config.forest) loc.tiles[x][y].type = TileType.FOREST;
              else if (r < config.water + config.forest + config.stone) loc.tiles[x][y].type = TileType.STONE;
              else if (r < config.water + config.forest + config.stone + config.sand) loc.tiles[x][y].type = TileType.SAND;
              else loc.tiles[x][y].type = config.base;
          }
      }
      for(let i=0; i<4; i++) this.smoothTerrain(loc);
      // Post-process: Add some trees in forests
      for (let x = 0; x < loc.width; x++) {
          for (let y = 0; y < loc.height; y++) {
              if (loc.tiles[x][y].type === TileType.FOREST && Math.random() > 0.7) {
                  loc.tiles[x][y].type = TileType.TREE;
              }
          }
      }
  }

  private smoothTerrain(loc: MapLocation): void {
      const newTiles = JSON.parse(JSON.stringify(loc.tiles));
      for (let x = 1; x < loc.width - 1; x++) {
          for (let y = 1; y < loc.height - 1; y++) {
              const neighbors = this.getNeighborTypes(loc, x, y);
              const counts: any = {};
              neighbors.forEach(t => counts[t] = (counts[t] || 0) + 1);
              const mostCommon = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
              if (counts[mostCommon] >= 4) newTiles[x][y].type = mostCommon;
          }
      }
      loc.tiles = newTiles;
  }

  private drawCityBlock(loc: MapLocation, x: number, y: number, w: number, h: number): void {
      this.fillArea(loc, x, y, w, h, TileType.STONE);
      this.drawBorderArea(loc, x, y, w, h, TileType.WALL);
  }

  private drawBorderArea(loc: MapLocation, x: number, y: number, w: number, h: number, type: TileType): void {
      for(let i=x; i<x+w; i++) {
          if(this.isWithin(loc, i, y)) loc.tiles[i][y].type = type;
          if(this.isWithin(loc, i, y+h-1)) loc.tiles[i][y+h-1].type = type;
      }
      for(let j=y; j<y+h; j++) {
          if(this.isWithin(loc, x, j)) loc.tiles[x][j].type = type;
          if(this.isWithin(loc, x+w-1, j)) loc.tiles[x+w-1][j].type = type;
      }
  }

  private getNeighborTypes(loc: MapLocation, x: number, y: number): TileType[] {
      const types: TileType[] = [];
      for(let i=-1; i<=1; i++) {
          for(let j=-1; j<=1; j++) {
              if (i===0 && j===0) continue;
              types.push(loc.tiles[x+i][y+j].type);
          }
      }
      return types;
  }

  private fillArea(loc: MapLocation, x: number, y: number, w: number, h: number, type: TileType): void {
      for(let i=x; i<x+w; i++) {
          for(let j=y; j<y+h; j++) {
              if (this.isWithin(loc, i, j)) loc.tiles[i][j].type = type;
          }
      }
  }

  private drawBorder(loc: MapLocation, type: TileType): void {
      this.drawBorderArea(loc, 0, 0, loc.width, loc.height, type);
  }

  private drawBuilding(loc: MapLocation, x: number, y: number, w: number, h: number, _label: string): void {
      this.fillArea(loc, x, y, w, h, TileType.WALL);
      const doorX = x + Math.floor(w/2);
      const doorY = y + h - 1;
      if (this.isWithin(loc, doorX, doorY)) {
          loc.tiles[doorX][doorY].type = TileType.FLOOR;
      }
  }

  public isPassable(x: number, y: number): boolean {
      const tile = this.getTile(x, y);
      if (!tile) return false;
      const obstacles = [TileType.WALL, TileType.WATER, TileType.DEEP_WATER, TileType.TREE];
      return !obstacles.includes(tile.type);
  }

  public getCurrentLocation(): MapLocation {
    return this.locations.get(this.currentLocationId)!;
  }

  public switchLocation(locationId: string, targetX: number, targetY: number): void {
    if (this.locations.has(locationId)) {
      this.currentLocationId = locationId;
      this.eventManager.emit('LOCATION_CHANGED', { locationId, x: targetX, y: targetY });
    }
  }

  public getTile(x: number, y: number): Tile | null {
    const loc = this.getCurrentLocation();
    if (!this.isWithin(loc, x, y)) return null;
    return loc.tiles[x][y];
  }

  public setTile(x: number, y: number, data: Partial<Tile>): void {
    const loc = this.getCurrentLocation();
    if (this.isWithin(loc, x, y)) Object.assign(loc.tiles[x][y], data);
  }

  private isWithin(loc: MapLocation, x: number, y: number): boolean {
      return x >= 0 && x < loc.width && y >= 0 && y < loc.height;
  }

  public checkExit(x: number, y: number): MapExit | null {
      const loc = this.getCurrentLocation();
      return loc.exits.find(e => e.x === x && e.y === y) || null;
  }

  public serialize(): any {
    const locs: any = {};
    this.locations.forEach((loc, id) => {
        locs[id] = { width: loc.width, height: loc.height, tiles: loc.tiles };
    });
    return { currentLocationId: this.currentLocationId, locations: locs };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this.currentLocationId = data.currentLocationId || 'farm';
    if (data.locations) {
        Object.keys(data.locations).forEach(id => {
            const loc = this.locations.get(id);
            if (loc) loc.tiles = data.locations[id].tiles;
        });
    }
  }

  public get width(): number { return this.getCurrentLocation().width; }
  public get height(): number { return this.getCurrentLocation().height; }
}
