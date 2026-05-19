import { Entity } from './BaseEntity';
import { AssetLoader } from '../../utils/AssetLoader';

export class NPCEntity extends Entity {
    public name: string;
    public portrait: string;
    private assetLoader: AssetLoader;

    constructor(id: string, x: number, y: number, name: string, portrait: string) {
        super(id, x, y);
        this.type = 'npc';
        this.name = name;
        this.portrait = portrait;
        this.assetLoader = AssetLoader.getInstance();
    }

    public update(_dt: number): void {
        // NPCManager handles wandering for now
    }

    public render(ctx: CanvasRenderingContext2D): void {
        const sprite = this.assetLoader.getImage('player_red'); 
        if (sprite) {
            ctx.drawImage(
                sprite,
                0, 0, 32, 32,
                this.x - 32, this.y - 52, 64, 64
            );
        }
        ctx.fillStyle = '#ffca28';
        ctx.font = '8px "Press Start 2P"';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y - 20);
    }
}
