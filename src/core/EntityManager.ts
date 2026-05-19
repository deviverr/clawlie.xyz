import { Entity } from '../game/entities/BaseEntity';
import { EventManager } from './EventManager';

export class EntityManager {
  private static instance: EntityManager;
  private entities: Map<string, Entity> = new Map();
  private eventManager: EventManager;

  private constructor() {
    this.eventManager = EventManager.getInstance();
  }

  public static getInstance(): EntityManager {
    if (!EntityManager.instance) {
      EntityManager.instance = new EntityManager();
    }
    return EntityManager.instance;
  }

  public addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.eventManager.emit('ENTITY_ADDED', entity);
  }

  public removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (entity) {
      entity.destroy();
      this.entities.delete(id);
      this.eventManager.emit('ENTITY_REMOVED', id);
    }
  }

  public getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  public getEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  public getEntitiesByType(type: string): Entity[] {
    return this.getEntities().filter(e => e.type === type);
  }

  public update(dt: number): void {
    this.entities.forEach(entity => {
      if (!entity.isDestroyed) {
        entity.update(dt);
      }
    });

    // Cleanup destroyed entities
    this.entities.forEach((entity, id) => {
      if (entity.isDestroyed) {
        this.entities.delete(id);
      }
    });
  }

  public clear(): void {
    this.entities.clear();
  }
}
