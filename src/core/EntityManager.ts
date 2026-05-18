// src/core/EntityManager.ts
// Entity-Component-System implementation

export class Entity {
  id: string;
  components: Map<string, any>;

  constructor() {
    this.id = crypto.randomUUID();
    this.components = new Map();
  }

  addComponent(component: any): void {
    this.components.set(component.name, component);
  }

  getComponent(name: string): any {
    return this.components.get(name);
  }
}

export class EntityManager {
  private entities: Map<string, Entity> = new Map();

  createEntity(): Entity {
    const entity = new Entity();
    this.entities.set(entity.id, entity);
    return entity;
  }

  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  removeEntity(id: string): void {
    this.entities.delete(id);
  }

  // Add methods for entity lifecycle management
}