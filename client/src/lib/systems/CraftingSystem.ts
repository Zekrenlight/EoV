import { CraftingRecipe, Item, ItemType, ItemRarity, CraftingSession } from '../types/GameTypes';
import { SAMPLE_ITEMS } from '../stores/useInventory';

export class CraftingSystem {
  private static recipes: CraftingRecipe[] = [];
  private static activeSessions: Map<string, CraftingSession> = new Map();

  // Initialize with basic recipes
  static initialize() {
    this.recipes = this.generateBaseRecipes();
    console.log('CraftingSystem initialized with', this.recipes.length, 'recipes');
  }

  private static generateBaseRecipes(): CraftingRecipe[] {
    return [
      // Basic Tools
      {
        id: 'fishing_rod',
        name: 'Fishing Rod',
        description: 'A simple fishing rod made from wood and basic materials.',
        result: SAMPLE_ITEMS.fishing_rod,
        resultQuantity: 1,
        ingredients: [
          { item: SAMPLE_ITEMS.wood, quantity: 3 },
          { item: SAMPLE_ITEMS.stone, quantity: 1 }
        ],
        skillRequired: 'woodworking',
        levelRequired: 1,
        craftingTime: 5000 // 5 seconds
      },

      // Basic Weapons
      {
        id: 'iron_sword',
        name: 'Iron Sword',
        description: 'A sturdy sword forged from iron ore.',
        result: SAMPLE_ITEMS.iron_sword,
        resultQuantity: 1,
        ingredients: [
          { item: SAMPLE_ITEMS.iron_ore, quantity: 3 },
          { item: SAMPLE_ITEMS.wood, quantity: 1 }
        ],
        skillRequired: 'smithing',
        levelRequired: 5,
        craftingTime: 8000
      },

      // Basic Armor
      {
        id: 'leather_armor',
        name: 'Leather Armor',
        description: 'Basic protection made from tanned leather.',
        result: SAMPLE_ITEMS.leather_armor,
        resultQuantity: 1,
        ingredients: [
          { item: this.createLeatherItem(), quantity: 5 },
          { item: SAMPLE_ITEMS.wood, quantity: 2 }
        ],
        skillRequired: 'woodworking',
        levelRequired: 3,
        craftingTime: 6000
      },

      // Consumables
      {
        id: 'health_potion',
        name: 'Health Potion',
        description: 'A healing potion brewed from herbs.',
        result: SAMPLE_ITEMS.health_potion,
        resultQuantity: 2,
        ingredients: [
          { item: this.createHealingHerbItem(), quantity: 3 },
          { item: this.createWaterItem(), quantity: 1 }
        ],
        skillRequired: 'herbalism',
        levelRequired: 2,
        craftingTime: 4000
      },

      {
        id: 'mana_potion',
        name: 'Mana Potion',
        description: 'A mystical potion that restores mana.',
        result: SAMPLE_ITEMS.mana_potion,
        resultQuantity: 2,
        ingredients: [
          { item: this.createManaHerbItem(), quantity: 2 },
          { item: this.createWaterItem(), quantity: 1 },
          { item: SAMPLE_ITEMS.stone, quantity: 1 }
        ],
        skillRequired: 'herbalism',
        levelRequired: 4,
        craftingTime: 5000
      },

      // Advanced Materials
      {
        id: 'iron_ingot',
        name: 'Iron Ingot',
        description: 'Refined iron ready for crafting.',
        result: this.createIronIngotItem(),
        resultQuantity: 1,
        ingredients: [
          { item: SAMPLE_ITEMS.iron_ore, quantity: 2 }
        ],
        skillRequired: 'smithing',
        levelRequired: 1,
        craftingTime: 3000
      },

      // Building Materials
      {
        id: 'wooden_planks',
        name: 'Wooden Planks',
        description: 'Processed wood planks for construction.',
        result: this.createWoodenPlanksItem(),
        resultQuantity: 4,
        ingredients: [
          { item: SAMPLE_ITEMS.wood, quantity: 1 }
        ],
        skillRequired: 'woodworking',
        levelRequired: 1,
        craftingTime: 2000
      },

      // Advanced Tools
      {
        id: 'steel_pickaxe',
        name: 'Steel Pickaxe',
        description: 'A high-quality pickaxe for mining rare ores.',
        result: this.createSteelPickaxeItem(),
        resultQuantity: 1,
        ingredients: [
          { item: this.createIronIngotItem(), quantity: 3 },
          { item: SAMPLE_ITEMS.wood, quantity: 2 }
        ],
        skillRequired: 'smithing',
        levelRequired: 10,
        craftingTime: 10000
      }
    ];
  }

  // Helper methods to create items not in SAMPLE_ITEMS
  private static createLeatherItem(): Item {
    return {
      id: 'leather',
      name: 'Leather',
      description: 'Tanned animal hide, useful for crafting.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.COMMON,
      stackSize: 25,
      value: 3,
      icon: '🦴'
    };
  }

  private static createHealingHerbItem(): Item {
    return {
      id: 'healing_herb',
      name: 'Healing Herb',
      description: 'A medicinal plant with healing properties.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.COMMON,
      stackSize: 50,
      value: 2,
      icon: '🌿'
    };
  }

  private static createManaHerbItem(): Item {
    return {
      id: 'mana_herb',
      name: 'Mana Herb',
      description: 'A mystical herb that enhances magical energy.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.UNCOMMON,
      stackSize: 25,
      value: 4,
      icon: '🔮'
    };
  }

  private static createWaterItem(): Item {
    return {
      id: 'water',
      name: 'Clean Water',
      description: 'Pure water essential for many recipes.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.COMMON,
      stackSize: 10,
      value: 1,
      icon: '💧'
    };
  }

  private static createIronIngotItem(): Item {
    return {
      id: 'iron_ingot',
      name: 'Iron Ingot',
      description: 'Refined iron ready for advanced crafting.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.UNCOMMON,
      stackSize: 20,
      value: 10,
      icon: '🔩'
    };
  }

  private static createWoodenPlanksItem(): Item {
    return {
      id: 'wooden_planks',
      name: 'Wooden Planks',
      description: 'Processed wood suitable for construction.',
      type: ItemType.MATERIAL,
      rarity: ItemRarity.COMMON,
      stackSize: 50,
      value: 2,
      icon: '🪵'
    };
  }

  private static createSteelPickaxeItem(): Item {
    return {
      id: 'steel_pickaxe',
      name: 'Steel Pickaxe',
      description: 'A durable pickaxe capable of mining rare materials.',
      type: ItemType.TOOL,
      rarity: ItemRarity.RARE,
      stackSize: 1,
      value: 150,
      icon: '⛏️',
      properties: {
        durability: 200
      }
    };
  }

  // Public methods
  static getAllRecipes(): CraftingRecipe[] {
    if (this.recipes.length === 0) {
      this.initialize();
    }
    return this.recipes;
  }

  static getRecipeById(id: string): CraftingRecipe | null {
    return this.recipes.find(recipe => recipe.id === id) || null;
  }

  static getRecipesBySkill(skillId: string): CraftingRecipe[] {
    return this.recipes.filter(recipe => recipe.skillRequired === skillId);
  }

  static getRecipesByCategory(category: ItemType): CraftingRecipe[] {
    return this.recipes.filter(recipe => recipe.result.type === category);
  }

  static canCraftRecipe(recipeId: string, playerSkills: any[], playerInventory: any[]): boolean {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return false;

    // Check skill requirements
    const requiredSkill = playerSkills.find(skill => skill.id === recipe.skillRequired);
    if (!requiredSkill || requiredSkill.level < recipe.levelRequired) {
      return false;
    }

    // Check ingredient availability
    for (const ingredient of recipe.ingredients) {
      const availableQuantity = this.getItemQuantityInInventory(ingredient.item.id, playerInventory);
      if (availableQuantity < ingredient.quantity) {
        return false;
      }
    }

    return true;
  }

  static startCrafting(recipeId: string): boolean {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) {
      console.error('Recipe not found:', recipeId);
      return false;
    }

    const sessionId = `craft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: CraftingSession = {
      recipe,
      progress: 0,
      isActive: true,
      startTime: Date.now()
    };

    this.activeSessions.set(sessionId, session);
    console.log(`Started crafting: ${recipe.name} (Session: ${sessionId})`);

    // Simulate crafting progress
    this.simulateCrafting(sessionId);

    return true;
  }

  private static simulateCrafting(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.isActive) return;

    const updateInterval = 100; // Update every 100ms
    const progressPerUpdate = (updateInterval / session.recipe.craftingTime) * 100;

    const updateProgress = () => {
      const currentSession = this.activeSessions.get(sessionId);
      if (!currentSession || !currentSession.isActive) return;

      currentSession.progress += progressPerUpdate;

      if (currentSession.progress >= 100) {
        currentSession.progress = 100;
        currentSession.isActive = false;
        console.log(`Crafting completed: ${currentSession.recipe.name}`);
        this.activeSessions.delete(sessionId);
      } else {
        setTimeout(updateProgress, updateInterval);
      }
    };

    updateProgress();
  }

  static getCraftingSession(sessionId: string): CraftingSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  static getActiveSessions(): CraftingSession[] {
    return Array.from(this.activeSessions.values());
  }

  static cancelCrafting(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      console.log(`Crafting cancelled: ${session.recipe.name}`);
      return true;
    }
    return false;
  }

  private static getItemQuantityInInventory(itemId: string, inventory: any[]): number {
    return inventory.reduce((total, slot) => {
      return slot.item && slot.item.id === itemId ? total + slot.quantity : total;
    }, 0);
  }

  // Recipe discovery system
  static discoverRecipe(recipeId: string): boolean {
    // This would integrate with a discovery system
    console.log(`Recipe discovered: ${recipeId}`);
    return true;
  }

  // Calculate crafting success chance (for advanced crafting)
  static calculateSuccessChance(recipe: CraftingRecipe, skillLevel: number): number {
    const baseDifficulty = recipe.levelRequired;
    const skillAdvantage = skillLevel - baseDifficulty;
    
    let successChance = 0.5; // Base 50% chance
    
    if (skillAdvantage >= 0) {
      successChance = Math.min(0.95, 0.5 + (skillAdvantage * 0.05)); // Up to 95%
    } else {
      successChance = Math.max(0.1, 0.5 + (skillAdvantage * 0.05)); // Down to 10%
    }
    
    return successChance;
  }

  // Batch crafting
  static startBatchCrafting(recipeId: string, quantity: number): string[] {
    const sessionIds: string[] = [];
    
    for (let i = 0; i < quantity; i++) {
      if (this.startCrafting(recipeId)) {
        const sessions = Array.from(this.activeSessions.keys());
        sessionIds.push(sessions[sessions.length - 1]);
      }
    }
    
    return sessionIds;
  }

  // Get crafting requirements for a recipe
  static getCraftingRequirements(recipeId: string): {
    skill: string;
    level: number;
    ingredients: Array<{ item: Item; quantity: number }>;
    time: number;
  } | null {
    const recipe = this.getRecipeById(recipeId);
    if (!recipe) return null;

    return {
      skill: recipe.skillRequired,
      level: recipe.levelRequired,
      ingredients: recipe.ingredients,
      time: recipe.craftingTime
    };
  }
}

// Initialize the crafting system
if (typeof window !== 'undefined') {
  CraftingSystem.initialize();
}
