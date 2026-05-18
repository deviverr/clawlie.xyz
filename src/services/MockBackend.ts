export interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
}

export interface LeaderboardEntry {
  username: string;
  money: number;
}

export class MockBackend {
  private static instance: MockBackend;
  private latency: number = 500; // ms

  private constructor() {}

  public static getInstance(): MockBackend {
    if (!MockBackend.instance) {
      MockBackend.instance = new MockBackend();
    }
    return MockBackend.instance;
  }

  private async delay(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, this.latency));
  }

  public async login(username: string): Promise<UserProfile> {
    await this.delay();
    return {
      id: 'user_' + Math.floor(Math.random() * 10000),
      username,
      level: 1,
      xp: 0
    };
  }

  public async saveGame(data: any): Promise<boolean> {
    await this.delay();
    console.log('[Backend] Game Saved', data);
    localStorage.setItem('farming_sim_save', JSON.stringify(data));
    return true;
  }

  public async loadGame(): Promise<any | null> {
    await this.delay();
    const data = localStorage.getItem('farming_sim_save');
    return data ? JSON.parse(data) : null;
  }

  public async getLeaderboard(): Promise<LeaderboardEntry[]> {
    await this.delay();
    return [
      { username: 'FarmKing99', money: 999999 },
      { username: 'CornMaster', money: 50000 },
      { username: 'NewbieFarmer', money: 1200 }
    ];
  }
}
