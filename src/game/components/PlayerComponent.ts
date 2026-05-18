// src/game/components/PlayerComponent.ts
export class PlayerComponent {
  name: string;
  position: { x: number; y: number };
  health: number;
  inventory: string[];

  constructor() {
    this.name = "Player";
    this.position = { x: 0, y: 0 };
    this.health = 100;
    this.inventory = [];
  }
}