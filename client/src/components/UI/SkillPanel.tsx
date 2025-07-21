import React, { useState } from 'react';
import { useSkills } from '../../lib/stores/useSkills';
import { PantheonGod } from '../../lib/types/GameTypes';
import { usePlayer } from '../../lib/stores/usePlayer';

interface SkillPanelProps {
  onClose: () => void;
}

const SkillPanel: React.FC<SkillPanelProps> = ({ onClose }) => {
  const { skills, totalLevel } = useSkills();
  const { player } = usePlayer();
  const [selectedPantheon, setSelectedPantheon] = useState<PantheonGod | 'all'>('all');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Get skills filtered by pantheon
  const filteredSkills = selectedPantheon === 'all' 
    ? skills 
    : skills.filter(skill => skill.pantheonGod === selectedPantheon);

  // Get pantheon information
  const pantheonInfo = {
    [PantheonGod.AILURA]: {
      name: 'Ailura',
      description: 'Goddess of Vitality and Gathering. Blesses those who work with nature.',
      color: '#48bb78',
      icon: '🌿'
    },
    [PantheonGod.THALIRION]: {
      name: 'Thalirion',
      description: 'God of Knowledge and Puzzles. Grants wisdom to seekers of truth.',
      color: '#4299e1',
      icon: '📚'
    },
    [PantheonGod.KORRATH]: {
      name: 'Korrath',
      description: 'God of Strength and Combat. Empowers warriors and defenders.',
      color: '#f56565',
      icon: '⚔️'
    },
    [PantheonGod.SYLVANA]: {
      name: 'Sylvana',
      description: 'Goddess of Nature and Crafting. Guides artisans and creators.',
      color: '#38a169',
      icon: '🍃'
    },
    [PantheonGod.NEREON]: {
      name: 'Nereon',
      description: 'God of Water and Fishing. Rules over seas and rivers.',
      color: '#0987a0',
      icon: '🌊'
    },
    [PantheonGod.PYRION]: {
      name: 'Pyrion',
      description: 'God of Fire and Smithing. Master of forge and flame.',
      color: '#dd6b20',
      icon: '🔥'
    },
    [PantheonGod.UMBROS]: {
      name: 'Umbros',
      description: 'God of Shadow and Stealth. Protector of rogues and scouts.',
      color: '#553c9a',
      icon: '🌙'
    },
    [PantheonGod.LUXARA]: {
      name: 'Luxara',
      description: 'Goddess of Light and Healing. Beacon of hope and restoration.',
      color: '#d69e2e',
      icon: '✨'
    }
  };

  const getSkillProgressPercent = (skill: any) => {
    return (skill.experience / skill.experienceToNext) * 100;
  };

  const getSkillColor = (pantheon: PantheonGod) => {
    return pantheonInfo[pantheon]?.color || '#64ffda';
  };

  const selectedSkillData = selectedSkill ? skills.find(s => s.id === selectedSkill) : null;

  return (
    <div className="game-panel w-full max-w-6xl max-h-[90vh] overflow-hidden">
      <div className="game-panel-header flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Skills & Pantheon</h2>
          <div className="text-sm text-valtara-bg opacity-80">
            Total Level: {totalLevel} | Attunement: {pantheonInfo[player?.pantheonAttunement || PantheonGod.AILURA]?.name}
          </div>
        </div>
        <button onClick={onClose} className="text-2xl hover:text-red-400">
          ×
        </button>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
        <div className="grid grid-cols-4 gap-6">
          {/* Pantheon Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
              Pantheon Filter
            </h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setSelectedPantheon('all')}
                className={`w-full text-left p-2 rounded transition-colors ${
                  selectedPantheon === 'all'
                    ? 'bg-valtara-primary text-valtara-bg'
                    : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                }`}
              >
                <span className="mr-2">⭐</span>
                All Skills
              </button>
              
              {Object.values(PantheonGod).map((god) => {
                const info = pantheonInfo[god];
                const skillCount = skills.filter(s => s.pantheonGod === god).length;
                
                return (
                  <button
                    key={god}
                    onClick={() => setSelectedPantheon(god)}
                    className={`w-full text-left p-2 rounded transition-colors ${
                      selectedPantheon === god
                        ? 'bg-valtara-primary text-valtara-bg'
                        : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="mr-2">{info.icon}</span>
                        {info.name}
                      </div>
                      <span className="text-xs opacity-70">
                        {skillCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Player's Attunement Info */}
            {player && (
              <div className="mt-6 p-3 bg-valtara-bg-light rounded">
                <h4 className="font-semibold text-valtara-secondary mb-2">
                  Your Attunement
                </h4>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">
                    {pantheonInfo[player.pantheonAttunement].icon}
                  </span>
                  <span className="font-semibold">
                    {pantheonInfo[player.pantheonAttunement].name}
                  </span>
                </div>
                <p className="text-xs text-valtara-text-muted">
                  {pantheonInfo[player.pantheonAttunement].description}
                </p>
              </div>
            )}
          </div>

          {/* Skills List */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
              Skills ({filteredSkills.length})
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredSkills.map((skill) => (
                <div
                  key={skill.id}
                  onClick={() => setSelectedSkill(skill.id)}
                  className={`skill-item cursor-pointer ${
                    selectedSkill === skill.id ? 'ring-2 ring-valtara-primary' : ''
                  }`}
                  style={{
                    borderColor: getSkillColor(skill.pantheonGod)
                  }}
                >
                  <div 
                    className="skill-icon"
                    style={{ backgroundColor: getSkillColor(skill.pantheonGod) }}
                  >
                    {skill.icon}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-valtara-text">
                        {skill.name}
                      </h4>
                      <span className="text-sm font-bold text-valtara-primary">
                        Level {skill.level}
                      </span>
                    </div>
                    
                    <div className="progress-bar mb-1">
                      <div
                        className="progress-bar-fill"
                        style={{ 
                          width: `${getSkillProgressPercent(skill)}%`,
                          backgroundColor: getSkillColor(skill.pantheonGod)
                        }}
                      />
                      <div className="progress-bar-text">
                        {skill.experience}/{skill.experienceToNext} XP
                      </div>
                    </div>
                    
                    <p className="text-xs text-valtara-text-muted">
                      {skill.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Debug: Add XP buttons */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-2 bg-gray-800 rounded">
                <h4 className="text-xs font-semibold mb-2">Debug: Add XP</h4>
                <div className="flex flex-wrap gap-1">
                  {skills.slice(0, 6).map(skill => (
                    <button
                      key={skill.id}
                      onClick={() => useSkills.getState().gainSkillExperience(skill.id, 100)}
                      className="text-xs bg-valtara-primary text-valtara-bg px-2 py-1 rounded"
                    >
                      +100 {skill.name.substring(0, 6)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Skill Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">
              Skill Details
            </h3>
            
            {selectedSkillData ? (
              <div className="space-y-4">
                {/* Skill Header */}
                <div className="game-panel p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="skill-icon text-lg"
                      style={{ backgroundColor: getSkillColor(selectedSkillData.pantheonGod) }}
                    >
                      {selectedSkillData.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{selectedSkillData.name}</h4>
                      <p className="text-sm" style={{ color: getSkillColor(selectedSkillData.pantheonGod) }}>
                        Level {selectedSkillData.level}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-valtara-text mb-3">
                    {selectedSkillData.description}
                  </p>

                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{ 
                        width: `${getSkillProgressPercent(selectedSkillData)}%`,
                        backgroundColor: getSkillColor(selectedSkillData.pantheonGod)
                      }}
                    />
                    <div className="progress-bar-text">
                      {selectedSkillData.experience}/{selectedSkillData.experienceToNext}
                    </div>
                  </div>
                </div>

                {/* Pantheon Info */}
                <div className="game-panel p-4">
                  <h5 className="font-semibold text-valtara-secondary mb-2">
                    Pantheon Blessing
                  </h5>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {pantheonInfo[selectedSkillData.pantheonGod].icon}
                    </span>
                    <span 
                      className="font-semibold"
                      style={{ color: getSkillColor(selectedSkillData.pantheonGod) }}
                    >
                      {pantheonInfo[selectedSkillData.pantheonGod].name}
                    </span>
                  </div>
                  <p className="text-xs text-valtara-text-muted">
                    {pantheonInfo[selectedSkillData.pantheonGod].description}
                  </p>
                </div>

                {/* Skill Bonuses */}
                <div className="game-panel p-4">
                  <h5 className="font-semibold text-valtara-secondary mb-2">
                    Active Bonuses
                  </h5>
                  <div className="space-y-1">
                    {selectedSkillData.bonuses.map((bonus, index) => (
                      <div key={index} className="text-sm">
                        <span className="text-valtara-primary">+{bonus.value}</span>
                        {bonus.type === 'percentage' && '%'}{' '}
                        <span className="text-valtara-text">{bonus.description}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-3 pt-2 border-t border-valtara-border">
                    <p className="text-xs text-valtara-text-muted">
                      Bonuses scale with skill level. Higher levels provide better effects!
                    </p>
                  </div>
                </div>

                {/* Level Milestones */}
                <div className="game-panel p-4">
                  <h5 className="font-semibold text-valtara-secondary mb-2">
                    Next Milestone
                  </h5>
                  <div className="text-sm">
                    {selectedSkillData.level < 10 && (
                      <div className="text-valtara-text">
                        <span className="text-valtara-primary">Level 10:</span> Enhanced bonuses
                      </div>
                    )}
                    {selectedSkillData.level < 25 && (
                      <div className="text-valtara-text">
                        <span className="text-valtara-primary">Level 25:</span> Unlock advanced techniques
                      </div>
                    )}
                    {selectedSkillData.level < 50 && (
                      <div className="text-valtara-text">
                        <span className="text-valtara-primary">Level 50:</span> Master rank abilities
                      </div>
                    )}
                    {selectedSkillData.level >= 50 && (
                      <div className="text-valtara-success">
                        <span className="text-valtara-primary">Mastery:</span> Maximum skill achieved!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="game-panel p-4 text-center text-valtara-text-muted">
                <p>Select a skill to view details</p>
                <p className="text-xs mt-2">
                  Click on any skill from the list to see bonuses, progression, and pantheon blessings.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillPanel;
