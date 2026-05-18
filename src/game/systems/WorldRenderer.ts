import { CanvasRenderer } from '../../renderer/CanvasRenderer';
import { WorldManager } from '../managers/WorldManager';
import { TileType } from '../../types';
import { AnimalsManager } from '../managers/AnimalsManager';
import { NPCManager } from '../managers/NPCManager';
import { TimeManager } from '../managers/TimeManager';
import { AssetLoader } from '../../utils/AssetLoader';

export class WorldRenderer {
  private world: WorldManager;
  private renderer: CanvasRenderer;
  private animalsManager: AnimalsManager;
  private npcManager: NPCManager;
  private timeManager: TimeManager;
  private assetLoader: AssetLoader;
  private readonly characterSize = 64;

  // Cache colors
  private colors: Record<TileType, string> = {
    [TileType.GRASS]: '#4CAF50',
    [TileType.SOIL]: '#795548',
    [TileType.WATER]: '#2196F3',
    [TileType.STONE]: '#9E9E9E',
    [TileType.WOOD]: '#A1887F',
    [TileType.CARPET]: '#E91E63',
    [TileType.WALL]: '#424242',
    [TileType.FLOOR]: '#BDBDBD',
    [TileType.CASINO_TABLE]: '#2E7D32',
    [TileType.TREE]: '#2E7D32',
    [TileType.FOREST]: '#1B5E20',
    [TileType.SAND]: '#F0E68C',
    [TileType.DEEP_WATER]: '#0D47A1',
    [TileType.PATH]: '#D7CCC8'
  };

  constructor(renderer: CanvasRenderer) {
    this.renderer = renderer;
    this.world = WorldManager.getInstance();
    this.animalsManager = AnimalsManager.getInstance();
    this.npcManager = NPCManager.getInstance();
    this.timeManager = TimeManager.getInstance();
    this.assetLoader = AssetLoader.getInstance();
  }

  public render(game: any): void {
    const ctx = this.renderer.getContext();
    const camera = this.renderer.camera;
    const tileSize = this.world.tileSize;

    // Culling: Calculate visible tile range
    const topLeft = camera.screenToWorld(0, 0);
    const bottomRight = camera.screenToWorld(camera.viewportWidth, camera.viewportHeight);

    const startX = Math.max(0, Math.floor(topLeft.x / tileSize) - 1);
    const startY = Math.max(0, Math.floor(topLeft.y / tileSize) - 1);
    const endX = Math.min(this.world.width, Math.ceil(bottomRight.x / tileSize) + 1);
    const endY = Math.min(this.world.height, Math.ceil(bottomRight.y / tileSize) + 1);

    // 1. Draw Tiles
    for (let x = startX; x < endX; x++) {
      for (let y = startY; y < endY; y++) {
        const tile = this.world.getTile(x, y);
        if (!tile) continue;

        const screenX = x * tileSize;
        const screenY = y * tileSize;

        this.renderer.drawRect(screenX, screenY, tileSize, tileSize, this.colors[tile.type]);

        if (tile.type === TileType.SOIL && tile.isTilled) {
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.fillRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
        }

        if (tile.waterLevel > 0) {
          ctx.fillStyle = 'rgba(33, 150, 243, 0.3)';
          ctx.fillRect(screenX, screenY, tileSize, tileSize);
        }

        if (tile.cropId) {
          const cropColors: Record<string, string> = {
            wheat: '#f6d365',
            corn: '#ffd54f',
            carrot: '#ff8a3d'
          };
          ctx.fillStyle = cropColors[tile.cropId] || '#8BC34A';
          const size = Math.min(tileSize - 6, 8 + tile.cropStage * 6);
          const offset = (tileSize - size) / 2;
          ctx.fillRect(screenX + offset, screenY + tileSize - offset - size, size, size);
          ctx.fillStyle = '#2E7D32';
          ctx.fillRect(screenX + tileSize / 2 - 2, screenY + tileSize - offset - size - 6, 4, 8);
        }
      }
    }

    // 2. Draw Remote Players
    const mpManager = (window as any).gameInstance._multiplayerManager;
    if (mpManager) {
        mpManager.getRemotePlayers().forEach((p: any) => {
            const sprite = this.assetLoader.getImage(p.skin);
            if (sprite) {
                this.drawCharacterSprite(sprite, p.x, p.y);
            }
            ctx.fillStyle = 'white';
            ctx.font = '8px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText(p.username, p.x, p.y - 20);
        });
    }

    // 3. Draw NPCs
    this.npcManager.getNPCs().filter(npc => npc.locationId === this.world.currentLocationId).forEach(npc => {
      const npcSprite = this.assetLoader.getImage('player_red'); 
      if (npcSprite) {
        this.drawCharacterSprite(npcSprite, npc.x, npc.y);
      }
      ctx.fillStyle = '#ffca28';
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = 'center';
      ctx.fillText(npc.name, npc.x, npc.y - 20);
    });

    // 4. Draw Player
    const playerSprite = this.assetLoader.getImage(game.playerSkin);
    if (playerSprite) {
       this.drawCharacterSprite(playerSprite, game.playerX, game.playerY);
    }
    ctx.fillStyle = '#4CAF50';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(game.username || 'YOU', game.playerX, game.playerY - 20);

    // 4. Draw Animals
    this.animalsManager.getAnimals().forEach(animal => {
      let color = '#FFFFFF';
      let accent = '#fbc02d';
      if (animal.type === 'cow') {
        color = '#A1887F';
        accent = '#3e2723';
      }
      if (animal.type === 'sheep') {
        color = '#E0E0E0';
        accent = '#9E9E9E';
      }

      ctx.fillStyle = color;
      ctx.fillRect(animal.x - 18, animal.y - 14, 28, 20);
      ctx.fillRect(animal.x + 6, animal.y - 20, 16, 16);
      ctx.fillStyle = accent;
      ctx.fillRect(animal.x + 14, animal.y - 15, 3, 3);
      ctx.fillRect(animal.x - 14, animal.y + 6, 5, 8);
      ctx.fillRect(animal.x + 4, animal.y + 6, 5, 8);
      
      if (animal.isProductive) {
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(animal.x, animal.y - 15, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. Day/Night Overlay
    this.drawDayNightOverlay(ctx);
  }

  private drawDayNightOverlay(ctx: CanvasRenderingContext2D): void {
    const hour = this.timeManager.hour;
    let opacity = 0;

    if (hour >= 20 || hour < 5) opacity = 0.4; // Night
    else if (hour >= 18) opacity = (hour - 18) / 2 * 0.4; // Sunset
    else if (hour < 7) opacity = (7 - hour) / 2 * 0.4; // Sunrise

    if (opacity > 0) {
      ctx.save();
      this.renderer.resetTransform();
      ctx.fillStyle = `rgba(0, 0, 50, ${opacity})`;
      ctx.fillRect(0, 0, this.renderer.viewportWidth, this.renderer.viewportHeight);
      ctx.restore();
    }
  }

  private drawCharacterSprite(sprite: HTMLImageElement, x: number, y: number): void {
    this.renderer.drawSprite(
      sprite,
      0,
      0,
      32,
      32,
      x - this.characterSize / 2,
      y - this.characterSize + 12,
      this.characterSize,
      this.characterSize
    );
  }
}
