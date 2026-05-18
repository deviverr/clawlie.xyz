export class Camera {
  public x: number = 0;
  public y: number = 0;
  public zoom: number = 1.5;
  private targetX: number = 0;
  private targetY: number = 0;
  private lerpFactor: number = 0.1;

  private shakeAmount: number = 0;
  private shakeDuration: number = 0;

  constructor(public viewportWidth: number, public viewportHeight: number) {}

  public setPosition(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
    // Immediate snap on first set
    if (this.x === 0 && this.y === 0) {
        this.x = x;
        this.y = y;
    }
  }

  public update(dt: number, worldWidth: number, worldHeight: number, tileSize: number): void {
    // Smooth Lerp
    this.x += (this.targetX - this.x) * this.lerpFactor;
    this.y += (this.targetY - this.y) * this.lerpFactor;

    // Shake
    if (this.shakeDuration > 0) {
        this.shakeDuration -= dt;
        this.x += (Math.random() - 0.5) * this.shakeAmount;
        this.y += (Math.random() - 0.5) * this.shakeAmount;
    }

    this.clamp(worldWidth * tileSize, worldHeight * tileSize);
  }

  public shake(amount: number, duration: number): void {
      this.shakeAmount = amount;
      this.shakeDuration = duration;
  }

  private clamp(worldWidthPx: number, worldHeightPx: number): void {
    const halfWidth = (this.viewportWidth / 2) / this.zoom;
    const halfHeight = (this.viewportHeight / 2) / this.zoom;

    // Minimum dimensions to avoid seeing outside the map
    if (worldWidthPx > this.viewportWidth / this.zoom) {
        this.x = Math.max(halfWidth, Math.min(this.x, worldWidthPx - halfWidth));
    } else {
        this.x = worldWidthPx / 2;
    }

    if (worldHeightPx > this.viewportHeight / this.zoom) {
        this.y = Math.max(halfHeight, Math.min(this.y, worldHeightPx - halfHeight));
    } else {
        this.y = worldHeightPx / 2;
    }
  }

  // Clamp zoom to prevent exposing the entire map
    private readonly MIN_ZOOM = 0.8;
    private readonly MAX_ZOOM = 3.0;

    public setZoom(zoom: number): void {
      this.zoom = Math.max(this.MIN_ZOOM, Math.min(zoom, this.MAX_ZOOM));
    }

  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const worldX = (screenX - this.viewportWidth / 2) / this.zoom + this.x;
    const worldY = (screenY - this.viewportHeight / 2) / this.zoom + this.y;
    return { x: worldX, y: worldY };
  }

  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const screenX = (worldX - this.x) * this.zoom + this.viewportWidth / 2;
    const screenY = (worldY - this.y) * this.zoom + this.viewportHeight / 2;
    return { x: screenX, y: screenY };
  }

  public updateViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }
}
