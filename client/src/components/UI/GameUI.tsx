import React, { useState, useEffect } from 'react';
import { useKeyboardControls } from '@react-three/drei';

import { Controls } from '../../App';
import Inventory from './Inventory';
import Crafting from './Crafting';
import SkillPanel from './SkillPanel';
import QuestLog from './QuestLog';
import { usePlayer } from '../../lib/stores/usePlayer';
import { useMultiplayer } from '../../lib/stores/useMultiplayer';

interface GameUIProps {
  onBackToMenu: () => void;
}

const GameUI: React.FC<GameUIProps> = ({ onBackToMenu }) => {
  const [subscribe, get] = useKeyboardControls<Controls>();
  const { player } = usePlayer();
  const { isConnected, connectedPlayers, chatMessages, sendChatMessage } = useMultiplayer();
  
  const [showInventory, setShowInventory] = useState(false);
  const [showCrafting, setShowCrafting] = useState(false);
  const [showSkills, setShowSkills] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // Handle keyboard shortcuts
  useEffect(() => {
    const unsubscribers = [
      subscribe(
        (state) => state.inventory,
        (pressed) => pressed && setShowInventory(!showInventory)
      ),
      subscribe(
        (state) => state.crafting,
        (pressed) => pressed && setShowCrafting(!showCrafting)
      ),
      subscribe(
        (state) => state.skills,
        (pressed) => pressed && setShowSkills(!showSkills)
      ),
      subscribe(
        (state) => state.quests,
        (pressed) => pressed && setShowQuests(!showQuests)
      ),
      subscribe(
        (state) => state.chat,
        (pressed) => pressed && setShowChat(!showChat)
      ),
      subscribe(
        (state) => state.menu,
        (pressed) => pressed && onBackToMenu()
      )
    ];

    return () => unsubscribers.forEach(unsub => unsub());
  }, [subscribe, showInventory, showCrafting, showSkills, showQuests, showChat]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && isConnected) {
      sendChatMessage(chatInput);
      setChatInput('');
    }
  };

  if (!player) return null;

  return (
    <div className="game-ui">
      {/* Top HUD Bar */}
      <div 
        className="fixed top-4 left-4 right-4 flex justify-between items-start z-10"
        style={{ pointerEvents: 'none' }}
      >
        {/* Player Stats */}
        <div className="game-panel p-4" style={{ pointerEvents: 'auto' }}>
          <div className="flex items-center gap-4 mb-2">
            <div className="text-lg font-bold text-valtara-primary">
              {player.name}
            </div>
            <div className="text-sm text-valtara-text-muted">
              Level {player.stats.level}
            </div>
          </div>
          
          {/* Health Bar */}
          <div className="mb-2">
            <div className="text-xs text-valtara-text-muted mb-1">Health</div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill health-bar"
                style={{ width: `${(player.stats.health / player.stats.maxHealth) * 100}%` }}
              />
              <div className="progress-bar-text">
                {player.stats.health}/{player.stats.maxHealth}
              </div>
            </div>
          </div>

          {/* Mana Bar */}
          <div>
            <div className="text-xs text-valtara-text-muted mb-1">Mana</div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill mana-bar"
                style={{ width: `${(player.stats.mana / player.stats.maxMana) * 100}%` }}
              />
              <div className="progress-bar-text">
                {player.stats.mana}/{player.stats.maxMana}
              </div>
            </div>
          </div>

          {/* Experience Bar */}
          <div className="mt-2">
            <div className="text-xs text-valtara-text-muted mb-1">Experience</div>
            <div className="progress-bar">
              <div 
                className="progress-bar-fill"
                style={{ width: `${(player.stats.experience / player.stats.experienceToNext) * 100}%` }}
              />
              <div className="progress-bar-text">
                {player.stats.experience}/{player.stats.experienceToNext}
              </div>
            </div>
          </div>
        </div>

        {/* Minimap Placeholder */}
        <div className="minimap" style={{ pointerEvents: 'auto' }}>
          <div className="p-2 text-center text-valtara-text-muted">
            <div className="text-sm font-semibold mb-1">Minimap</div>
            <div className="w-full h-32 bg-valtara-bg-light border border-valtara-border rounded flex items-center justify-center">
              <span className="text-xs">Map View</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div 
        className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-10"
        style={{ pointerEvents: 'none' }}
      >
        <div className="game-panel p-2" style={{ pointerEvents: 'auto' }}>
          <div className="flex gap-2">
            <button 
              className="game-button"
              onClick={() => setShowInventory(!showInventory)}
              title="Inventory (I/Tab)"
            >
              🎒 Inventory
            </button>
            <button 
              className="game-button"
              onClick={() => setShowCrafting(!showCrafting)}
              title="Crafting (C)"
            >
              🔨 Crafting
            </button>
            <button 
              className="game-button"
              onClick={() => setShowSkills(!showSkills)}
              title="Skills (K)"
            >
              ⭐ Skills
            </button>
            <button 
              className="game-button"
              onClick={() => setShowQuests(!showQuests)}
              title="Quests (J)"
            >
              📜 Quests
            </button>
            {isConnected && (
              <button 
                className="game-button"
                onClick={() => setShowChat(!showChat)}
                title="Chat (T/Enter)"
              >
                💬 Chat
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Controls Help */}
      <div 
        className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10"
        style={{ pointerEvents: 'none' }}
      >
        <div className="game-panel p-2 text-center" style={{ pointerEvents: 'auto' }}>
          <div className="text-xs text-valtara-text-muted">
            WASD: Move | Arrow Keys: Camera | E: Interact | ESC: Menu
          </div>
        </div>
      </div>

      {/* Multiplayer Status */}
      {isConnected && (
        <div 
          className="fixed top-20 right-4 z-10"
          style={{ pointerEvents: 'none' }}
        >
          <div className="game-panel p-3" style={{ pointerEvents: 'auto' }}>
            <div className="text-sm font-semibold text-valtara-primary mb-2">
              Multiplayer ({connectedPlayers.length + 1} players)
            </div>
            <div className="space-y-1">
              <div className="text-xs text-valtara-success">🟢 You</div>
              {connectedPlayers.map((player, index) => (
                <div key={index} className="text-xs text-valtara-text">
                  🟢 {player.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UI Panels */}
      {showInventory && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <Inventory onClose={() => setShowInventory(false)} />
        </div>
      )}

      {showCrafting && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <Crafting onClose={() => setShowCrafting(false)} />
        </div>
      )}

      {showSkills && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <SkillPanel onClose={() => setShowSkills(false)} />
        </div>
      )}

      {showQuests && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50">
          <QuestLog onClose={() => setShowQuests(false)} />
        </div>
      )}

      {/* Chat Window */}
      {showChat && isConnected && (
        <div className="chat-container">
          <div className="chat-messages">
            {chatMessages.slice(-10).map((msg) => (
              <div key={msg.id} className="chat-message">
                <span className="font-semibold text-valtara-primary">
                  {msg.sender}:
                </span>{' '}
                <span className="text-valtara-text">{msg.message}</span>
              </div>
            ))}
          </div>
          <form onSubmit={handleChatSubmit}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
              maxLength={100}
            />
          </form>
        </div>
      )}
    </div>
  );
};

export default GameUI;
