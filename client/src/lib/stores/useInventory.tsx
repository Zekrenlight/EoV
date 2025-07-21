import { create } from 'zustand';
import { Item, InventorySlot, ItemType, ItemRarity } from '../types/GameTypes';

interface InventoryState {
  slots: InventorySlot[];
  selectedSlot: number | null;
  draggedItem: { slot: number; item: Item; quantity: number } | null;
  
  // Actions
  addItem: (item: Item, quantity: number) => boolean;
  removeItem: (slotIndex: number, quantity: number) => void;
  moveItem: (fromSlot: number, toSlot: number, quantity?: number) => void;
  useItem: (slotIndex: number) => void;
  selectSlot: (slotIndex: number | null) => void;
  startDrag: (slotIndex: number) => void;
  endDrag: () => void;
  getItemCount: (itemId: string) => number;
  hasItem: (itemId: string, quantity?: number) => boolean;
  findEmptySlot: () => number | null;
  sortInventory: () => void;
}

const INVENTORY_SIZE = 30;

// Sample items for the game
export const SAMPLE_ITEMS: { [key: string]: Item } = {
  'wood': {
    id: 'wood',
    name: 'Wood',
    description: 'Basic crafting material. Used in construction and crafting.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    stackSize: 50,
    value: 1,
    icon: '🪵'
  },
  'stone': {
    id: 'stone',
    name: 'Stone',
    description: 'Hard material used for building and tools.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.COMMON,
    stackSize: 50,
    value: 2,
    icon: '🪨'
  },
  'iron_ore': {
    id: 'iron_ore',
    name: 'Iron Ore',
    description: 'Raw iron ore that can be smelted into ingots.',
    type: ItemType.MATERIAL,
    rarity: ItemRarity.UNCOMMON,
    stackSize: 25,
    value: 5,
    icon: '⛏️'
  },
  'health_potion': {
    id: 'health_potion',
    name: 'Health Potion',
    description: 'Restores 50 health points when consumed.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    stackSize: 10,
    value: 25,
    icon: '🧪',
    properties: {
      healing: 50
    }
  },
  'mana_potion': {
    id: 'mana_potion',
    name: 'Mana Potion',
    description: 'Restores 30 mana points when consumed.',
    type: ItemType.CONSUMABLE,
    rarity: ItemRarity.COMMON,
    stackSize: 10,
    value: 20,
    icon: '🔮'
  },
  'iron_sword': {
    id: 'iron_sword',
    name: 'Iron Sword',
    description: 'A sturdy sword forged from iron. +15 Attack damage.',
    type: ItemType.WEAPON,
    rarity: ItemRarity.UNCOMMON,
    stackSize: 1,
    value: 100,
    icon: '⚔️',
    properties: {
      damage: 15,
      durability: 100
    }
  },
  'leather_armor': {
    id: 'leather_armor',
    name: 'Leather Armor',
    description: 'Basic leather protection. +5 Defense.',
    type: ItemType.ARMOR,
    rarity: ItemRarity.COMMON,
    stackSize: 1,
    value: 50,
    icon: '🛡️',
    properties: {
      defense: 5,
      durability: 80
    }
  },
  'fishing_rod': {
    id: 'fishing_rod',
    name: 'Fishing Rod',
    description: 'Used to catch fish from water sources.',
    type: ItemType.TOOL,
    rarity: ItemRarity.COMMON,
    stackSize: 1,
    value: 30,
    icon: '🎣',
    properties: {
      durability: 50
    }
  }
};

const createEmptyInventory = (): InventorySlot[] => {
  return Array.from({ length: INVENTORY_SIZE }, () => ({
    item: null,
    quantity: 0
  }));
};

export const useInventory = create<InventoryState>((set, get) => ({
  slots: createEmptyInventory(),
  selectedSlot: null,
  draggedItem: null,

  addItem: (item, quantity) => {
    const { slots } = get();
    const newSlots = [...slots];
    let remainingQuantity = quantity;

    // First, try to stack with existing items
    for (let i = 0; i < newSlots.length && remainingQuantity > 0; i++) {
      const slot = newSlots[i];
      if (slot.item && slot.item.id === item.id) {
        const availableSpace = item.stackSize - slot.quantity;
        if (availableSpace > 0) {
          const addAmount = Math.min(remainingQuantity, availableSpace);
          newSlots[i] = {
            ...slot,
            quantity: slot.quantity + addAmount
          };
          remainingQuantity -= addAmount;
        }
      }
    }

    // Then, use empty slots
    for (let i = 0; i < newSlots.length && remainingQuantity > 0; i++) {
      if (!newSlots[i].item) {
        const addAmount = Math.min(remainingQuantity, item.stackSize);
        newSlots[i] = {
          item: { ...item },
          quantity: addAmount
        };
        remainingQuantity -= addAmount;
      }
    }

    set({ slots: newSlots });
    
    console.log(`Added ${quantity - remainingQuantity} ${item.name} to inventory`);
    return remainingQuantity === 0;
  },

  removeItem: (slotIndex, quantity) => {
    const { slots } = get();
    const slot = slots[slotIndex];
    
    if (!slot.item || slot.quantity < quantity) {
      console.warn('Cannot remove item: insufficient quantity');
      return;
    }

    const newSlots = [...slots];
    const newQuantity = slot.quantity - quantity;

    if (newQuantity <= 0) {
      newSlots[slotIndex] = { item: null, quantity: 0 };
    } else {
      newSlots[slotIndex] = { ...slot, quantity: newQuantity };
    }

    set({ slots: newSlots });
    console.log(`Removed ${quantity} ${slot.item.name} from inventory`);
  },

  moveItem: (fromSlot, toSlot, quantity) => {
    if (fromSlot === toSlot) return;

    const { slots } = get();
    const fromSlotData = slots[fromSlot];
    const toSlotData = slots[toSlot];

    if (!fromSlotData.item) return;

    const moveQuantity = quantity || fromSlotData.quantity;
    if (moveQuantity > fromSlotData.quantity) return;

    const newSlots = [...slots];

    // If target slot is empty
    if (!toSlotData.item) {
      newSlots[toSlot] = {
        item: { ...fromSlotData.item },
        quantity: moveQuantity
      };

      if (moveQuantity === fromSlotData.quantity) {
        newSlots[fromSlot] = { item: null, quantity: 0 };
      } else {
        newSlots[fromSlot] = {
          ...fromSlotData,
          quantity: fromSlotData.quantity - moveQuantity
        };
      }
    }
    // If target slot has the same item (stack)
    else if (toSlotData.item.id === fromSlotData.item.id) {
      const availableSpace = toSlotData.item.stackSize - toSlotData.quantity;
      const actualMoveQuantity = Math.min(moveQuantity, availableSpace);

      if (actualMoveQuantity > 0) {
        newSlots[toSlot] = {
          ...toSlotData,
          quantity: toSlotData.quantity + actualMoveQuantity
        };

        if (actualMoveQuantity === fromSlotData.quantity) {
          newSlots[fromSlot] = { item: null, quantity: 0 };
        } else {
          newSlots[fromSlot] = {
            ...fromSlotData,
            quantity: fromSlotData.quantity - actualMoveQuantity
          };
        }
      }
    }
    // If target slot has different item (swap)
    else {
      newSlots[fromSlot] = { ...toSlotData };
      newSlots[toSlot] = {
        item: { ...fromSlotData.item },
        quantity: fromSlotData.quantity
      };
    }

    set({ slots: newSlots });
  },

  useItem: (slotIndex) => {
    const { slots } = get();
    const slot = slots[slotIndex];
    
    if (!slot.item) return;

    console.log(`Using item: ${slot.item.name}`);

    // Handle consumable items
    if (slot.item.type === ItemType.CONSUMABLE) {
      // Apply item effects (this would integrate with player stats)
      if (slot.item.properties?.healing) {
        console.log(`Healed for ${slot.item.properties.healing} HP`);
        // This would call usePlayer's heal method
      }
      
      // Remove one item after use
      get().removeItem(slotIndex, 1);
    }
    
    // Handle equipment items (weapons, armor)
    else if (slot.item.type === ItemType.WEAPON || slot.item.type === ItemType.ARMOR) {
      console.log(`Equipped ${slot.item.name}`);
      // This would integrate with equipment system
    }
    
    // Handle tools
    else if (slot.item.type === ItemType.TOOL) {
      console.log(`Selected tool: ${slot.item.name}`);
      // Set as active tool
    }
  },

  selectSlot: (slotIndex) => {
    set({ selectedSlot: slotIndex });
  },

  startDrag: (slotIndex) => {
    const { slots } = get();
    const slot = slots[slotIndex];
    
    if (slot.item) {
      set({
        draggedItem: {
          slot: slotIndex,
          item: slot.item,
          quantity: slot.quantity
        }
      });
    }
  },

  endDrag: () => {
    set({ draggedItem: null });
  },

  getItemCount: (itemId) => {
    const { slots } = get();
    return slots.reduce((count, slot) => {
      return slot.item && slot.item.id === itemId ? count + slot.quantity : count;
    }, 0);
  },

  hasItem: (itemId, quantity = 1) => {
    return get().getItemCount(itemId) >= quantity;
  },

  findEmptySlot: () => {
    const { slots } = get();
    const emptyIndex = slots.findIndex(slot => !slot.item);
    return emptyIndex !== -1 ? emptyIndex : null;
  },

  sortInventory: () => {
    const { slots } = get();
    
    // Filter out empty slots and sort by type, rarity, then name
    const itemSlots = slots.filter(slot => slot.item);
    const typeOrder = [ItemType.WEAPON, ItemType.ARMOR, ItemType.TOOL, ItemType.CONSUMABLE, ItemType.MATERIAL, ItemType.QUEST];
    const rarityOrder = [ItemRarity.LEGENDARY, ItemRarity.EPIC, ItemRarity.RARE, ItemRarity.UNCOMMON, ItemRarity.COMMON];
    
    itemSlots.sort((a, b) => {
      if (!a.item || !b.item) return 0;
      
      // Sort by type first
      const typeA = typeOrder.indexOf(a.item.type);
      const typeB = typeOrder.indexOf(b.item.type);
      if (typeA !== typeB) return typeA - typeB;
      
      // Then by rarity
      const rarityA = rarityOrder.indexOf(a.item.rarity);
      const rarityB = rarityOrder.indexOf(b.item.rarity);
      if (rarityA !== rarityB) return rarityA - rarityB;
      
      // Finally by name
      return a.item.name.localeCompare(b.item.name);
    });
    
    // Create new slots array with sorted items followed by empty slots
    const newSlots: InventorySlot[] = [];
    itemSlots.forEach(slot => newSlots.push(slot));
    
    while (newSlots.length < INVENTORY_SIZE) {
      newSlots.push({ item: null, quantity: 0 });
    }
    
    set({ slots: newSlots });
    console.log('Inventory sorted');
  }
}));
