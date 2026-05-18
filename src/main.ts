import { GameLoop } from './core/GameLoop';
import { InputManager } from './core/InputManager';
import { CanvasRenderer } from './renderer/CanvasRenderer';
import { EventManager } from './core/EventManager';
import { WorldManager } from './game/managers/WorldManager';
import { WorldRenderer } from './game/systems/WorldRenderer';
import { TimeManager } from './game/managers/TimeManager';
import { FarmManager } from './game/managers/FarmManager';
import { GrowthSystem } from './game/systems/GrowthSystem';
import { InventoryManager } from './game/managers/InventoryManager';
import { EconomyManager } from './game/managers/EconomyManager';
import { UIManager } from './ui/UIManager';
import { TileType } from './types';
import { CROPS } from './config/crops';

import { SeasonManager } from './game/managers/SeasonManager';
import { WeatherManager, WeatherType } from './game/managers/WeatherManager';
import { AnimalsManager, AnimalType } from './game/managers/AnimalsManager';
import { NPCManager, NPC } from './game/managers/NPCManager';
import { CraftingManager } from './game/managers/CraftingManager';
import { QuestManager } from './game/managers/QuestManager';
import { MonetizationManager } from './game/managers/MonetizationManager';
import { AudioManager } from './core/AudioManager';
import { MultiplayerManager } from './game/managers/MultiplayerManager';
import { AssetLoader } from './utils/AssetLoader';

class Game {
  private loop: GameLoop;
  private renderer: CanvasRenderer;
  private input: InputManager;
  private eventManager: EventManager;
  private assetLoader: AssetLoader;
  
  private worldManager: WorldManager;
  private worldRenderer: WorldRenderer;
  
  private timeManager: TimeManager;
  private farmManager: FarmManager;
  private _growthSystem: GrowthSystem;
  private inventoryManager: InventoryManager;
  private economyManager: EconomyManager;
  private uiManager: UIManager;
  private _seasonManager: SeasonManager;
  private weatherManager: WeatherManager;
  private animalsManager: AnimalsManager;
  private npcManager: NPCManager;
  private _craftingManager: CraftingManager;
  private questManager: QuestManager;
  private _monetizationManager: MonetizationManager;
  private _audioManager: AudioManager;
  private _multiplayerManager: MultiplayerManager;

  // Temporary State
  public playerX: number;
  public playerY: number;
  public playerSkin: string = 'player_blue';
  public gameStarted: boolean = false;

  constructor() {
    this.renderer = new CanvasRenderer('game-canvas');
    this.input = InputManager.getInstance();
    this.input.setCanvas(this.renderer.getCanvas());
    this.eventManager = EventManager.getInstance();
    this.assetLoader = AssetLoader.getInstance();
    
    this.worldManager = WorldManager.getInstance();
    
    this.timeManager = TimeManager.getInstance();
    this.farmManager = FarmManager.getInstance();
    this._growthSystem = new GrowthSystem(); 
    this.inventoryManager = InventoryManager.getInstance();
    this.economyManager = EconomyManager.getInstance();
    this._seasonManager = SeasonManager.getInstance();
    this.weatherManager = WeatherManager.getInstance();
    
    // New Managers
    this.animalsManager = AnimalsManager.getInstance();
    this.npcManager = NPCManager.getInstance();
    this._craftingManager = CraftingManager.getInstance();
    this.questManager = QuestManager.getInstance();
    this._monetizationManager = MonetizationManager.getInstance();
    this._audioManager = AudioManager.getInstance();
    this._multiplayerManager = MultiplayerManager.getInstance();

    this.worldRenderer = new WorldRenderer(this.renderer);
    
    // UI Must be last so it can access other managers
    this.uiManager = UIManager.getInstance();

    // Start player in a safe spot
    this.playerX = 50 * this.worldManager.tileSize;
    this.playerY = 55 * this.worldManager.tileSize;

    // Handle Input Events for Interaction
    this.eventManager.on('INPUT_MOUSE_DOWN', (e: any) => this.handleInteraction(e));
    
        // Handle 'E' key for NPC interaction
        this.eventManager.on('INPUT_KEY_E_PRESSED', () => this.handleNPCInteraction());
    
        this.eventManager.on('LOCATION_CHANGED', (data: any) => {
        this.playerX = data.x * this.worldManager.tileSize;
        this.playerY = data.y * this.worldManager.tileSize;
        console.log(`Changed location to ${data.locationId}`);
    });

    this.loop = new GameLoop(
      (dt) => this.update(dt),
      (_alpha) => this.render(_alpha)
    );

    // Initial Animals for demo
    this.animalsManager.addAnimal(AnimalType.CHICKEN, this.playerX + 50, this.playerY + 50);
    this.animalsManager.addAnimal(AnimalType.COW, this.playerX - 100, this.playerY + 80);

    // Initial Quest
    this.questManager.addQuest({
      id: 'first_harvest',
      title: 'The First Harvest',
      description: 'Harvest your first crop to prove your farming skills.',
      requirements: [{ type: 'harvest', target: 'parsnip', count: 1 }],
      rewards: [{ type: 'money', amount: 500 }, { type: 'item', id: 'parsnip_seed', amount: 5 }],
      isCompleted: false
    });

    console.log('Farming Sim Engine Initialized');
  }

  public async start(): Promise<void> {
    await this.assetLoader.loadAll();
    this.loop.start();
  }

  private handleInteraction(e: { x: number, y: number, button: number }): void {
    const worldPos = this.renderer.camera.screenToWorld(e.x, e.y);
    const tileX = Math.floor(worldPos.x / this.worldManager.tileSize);
    const tileY = Math.floor(worldPos.y / this.worldManager.tileSize);

    // Check interaction with Animals or NPCs first
    const clickedAnimal = this.animalsManager.getAnimals().find(a => 
      Math.abs(a.x - worldPos.x) < 20 && Math.abs(a.y - worldPos.y) < 20
    );
    if (clickedAnimal) {
       if (clickedAnimal.isProductive) {
         const product = this.animalsManager.collectProduct(clickedAnimal.id);
         if (product) {
           this.inventoryManager.addItem(product, 1);
           console.log(`Collected ${product} from ${clickedAnimal.type}`);
         }
       } else {
         this.animalsManager.petAnimal(clickedAnimal.id);
         console.log(`Pet the ${clickedAnimal.type}`);
       }
       return;
    }

    const clickedNPC = this.npcManager.getNPCs().find(n => 
      Math.abs(n.x - worldPos.x) < 20 && Math.abs(n.y - worldPos.y) < 20
    );
    if (clickedNPC) {
      const line = this.npcManager.interact(clickedNPC.id);
      this.uiManager.showDialogue(clickedNPC.id, line);
      return;
    }

    const tile = this.worldManager.getTile(tileX, tileY);
    if (!tile) return;

    if (tile.type === TileType.CASINO_TABLE) {
        this.eventManager.emit('INTERACT_CASINO');
        return;
    }

    if (e.button === 0) { // Left Click
      const selectedItem = this.uiManager.getSelectedItem();
      if (!selectedItem) return;

      if (selectedItem === 'hoe') {
        if (tile.type === TileType.GRASS) {
          this.farmManager.till(tile);
          this.renderer.camera.shake(3, 0.2);
        }
      } else if (selectedItem === 'water') {
        if (tile.type === TileType.SOIL) {
          this.farmManager.water(tile);
        }
      } else if (selectedItem === 'scythe') {
        if (tile.cropId) {
          const harvested = this.farmManager.harvest(tile);
          if (harvested) {
             const config = CROPS[harvested];
             this.inventoryManager.addItem(harvested, config.harvestYield);
             this.eventManager.emit('CROP_HARVESTED', harvested);
             this.renderer.camera.shake(5, 0.3);
             console.log(`Harvested ${harvested}`);
          }
        }
      } else if (selectedItem.endsWith('_seed')) {
         const cropId = selectedItem.replace('_seed', '');
         if (this.inventoryManager.hasItem(selectedItem)) {
            if (this.farmManager.plant(tile, cropId)) {
               this.inventoryManager.removeItem(selectedItem);
               this.eventManager.emit('CROP_PLANTED', cropId);
            }
         }
      }
    }
  }

  private update(dt: number): void {
    if (!this.gameStarted) return;
    this.timeManager.update(dt);
    this.animalsManager.update(dt);
    this.npcManager.update(dt);

    // Test Movement with Sliding Collision
    const speed = 250 * dt;
    let dx = 0;
    let dy = 0;

    if (this.input.isKeyPressed('w') || this.input.isKeyPressed('arrowup')) dy -= speed;
    if (this.input.isKeyPressed('s') || this.input.isKeyPressed('arrowdown')) dy += speed;
    if (this.input.isKeyPressed('a') || this.input.isKeyPressed('arrowleft')) dx -= speed;
    if (this.input.isKeyPressed('d') || this.input.isKeyPressed('arrowright')) dx += speed;

    // Try moving X
    const nextTileX = Math.floor((this.playerX + dx) / this.worldManager.tileSize);
    const currentTileY = Math.floor(this.playerY / this.worldManager.tileSize);
    if (this.worldManager.isPassable(nextTileX, currentTileY)) {
        this.playerX += dx;
    }

    // Try moving Y
    const currentTileX = Math.floor(this.playerX / this.worldManager.tileSize);
    const nextTileY = Math.floor((this.playerY + dy) / this.worldManager.tileSize);
    if (this.worldManager.isPassable(currentTileX, nextTileY)) {
        this.playerY += dy;
    }

    this.renderer.camera.setPosition(this.playerX, this.playerY);
    this.renderer.camera.update(dt, this.worldManager.width, this.worldManager.height, this.worldManager.tileSize);

    // Broadcast position to other players
    if (this._multiplayerManager) {
        this._multiplayerManager.broadcastSync(this.playerX, this.playerY, this.playerSkin);
    }

    // Check for map exits
    const currentTileX_exit = Math.floor(this.playerX / this.worldManager.tileSize);
    const currentTileY_exit = Math.floor(this.playerY / this.worldManager.tileSize);
    const exit = this.worldManager.checkExit(currentTileX_exit, currentTileY_exit);
    if (exit) {
        this.worldManager.switchLocation(exit.targetLocationId, exit.targetX, exit.targetY);
        this.renderer.camera.setPosition(this.playerX, this.playerY); // Snap camera on location change
    }
    
    if (this.input.isKeyPressed('q')) this.renderer.camera.setZoom(this.renderer.camera.zoom - dt);
    if (this.input.isKeyPressed('r')) this.renderer.camera.setZoom(this.renderer.camera.zoom + dt);
  }

  private render(_alpha: number): void {
    this.renderer.clear();

    this.renderer.beginWorldDraw();
    this.worldRenderer.render(this);
    this.renderer.endWorldDraw();

    this.renderer.beginUIDraw();
    this.renderWeatherOverlay();
    this.uiManager.renderMinimap();
    this.renderer.drawText(`FPS: ${Math.round(1/0.016)}`, 10, 80); 
    this.renderer.endUIDraw();
  }

  private handleNPCInteraction(): void {
      const INTERACTION_RADIUS = 50; // pixels
    
      // Find closest NPC within range
      let closestNPC: NPC | null = null;
      let closestDistance = Infinity;
    
      for (const npc of this.npcManager.getNPCs()) {
      const dx = npc.x - this.playerX;
      const dy = npc.y - this.playerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
    
      if (distance < INTERACTION_RADIUS && distance < closestDistance) {
        closestDistance = distance;
        closestNPC = npc;
      }
    }
    
      if (closestNPC) {
        const line = this.npcManager.interact(closestNPC.id);
        this.uiManager.showDialogue(closestNPC.id, line);
      }
    }

    private renderWeatherOverlay(): void {
        const ctx = this.renderer.getContext();
        const weather = this.weatherManager.currentWeather;
      
      if (weather === WeatherType.RAIN || weather === WeatherType.STORM) {
          ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
          ctx.lineWidth = 1;
          for(let i=0; i<100; i++) {
              const x = Math.random() * this.renderer.viewportWidth;
              const y = Math.random() * this.renderer.viewportHeight;
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x - 5, y + 15);
              ctx.stroke();
          }
          if (weather === WeatherType.STORM && Math.random() > 0.98) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fillRect(0, 0, this.renderer.viewportWidth, this.renderer.viewportHeight);
          }
      }
  }
}

const game = new Game();
(window as any).gameInstance = game;
game.start();
