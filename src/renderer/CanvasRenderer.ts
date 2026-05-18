import { Camera } from './Camera';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  public camera: Camera;

  constructor(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!canvas) {
      throw new Error(`Canvas with id ${canvasId} not found`);
    }
    this.canvas = canvas;
    const ctx = this.canvas.getContext('2d', { alpha: false }); // Optimize for opaque background
    if (!ctx) {
      throw new Error('Could not get 2D context');
    }
    this.ctx = ctx;

    // Initialize Camera
    this.camera = new Camera(this.canvas.width, this.canvas.height);

    // Handle resizing
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  public get viewportWidth(): number {
    return this.canvas.width;
  }

  public get viewportHeight(): number {
    return this.canvas.height;
  }

  private resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.camera.updateViewport(this.canvas.width, this.canvas.height);
    // Restore context settings after resize if needed (e.g., pixel art smoothing)
    this.ctx.imageSmoothingEnabled = false;
  }

  public clear(): void {
    this.ctx.fillStyle = '#000000'; // Or sky color
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Draw in world coordinates (affected by camera)
  public beginWorldDraw(): void {
    this.ctx.save();
    // Translate to center, scale, translate back
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }

  public endWorldDraw(): void {
    this.ctx.restore();
  }

  // Draw in screen coordinates (UI)
  public beginUIDraw(): void {
    this.ctx.save();
  }
  
  public endUIDraw(): void {
    this.ctx.restore();
  }

  public getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  // --- Drawing Primitives (Wrappers) ---

  public drawRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  public drawText(text: string, x: number, y: number, color: string = 'white', font: string = '16px monospace'): void {
    this.ctx.fillStyle = color;
    this.ctx.font = font;
    this.ctx.fillText(text, x, y);
  }

  public drawSprite(image: HTMLImageElement, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void {
    this.ctx.drawImage(image, sx, sy, sw, sh, dx, dy, dw, dh);
  }
}
