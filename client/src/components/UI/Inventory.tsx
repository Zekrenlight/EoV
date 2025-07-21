import React, { useState } from 'react';
import { useInventory, SAMPLE_ITEMS } from '../../lib/stores/useInventory';
import { usePlayer } from '../../lib/stores/usePlayer';

interface InventoryProps {
  onClose: () => void;
}

const Inventory: React.FC<InventoryProps> = ({ onClose }) => {
  const { slots, selectedSlot, selectSlot, moveItem, useItem, sortInventory } = useInventory();
  const { player } = usePlayer();
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);

  const handleSlotClick = (slotIndex: number) => {
    if (selectedSlot === slotIndex) {
      // Double-click to use item
      useItem(slotIndex);
      selectSlot(null);
    } else {
      selectSlot(slotIndex);
    }
  };

  const handleDragStart = (slotIndex: number) => {
    if (slots[slotIndex].item) {
      setDraggedSlot(slotIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetSlot: number) => {
    e.preventDefault();
    if (draggedSlot !== null && draggedSlot !== targetSlot) {
      moveItem(draggedSlot, targetSlot);
    }
    setDraggedSlot(null);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#94a3b8';
      case 'uncommon': return '#10b981';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#94a3b8';
    }
  };

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'weapon': return '⚔️';
      case 'armor': return '🛡️';
      case 'tool': return '🔧';
      case 'consumable': return '🧪';
      case 'material': return '📦';
      case 'quest': return '📋';
      default: return '❓';
    }
  };

  // Calculate inventory statistics
  const totalSlots = slots.length;
  const occupiedSlots = slots.filter(slot => slot.item).length;
  const totalValue = slots.reduce((sum, slot) => {
    return sum + (slot.item ? slot.item.value * slot.quantity : 0);
  }, 0);

  return (
    <div className="game-panel w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <div className="game-panel-header flex justify-between items-center">
        <h2 className="text-xl font-bold">Inventory</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {occupiedSlots}/{totalSlots} slots | Total Value: {totalValue}g
          </span>
          <button 
            onClick={sortInventory}
            className="game-button text-xs py-1 px-2"
          >
            Sort
          </button>
          <button onClick={onClose} className="text-2xl hover:text-red-400">
            ×
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
        <div className="grid grid-cols-2 gap-6">
          {/* Main Inventory Grid */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
              Inventory ({occupiedSlots}/{totalSlots})
            </h3>
            
            <div className="inventory-grid">
              {slots.map((slot, index) => (
                <div
                  key={index}
                  className={`inventory-slot ${slot.item ? 'occupied' : ''} ${selectedSlot === index ? 'ring-2 ring-valtara-primary' : ''}`}
                  onClick={() => handleSlotClick(index)}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  draggable={!!slot.item}
                  title={slot.item ? 
                    `${slot.item.name} x${slot.quantity}\n${slot.item.description}\nValue: ${slot.item.value}g each` : 
                    'Empty slot'
                  }
                  style={{
                    borderColor: slot.item ? getRarityColor(slot.item.rarity) : undefined,
                    cursor: slot.item ? 'pointer' : 'default'
                  }}
                >
                  {slot.item && (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-lg mb-1">
                        {slot.item.icon || getItemTypeIcon(slot.item.type)}
                      </div>
                      {slot.quantity > 1 && (
                        <div className="text-xs font-bold bg-valtara-primary text-valtara-bg rounded px-1">
                          {slot.quantity}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => {
                  // Add sample items for testing
                  Object.values(SAMPLE_ITEMS).forEach(item => {
                    useInventory.getState().addItem(item, 1);
                  });
                }}
                className="game-button secondary text-xs"
              >
                Add Sample Items (Debug)
              </button>
            </div>
          </div>

          {/* Item Details and Actions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
              Item Details
            </h3>
            
            {selectedSlot !== null && slots[selectedSlot].item ? (
              <div className="game-panel p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">
                    {slots[selectedSlot].item!.icon || getItemTypeIcon(slots[selectedSlot].item!.type)}
                  </div>
                  <div>
                    <h4 
                      className="font-bold text-lg"
                      style={{ color: getRarityColor(slots[selectedSlot].item!.rarity) }}
                    >
                      {slots[selectedSlot].item!.name}
                    </h4>
                    <p className="text-sm text-valtara-text-muted">
                      {slots[selectedSlot].item!.type} • {slots[selectedSlot].item!.rarity}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-valtara-text mb-3">
                  {slots[selectedSlot].item!.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div>
                    <span className="text-valtara-text-muted">Quantity:</span>{' '}
                    {slots[selectedSlot].quantity}
                  </div>
                  <div>
                    <span className="text-valtara-text-muted">Stack Size:</span>{' '}
                    {slots[selectedSlot].item!.stackSize}
                  </div>
                  <div>
                    <span className="text-valtara-text-muted">Value:</span>{' '}
                    {slots[selectedSlot].item!.value}g each
                  </div>
                  <div>
                    <span className="text-valtara-text-muted">Total:</span>{' '}
                    {slots[selectedSlot].item!.value * slots[selectedSlot].quantity}g
                  </div>
                </div>

                {/* Item Properties */}
                {slots[selectedSlot].item!.properties && (
                  <div className="mb-4">
                    <h5 className="font-semibold text-valtara-primary mb-2">Properties</h5>
                    <div className="text-xs space-y-1">
                      {slots[selectedSlot].item!.properties.damage && (
                        <div>💥 Damage: +{slots[selectedSlot].item!.properties.damage}</div>
                      )}
                      {slots[selectedSlot].item!.properties.defense && (
                        <div>🛡️ Defense: +{slots[selectedSlot].item!.properties.defense}</div>
                      )}
                      {slots[selectedSlot].item!.properties.healing && (
                        <div>❤️ Healing: +{slots[selectedSlot].item!.properties.healing}</div>
                      )}
                      {slots[selectedSlot].item!.properties.durability && (
                        <div>🔧 Durability: {slots[selectedSlot].item!.properties.durability}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      useItem(selectedSlot);
                      selectSlot(null);
                    }}
                    className="game-button w-full"
                  >
                    {slots[selectedSlot].item!.type === 'consumable' ? 'Use' :
                     slots[selectedSlot].item!.type === 'weapon' || slots[selectedSlot].item!.type === 'armor' ? 'Equip' :
                     slots[selectedSlot].item!.type === 'tool' ? 'Equip' : 'Use'}
                  </button>
                  
                  <button 
                    onClick={() => {
                      if (selectedSlot !== null) {
                        useInventory.getState().removeItem(selectedSlot, 1);
                        if (slots[selectedSlot].quantity <= 1) {
                          selectSlot(null);
                        }
                      }
                    }}
                    className="game-button secondary w-full"
                  >
                    Drop 1
                  </button>
                </div>
              </div>
            ) : (
              <div className="game-panel p-4 text-center text-valtara-text-muted">
                <p>Select an item to view details</p>
                <p className="text-xs mt-2">
                  Left-click to select<br/>
                  Double-click to use<br/>
                  Drag to move items
                </p>
              </div>
            )}

            {/* Player Equipment (placeholder) */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
                Equipment
              </h3>
              <div className="game-panel p-4 text-center text-valtara-text-muted">
                <p className="text-sm">Equipment system coming soon!</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {['Helmet', 'Chest', 'Legs', 'Weapon', 'Shield', 'Boots'].map((slot) => (
                    <div key={slot} className="inventory-slot">
                      <div className="text-xs">{slot}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
