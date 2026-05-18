export type EventCallback<T = any> = (payload: T) => void;

export class EventManager {
  private static instance: EventManager;
  private listeners: Map<string, EventCallback[]>;

  private constructor() {
    this.listeners = new Map();
  }

  public static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  public on<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event)!;
    this.listeners.set(event, callbacks.filter((cb) => cb !== callback));
  }

  public emit<T>(event: string, payload?: T): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.forEach((callback) => callback(payload));
  }

  // Debug helper
  public clearAll(): void {
    this.listeners.clear();
  }
}
