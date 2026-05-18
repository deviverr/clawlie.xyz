export class GameLoop {
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly fixedTimeStep: number = 1 / 60; // 60 FPS fixed update
  private isRunning: boolean = false;
  private frameId: number = 0;

  private updateCallback: (dt: number) => void;
  private renderCallback: (alpha: number) => void;

  constructor(
    updateCallback: (dt: number) => void,
    renderCallback: (alpha: number) => void
  ) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameId = requestAnimationFrame((time) => this.loop(time));
  }

  public stop(): void {
    this.isRunning = false;
    cancelAnimationFrame(this.frameId);
  }

  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    // Calculate delta time in seconds
    let frameTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Cap frame time to avoid spiral of death on lag spikes
    if (frameTime > 0.25) frameTime = 0.25;

    this.accumulator += frameTime;

    // Fixed time step update
    while (this.accumulator >= this.fixedTimeStep) {
      this.updateCallback(this.fixedTimeStep);
      this.accumulator -= this.fixedTimeStep;
    }

    // Render with interpolation alpha
    const alpha = this.accumulator / this.fixedTimeStep;
    this.renderCallback(alpha);

    this.frameId = requestAnimationFrame((time) => this.loop(time));
  }
}
