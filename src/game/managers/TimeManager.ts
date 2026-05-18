import { EventManager } from '../../core/EventManager';

export class TimeManager {
  private static instance: TimeManager;
  private eventManager: EventManager;

  public day: number = 1;
  public hour: number = 6; // Start at 6 AM
  public minute: number = 0;
  
  private timeAccumulator: number = 0;
  private readonly REAL_SECONDS_PER_GAME_MINUTE = 0.1; // Very fast: 1 game hour = 6 seconds

  private constructor() {
    this.eventManager = EventManager.getInstance();
  }

  public static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
  }

  public update(dt: number): void {
    this.timeAccumulator += dt;

    if (this.timeAccumulator >= this.REAL_SECONDS_PER_GAME_MINUTE) {
      this.timeAccumulator -= this.REAL_SECONDS_PER_GAME_MINUTE;
      this.advanceMinute();
    }
  }

  private advanceMinute(): void {
    this.minute++;
    if (this.minute >= 60) {
      this.minute = 0;
      this.advanceHour();
    }
  }

  private advanceHour(): void {
    this.hour++;
    this.eventManager.emit('HOUR_PASS', this.hour);

    if (this.hour >= 24) {
      this.hour = 0;
      this.advanceDay();
    }
  }

  private advanceDay(): void {
    this.day++;
    this.eventManager.emit('DAY_START', this.day);
  }

  public getTimeString(): string {
    const h = this.hour.toString().padStart(2, '0');
    const m = this.minute.toString().padStart(2, '0');
    return `Day ${this.day} ${h}:${m}`;
  }
}
