import { EventManager } from '../../core/EventManager';
import { TimeManager } from './TimeManager';
import { EntityManager } from '../../core/EntityManager';
import { AnimalEntity } from '../entities/AnimalEntity';

export enum AnimalType {
  CHICKEN = 'chicken',
  COW = 'cow',
  SHEEP = 'sheep'
}

export interface Animal {
  id: string;
  type: AnimalType;
  x: number;
  y: number;
  hunger: number; // 0-100
  happiness: number; // 0-100
  age: number; // days
  isProductive: boolean;
  lastProducedDay: number;
  entity?: AnimalEntity;
}

export class AnimalsManager {
  private static instance: AnimalsManager;
  private eventManager: EventManager;
  private timeManager: TimeManager;
  private entityManager: EntityManager;

  private animals: Animal[] = [];

  private constructor() {
    this.eventManager = EventManager.getInstance();
    this.timeManager = TimeManager.getInstance();
    this.entityManager = EntityManager.getInstance();

    this.eventManager.on('DAY_START', () => this.processDailyUpdate());
  }

  public static getInstance(): AnimalsManager {
    if (!AnimalsManager.instance) {
      AnimalsManager.instance = new AnimalsManager();
    }
    return AnimalsManager.instance;
  }

  public addAnimal(type: AnimalType, x: number, y: number): void {
    const animal: Animal = {
      id: `animal_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type,
      x,
      y,
      hunger: 0,
      happiness: 100,
      age: 0,
      isProductive: false,
      lastProducedDay: -1,
      entity: new AnimalEntity(`ent_${Date.now()}`, x, y, type)
    };
    this.animals.push(animal);
    this.entityManager.addEntity(animal.entity!);
    this.eventManager.emit('ANIMAL_ADDED', animal);
  }

  public getAnimals(): Animal[] {
    return this.animals;
  }

  public feedAnimal(id: string): void {
    const animal = this.animals.find(a => a.id === id);
    if (animal) {
      animal.hunger = Math.max(0, animal.hunger - 50);
      animal.happiness = Math.min(100, animal.happiness + 10);
    }
  }

  public petAnimal(id: string): void {
    const animal = this.animals.find(a => a.id === id);
    if (animal) {
      animal.happiness = Math.min(100, animal.happiness + 20);
      if (animal.hunger < 50 && animal.lastProducedDay !== this.timeManager.day) {
        animal.isProductive = true;
      }
    }
  }

  private processDailyUpdate(): void {
    const currentDay = this.timeManager.day;
    this.animals.forEach(animal => {
      animal.age++;
      animal.hunger = Math.min(100, animal.hunger + 30);
      
      if (animal.hunger > 50) {
        animal.happiness = Math.max(0, animal.happiness - 10);
      }

      // Production logic
      if (animal.age >= 3 && animal.hunger < 50 && animal.happiness > 60) {
        if (animal.lastProducedDay !== currentDay) {
           animal.isProductive = true;
        }
      } else {
        animal.isProductive = false;
      }
    });
    this.eventManager.emit('ANIMALS_UPDATED', this.animals);
  }

  public collectProduct(id: string): string | null {
    const animal = this.animals.find(a => a.id === id);
    if (animal && animal.isProductive) {
      animal.isProductive = false;
      animal.lastProducedDay = this.timeManager.day;
      
      switch(animal.type) {
        case AnimalType.CHICKEN: return 'egg';
        case AnimalType.COW: return 'milk';
        case AnimalType.SHEEP: return 'wool';
      }
    }
    return null;
  }

  public update(_dt: number): void {
    // Simple AI movement
    this.animals.forEach(animal => {
      if (Math.random() < 0.01) {
        animal.x += (Math.random() - 0.5) * 20;
        animal.y += (Math.random() - 0.5) * 20;
      }

      // Sync to entity
      if (animal.entity) {
          animal.entity.x = animal.x;
          animal.entity.y = animal.y;
          animal.entity.isProductive = animal.isProductive;
      }
    });
  }
}
