import { EventManager } from './EventManager';

export interface MouseState {
  x: number;
  y: number;
  isDown: boolean;
}

export class InputManager {
  private static instance: InputManager;
  private keys: Set<string>;
  private mouse: MouseState;
  private eventManager: EventManager;
  private canvas: HTMLCanvasElement | null = null;
  private virtualMovement = { x: 0, y: 0 };

  private constructor() {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, isDown: false };
    this.eventManager = EventManager.getInstance();

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    // Prevent context menu on right click for game feel
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  public static getInstance(): InputManager {
    if (!InputManager.instance) {
      InputManager.instance = new InputManager();
    }
    return InputManager.instance;
  }

  public setCanvas(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  public isKeyPressed(key: string): boolean {
    return this.keys.has(key);
  }

  public getMousePosition(): { x: number; y: number } {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  public isMouseDown(): boolean {
    return this.mouse.isDown;
  }

  public setVirtualMovement(x: number, y: number): void {
    const length = Math.hypot(x, y);
    if (length > 1) {
      this.virtualMovement = { x: x / length, y: y / length };
    } else {
      this.virtualMovement = { x, y };
    }
  }

  public clearVirtualMovement(): void {
    this.virtualMovement = { x: 0, y: 0 };
  }

  public getMovementVector(): { x: number; y: number } {
    let x = this.virtualMovement.x;
    let y = this.virtualMovement.y;

    if (this.isKeyPressed('w') || this.isKeyPressed('arrowup')) y -= 1;
    if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) y += 1;
    if (this.isKeyPressed('a') || this.isKeyPressed('arrowleft')) x -= 1;
    if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) x += 1;

    const length = Math.hypot(x, y);
    if (length > 1) return { x: x / length, y: y / length };
    return { x, y };
  }

  private onKeyDown(e: KeyboardEvent): void {
      const key = e.key.toLowerCase();
      this.keys.add(key);
      this.eventManager.emit('INPUT_KEY_DOWN', e.key);
    
      // Emit specific event for 'e' key for NPC interaction
      if (key === 'e') {
        this.eventManager.emit('INPUT_KEY_E_PRESSED');
      }
    }

  private onKeyUp(e: KeyboardEvent): void {
    this.keys.delete(e.key.toLowerCase());
    this.eventManager.emit('INPUT_KEY_UP', e.key);
  }

  private onMouseDown(e: MouseEvent): void {
    this.mouse.isDown = true;
    this.updateMousePos(e);
    this.eventManager.emit('INPUT_MOUSE_DOWN', { x: this.mouse.x, y: this.mouse.y, button: e.button });
  }

  private onMouseUp(e: MouseEvent): void {
    this.mouse.isDown = false;
    this.updateMousePos(e);
    this.eventManager.emit('INPUT_MOUSE_UP', { x: this.mouse.x, y: this.mouse.y, button: e.button });
  }

  private onMouseMove(e: MouseEvent): void {
    this.updateMousePos(e);
    this.eventManager.emit('INPUT_MOUSE_MOVE', { x: this.mouse.x, y: this.mouse.y });
  }

  private updateMousePos(e: MouseEvent): void {
    if (this.canvas) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    } else {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }
  }
}
