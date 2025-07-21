import React, { useState, useMemo } from 'react';
import { useInventory, SAMPLE_ITEMS } from '../../lib/stores/useInventory';
import { useSkills } from '../../lib/stores/useSkills';
import { CraftingSystem } from '../../lib/systems/CraftingSystem';
import { CraftingRecipe, Item } from '../../lib/types/GameTypes';

interface CraftingProps {
  onClose: () => void;
}

const Crafting: React.FC<CraftingProps> = ({ onClose }) => {
  const { slots, addItem, removeItem, hasItem, getItemCount } = useInventory();
  const { skills } = useSkills();
  const [selectedRecipe, setSelectedRecipe] = useState<CraftingRecipe | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get all available recipes
  const allRecipes = CraftingSystem.getAllRecipes();

  // Filter recipes based on category and search
  const filteredRecipes = useMemo(() => {
    return allRecipes.filter(recipe => {
      const matchesCategory = selectedCategory === 'all' || 
        recipe.result.type === selectedCategory;
      
      const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [allRecipes, selectedCategory, searchTerm]);

  // Check if player can craft a recipe
  const canCraftRecipe = (recipe: CraftingRecipe): { canCraft: boolean; reason?: string } => {
    // Check skill requirements
    const requiredSkill = skills.find(skill => skill.id === recipe.skillRequired);
    if (!requiredSkill) {
      return { canCraft: false, reason: `Missing skill: ${recipe.skillRequired}` };
    }
    
    if (requiredSkill.level < recipe.levelRequired) {
      return { 
        canCraft: false, 
        reason: `Requires ${recipe.skillRequired} level ${recipe.levelRequired} (current: ${requiredSkill.level})` 
      };
    }

    // Check ingredients
    for (const ingredient of recipe.ingredients) {
      const availableCount = getItemCount(ingredient.item.id);
      if (availableCount < ingredient.quantity) {
        return { 
          canCraft: false, 
          reason: `Need ${ingredient.quantity - availableCount} more ${ingredient.item.name}` 
        };
      }
    }

    return { canCraft: true };
  };

  const handleCraftItem = () => {
    if (!selectedRecipe) return;

    const craftingCheck = canCraftRecipe(selectedRecipe);
    if (!craftingCheck.canCraft) {
      console.log('Cannot craft:', craftingCheck.reason);
      return;
    }

    // Start crafting process
    const success = CraftingSystem.startCrafting(selectedRecipe.id);
    if (success) {
      // Remove ingredients from inventory
      selectedRecipe.ingredients.forEach(ingredient => {
        // Find slot with this item and remove the required quantity
        for (let i = 0; i < slots.length; i++) {
          const slot = slots[i];
          if (slot.item && slot.item.id === ingredient.item.id) {
            const removeCount = Math.min(slot.quantity, ingredient.quantity);
            removeItem(i, removeCount);
            ingredient.quantity -= removeCount;
            if (ingredient.quantity <= 0) break;
          }
        }
      });

      // Add crafted item to inventory
      const craftedSuccessfully = addItem(selectedRecipe.result, selectedRecipe.resultQuantity);
      
      if (craftedSuccessfully) {
        console.log(`Crafted ${selectedRecipe.resultQuantity}x ${selectedRecipe.result.name}!`);
        
        // Grant crafting experience
        useSkills.getState().gainSkillExperience(selectedRecipe.skillRequired, 50);
        
        // Clear selection
        setSelectedRecipe(null);
      } else {
        console.log('Inventory full! Could not add crafted item.');
        // Would need to restore ingredients here in a real implementation
      }
    }
  };

  const categories = [
    { id: 'all', name: 'All', icon: '📋' },
    { id: 'weapon', name: 'Weapons', icon: '⚔️' },
    { id: 'armor', name: 'Armor', icon: '🛡️' },
    { id: 'tool', name: 'Tools', icon: '🔧' },
    { id: 'consumable', name: 'Consumables', icon: '🧪' },
    { id: 'material', name: 'Materials', icon: '📦' }
  ];

  const getItemIcon = (item: Item) => {
    return item.icon || '📦';
  };

  return (
    <div className="game-panel w-full max-w-6xl max-h-[90vh] overflow-hidden">
      <div className="game-panel-header flex justify-between items-center">
        <h2 className="text-xl font-bold">Crafting Workshop</h2>
        <button onClick={onClose} className="text-2xl hover:text-red-400">
          ×
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
        <div className="grid grid-cols-3 gap-6">
          {/* Categories and Search */}
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="game-input w-full"
              />
            </div>

            <div className="space-y-2 mb-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left p-2 rounded transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-valtara-primary text-valtara-bg'
                      : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Recipe List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
              Recipes ({filteredRecipes.length})
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredRecipes.map((recipe) => {
                const craftingCheck = canCraftRecipe(recipe);
                
                return (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe)}
                    className={`p-3 rounded cursor-pointer transition-colors border-2 ${
                      selectedRecipe?.id === recipe.id
                        ? 'border-valtara-primary bg-valtara-bg-light'
                        : craftingCheck.canCraft
                        ? 'border-valtara-border bg-valtara-bg-light hover:border-valtara-secondary'
                        : 'border-gray-600 bg-gray-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {getItemIcon(recipe.result)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-valtara-text">
                          {recipe.name}
                        </h4>
                        <p className="text-xs text-valtara-text-muted">
                          {recipe.skillRequired} Level {recipe.levelRequired}
                        </p>
                        {!craftingCheck.canCraft && (
                          <p className="text-xs text-red-400">
                            {craftingCheck.reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          {recipe.resultQuantity}x
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recipe Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
              Recipe Details
            </h3>
            
            {selectedRecipe ? (
              <div className="space-y-4">
                {/* Result Item */}
                <div className="game-panel p-4">
                  <h4 className="font-semibold text-valtara-primary mb-2">Crafting Result</h4>
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">
                      {getItemIcon(selectedRecipe.result)}
                    </div>
                    <div>
                      <div className="font-bold">{selectedRecipe.result.name}</div>
                      <div className="text-sm text-valtara-text-muted">
                        {selectedRecipe.resultQuantity}x {selectedRecipe.result.type}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-valtara-text mt-2">
                    {selectedRecipe.description}
                  </p>
                </div>

                {/* Requirements */}
                <div className="game-panel p-4">
                  <h4 className="font-semibold text-valtara-primary mb-2">Requirements</h4>
                  <div className="text-sm space-y-1">
                    <div>
                      <span className="text-valtara-text-muted">Skill:</span>{' '}
                      {selectedRecipe.skillRequired} Level {selectedRecipe.levelRequired}
                    </div>
                    <div>
                      <span className="text-valtara-text-muted">Time:</span>{' '}
                      {(selectedRecipe.craftingTime / 1000).toFixed(1)}s
                    </div>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="game-panel p-4">
                  <h4 className="font-semibold text-valtara-primary mb-2">Ingredients</h4>
                  <div className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => {
                      const available = getItemCount(ingredient.item.id);
                      const hasEnough = available >= ingredient.quantity;
                      
                      return (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-2 rounded ${
                            hasEnough ? 'bg-green-900' : 'bg-red-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getItemIcon(ingredient.item)}</span>
                            <span className="text-sm">{ingredient.item.name}</span>
                          </div>
                          <span className={`text-sm font-semibold ${
                            hasEnough ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {available}/{ingredient.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Craft Button */}
                <button
                  onClick={handleCraftItem}
                  disabled={!canCraftRecipe(selectedRecipe).canCraft}
                  className={`game-button w-full py-3 ${
                    !canCraftRecipe(selectedRecipe).canCraft 
                      ? 'opacity-50 cursor-not-allowed' 
                      : ''
                  }`}
                >
                  🔨 Craft {selectedRecipe.result.name}
                </button>
              </div>
            ) : (
              <div className="game-panel p-4 text-center text-valtara-text-muted">
                <p>Select a recipe to view details</p>
                <p className="text-xs mt-2">
                  Choose from the recipes on the left to see ingredients and requirements.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Craft Bar */}
        <div className="mt-6 p-4 bg-valtara-bg-light rounded">
          <h4 className="font-semibold text-valtara-primary mb-2">Quick Craft</h4>
          <div className="flex gap-2">
            {allRecipes.slice(0, 6).map((recipe) => {
              const craftingCheck = canCraftRecipe(recipe);
              return (
                <button
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  disabled={!craftingCheck.canCraft}
                  className={`p-2 rounded transition-colors ${
                    craftingCheck.canCraft
                      ? 'bg-valtara-primary text-valtara-bg hover:bg-valtara-secondary'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                  title={`${recipe.name}\n${craftingCheck.reason || 'Ready to craft'}`}
                >
                  <div className="text-lg">{getItemIcon(recipe.result)}</div>
                  <div className="text-xs">{recipe.name.split(' ')[0]}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Crafting;
