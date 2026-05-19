import { Entity } from './BaseEntity';
import { AssetLoader } from '../../utils/AssetLoader';

export class PlayerEntity extends Entity {
  public username: string;
  public skin: string;
  public hp: number = 100;
  private assetLoader: AssetLoader;

  constructor(id: string, x: number, y: number, username: string, skin: string) {
    super(id, x, y);
    this.type = 'player';
    this.username = username;
    this.skin = skin;
    this.assetLoader = AssetLoader.getInstance();
  }

  public update(_dt: number): void {
    // Local player movement is handled by main.ts for now 
    // but state is synced here
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const sprite = this.assetLoader.getImage(this.skin);
    if (sprite) {
      ctx.drawImage(
        sprite,
        0, 0, 32, 32,
        this.x - 32, this.y - 52, 64, 64
      );
    }

    // Name tag
    ctx.fillStyle = '#4CAF50';
    ctx.font = '8px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText(this.username, this.x, this.y - 20);

    // Health bar
    ctx.fillStyle = 'red';
    ctx.fillRect(this.x - 10, this.y - 30, 20, 4);
    ctx.fillStyle = 'green';
    ctx.fillRect(this.x - 10, this.y - 30, 20 * (this.hp / 100), 4);
  }
}
