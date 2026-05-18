import { EventManager } from '../../core/EventManager';

declare const Peer: any;

export interface RemotePlayer {
    id: string;
    username: string;
    x: number;
    y: number;
    skin: string;
    hp: number;
    lastUpdate: number;
}

export class MultiplayerManager {
  private static instance: MultiplayerManager;
  private eventManager: EventManager;
  
  private peer: any;
  private connections: Map<string, any> = new Map();
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private myId: string = '';
  private username: string = 'Guest';

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.initPeer();
  }

  public static getInstance(): MultiplayerManager {
    if (!MultiplayerManager.instance) {
      MultiplayerManager.instance = new MultiplayerManager();
    }
    return MultiplayerManager.instance;
  }

  private initPeer(): void {
      if (typeof Peer === 'undefined') {
          console.warn('PeerJS not loaded yet. Retrying...');
          setTimeout(() => this.initPeer(), 1000);
          return;
      }

      this.peer = new Peer();
      
      this.peer.on('open', (id: string) => {
          this.myId = id;
          console.log(`My Multiplayer ID: ${id}`);
          this.eventManager.emit('MP_READY', id);
      });

      this.peer.on('connection', (conn: any) => {
          this.handleConnection(conn);
      });
  }

  private handleConnection(conn: any): void {
      conn.on('open', () => {
          this.connections.set(conn.peer, conn);
          console.log(`Connected to: ${conn.peer}`);
          
          conn.on('data', (data: any) => {
              this.handleData(conn.peer, data);
          });
      });

      conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.remotePlayers.delete(conn.peer);
          this.eventManager.emit('PLAYER_LEFT', conn.peer);
      });
  }

  private handleData(peerId: string, data: any): void {
      if (data.type === 'sync') {
          const player: RemotePlayer = {
              id: peerId,
              username: data.username,
              x: data.x,
              y: data.y,
              skin: data.skin,
              hp: data.hp ?? 100,
              lastUpdate: Date.now()
          };
          this.remotePlayers.set(peerId, player);
          this.eventManager.emit('PLAYER_UPDATED', player);
      } else if (data.type === 'attack') {
          this.eventManager.emit('PLAYER_ATTACKED', data.damage);
      }
  }

  public connectToPeer(targetId: string): void {
      const conn = this.peer.connect(targetId);
      this.handleConnection(conn);
  }

  public broadcastSync(x: number, y: number, skin: string, hp: number = 100): void {
      const data = {
          type: 'sync',
          username: this.username,
          x, y, skin, hp
      };
      this.connections.forEach(conn => {
          if (conn.open) conn.send(data);
      });
  }

  public sendAttack(targetId: string, damage: number): void {
      const conn = this.connections.get(targetId);
      if (conn && conn.open) {
          conn.send({ type: 'attack', damage });
      }
  }

  public getRemotePlayers(): RemotePlayer[] {
      return Array.from(this.remotePlayers.values());
  }

  public setUsername(name: string): void {
      this.username = name;
  }

  public getMyId(): string {
      return this.myId;
  }
}
