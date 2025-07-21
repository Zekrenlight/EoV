import React, { useState, useEffect } from 'react';
import { usePlayer } from '../../lib/stores/usePlayer';

interface MainMenuProps {
  onStartSinglePlayer: () => void;
  onStartMultiplayer: () => void;
  onToggleAudio: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartSinglePlayer, onStartMultiplayer, onToggleAudio }) => {
  const { loadPlayer } = usePlayer();
  const [hasSaveData, setHasSaveData] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    // Check if save data exists
    const saveData = localStorage.getItem('valtara_save');
    setHasSaveData(!!saveData);
  }, []);

  const handleContinueGame = () => {
    const loaded = loadPlayer();
    if (loaded) {
      onStartSinglePlayer();
    } else {
      alert('No save data found!');
    }
  };

  const handleNewGame = () => {
    // Clear existing save data if any
    localStorage.removeItem('valtara_save');
    onStartSinglePlayer();
  };

  const pantheonGods = [
    { name: 'Ailura', icon: '🌿', desc: 'Vitality & Gathering' },
    { name: 'Thalirion', icon: '📚', desc: 'Knowledge & Puzzles' },
    { name: 'Korrath', icon: '⚔️', desc: 'Strength & Combat' },
    { name: 'Sylvana', icon: '🍃', desc: 'Nature & Crafting' },
    { name: 'Nereon', icon: '🌊', desc: 'Water & Fishing' },
    { name: 'Pyrion', icon: '🔥', desc: 'Fire & Smithing' },
    { name: 'Umbros', icon: '🌙', desc: 'Shadow & Stealth' },
    { name: 'Luxara', icon: '✨', desc: 'Light & Healing' }
  ];

  if (showCredits) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-valtara-bg via-valtara-bg-light to-valtara-bg flex items-center justify-center p-4">
        <div className="game-panel w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="game-panel-header flex justify-between items-center">
            <h2 className="text-2xl font-bold">Credits</h2>
            <button onClick={() => setShowCredits(false)} className="text-2xl hover:text-red-400">
              ×
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)] text-center space-y-6">
            <div>
              <h3 className="text-xl font-bold text-valtara-primary mb-2">Echoes of Valtara</h3>
              <p className="text-valtara-text-muted">A 3D Isometric RPG Adventure</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div className="game-panel p-4">
                <h4 className="font-semibold text-valtara-secondary mb-2">Game Design</h4>
                <ul className="text-sm space-y-1 text-valtara-text">
                  <li>• Inspired by Old School RuneScape</li>
                  <li>• 8 Pantheon deities with unique abilities</li>
                  <li>• 25+ skills tied to divine attunements</li>
                  <li>• Dynamic seasonal world changes</li>
                </ul>
              </div>

              <div className="game-panel p-4">
                <h4 className="font-semibold text-valtara-secondary mb-2">Technology</h4>
                <ul className="text-sm space-y-1 text-valtara-text">
                  <li>• React + TypeScript</li>
                  <li>• Three.js for 3D graphics</li>
                  <li>• Socket.io for multiplayer</li>
                  <li>• Zustand for state management</li>
                </ul>
              </div>

              <div className="game-panel p-4">
                <h4 className="font-semibold text-valtara-secondary mb-2">Features</h4>
                <ul className="text-sm space-y-1 text-valtara-text">
                  <li>• Local/LAN multiplayer (1-8 players)</li>
                  <li>• Procedural terrain generation</li>
                  <li>• Advanced crafting system</li>
                  <li>• Dynamic quest system</li>
                </ul>
              </div>

              <div className="game-panel p-4">
                <h4 className="font-semibold text-valtara-secondary mb-2">World of Valtara</h4>
                <ul className="text-sm space-y-1 text-valtara-text">
                  <li>• 5 distinct biomes</li>
                  <li>• Seasonal weather effects</li>
                  <li>• Player-driven economy</li>
                  <li>• Pantheon-based storylines</li>
                </ul>
              </div>
            </div>

            <div className="game-panel p-4">
              <h4 className="font-semibold text-valtara-secondary mb-3">The Pantheon of Valtara</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {pantheonGods.map((god) => (
                  <div key={god.name} className="text-center p-2 bg-valtara-bg rounded">
                    <div className="text-2xl mb-1">{god.icon}</div>
                    <div className="font-semibold text-valtara-primary">{god.name}</div>
                    <div className="text-xs text-valtara-text-muted">{god.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-valtara-text-muted">
                Built for immersive cooperative gameplay and endless adventure.
              </p>
              <p className="text-xs text-valtara-text-muted mt-2">
                "In Valtara, legends are not born - they are forged through divine favor and mortal deeds."
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-valtara-bg via-valtara-bg-light to-valtara-bg flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Game Title and Description */}
        <div className="text-center lg:text-left space-y-6">
          <div>
            <h1 className="text-6xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-valtara-primary to-valtara-secondary mb-4">
              Echoes of Valtara
            </h1>
            <p className="text-xl text-valtara-text-muted mb-2">
              A 3D Isometric RPG Adventure
            </p>
            <p className="text-sm text-valtara-text max-w-md mx-auto lg:mx-0">
              Embark on an epic journey through mystical realms, guided by ancient pantheon deities. 
              Master 25+ skills, craft legendary items, and build your legend in cooperative multiplayer adventures.
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="game-panel p-3">
              <div className="text-valtara-primary font-semibold mb-1">🌍 Dynamic World</div>
              <div className="text-valtara-text-muted">Seasonal changes, 5 biomes, procedural terrain</div>
            </div>
            <div className="game-panel p-3">
              <div className="text-valtara-primary font-semibold mb-1">👥 Co-op Multiplayer</div>
              <div className="text-valtara-text-muted">Local/LAN play for 1-8 players</div>
            </div>
            <div className="game-panel p-3">
              <div className="text-valtara-primary font-semibold mb-1">⭐ Divine Pantheon</div>
              <div className="text-valtara-text-muted">8 deities, unique skill paths</div>
            </div>
            <div className="game-panel p-3">
              <div className="text-valtara-primary font-semibold mb-1">🔨 Deep Crafting</div>
              <div className="text-valtara-text-muted">Advanced crafting, player economy</div>
            </div>
          </div>
        </div>

        {/* Menu Options */}
        <div className="space-y-4">
          <div className="game-panel p-6 space-y-4">
            <h2 className="text-2xl font-bold text-center text-valtara-primary mb-6">
              Begin Your Journey
            </h2>

            {/* Continue Game */}
            {hasSaveData && (
              <button
                onClick={handleContinueGame}
                className="game-button w-full py-4 text-lg font-semibold"
              >
                📖 Continue Journey
              </button>
            )}

            {/* New Game */}
            <button
              onClick={handleNewGame}
              className="game-button w-full py-4 text-lg font-semibold"
            >
              ⚔️ New Adventure
            </button>

            {/* Multiplayer */}
            <button
              onClick={onStartMultiplayer}
              className="game-button w-full py-4 text-lg font-semibold"
            >
              👥 Multiplayer Co-op
            </button>

            <div className="border-t border-valtara-border pt-4 space-y-3">
              {/* Audio Toggle */}
              <button
                onClick={onToggleAudio}
                className="game-button secondary w-full py-3"
              >
                🔊 Toggle Audio
              </button>

              {/* Credits */}
              <button
                onClick={() => setShowCredits(true)}
                className="game-button secondary w-full py-3"
              >
                📜 Credits
              </button>
            </div>

            {/* Version Info */}
            <div className="text-center text-xs text-valtara-text-muted pt-4 border-t border-valtara-border">
              <p>Echoes of Valtara v1.0 - Built for Replit</p>
              <p>Inspired by Old School RuneScape</p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="game-panel p-4">
            <h3 className="font-semibold text-valtara-secondary mb-3">Quick Start Tips</h3>
            <div className="text-sm space-y-2 text-valtara-text">
              <div className="flex items-center gap-2">
                <span className="text-valtara-primary">•</span>
                <span>Choose your pantheon deity wisely - it affects your entire journey</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-valtara-primary">•</span>
                <span>Use WASD to move, arrow keys to control the camera</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-valtara-primary">•</span>
                <span>Click on trees and rocks to gather resources</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-valtara-primary">•</span>
                <span>Press I for inventory, C for crafting, K for skills</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute top-10 left-10 text-6xl">🌿</div>
        <div className="absolute top-20 right-20 text-4xl">⚔️</div>
        <div className="absolute bottom-20 left-20 text-5xl">🔥</div>
        <div className="absolute bottom-10 right-10 text-4xl">✨</div>
        <div className="absolute top-1/2 left-1/4 text-3xl">📚</div>
        <div className="absolute top-1/3 right-1/3 text-4xl">🌊</div>
        <div className="absolute bottom-1/3 left-1/2 text-3xl">🌙</div>
        <div className="absolute top-3/4 right-1/4 text-5xl">🍃</div>
      </div>
    </div>
  );
};

export default MainMenu;
