import { EventManager } from '../../core/EventManager';

export enum WeatherType {
  SUNNY = 'sunny',
  RAIN = 'rain',
  STORM = 'storm'
}

export class WeatherManager {
  private static instance: WeatherManager;
  private eventManager: EventManager;
  public currentWeather: WeatherType = WeatherType.SUNNY;

  private constructor() {
    this.eventManager = EventManager.getInstance();
    
    // Change weather daily
    this.eventManager.on('DAY_START', () => this.rollWeather());
  }

  public static getInstance(): WeatherManager {
    if (!WeatherManager.instance) {
      WeatherManager.instance = new WeatherManager();
    }
    return WeatherManager.instance;
  }

  private rollWeather(): void {
    const rand = Math.random();
    let newWeather = WeatherType.SUNNY;

    if (rand > 0.8) newWeather = WeatherType.STORM;
    else if (rand > 0.6) newWeather = WeatherType.RAIN;
    
    this.currentWeather = newWeather;
    this.eventManager.emit('WEATHER_CHANGED', newWeather);
    console.log(`Weather changed to ${newWeather}`);
  }
}
