import React, { useState } from 'react';
import { PantheonGod, PlayerAppearance } from '../../lib/types/GameTypes';

interface CharacterCreationProps {
  onCharacterCreated: (characterData: any) => void;
  onBack: () => void;
}

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onCharacterCreated, onBack }) => {
  const [characterName, setCharacterName] = useState('');
  const [selectedGod, setSelectedGod] = useState<PantheonGod>(PantheonGod.AILURA);
  const [appearance, setAppearance] = useState<PlayerAppearance>({
    skinColor: '#F4C2A1',
    hairColor: '#8B4513',
    eyeColor: '#4169E1',
    gender: 'male',
    outfit: 'basic'
  });

  const pantheonInfo = {
    [PantheonGod.AILURA]: {
      name: 'Ailura',
      title: 'Goddess of Vitality and Gathering',
      description: 'Ailura blesses those who work with nature, granting enhanced gathering abilities and natural healing. Perfect for players who enjoy resource collection and self-sufficiency.',
      icon: '🌿',
      color: '#48bb78',
      bonuses: ['Increased resource yield', 'Natural health regeneration', 'Better herb identification']
    },
    [PantheonGod.THALIRION]: {
      name: 'Thalirion',
      title: 'God of Knowledge and Puzzles',
      description: 'Thalirion favors scholars and puzzle-solvers, granting wisdom and enhanced learning. Ideal for players who enjoy mysteries and magical arts.',
      icon: '📚',
      color: '#4299e1',
      bonuses: ['Faster skill progression', 'Puzzle-solving bonuses', 'Enhanced mana regeneration']
    },
    [PantheonGod.KORRATH]: {
      name: 'Korrath',
      title: 'God of Strength and Combat',
      description: 'Korrath empowers warriors and defenders, enhancing combat prowess and physical strength. Perfect for players who prefer direct confrontation.',
      icon: '⚔️',
      color: '#f56565',
      bonuses: ['Increased melee damage', 'Higher health pool', 'Combat experience bonus']
    },
    [PantheonGod.SYLVANA]: {
      name: 'Sylvana',
      title: 'Goddess of Nature and Crafting',
      description: 'Sylvana guides artisans and nature-lovers, blessing them with crafting expertise and nature magic. Great for creative players.',
      icon: '🍃',
      color: '#38a169',
      bonuses: ['Crafting success bonus', 'Nature magic affinity', 'Animal companion bonding']
    },
    [PantheonGod.NEREON]: {
      name: 'Nereon',
      title: 'God of Water and Fishing',
      description: 'Nereon rules the waters and grants mastery over aquatic activities. Excellent for players who enjoy exploration and fishing.',
      icon: '🌊',
      color: '#0987a0',
      bonuses: ['Enhanced fishing abilities', 'Water breathing', 'Swimming speed bonus']
    },
    [PantheonGod.PYRION]: {
      name: 'Pyrion',
      title: 'God of Fire and Smithing',
      description: 'Pyrion is the master of forge and flame, blessing smiths and fire mages. Perfect for players who enjoy weapon crafting.',
      icon: '🔥',
      color: '#dd6b20',
      bonuses: ['Smithing mastery', 'Fire magic power', 'Weapon durability bonus']
    },
    [PantheonGod.UMBROS]: {
      name: 'Umbros',
      title: 'God of Shadow and Stealth',
      description: 'Umbros protects rogues and scouts, granting stealth abilities and shadow magic. Ideal for players who prefer subtlety.',
      icon: '🌙',
      color: '#553c9a',
      bonuses: ['Stealth mastery', 'Lockpicking bonus', 'Shadow magic affinity']
    },
    [PantheonGod.LUXARA]: {
      name: 'Luxara',
      title: 'Goddess of Light and Healing',
      description: 'Luxara is the beacon of hope and restoration, blessing healers and paladins. Perfect for supportive players.',
      icon: '✨',
      color: '#d69e2e',
      bonuses: ['Healing power bonus', 'Light magic mastery', 'Undead resistance']
    }
  };

  const skinColors = ['#F4C2A1', '#E8B896', '#D4A574', '#C19355', '#8B5A2B', '#654321'];
  const hairColors = ['#8B4513', '#CD853F', '#D2691E', '#000000', '#696969', '#FFFFFF', '#FF6347', '#8A2BE2'];
  const eyeColors = ['#4169E1', '#228B22', '#8B4513', '#FF1493', '#32CD32', '#FF4500'];

  const handleCreateCharacter = () => {
    if (!characterName.trim()) {
      alert('Please enter a character name');
      return;
    }

    if (characterName.length < 3 || characterName.length > 20) {
      alert('Character name must be between 3 and 20 characters');
      return;
    }

    const characterData = {
      name: characterName.trim(),
      pantheonAttunement: selectedGod,
      appearance
    };

    console.log('Creating character:', characterData);
    onCharacterCreated(characterData);
  };

  const currentGodInfo = pantheonInfo[selectedGod];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-valtara-bg via-valtara-bg-light to-valtara-bg flex items-center justify-center p-4">
      <div className="game-panel w-full max-w-6xl max-h-[95vh] overflow-hidden">
        <div className="game-panel-header flex justify-between items-center">
          <h2 className="text-2xl font-bold">Create Your Hero</h2>
          <button onClick={onBack} className="text-2xl hover:text-red-400">
            ←
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-4rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Character Info */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-valtara-primary">Character Details</h3>
                
                {/* Name Input */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-valtara-text mb-2">
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Enter your hero's name"
                    className="game-input w-full"
                    maxLength={20}
                  />
                  <p className="text-xs text-valtara-text-muted mt-1">
                    3-20 characters, will be visible to other players
                  </p>
                </div>

                {/* Gender Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-valtara-text mb-2">
                    Gender
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setAppearance(prev => ({ ...prev, gender: 'male' }))}
                      className={`flex-1 p-3 rounded transition-colors ${
                        appearance.gender === 'male'
                          ? 'bg-valtara-primary text-valtara-bg'
                          : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                      }`}
                    >
                      👨 Male
                    </button>
                    <button
                      onClick={() => setAppearance(prev => ({ ...prev, gender: 'female' }))}
                      className={`flex-1 p-3 rounded transition-colors ${
                        appearance.gender === 'female'
                          ? 'bg-valtara-primary text-valtara-bg'
                          : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                      }`}
                    >
                      👩 Female
                    </button>
                  </div>
                </div>

                {/* Appearance Customization */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-valtara-secondary">Appearance</h4>
                  
                  {/* Skin Color */}
                  <div>
                    <label className="block text-sm text-valtara-text mb-2">Skin Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {skinColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setAppearance(prev => ({ ...prev, skinColor: color }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            appearance.skinColor === color
                              ? 'border-valtara-primary scale-110'
                              : 'border-valtara-border hover:border-valtara-secondary'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Hair Color */}
                  <div>
                    <label className="block text-sm text-valtara-text mb-2">Hair Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {hairColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setAppearance(prev => ({ ...prev, hairColor: color }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            appearance.hairColor === color
                              ? 'border-valtara-primary scale-110'
                              : 'border-valtara-border hover:border-valtara-secondary'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Eye Color */}
                  <div>
                    <label className="block text-sm text-valtara-text mb-2">Eye Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {eyeColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setAppearance(prev => ({ ...prev, eyeColor: color }))}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            appearance.eyeColor === color
                              ? 'border-valtara-primary scale-110'
                              : 'border-valtara-border hover:border-valtara-secondary'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pantheon Selection */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-valtara-primary">Choose Your Pantheon</h3>
              <p className="text-sm text-valtara-text-muted mb-4">
                Select a deity to guide your journey. Each pantheon grants unique bonuses and unlocks specific skill paths.
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(PantheonGod).map((god) => {
                  const info = pantheonInfo[god];
                  return (
                    <button
                      key={god}
                      onClick={() => setSelectedGod(god)}
                      className={`w-full text-left p-4 rounded-lg transition-colors border-2 ${
                        selectedGod === god
                          ? 'border-valtara-primary bg-valtara-bg-light'
                          : 'border-valtara-border bg-valtara-bg hover:border-valtara-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{info.icon}</span>
                        <div>
                          <h4 className="font-bold" style={{ color: info.color }}>
                            {info.name}
                          </h4>
                          <p className="text-sm text-valtara-text-muted">
                            {info.title}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Pantheon Details */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-valtara-primary">Pantheon Details</h3>
              
              <div className="game-panel p-6">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-4xl">{currentGodInfo.icon}</span>
                  <div>
                    <h4 className="text-2xl font-bold" style={{ color: currentGodInfo.color }}>
                      {currentGodInfo.name}
                    </h4>
                    <p className="text-valtara-text-muted">{currentGodInfo.title}</p>
                  </div>
                </div>

                <p className="text-valtara-text mb-6 leading-relaxed">
                  {currentGodInfo.description}
                </p>

                <div>
                  <h5 className="font-semibold text-valtara-secondary mb-3">Divine Bonuses</h5>
                  <div className="space-y-2">
                    {currentGodInfo.bonuses.map((bonus, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span className="text-valtara-primary">✦</span>
                        <span className="text-valtara-text">{bonus}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 p-3 bg-valtara-bg rounded">
                  <p className="text-xs text-valtara-text-muted">
                    <strong>Note:</strong> Your pantheon choice affects starting bonuses and available quests. 
                    You can gain favor with other deities through gameplay, but your primary attunement remains permanent.
                  </p>
                </div>
              </div>

              {/* Character Preview */}
              <div className="game-panel p-4">
                <h4 className="font-semibold text-valtara-secondary mb-3">Character Preview</h4>
                <div className="text-center">
                  <div 
                    className="w-20 h-20 mx-auto rounded-full mb-2 border-4 border-valtara-border"
                    style={{ backgroundColor: appearance.skinColor }}
                  >
                    <div className="w-full h-full rounded-full flex items-center justify-center text-2xl">
                      {appearance.gender === 'male' ? '👨' : '👩'}
                    </div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-semibold text-valtara-primary">
                      {characterName || 'Hero Name'}
                    </div>
                    <div className="text-valtara-text-muted">
                      Follower of {currentGodInfo.name}
                    </div>
                    <div className="flex justify-center gap-4 text-xs">
                      <div>Hair: <span style={{ color: appearance.hairColor }}>●</span></div>
                      <div>Eyes: <span style={{ color: appearance.eyeColor }}>●</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreateCharacter}
                disabled={!characterName.trim()}
                className={`game-button w-full py-4 text-lg font-bold ${
                  !characterName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                🌟 Begin Your Journey
              </button>

              <div className="text-center">
                <p className="text-xs text-valtara-text-muted">
                  By creating your character, you agree to embark on an epic adventure through the mystical realm of Valtara.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreation;
