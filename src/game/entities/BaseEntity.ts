import { Component } from '../components/Component';

export abstract class Entity {
  public id: string;
  public x: number;
  public y: number;
  public width: number = 32;
  public height: number = 32;
  public type: string = 'generic';
  public components: Map<string, any> = new Map();
  public isDestroyed: boolean = false;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  public addComponent(name: string, component: any): void {
    this.components.set(name, component);
  }

  public getComponent<T>(name: string): T {
    return this.components.get(name) as T;
  }

  public abstract update(dt: number): void;
  public abstract render(ctx: CanvasRenderingContext2D): void;

  public destroy(): void {
    this.isDestroyed = true;
  }
}
