import { EventManager } from '../core/EventManager';
import { InventoryManager } from '../game/managers/InventoryManager';
import { EconomyManager } from '../game/managers/EconomyManager';
import { TimeManager } from '../game/managers/TimeManager';
import { SaveManager } from '../game/managers/SaveManager';
import { SeasonManager } from '../game/managers/SeasonManager';
import { WeatherManager } from '../game/managers/WeatherManager';
import { QuestManager } from '../game/managers/QuestManager';
import { CraftingManager, RECIPES } from '../game/managers/CraftingManager';
import { MonetizationManager } from '../game/managers/MonetizationManager';
import { AudioManager } from '../core/AudioManager';
import { CasinoManager } from '../game/managers/CasinoManager';
import { WorldManager } from '../game/managers/WorldManager';
import { NPCManager, NPC } from '../game/managers/NPCManager';
import { MultiplayerManager, RemotePlayer } from '../game/managers/MultiplayerManager';
import { TileType } from '../types';
import { CROPS } from '../config/crops';
import { AssetLoader } from '../utils/AssetLoader';
import { InputManager } from '../core/InputManager';

export class UIManager {
  private static instance: UIManager;
  private eventManager: EventManager;
  private inventoryManager: InventoryManager;
  private economyManager: EconomyManager;
  private timeManager: TimeManager;
  private saveManager: SaveManager;
  private seasonManager: SeasonManager;
  private weatherManager: WeatherManager;
  private questManager: QuestManager;
  private craftingManager: CraftingManager;
  private monetizationManager: MonetizationManager;
  private audioManager: AudioManager;
  private casinoManager: CasinoManager;
  private worldManager: WorldManager;
  private npcManager: NPCManager;
  private multiplayerManager: MultiplayerManager;
  private assetLoader: AssetLoader;
  private inputManager: InputManager;

  private uiLayer: HTMLElement;
  private selectedItem: string | null = null; 
  private activePanel: HTMLElement | null = null;
  private gameStarted: boolean = false;

  private minimapCanvas: HTMLCanvasElement | null = null;
  private minimapCtx: CanvasRenderingContext2D | null = null;
  private toastTimer: number | null = null;

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.inventoryManager = InventoryManager.getInstance();
    this.economyManager = EconomyManager.getInstance();
    this.timeManager = TimeManager.getInstance();
    this.saveManager = SaveManager.getInstance();
    this.seasonManager = SeasonManager.getInstance();
    this.weatherManager = WeatherManager.getInstance();
    this.questManager = QuestManager.getInstance();
    this.craftingManager = CraftingManager.getInstance();
    this.monetizationManager = MonetizationManager.getInstance();
    this.audioManager = AudioManager.getInstance();
    this.casinoManager = CasinoManager.getInstance();
    this.worldManager = WorldManager.getInstance();
    this.npcManager = NPCManager.getInstance();
    this.multiplayerManager = MultiplayerManager.getInstance();
    this.assetLoader = AssetLoader.getInstance();
    this.inputManager = InputManager.getInstance();

    this.uiLayer = document.getElementById('ui-layer')!;
    
    this.eventManager.on('INVENTORY_CHANGED', () => this.updateToolbar());
    this.eventManager.on('MONEY_CHANGED', (amount: number) => this.updateMoney(amount));
    this.eventManager.on('HOUR_PASS', () => this.updateTime());
    this.eventManager.on('SEASON_CHANGED', (season: string) => this.updateEnvironment(season));
    this.eventManager.on('WEATHER_CHANGED', (weather: string) => this.updateEnvironment(undefined, weather));
    this.eventManager.on('QUEST_ADDED', () => this.refreshActivePanel());
    this.eventManager.on('QUEST_COMPLETED', (quest: any) => {
      this.showToast(`Quest complete: ${quest.title}`);
      this.refreshActivePanel();
    });
    this.eventManager.on('INTERACT_CASINO', () => this.togglePanel('casino'));
    this.eventManager.on('LOCATION_CHANGED', () => this.renderMinimap());

    this.showMainMenu();
  }

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  public getSelectedItem(): string | null {
    return this.selectedItem;
  }

  public showMainMenu(): void {
    this.uiLayer.innerHTML = '';
    const menu = document.createElement('div');
    menu.className = 'full-screen-menu fade-in';
    menu.innerHTML = `
      <div class="menu-content" style="text-align: center; padding: 40px; border: 4px solid var(--ui-border); box-shadow: 8px 8px 0px rgba(0,0,0,0.5);">
        <h1 style="font-size: 48px; margin-bottom: 5px; color: #3e2723; text-shadow: 4px 4px 0px #fff;">CLAWLIE<span style="color: #4CAF50;">.XYZ</span></h1>
        <p style="font-size: 12px; margin-bottom: 40px; color: #5d4037;">The Ultimate Pixel Farming Adventure</p>
        <div class="flex-col" style="gap: 15px;">
          <button class="pixel-btn" id="start-game-btn" style="font-size: 20px; padding: 15px 30px; background-color: #4CAF50; color: white;">Play</button>
          <button class="pixel-btn" id="settings-btn" style="font-size: 14px;">Settings</button>
        </div>
      </div>
    `;
    this.uiLayer.appendChild(menu);

    document.getElementById('start-game-btn')!.onclick = () => this.showCharacterSelection();
    document.getElementById('settings-btn')!.onclick = () => this.showSettings();
  }

  private showCharacterSelection(): void {
    const menu = this.uiLayer.querySelector('.menu-content')!;
    menu.innerHTML = `
      <h2 style="font-size: 16px; margin-bottom: 20px;">Create Profile</h2>
      <div style="margin-bottom: 20px; text-align: left;">
        <label style="font-size: 12px; display: block; margin-bottom: 8px; color: #5d4037;">Nickname:</label>
        <input type="text" id="nickname-input" class="pixel-input" placeholder="Farmer" maxlength="16" style="width: 100%; padding: 10px; font-family: 'Press Start 2P'; font-size: 14px; border: 4px solid var(--ui-border); box-sizing: border-box; text-transform: uppercase;">
      </div>
      <h3 style="font-size: 12px; margin-bottom: 10px; color: #5d4037; text-align: left;">Character:</h3>
      <div class="character-grid">
        <div class="char-option selected" data-skin="player_blue">
          <img src="${this.assetLoader.resolveAssetPath('assets/sprites/blue_character/full_sprite_blue.png')}" style="object-position: 0 0; object-fit: none; width: 32px; height: 32px; transform: scale(1.5);">
          <p>Blue</p>
        </div>
        <div class="char-option" data-skin="player_green">
          <img src="${this.assetLoader.resolveAssetPath('assets/sprites/green_character/full_sprite_green.png')}" style="object-position: 0 0; object-fit: none; width: 32px; height: 32px; transform: scale(1.5);">
          <p>Green</p>
        </div>
        <div class="char-option" data-skin="player_red">
          <img src="${this.assetLoader.resolveAssetPath('assets/sprites/red_character/full_sprite_red.png')}" style="object-position: 0 0; object-fit: none; width: 32px; height: 32px; transform: scale(1.5);">
          <p>Red</p>
        </div>
      </div>
      <button class="pixel-btn" id="confirm-char-btn" style="margin-top: 30px; font-size: 16px; padding: 10px 20px;">Start Farming</button>
    `;

    let selectedSkin = 'player_blue';
    const options = menu.querySelectorAll('.char-option');
    options.forEach(opt => {
        (opt as HTMLElement).onclick = () => {
            options.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedSkin = opt.getAttribute('data-skin')!;
        };
    });

    document.getElementById('confirm-char-btn')!.onclick = () => {
        const nameInput = document.getElementById('nickname-input') as HTMLInputElement;
        const nickname = nameInput.value.trim().toUpperCase() || 'FARMER';
        
        const game = (window as any).gameInstance;
        if (game) {
            game.playerSkin = selectedSkin;
            game.username = nickname;
        }
        
        this.multiplayerManager.setUsername(nickname);
        this.startGame();
    };
  }

  private showSettings(): void {
      const panel = document.createElement('div');
      panel.className = 'full-screen-menu fade-in';
      panel.innerHTML = `
        <div class="menu-content">
          <h2 style="font-size: 18px; margin-bottom: 20px;">Settings</h2>
          <div class="flex-col" style="text-align: left; font-size: 10px;">
            <label>Master Volume</label>
            <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="1">
            <button class="pixel-btn" id="mute-btn">Toggle Mute</button>
            <hr style="width: 100%; border: 1px solid var(--ui-border);">
            <p>Graphics: High (Pixel Perfect)</p>
            <p>Controls: WASD / ARROWS</p>
          </div>
          <button class="pixel-btn" id="close-settings" style="margin-top: 20px;">Back</button>
        </div>
      `;
      this.uiLayer.appendChild(panel);

      document.getElementById('close-settings')!.onclick = () => panel.remove();
      (document.getElementById('volume-slider') as HTMLInputElement).oninput = (e: any) => {
          this.audioManager.setVolume(parseFloat(e.target.value));
      };
      document.getElementById('mute-btn')!.onclick = () => {
          this.audioManager.toggleMute();
      };
  }

  private startGame(): void {
    const game = (window as any).gameInstance;
    if (game) game.gameStarted = true;
    
    this.gameStarted = true;
    this.setupHUD();
    this.setupSideMenu();
    this.setupMinimap();
    this.setupPlayerList();
    this.setupAds();
    this.setupTouchControls();
    this.updateToolbar();
    this.updateMoney(this.economyManager.getMoney());
    this.updateTime();
    this.updateEnvironment();
    this.selectItem('hoe');
  }

  private setupHUD(): void {
    this.uiLayer.innerHTML = '';

    const hudTop = document.createElement('div');
    hudTop.id = 'hud-top';
    
    hudTop.innerHTML = `
      <div style="display: flex; gap: 5px;">
        <button class="pixel-btn" id="save-btn" style="padding: 4px; margin: 0;">💾</button>
        <button class="pixel-btn" id="settings-btn-hud" style="padding: 4px; margin: 0;">⚙️</button>
      </div>
      <div>
        <span id="env-display">Spring ☀️</span> | 
        <span id="time-display">Day 1 06:00</span> | 
        <span id="money-display">$0</span> |
        <span id="gems-display" style="color: #00bcd4;">💎 0</span>
      </div>
    `;
    
    this.uiLayer.appendChild(hudTop);

    document.getElementById('save-btn')!.onclick = () => this.saveManager.saveGame().then(() => this.showToast('Game saved'));
    document.getElementById('settings-btn-hud')!.onclick = () => this.showSettings();

    const toolbar = document.createElement('div');
    toolbar.id = 'toolbar';
    this.uiLayer.appendChild(toolbar);
  }

  private setupSideMenu(): void {
    const sideMenu = document.createElement('div');
    sideMenu.id = 'side-menu';
    
    sideMenu.appendChild(this.createMenuButton('📜 Quests', () => this.togglePanel('quest')));
    sideMenu.appendChild(this.createMenuButton('⚒️ Craft', () => this.togglePanel('craft')));
    sideMenu.appendChild(this.createMenuButton('💰 Shop', () => this.togglePanel('shop')));
    
    // Teleport Buttons
    sideMenu.appendChild(this.createMenuButton('🏠 Home', () => this.teleportTo('house')));
    sideMenu.appendChild(this.createMenuButton('🏙️ Town', () => this.teleportTo('town')));
    sideMenu.appendChild(this.createMenuButton('🎲 Casino', () => this.teleportTo('casino')));

    this.uiLayer.appendChild(sideMenu);
  }

  private teleportTo(locationId: string): void {
      const targets: any = {
          'house': { x: 10, y: 13 },
          'town': { x: 50, y: 50 },
          'casino': { x: 12, y: 18 },
          'farm': { x: 50, y: 50 }
      };
      const target = targets[locationId];
      if (target) {
          this.worldManager.switchLocation(locationId, target.x, target.y);
      }
  }

  private setupMinimap(): void {
      const container = document.createElement('div');
      container.id = 'minimap-container';
      container.innerHTML = `<canvas id="minimap-canvas"></canvas>`;
      this.uiLayer.appendChild(container);

      this.minimapCanvas = container.querySelector('#minimap-canvas') as HTMLCanvasElement;
      this.minimapCtx = this.minimapCanvas.getContext('2d');
      this.renderMinimap();
  }

  private setupPlayerList(): void {
      const container = document.createElement('div');
      container.id = 'player-list-container';
      container.innerHTML = `
        <h4 style="margin: 0 0 5px 0; font-size: 8px; border-bottom: 2px solid #5d4037;">MULTIPLAYER</h4>
        <div style="font-size: 7px; margin-bottom: 5px; color: #5d4037;">ID: <span id="my-peer-id">Connecting...</span></div>
        <div style="display: flex; gap: 2px; margin-bottom: 8px;">
            <input type="text" id="target-peer-id" placeholder="Friend's ID" style="width: 80px; font-size: 7px; border: 2px solid var(--ui-border); padding: 2px;">
            <button class="pixel-btn" id="connect-peer-btn" style="padding: 2px 4px; font-size: 7px; margin: 0;">JOIN</button>
        </div>
        <div id="player-list-content">
            <div class="player-list-item"><div class="online-dot"></div> You</div>
        </div>
      `;
      this.uiLayer.appendChild(container);

      const myIdSpan = container.querySelector('#my-peer-id')!;
      this.eventManager.on('MP_READY', (id: string) => {
          myIdSpan.textContent = id;
      });

      const input = container.querySelector('#target-peer-id') as HTMLInputElement;
      const btn = container.querySelector('#connect-peer-btn') as HTMLButtonElement;
      btn.onclick = () => {
          if (input.value) {
              this.multiplayerManager.connectToPeer(input.value);
              input.value = '';
          }
      };

      this.eventManager.on('PLAYER_UPDATED', () => this.refreshPlayerList());
      this.eventManager.on('PLAYER_LEFT', () => this.refreshPlayerList());
  }

  private refreshPlayerList(): void {
      const content = document.getElementById('player-list-content');
      if (!content) return;
      content.innerHTML = `<div class="player-list-item"><div class="online-dot"></div> You</div>`;
      
      this.multiplayerManager.getRemotePlayers().forEach(p => {
          const item = document.createElement('div');
          item.className = 'player-list-item';
          item.innerHTML = `<div class="online-dot"></div> ${p.username} (${p.id.slice(0, 4)})`;
          content.appendChild(item);
      });
  }

  private setupAds(): void {
      const ad = document.createElement('div');
      ad.className = 'ad-banner';
      ad.innerHTML = 'AD BANNER PLACEHOLDER - CLAWLIE.XYZ';
      this.uiLayer.appendChild(ad);
  }

  private setupTouchControls(): void {
      const controls = document.createElement('div');
      controls.id = 'touch-controls';
      controls.innerHTML = `
        <div id="touch-joystick">
          <div id="touch-stick"></div>
        </div>
        <div id="touch-actions">
          <button class="touch-btn" id="touch-zoom-in">+</button>
          <button class="touch-btn primary" id="touch-use">Use</button>
          <button class="touch-btn" id="touch-interact">Talk</button>
          <button class="touch-btn" id="touch-cycle">Tool</button>
          <button class="touch-btn" id="touch-menu">Menu</button>
          <button class="touch-btn" id="touch-zoom-out">-</button>
        </div>
      `;
      this.uiLayer.appendChild(controls);

      const joystick = controls.querySelector('#touch-joystick') as HTMLElement;
      const stick = controls.querySelector('#touch-stick') as HTMLElement;
      let activePointer: number | null = null;

      const moveStick = (event: PointerEvent) => {
        if (activePointer !== event.pointerId) return;
        const rect = joystick.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const max = rect.width / 2 - 18;
        const dx = event.clientX - centerX;
        const dy = event.clientY - centerY;
        const distance = Math.min(max, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        stick.style.transform = `translate(${x}px, ${y}px)`;
        this.inputManager.setVirtualMovement(x / max, y / max);
      };

      joystick.onpointerdown = (event) => {
        activePointer = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        moveStick(event);
        event.preventDefault();
      };
      joystick.onpointermove = (event) => {
        moveStick(event);
        event.preventDefault();
      };
      const releaseStick = (event: PointerEvent) => {
        if (activePointer !== event.pointerId) return;
        activePointer = null;
        stick.style.transform = 'translate(0, 0)';
        this.inputManager.clearVirtualMovement();
        event.preventDefault();
      };
      joystick.onpointerup = releaseStick;
      joystick.onpointercancel = releaseStick;

      (controls.querySelector('#touch-use') as HTMLButtonElement).onclick = () => this.emitCenterUse();
      (controls.querySelector('#touch-interact') as HTMLButtonElement).onclick = () => this.eventManager.emit('INPUT_KEY_E_PRESSED');
      (controls.querySelector('#touch-cycle') as HTMLButtonElement).onclick = () => this.selectNextTool();
      (controls.querySelector('#touch-menu') as HTMLButtonElement).onclick = () => this.togglePanel('quest');
      (controls.querySelector('#touch-zoom-in') as HTMLButtonElement).onclick = () => this.adjustZoom(0.25);
      (controls.querySelector('#touch-zoom-out') as HTMLButtonElement).onclick = () => this.adjustZoom(-0.25);
  }

  public renderMinimap(): void {
        if (!this.minimapCtx || !this.minimapCanvas) return;
        const loc = this.worldManager.getCurrentLocation();
      
        const VIEWPORT_SIZE = 40;
        this.minimapCanvas.width = VIEWPORT_SIZE;
        this.minimapCanvas.height = VIEWPORT_SIZE;

        const ctx = this.minimapCtx;
        ctx.clearRect(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE);

        const game = (window as any).gameInstance;
        let px = 0;
        let py = 0;
      
        if (game) {
            px = Math.floor(game.playerX / this.worldManager.tileSize);
            py = Math.floor(game.playerY / this.worldManager.tileSize);
        }

        const startX = Math.max(0, Math.floor(px - VIEWPORT_SIZE / 2));
        const startY = Math.max(0, Math.floor(py - VIEWPORT_SIZE / 2));

        for (let x = 0; x < VIEWPORT_SIZE; x++) {
            for (let y = 0; y < VIEWPORT_SIZE; y++) {
                const worldX = startX + x;
                const worldY = startY + y;
              
                if (worldX < 0 || worldX >= loc.width || worldY < 0 || worldY >= loc.height) {
                    ctx.fillStyle = '#000';
                    ctx.fillRect(x, y, 1, 1);
                    continue;
                }

                const tile = loc.tiles[worldX][worldY];
                let color = '#4CAF50';
                if (tile.type === TileType.WATER || tile.type === TileType.DEEP_WATER) color = '#2196F3';
                if (tile.type === TileType.WALL) color = '#424242';
                if (tile.type === TileType.STONE) color = '#9E9E9E';
                if (tile.type === TileType.TREE || tile.type === TileType.FOREST) color = '#1B5E20';
                if (tile.type === TileType.SAND) color = '#F0E68C';
                if (tile.type === TileType.FLOOR) color = '#BDBDBD';
                ctx.fillStyle = color;
                ctx.fillRect(x, y, 1, 1);
            }
        }

        // Draw NPCs on minimap
        const npcs = this.npcManager.getNPCs();
        npcs.forEach(npc => {
            const nx = Math.floor(npc.x / this.worldManager.tileSize);
            const ny = Math.floor(npc.y / this.worldManager.tileSize);
            const mapX = nx - startX;
            const mapY = ny - startY;
            if (mapX >= 0 && mapX < VIEWPORT_SIZE && mapY >= 0 && mapY < VIEWPORT_SIZE) {
                ctx.fillStyle = '#ffca28';
                ctx.fillRect(mapX, mapY, 2, 2);
            }
        });

        // Draw Player
        if (game) {
            ctx.fillStyle = 'red';
            const centerOffset = Math.floor(VIEWPORT_SIZE / 2);
            ctx.fillRect(centerOffset - 1, centerOffset - 1, 2, 2);
        }
    }

  public showDialogue(npcId: string, text: string): void {
      const npc = this.npcManager.getNPC(npcId);
      if (!npc) return;

      const panel = document.createElement('div');
      panel.className = 'ui-panel dialogue-panel fade-in';
      panel.innerHTML = `
        <img class="dialogue-portrait" src="${npc.portrait}">
        <div class="dialogue-text">
            <strong style="color: #5d4037;">${npc.name}</strong><br>
            <span id="dialogue-content"></span>
        </div>
      `;
      this.uiLayer.appendChild(panel);

      // Simple typewriter effect
      let i = 0;
      const content = panel.querySelector('#dialogue-content')!;
      const interval = setInterval(() => {
          content.textContent += text[i];
          i++;
          if (i >= text.length) clearInterval(interval);
      }, 30);

      const closeOnClick = () => {
          panel.remove();
          document.removeEventListener('keydown', closeOnClick);
          document.removeEventListener('mousedown', closeOnClick);
      };
      setTimeout(() => {
          document.addEventListener('keydown', closeOnClick);
          document.addEventListener('mousedown', closeOnClick);
      }, 500);
  }

  private createMenuButton(text: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'pixel-btn';
    btn.innerText = text;
    btn.onclick = onClick;
    return btn;
  }

  private togglePanel(type: 'quest' | 'craft' | 'shop' | 'casino'): void {
    if (this.activePanel) {
      const currentType = this.activePanel.getAttribute('data-type');
      this.activePanel.remove();
      this.activePanel = null;
      if (currentType === type) return;
    }
    this.showPanel(type);
  }

  private refreshActivePanel(): void {
     if (this.activePanel) {
        const type = this.activePanel.getAttribute('data-type') as any;
        this.activePanel.remove();
        this.showPanel(type);
     }
  }

  private showPanel(type: 'quest' | 'craft' | 'shop' | 'casino'): void {
    const panel = document.createElement('div');
    panel.className = 'ui-panel overlay-panel fade-in';
    panel.setAttribute('data-type', type);
    
    panel.innerHTML = `
        <button class="pixel-btn" style="float: right; padding: 2px 8px; margin: 0;">X</button>
        <h2 style="margin-top: 0;">${type.toUpperCase()}</h2>
        <div id="panel-content"></div>
    `;

    panel.querySelector('button')!.onclick = () => { panel.remove(); this.activePanel = null; };
    const content = panel.querySelector('#panel-content')!;
    
    if (type === 'quest') {
      this.questManager.getActiveQuests().forEach(q => {
        const item = document.createElement('div');
        item.className = `quest-item ${q.isCompleted ? 'completed' : ''}`;
        const progress = q.requirements
          .map(req => `${this.questManager.getProgress(q, req)}/${req.count}`)
          .join(', ');
        item.innerHTML = `<strong>${q.title}</strong><br><small>${q.description}</small><br><small>${q.isCompleted ? 'Complete' : progress}</small>`;
        content.appendChild(item);
      });
    } else if (type === 'craft') {
      const grid = document.createElement('div');
      grid.className = 'crafting-grid';
      RECIPES.forEach(r => {
        const item = document.createElement('div');
        item.className = 'char-option';
        item.style.fontSize = '12px';
        item.innerHTML = `<strong>${r.name}</strong><br>${r.ingredients.map(i => `${i.count}x ${i.itemId}`).join('<br>')}`;
        item.onclick = () => {
          if (this.craftingManager.craft(r.id)) {
            this.refreshActivePanel();
          } else {
            alert('Missing items!');
          }
        };
        grid.appendChild(item);
      });
      content.appendChild(grid);
    } else if (type === 'shop') {
      const seedSection = document.createElement('div');
      seedSection.className = 'shop-section';
      seedSection.innerHTML = '<h3>Seeds</h3>';
      Object.values(CROPS).forEach(crop => {
        const row = document.createElement('div');
        row.className = 'quest-item shop-row';
        row.innerHTML = `
          <span>${crop.name} Seeds</span>
          <button class="pixel-btn" style="margin: 0; padding: 4px 8px;">$${crop.seedPrice}</button>
        `;
        row.querySelector('button')!.onclick = () => this.buySeed(crop.id);
        seedSection.appendChild(row);
      });
      content.appendChild(seedSection);

      const sellSection = document.createElement('div');
      sellSection.className = 'shop-section';
      sellSection.innerHTML = '<h3>Farm Stand</h3>';
      const sellable = this.getSellableItems();
      if (sellable.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'quest-item';
        empty.textContent = 'Harvest crops or collect animal products to sell here.';
        sellSection.appendChild(empty);
      } else {
        sellable.forEach(({ id, count, price }) => {
          const row = document.createElement('div');
          row.className = 'quest-item shop-row';
          row.innerHTML = `
            <span>${this.getItemName(id)} x${count}</span>
            <button class="pixel-btn" style="margin: 0; padding: 4px 8px;">Sell $${price}</button>
          `;
          row.querySelector('button')!.onclick = () => this.sellItem(id);
          sellSection.appendChild(row);
        });
      }
      content.appendChild(sellSection);

      const premiumTitle = document.createElement('h3');
      premiumTitle.textContent = 'Premium Extras';
      content.appendChild(premiumTitle);
      this.monetizationManager.getShopItems().forEach(i => {
        const item = document.createElement('div');
        item.className = 'quest-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.innerHTML = `
          <span>${i.name}</span>
          <button class="pixel-btn" style="margin: 0; padding: 4px 8px;">
            ${i.price}${i.currency === 'gems' ? '💎' : '$'}
          </button>
        `;
        item.querySelector('button')!.onclick = () => {
           if (this.monetizationManager.purchaseItem(i.id)) {
              this.showToast('Purchased');
              this.updateGems();
           } else {
              this.showToast('Not enough currency');
           }
        };
        content.appendChild(item);
      });
    } else if (type === 'casino') {
        content.innerHTML = `
            <div class="flex-col">
                <div class="ui-panel" style="background: #1b5e20; color: white;">
                    <h3>Blackjack</h3>
                    <p>Bet $100</p>
                    <button class="pixel-btn" id="bj-play-btn">Play Hand</button>
                    <div id="bj-result" style="margin-top: 10px; font-size: 12px;"></div>
                </div>
                <div class="ui-panel" style="background: #b71c1c; color: white; margin-top: 10px;">
                    <h3>Roulette</h3>
                    <p>Bet $50 on RED</p>
                    <button class="pixel-btn" id="rl-play-btn">Spin Wheel</button>
                    <div id="rl-result" style="margin-top: 10px; font-size: 12px;"></div>
                </div>
            </div>
        `;

        (content.querySelector('#bj-play-btn') as HTMLElement).onclick = () => {
            const res = this.casinoManager.playBlackjack(100);
            const resEl = content.querySelector('#bj-result')!;
            if (res.result === 'Insufficient Funds') {
                resEl.innerHTML = '<span style="color: #ff5252;">Not enough money!</span>';
            } else {
                resEl.innerHTML = `
                    Dealer: ${res.dealerHand.map(c => c.rank+c.suit).join(' ')}<br>
                    You: ${res.playerHand.map(c => c.rank+c.suit).join(' ')}<br>
                    <strong>${res.result}</strong> ${res.payout > 0 ? '+$'+res.payout : ''}
                `;
                this.updateMoney(this.economyManager.getMoney());
            }
        };

        (content.querySelector('#rl-play-btn') as HTMLElement).onclick = () => {
            const res = this.casinoManager.playRoulette(50, 'red');
            const resEl = content.querySelector('#rl-result')!;
            if (res.result === 'Insufficient Funds') {
                resEl.innerHTML = '<span style="color: #ff5252;">Not enough money!</span>';
            } else {
                resEl.innerHTML = `
                    Result: <span style="color: ${res.color === 'red' ? '#ff5252' : (res.color === 'black' ? '#000' : '#4caf50')}">${res.roll} ${res.color.toUpperCase()}</span><br>
                    <strong>${res.result}</strong> ${res.payout > 0 ? '+$'+res.payout : ''}
                `;
                this.updateMoney(this.economyManager.getMoney());
            }
        };
    }

    this.uiLayer.appendChild(panel);
    this.activePanel = panel;
  }

  private updateTime(): void {
    if (!this.gameStarted) return;
    const el = document.getElementById('time-display');
    if (el) el.innerText = this.timeManager.getTimeString();
  }

  private updateMoney(amount: number): void {
    if (!this.gameStarted) return;
    const el = document.getElementById('money-display');
    if (el) el.innerText = `$${amount}`;
  }

  private updateGems(): void {
    if (!this.gameStarted) return;
    const el = document.getElementById('gems-display');
    if (el) el.innerText = `💎 ${this.monetizationManager.getPremiumCurrency()}`;
  }
  
  private updateEnvironment(season?: string, weather?: string): void {
    if (!this.gameStarted) return;
    const el = document.getElementById('env-display');
    if (el) {
      const s = season || this.seasonManager.currentSeason;
      const w = weather || this.weatherManager.currentWeather;
      const icons: any = { 'sunny': '☀️', 'rain': '🌧️', 'storm': '⛈️' };
      el.innerText = `${s.charAt(0).toUpperCase() + s.slice(1)} ${icons[w] || ''}`;
    }
  }

  private updateToolbar(): void {
    if (!this.gameStarted) return;
    const toolbar = document.getElementById('toolbar');
    if (!toolbar) return;
    toolbar.innerHTML = '';

    this.createToolSlot(toolbar, 'hoe', '⛏️');
    this.createToolSlot(toolbar, 'water', '💧');
    this.createToolSlot(toolbar, 'scythe', '⚔️'); 

    this.inventoryManager.getItems().forEach((count, id) => {
       if (id.includes('seed')) this.createToolSlot(toolbar, id, '🌱', count);
       else this.createToolSlot(toolbar, id, '📦', count);
    });
  }

  private createToolSlot(parent: HTMLElement, id: string, icon: string, count?: number): void {
    const slot = document.createElement('div');
    slot.className = `tool-slot ${this.selectedItem === id ? 'active' : ''}`;
    slot.innerHTML = `<span>${icon}</span>`;
    
    if (count !== undefined) {
      const countEl = document.createElement('div');
      countEl.className = 'item-count';
      countEl.innerText = count.toString();
      slot.appendChild(countEl);
    }

    slot.onclick = () => this.selectItem(id);
    parent.appendChild(slot);
  }

  private selectItem(id: string): void {
    this.selectedItem = id;
    this.updateToolbar(); 
  }

  private selectNextTool(): void {
    const ids = ['hoe', 'water', 'scythe', ...Array.from(this.inventoryManager.getItems().keys())];
    const current = Math.max(0, ids.indexOf(this.selectedItem || 'hoe'));
    this.selectItem(ids[(current + 1) % ids.length]);
  }

  private emitCenterUse(): void {
    const game = (window as any).gameInstance;
    const renderer = game?.renderer;
    const x = renderer?.viewportWidth ? renderer.viewportWidth / 2 : window.innerWidth / 2;
    const y = renderer?.viewportHeight ? renderer.viewportHeight / 2 : window.innerHeight / 2;
    this.eventManager.emit('INPUT_MOUSE_DOWN', { x, y, button: 0 });
  }

  private adjustZoom(delta: number): void {
    const camera = (window as any).gameInstance?.renderer?.camera;
    if (camera) camera.setZoom(camera.zoom + delta);
  }

  private buySeed(cropId: string): void {
    const crop = CROPS[cropId];
    if (!crop) return;
    if (!this.economyManager.spendMoney(crop.seedPrice)) {
      this.showToast('Not enough gold');
      return;
    }
    const itemId = `${cropId}_seed`;
    this.inventoryManager.addItem(itemId, 1);
    this.eventManager.emit('SEED_BOUGHT', itemId);
    this.showToast(`Bought ${crop.name} seeds`);
    this.refreshActivePanel();
  }

  private sellItem(itemId: string): void {
    const price = this.getSellPrice(itemId);
    if (price <= 0 || !this.inventoryManager.removeItem(itemId, 1)) {
      this.showToast('Nothing to sell');
      return;
    }
    this.economyManager.addMoney(price);
    this.eventManager.emit('ITEM_SOLD', itemId);
    this.showToast(`Sold ${this.getItemName(itemId)} for $${price}`);
    this.refreshActivePanel();
  }

  private getSellableItems(): { id: string; count: number; price: number }[] {
    return Array.from(this.inventoryManager.getItems().entries())
      .map(([id, count]) => ({ id, count, price: this.getSellPrice(id) }))
      .filter(item => item.price > 0 && item.count > 0);
  }

  private getSellPrice(itemId: string): number {
    if (CROPS[itemId]) return CROPS[itemId].sellPrice;
    const productPrices: Record<string, number> = {
      egg: 18,
      milk: 35,
      wool: 45,
      mayonnaise_jar: 60,
      cheese_wheel: 90,
      bread_loaf: 55
    };
    return productPrices[itemId] || 0;
  }

  private getItemName(itemId: string): string {
    if (CROPS[itemId]) return CROPS[itemId].name;
    if (itemId.endsWith('_seed')) {
      const crop = CROPS[itemId.replace('_seed', '')];
      if (crop) return `${crop.name} Seeds`;
    }
    return itemId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  private showToast(message: string): void {
    let toast = document.getElementById('game-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'game-toast';
      toast.className = 'ui-panel';
      this.uiLayer.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('visible');
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => toast?.classList.remove('visible'), 2200);
  }
}
