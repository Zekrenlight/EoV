import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';
import { PlayerCharacter, PlayerStats, PantheonGod, PlayerAppearance, InventorySlot } from '../types/GameTypes';

interface PlayerState {
  player: PlayerCharacter | null;
  inventory: InventorySlot[];
  isMoving: boolean;
  targetPosition: THREE.Vector3 | null;
  
  // Actions
  createPlayer: (characterData: Partial<PlayerCharacter>) => void;
  updatePlayer: (updates: Partial<PlayerCharacter>) => void;
  updateStats: (stats: Partial<PlayerStats>) => void;
  setPosition: (position: THREE.Vector3) => void;
  setTargetPosition: (position: THREE.Vector3 | null) => void;
  setMoving: (moving: boolean) => void;
  takeDamage: (damage: number) => void;
  heal: (amount: number) => void;
  gainExperience: (amount: number) => void;
  addItemToInventory: (item: any, quantity: number) => boolean;
  removeItemFromInventory: (slotIndex: number, quantity: number) => void;
  savePlayer: () => void;
  loadPlayer: () => void;
}

const INVENTORY_SIZE = 30;

// Default player stats
const createDefaultStats = (): PlayerStats => ({
  health: 100,
  maxHealth: 100,
  mana: 50,
  maxMana: 50,
  level: 1,
  experience: 0,
  experienceToNext: 100
});

// Default inventory
const createDefaultInventory = (): InventorySlot[] => {
  return Array.from({ length: INVENTORY_SIZE }, () => ({
    item: null,
    quantity: 0
  }));
};

export const usePlayer = create<PlayerState>()(
  subscribeWithSelector((set, get) => ({
    player: null,
    inventory: createDefaultInventory(),
    isMoving: false,
    targetPosition: null,

    createPlayer: (characterData) => {
      const defaultAppearance: PlayerAppearance = {
        skinColor: '#F4C2A1',
        hairColor: '#8B4513',
        eyeColor: '#4169E1',
        gender: 'male',
        outfit: 'basic'
      };

      const newPlayer: PlayerCharacter = {
        id: `player_${Date.now()}`,
        name: characterData.name || 'Hero',
        stats: createDefaultStats(),
        position: new THREE.Vector3(0, 0, 0),
        rotation: 0,
        isMoving: false,
        pantheonAttunement: characterData.pantheonAttunement || PantheonGod.AILURA,
        appearance: { ...defaultAppearance, ...characterData.appearance }
      };

      console.log('Creating new player:', newPlayer);
      
      set({ 
        player: newPlayer,
        inventory: createDefaultInventory()
      });
      
      // Auto-save after creation
      setTimeout(() => get().savePlayer(), 100);
    },

    updatePlayer: (updates) => {
      set((state) => {
        if (!state.player) return state;
        return {
          player: { ...state.player, ...updates }
        };
      });
    },

    updateStats: (stats) => {
      set((state) => {
        if (!state.player) return state;
        return {
          player: {
            ...state.player,
            stats: { ...state.player.stats, ...stats }
          }
        };
      });
    },

    setPosition: (position) => {
      set((state) => {
        if (!state.player) return state;
        return {
          player: {
            ...state.player,
            position: position.clone()
          }
        };
      });
    },

    setTargetPosition: (position) => {
      set({ 
        targetPosition: position ? position.clone() : null,
        isMoving: position !== null
      });
      
      // Update player target if exists
      const { player } = get();
      if (player) {
        get().updatePlayer({ 
          targetPosition: position ? position.clone() : undefined,
          isMoving: position !== null
        });
      }
    },

    setMoving: (moving) => {
      set({ isMoving: moving });
      
      const { player } = get();
      if (player) {
        get().updatePlayer({ isMoving: moving });
      }
    },

    takeDamage: (damage) => {
      set((state) => {
        if (!state.player) return state;
        
        const newHealth = Math.max(0, state.player.stats.health - damage);
        console.log(`Player took ${damage} damage. Health: ${newHealth}/${state.player.stats.maxHealth}`);
        
        return {
          player: {
            ...state.player,
            stats: {
              ...state.player.stats,
              health: newHealth
            }
          }
        };
      });
    },

    heal: (amount) => {
      set((state) => {
        if (!state.player) return state;
        
        const newHealth = Math.min(state.player.stats.maxHealth, state.player.stats.health + amount);
        console.log(`Player healed for ${amount}. Health: ${newHealth}/${state.player.stats.maxHealth}`);
        
        return {
          player: {
            ...state.player,
            stats: {
              ...state.player.stats,
              health: newHealth
            }
          }
        };
      });
    },

    gainExperience: (amount) => {
      set((state) => {
        if (!state.player) return state;
        
        let newExperience = state.player.stats.experience + amount;
        let newLevel = state.player.stats.level;
        let experienceToNext = state.player.stats.experienceToNext;
        
        // Check for level up
        while (newExperience >= experienceToNext) {
          newExperience -= experienceToNext;
          newLevel++;
          experienceToNext = newLevel * 100; // Simple formula
          
          console.log(`Player leveled up! New level: ${newLevel}`);
          
          // Increase max health and mana on level up
          const healthIncrease = 10;
          const manaIncrease = 5;
        }
        
        const updatedStats = {
          ...state.player.stats,
          experience: newExperience,
          level: newLevel,
          experienceToNext,
          maxHealth: state.player.stats.maxHealth + (newLevel > state.player.stats.level ? 10 : 0),
          maxMana: state.player.stats.maxMana + (newLevel > state.player.stats.level ? 5 : 0),
          health: state.player.stats.health + (newLevel > state.player.stats.level ? 10 : 0),
          mana: state.player.stats.mana + (newLevel > state.player.stats.level ? 5 : 0)
        };
        
        return {
          player: {
            ...state.player,
            stats: updatedStats
          }
        };
      });
    },

    addItemToInventory: (item, quantity) => {
      const state = get();
      const inventory = [...state.inventory];
      
      // Try to stack with existing items first
      for (let i = 0; i < inventory.length; i++) {
        const slot = inventory[i];
        if (slot.item && slot.item.id === item.id) {
          const availableSpace = item.stackSize - slot.quantity;
          if (availableSpace > 0) {
            const addAmount = Math.min(quantity, availableSpace);
            inventory[i] = {
              ...slot,
              quantity: slot.quantity + addAmount
            };
            quantity -= addAmount;
            
            if (quantity <= 0) {
              set({ inventory });
              console.log(`Added ${addAmount} ${item.name} to inventory (stacked)`);
              return true;
            }
          }
        }
      }
      
      // Find empty slots for remaining items
      for (let i = 0; i < inventory.length && quantity > 0; i++) {
        if (!inventory[i].item) {
          const addAmount = Math.min(quantity, item.stackSize);
          inventory[i] = {
            item: { ...item },
            quantity: addAmount
          };
          quantity -= addAmount;
          console.log(`Added ${addAmount} ${item.name} to inventory slot ${i}`);
        }
      }
      
      set({ inventory });
      
      if (quantity > 0) {
        console.log(`Could not add all items. ${quantity} ${item.name} remaining.`);
        return false;
      }
      
      return true;
    },

    removeItemFromInventory: (slotIndex, quantity) => {
      set((state) => {
        const inventory = [...state.inventory];
        const slot = inventory[slotIndex];
        
        if (!slot.item || slot.quantity < quantity) {
          console.warn('Cannot remove items: insufficient quantity');
          return state;
        }
        
        const newQuantity = slot.quantity - quantity;
        
        if (newQuantity <= 0) {
          inventory[slotIndex] = { item: null, quantity: 0 };
          console.log(`Removed all ${slot.item.name} from slot ${slotIndex}`);
        } else {
          inventory[slotIndex] = { ...slot, quantity: newQuantity };
          console.log(`Removed ${quantity} ${slot.item.name} from slot ${slotIndex}. ${newQuantity} remaining.`);
        }
        
        return { inventory };
      });
    },

    savePlayer: () => {
      const { player, inventory } = get();
      if (player) {
        const saveData = {
          player: {
            ...player,
            position: {
              x: player.position.x,
              y: player.position.y,
              z: player.position.z
            }
          },
          inventory,
          savedAt: Date.now()
        };
        
        try {
          localStorage.setItem('valtara_save', JSON.stringify(saveData));
          console.log('Player data saved successfully');
        } catch (error) {
          console.error('Failed to save player data:', error);
        }
      }
    },

    loadPlayer: () => {
      try {
        const saveData = localStorage.getItem('valtara_save');
        if (saveData) {
          const parsed = JSON.parse(saveData);
          
          // Reconstruct Vector3 from saved position
          if (parsed.player.position) {
            parsed.player.position = new THREE.Vector3(
              parsed.player.position.x,
              parsed.player.position.y,
              parsed.player.position.z
            );
          }
          
          set({
            player: parsed.player,
            inventory: parsed.inventory || createDefaultInventory()
          });
          
          console.log('Player data loaded successfully');
          return true;
        }
      } catch (error) {
        console.error('Failed to load player data:', error);
      }
      
      return false;
    }
  }))
);

// Auto-save player data periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { player, savePlayer } = usePlayer.getState();
    if (player) {
      savePlayer();
    }
  }, 30000); // Save every 30 seconds
}
