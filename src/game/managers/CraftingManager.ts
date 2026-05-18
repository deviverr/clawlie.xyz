import { EventManager } from '../../core/EventManager';
import { InventoryManager } from './InventoryManager';

export interface Recipe {
  id: string;
  name: string;
  ingredients: { itemId: string; count: number }[];
  output: { itemId: string; count: number };
  craftTime: number; // in game hours
}

export const RECIPES: Recipe[] = [
  {
    id: 'mayonnaise',
    name: 'Mayonnaise',
    ingredients: [{ itemId: 'egg', count: 1 }],
    output: { itemId: 'mayonnaise_jar', count: 1 },
    craftTime: 2
  },
  {
    id: 'cheese',
    name: 'Cheese',
    ingredients: [{ itemId: 'milk', count: 1 }],
    output: { itemId: 'cheese_wheel', count: 1 },
    craftTime: 4
  },
  {
    id: 'bread',
    name: 'Fresh Bread',
    ingredients: [{ itemId: 'wheat', count: 2 }],
    output: { itemId: 'bread_loaf', count: 1 },
    craftTime: 3
  }
];

export class CraftingManager {
  private static instance: CraftingManager;
  private inventoryManager: InventoryManager;
  private eventManager: EventManager;

  private constructor() {
    this.inventoryManager = InventoryManager.getInstance();
    this.eventManager = EventManager.getInstance();
  }

  public static getInstance(): CraftingManager {
    if (!CraftingManager.instance) {
      CraftingManager.instance = new CraftingManager();
    }
    return CraftingManager.instance;
  }

  public canCraft(recipeId: string): boolean {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe) return false;

    return recipe.ingredients.every(ing => 
      this.inventoryManager.hasItem(ing.itemId, ing.count)
    );
  }

  public craft(recipeId: string): boolean {
    const recipe = RECIPES.find(r => r.id === recipeId);
    if (!recipe || !this.canCraft(recipeId)) return false;

    // Consume ingredients
    recipe.ingredients.forEach(ing => {
      this.inventoryManager.removeItem(ing.itemId, ing.count);
    });

    // Add result (In a real game, this might take time)
    this.inventoryManager.addItem(recipe.output.itemId, recipe.output.count);
    
    this.eventManager.emit('CRAFT_COMPLETED', { recipeId, output: recipe.output });
    console.log(`Crafted ${recipe.name}`);
    return true;
  }
}
