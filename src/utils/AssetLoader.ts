export class AssetLoader {
  private static instance: AssetLoader;
  private images: Map<string, HTMLImageElement>;
  private _sounds: Map<string, AudioBuffer>; // Placeholder for later

  private constructor() {
    this.images = new Map();
    this._sounds = new Map();
  }

  public static getInstance(): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader();
    }
    return AssetLoader.instance;
  }

  public async loadImage(key: string, src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        this.images.set(key, img);
        resolve(img);
      };
      img.onerror = (err) => {
        console.error(`Failed to load image: ${src}`, err);
        reject(err);
      };
    });
  }

  public resolveAssetPath(path: string): string {
    const base = import.meta.env.BASE_URL || './';
    const cleanBase = base.endsWith('/') ? base : `${base}/`;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `${cleanBase}${cleanPath}`;
  }

  public async loadAll(): Promise<void> {
    const assets = [
      { key: 'player_blue', src: this.resolveAssetPath('assets/sprites/blue_character/full_sprite_blue.png') },
      { key: 'player_green', src: this.resolveAssetPath('assets/sprites/green_character/full_sprite_green.png') },
      { key: 'player_red', src: this.resolveAssetPath('assets/sprites/red_character/full_sprite_red.png') }
    ];

    await Promise.all(assets.map(asset => this.loadImage(asset.key, asset.src).catch(e => {
        console.warn(`Could not load ${asset.key}, using placeholder.`);
        this.generatePlaceholder(asset.key, '#ff00ff');
    })));
  }

  public getImage(key: string): HTMLImageElement | undefined {
    return this.images.get(key);
  }

  // Placeholder function for procedural generation of assets (if files are missing)
  public generatePlaceholder(key: string, color: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 32, 32);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(0, 0, 32, 32);
    }
    const img = new Image();
    img.src = canvas.toDataURL();
    this.images.set(key, img);
  }
}
