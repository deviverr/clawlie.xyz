import { EventManager } from '../../core/EventManager';

declare const Peer: any;

export interface RemotePlayer {
    id: string;
    username: string;
    x: number;
    y: number;
    skin: string;
    hp: number;
    locationId: string;
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
          console.log(`Incoming connection from: ${conn.peer}`);
          this.handleConnection(conn);
      });

      this.peer.on('error', (err: any) => {
          console.error('PeerJS Global Error:', err);
          if (err.type === 'peer-unavailable') {
              this.eventManager.emit('MP_ERROR', 'Target player not found.');
          }
      });

      this.peer.on('disconnected', () => {
          console.warn('PeerJS Disconnected. Attempting to reconnect...');
          this.peer.reconnect();
      });
  }

  private handleConnection(conn: any): void {
      const setupConn = () => {
          this.connections.set(conn.peer, conn);
          console.log(`Connected to: ${conn.peer}`);
          this.eventManager.emit('PLAYER_UPDATED', { id: conn.peer, username: 'Connecting...' });
          
          conn.on('data', (data: any) => {
              this.handleData(conn.peer, data);
          });
      };

      if (conn.open) {
          setupConn();
      } else {
          conn.on('open', setupConn);
      }

      conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.remotePlayers.delete(conn.peer);
          this.eventManager.emit('PLAYER_LEFT', conn.peer);
      });
      conn.on('error', (err: any) => {
          console.log('Connection error:', err);
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
              locationId: data.locationId || 'farm',
              lastUpdate: Date.now()
          };
          this.remotePlayers.set(peerId, player);
          this.eventManager.emit('PLAYER_UPDATED', player);
      } else if (data.type === 'attack') {
          this.eventManager.emit('PLAYER_ATTACKED', data.damage);
      } else if (data.type === 'world_action') {
          this.handleWorldAction(data.action);
      } else if (data.type === 'request_seed') {
          const world = (window as any).gameInstance.worldManager;
          const conn = this.connections.get(peerId);
          if (conn && conn.open) {
              conn.send({ type: 'seed_sync', seed: world.worldSeed });
          }
      } else if (data.type === 'seed_sync') {
          const world = (window as any).gameInstance.worldManager;
          world.setSeed(data.seed);
          console.log(`World Seed Synced: ${data.seed}`);
      } else if (data.type === 'chat') {
          this.eventManager.emit('CHAT_MESSAGE', { 
              username: data.username, 
              text: data.text,
              id: peerId 
          });
      }
  }

  public sendChat(text: string): void {
      const data = { type: 'chat', username: this.username, text };
      this.connections.forEach(conn => {
          if (conn.open) conn.send(data);
      });
      // Also emit locally for self
      this.eventManager.emit('CHAT_MESSAGE', { username: this.username, text, id: 'me' });
  }

  private handleWorldAction(action: any): void {
      const world = (window as any).gameInstance.worldManager;
      const farm = (window as any).gameInstance.farmManager;
      const tile = world.getTile(action.x, action.y);
      if (!tile) return;

      if (action.type === 'till') {
          farm.till(tile);
      } else if (action.type === 'plant') {
          farm.plant(tile, action.cropId);
      } else if (action.type === 'water') {
          farm.water(tile);
      } else if (action.type === 'harvest') {
          farm.harvest(tile);
      }
  }

  public broadcastWorldAction(action: any): void {
      this.connections.forEach(conn => {
          if (conn.open) conn.send({ type: 'world_action', action });
      });
  }

  public connectToPeer(targetId: string): void {
      const conn = this.peer.connect(targetId);
      this.handleConnection(conn);
      
      // Request seed from host
      conn.on('open', () => {
          conn.send({ type: 'request_seed' });
      });
  }

  private lastSyncTime: number = 0;

  public broadcastSync(x: number, y: number, skin: string, hp: number = 100, locationId: string = 'farm'): void {
      const now = Date.now();
      if (now - this.lastSyncTime < 50) return; // limit to 20 fps to prevent WebRTC channel overflow
      this.lastSyncTime = now;

      const data = {
          type: 'sync',
          username: this.username,
          x, y, skin, hp, locationId
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
