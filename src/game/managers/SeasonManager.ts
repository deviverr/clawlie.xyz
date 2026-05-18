import { EventManager } from '../../core/EventManager';

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter'
}

export class SeasonManager {
  private static instance: SeasonManager;
  private eventManager: EventManager;
  
  public currentSeason: Season = Season.SPRING;
  private daysInSeason: number = 7; // Fast for prototype
  private currentDayOfSeason: number = 1;

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.eventManager.on('DAY_START', () => this.advanceDay());
  }

  public static getInstance(): SeasonManager {
    if (!SeasonManager.instance) {
      SeasonManager.instance = new SeasonManager();
    }
    return SeasonManager.instance;
  }

  private advanceDay(): void {
    this.currentDayOfSeason++;
    if (this.currentDayOfSeason > this.daysInSeason) {
      this.currentDayOfSeason = 1;
      this.nextSeason();
    }
  }

  private nextSeason(): void {
    const seasons = [Season.SPRING, Season.SUMMER, Season.FALL, Season.WINTER];
    const currentIndex = seasons.indexOf(this.currentSeason);
    const nextIndex = (currentIndex + 1) % seasons.length;
    this.currentSeason = seasons[nextIndex];
    this.eventManager.emit('SEASON_CHANGED', this.currentSeason);
    console.log(`Season changed to ${this.currentSeason}`);
  }
}
