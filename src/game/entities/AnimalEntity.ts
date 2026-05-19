import { Entity } from './BaseEntity';
import { AnimalType } from '../managers/AnimalsManager';

export class AnimalEntity extends Entity {
    public animalType: AnimalType;
    public isProductive: boolean = false;

    constructor(id: string, x: number, y: number, animalType: AnimalType) {
        super(id, x, y);
        this.type = 'animal';
        this.animalType = animalType;
    }

    public update(_dt: number): void {
        // AnimalsManager handles AI for now
    }

    public render(ctx: CanvasRenderingContext2D): void {
        let color = '#FFFFFF';
        let accent = '#fbc02d';
        if (this.animalType === 'cow') {
            color = '#A1887F';
            accent = '#3e2723';
        }
        if (this.animalType === 'sheep') {
            color = '#E0E0E0';
            accent = '#9E9E9E';
        }

        ctx.fillStyle = color;
        ctx.fillRect(this.x - 18, this.y - 14, 28, 20);
        ctx.fillRect(this.x + 6, this.y - 20, 16, 16);
        ctx.fillStyle = accent;
        ctx.fillRect(this.x + 14, this.y - 15, 3, 3);
        ctx.fillRect(this.x - 14, this.y + 6, 5, 8);
        ctx.fillRect(this.x + 4, this.y + 6, 5, 8);
        
        if (this.isProductive) {
            ctx.fillStyle = 'gold';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 15, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
