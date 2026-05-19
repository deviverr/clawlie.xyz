import { Tile, TileType } from '../../types';
import { EventManager } from '../../core/EventManager';
import { Random } from '../../utils/Random';

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
  private random: Random;
  
  public tileSize: number = 32;
  private locations: Map<string, MapLocation> = new Map();
  private _currentLocationId: string = 'farm';
  private _worldSeed: number = 0;

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this._worldSeed = Math.floor(Math.random() * 1000000);
    this.random = new Random(this._worldSeed);
    this.initializeLocations();
  }

  public setSeed(seed: number): void {
      this._worldSeed = seed;
      this.random = new Random(seed);
      this.locations.clear();
      this.initializeLocations();
  }

  public get worldSeed(): number {
      return this._worldSeed;
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
    const farmWidth = 160;
    const farmHeight = 160;
    const farm = this.createEmptyLocation('farm', 'Your Farm', farmWidth, farmHeight);
    this.generateComplexTerrain(farm, {
        base: TileType.GRASS,
        water: 0.02,
        stone: 0.01,
        forest: 0.08,
        sand: 0.01
    });
    // Starting clearing for player
    this.fillArea(farm, 40, 40, 20, 20, TileType.GRASS);
    this.drawBuilding(farm, 48, 48, 4, 4, 'home'); 
    
    const townExitX = Math.floor(farmWidth / 2);
    farm.exits.push({ x: townExitX, y: 0, targetLocationId: 'town', targetX: 60, targetY: 118 });
    farm.exits.push({ x: 50, y: 51, targetLocationId: 'house', targetX: 10, targetY: 13 });
    
    // Clean path to town
    for(let i=0; i<50; i++) {
        farm.tiles[townExitX][i].type = TileType.PATH;
        farm.tiles[townExitX+1][i].type = TileType.PATH;
    }
    this.locations.set('farm', farm);

    // 2. Town (120x120)
    const townWidth = 120;
    const townHeight = 120;
    const town = this.createEmptyLocation('town', 'Capital City', townWidth, townHeight);
    this.fillArea(town, 0, 0, townWidth, townHeight, TileType.GRASS);
    
    const roadCenter = Math.floor(townWidth / 2);
    // Roads
    this.fillArea(town, roadCenter - 5, 0, 10, townHeight, TileType.PATH);
    this.fillArea(town, 0, roadCenter - 5, townWidth, 10, TileType.PATH);
    
    // Central Plaza
    this.fillArea(town, roadCenter - 15, roadCenter - 15, 30, 30, TileType.STONE);

    // Key Buildings
    this.drawBuilding(town, roadCenter - 25, roadCenter - 25, 10, 8, 'casino');
    this.drawBuilding(town, roadCenter + 15, roadCenter - 25, 10, 8, 'shop');
    
    town.exits.push({ x: roadCenter, y: townHeight - 1, targetLocationId: 'farm', targetX: townExitX, targetY: 1 });
    town.exits.push({ x: roadCenter - 20, y: roadCenter - 18, targetLocationId: 'casino', targetX: 12, targetY: 18 });
    town.exits.push({ x: roadCenter + 20, y: roadCenter - 18, targetLocationId: 'shop_interior', targetX: 10, targetY: 13 });
    this.locations.set('town', town);

    // 3. House Interior
    const house = this.createEmptyLocation('house', 'Your Home', 20, 15);
    this.fillArea(house, 0, 0, 20, 15, TileType.WOOD);
    this.drawBorder(house, TileType.WALL);
    house.tiles[10][14].type = TileType.WOOD; // make exit passable
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
    casino.tiles[12][19].type = TileType.CARPET; // make exit passable
    casino.exits.push({ x: 12, y: 19, targetLocationId: 'town', targetX: 20, targetY: 23 });
    this.locations.set('casino', casino);

    // 5. Shop Interior
    const shopInterior = this.createEmptyLocation('shop_interior', 'General Store', 20, 15);
    this.fillArea(shopInterior, 0, 0, 20, 15, TileType.WOOD);
    this.drawBorder(shopInterior, TileType.WALL);
    shopInterior.tiles[10][14].type = TileType.WOOD; // make exit passable
    shopInterior.exits.push({ x: 10, y: 14, targetLocationId: 'town', targetX: 60, targetY: 23 });
    this.locations.set('shop_interior', shopInterior);
  }

  private generateComplexTerrain(loc: MapLocation, config: any): void {
      for (let x = 0; x < loc.width; x++) {
          for (let y = 0; y < loc.height; y++) {
              const r = this.random.next();
              // Determine Biome base
              if (r < config.water) loc.tiles[x][y].type = TileType.WATER;
              else if (r < config.water + config.forest) loc.tiles[x][y].type = TileType.FOREST;
              else if (r < config.water + config.forest + config.stone) loc.tiles[x][y].type = TileType.STONE;
              else if (r < config.water + config.forest + config.stone + config.sand) loc.tiles[x][y].type = TileType.SAND;
              else loc.tiles[x][y].type = config.base;
          }
      }

      // Add "Oasis" or "Hot spots" based on seed
      const hotSpotCount = this.random.nextInt(3, 8);
      for (let i = 0; i < hotSpotCount; i++) {
          const hx = this.random.nextInt(10, loc.width - 10);
          const hy = this.random.nextInt(10, loc.height - 10);
          const radius = this.random.nextInt(5, 12);
          for (let x = hx - radius; x < hx + radius; x++) {
              for (let y = hy - radius; y < hy + radius; y++) {
                  if (this.isWithin(loc, x, y) && Math.hypot(x - hx, y - hy) < radius) {
                      if (this.random.next() > 0.3) loc.tiles[x][y].type = TileType.SAND;
                  }
              }
          }
      }

      // Deepen smoothing (Cellular Automata)
      for(let i=0; i<6; i++) this.smoothTerrain(loc);
      
      // Carve random paths through the world
      for(let p=0; p<15; p++) {
          let cx = this.random.nextInt(0, loc.width);
          let cy = this.random.nextInt(0, loc.height);
          for(let steps=0; steps<50; steps++) {
               if(this.isWithin(loc, cx, cy)) {
                   loc.tiles[cx][cy].type = TileType.PATH;
                   // widen the path randomly
                   if (this.random.next() > 0.5 && this.isWithin(loc, cx+1, cy)) loc.tiles[cx+1][cy].type = TileType.PATH;
                   if (this.random.next() > 0.5 && this.isWithin(loc, cx, cy+1)) loc.tiles[cx][cy+1].type = TileType.PATH;
               }
               cx += this.random.next() > 0.5 ? 1 : -1;
               cy += this.random.next() > 0.5 ? 1 : -1;
          }
      }

      // Post-process: Add some trees in forests and desert decorations
      for (let x = 0; x < loc.width; x++) {
          for (let y = 0; y < loc.height; y++) {
              const tile = loc.tiles[x][y];
              if (tile.type === TileType.FOREST && this.random.next() > 0.55) {
                  tile.type = TileType.TREE;
              }
              if (tile.type === TileType.SAND && this.random.next() > 0.95) {
                  // Cactus placeholder - reuse stone or specific type if we add it. 
                  // For now let's just make sure it stays sand.
              }
              // Deep water in center of lakes
              if (tile.type === TileType.WATER) {
                  let waterNeighbors = 0;
                  for(let dx=-1; dx<=1; dx++) {
                      for(let dy=-1; dy<=1; dy++) {
                          if (this.isWithin(loc, x+dx, y+dy) && loc.tiles[x+dx][y+dy].type === TileType.WATER) waterNeighbors++;
                      }
                  }
                  if (waterNeighbors === 9) tile.type = TileType.DEEP_WATER;
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

  public get currentLocationId(): string {
      return this._currentLocationId;
  }

  public getCurrentLocation(): MapLocation {
    return this.locations.get(this._currentLocationId)!;
  }

  public switchLocation(locationId: string, targetX: number, targetY: number): void {
    if (this.locations.has(locationId)) {
      this._currentLocationId = locationId;
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
    return { currentLocationId: this._currentLocationId, locations: locs };
  }

  public deserialize(data: any): void {
    if (!data) return;
    this._currentLocationId = data.currentLocationId || 'farm';
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
