import React, { useState, useEffect } from 'react';
import { useQuests } from '../../lib/stores/useQuests';
import { usePlayer } from '../../lib/stores/usePlayer';
import { useInventory } from '../../lib/stores/useInventory';
import { useSkills } from '../../lib/stores/useSkills';
import { Quest, QuestStatus, ObjectiveType, PantheonGod } from '../../lib/types/GameTypes';

interface QuestLogProps {
  onClose: () => void;
}

const QuestLog: React.FC<QuestLogProps> = ({ onClose }) => {
  const { 
    quests, 
    activeQuest, 
    activateQuest, 
    completeQuest, 
    updateObjective,
    getAvailableQuests, 
    getActiveQuests, 
    getCompletedQuests 
  } = useQuests();
  const { player, gainExperience } = usePlayer();
  const { addItem } = useInventory();
  const { gainSkillExperience } = useSkills();
  
  const [selectedTab, setSelectedTab] = useState<'available' | 'active' | 'completed'>('active');
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const availableQuests = getAvailableQuests();
  const activeQuests = getActiveQuests();
  const completedQuests = getCompletedQuests();

  // Auto-select first quest in current tab
  useEffect(() => {
    let questList: Quest[] = [];
    switch (selectedTab) {
      case 'available':
        questList = availableQuests;
        break;
      case 'active':
        questList = activeQuests;
        break;
      case 'completed':
        questList = completedQuests;
        break;
    }
    
    if (questList.length > 0 && !questList.includes(selectedQuest!)) {
      setSelectedQuest(questList[0]);
    } else if (questList.length === 0) {
      setSelectedQuest(null);
    }
  }, [selectedTab, availableQuests, activeQuests, completedQuests]);

  const handleAcceptQuest = (quest: Quest) => {
    activateQuest(quest.id);
    console.log(`Quest accepted: ${quest.title}`);
  };

  const handleCompleteQuest = (quest: Quest) => {
    const rewards = completeQuest(quest.id);
    
    // Process rewards
    rewards.forEach(reward => {
      switch (reward.type) {
        case 'experience':
          gainExperience(reward.value);
          console.log(`Gained ${reward.value} experience!`);
          break;
        case 'item':
          if (reward.item) {
            addItem(reward.item, reward.value);
            console.log(`Received ${reward.value}x ${reward.item.name}!`);
          }
          break;
        case 'skill_experience':
          if (reward.skill) {
            gainSkillExperience(reward.skill, reward.value);
            console.log(`Gained ${reward.value} ${reward.skill} experience!`);
          }
          break;
        case 'gold':
          console.log(`Received ${reward.value} gold!`);
          break;
      }
    });
    
    console.log(`Quest completed: ${quest.title}`);
  };

  const getPantheonInfo = (god: PantheonGod) => {
    const pantheonData = {
      [PantheonGod.AILURA]: { name: 'Ailura', icon: '🌿', color: '#48bb78' },
      [PantheonGod.THALIRION]: { name: 'Thalirion', icon: '📚', color: '#4299e1' },
      [PantheonGod.KORRATH]: { name: 'Korrath', icon: '⚔️', color: '#f56565' },
      [PantheonGod.SYLVANA]: { name: 'Sylvana', icon: '🍃', color: '#38a169' },
      [PantheonGod.NEREON]: { name: 'Nereon', icon: '🌊', color: '#0987a0' },
      [PantheonGod.PYRION]: { name: 'Pyrion', icon: '🔥', color: '#dd6b20' },
      [PantheonGod.UMBROS]: { name: 'Umbros', icon: '🌙', color: '#553c9a' },
      [PantheonGod.LUXARA]: { name: 'Luxara', icon: '✨', color: '#d69e2e' }
    };
    return pantheonData[god] || { name: 'Unknown', icon: '❓', color: '#64ffda' };
  };

  const getObjectiveIcon = (type: ObjectiveType) => {
    switch (type) {
      case ObjectiveType.KILL: return '⚔️';
      case ObjectiveType.COLLECT: return '📦';
      case ObjectiveType.CRAFT: return '🔨';
      case ObjectiveType.INTERACT: return '💬';
      case ObjectiveType.REACH_LOCATION: return '📍';
      case ObjectiveType.TALK_TO_NPC: return '👥';
      default: return '❓';
    }
  };

  const getQuestDifficulty = (quest: Quest) => {
    if (quest.isMainQuest) return { text: 'Main Quest', color: '#f59e0b' };
    if (quest.pantheonGod) return { text: 'Pantheon Quest', color: getPantheonInfo(quest.pantheonGod).color };
    return { text: 'Side Quest', color: '#64ffda' };
  };

  const renderQuestList = (questList: Quest[]) => {
    if (questList.length === 0) {
      return (
        <div className="text-center py-8 text-valtara-text-muted">
          <p>No quests in this category</p>
          <p className="text-xs mt-2">
            {selectedTab === 'available' && 'Complete other quests to unlock new ones'}
            {selectedTab === 'active' && 'Accept quests from the Available tab'}
            {selectedTab === 'completed' && 'Complete active quests to see them here'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {questList.map((quest) => {
          const difficulty = getQuestDifficulty(quest);
          const pantheonInfo = quest.pantheonGod ? getPantheonInfo(quest.pantheonGod) : null;
          
          return (
            <div
              key={quest.id}
              onClick={() => setSelectedQuest(quest)}
              className={`quest-item cursor-pointer ${
                selectedQuest?.id === quest.id ? 'ring-2 ring-valtara-primary' : ''
              } ${quest.status === QuestStatus.COMPLETED ? 'completed' : ''}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {pantheonInfo && (
                    <span className="text-lg" title={pantheonInfo.name}>
                      {pantheonInfo.icon}
                    </span>
                  )}
                  <div>
                    <h4 className="quest-title">{quest.title}</h4>
                    <div className="flex items-center gap-2 text-xs">
                      <span 
                        className="px-2 py-1 rounded"
                        style={{ backgroundColor: difficulty.color + '20', color: difficulty.color }}
                      >
                        {difficulty.text}
                      </span>
                      {quest.pantheonGod && (
                        <span className="text-valtara-text-muted">
                          {pantheonInfo?.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  {quest.status === QuestStatus.ACTIVE && (
                    <div className="text-xs text-valtara-primary">Active</div>
                  )}
                  {quest.status === QuestStatus.COMPLETED && (
                    <div className="text-xs text-valtara-success">Ready to turn in</div>
                  )}
                  {quest.status === QuestStatus.TURNED_IN && (
                    <div className="text-xs text-valtara-text-muted">Completed</div>
                  )}
                </div>
              </div>
              
              <p className="quest-description mb-2">{quest.description}</p>
              
              {/* Progress indicators */}
              {quest.status === QuestStatus.ACTIVE && (
                <div className="space-y-1">
                  {quest.objectives.map((objective) => (
                    <div key={objective.id} className="flex items-center gap-2 text-xs">
                      <span>{getObjectiveIcon(objective.type)}</span>
                      <span className={objective.isCompleted ? 'text-valtara-success line-through' : 'text-valtara-text'}>
                        {objective.description}
                      </span>
                      <span className="ml-auto text-valtara-text-muted">
                        {objective.currentProgress}/{objective.requiredProgress}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="game-panel w-full max-w-6xl max-h-[90vh] overflow-hidden">
      <div className="game-panel-header flex justify-between items-center">
        <h2 className="text-xl font-bold">Quest Log</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            Active: {activeQuests.length} | Completed: {completedQuests.length}
          </span>
          <button onClick={onClose} className="text-2xl hover:text-red-400">
            ×
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-[calc(90vh-4rem)]">
        <div className="grid grid-cols-3 gap-6">
          {/* Quest Categories */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">Categories</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => setSelectedTab('active')}
                className={`w-full text-left p-3 rounded transition-colors ${
                  selectedTab === 'active'
                    ? 'bg-valtara-primary text-valtara-bg'
                    : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="mr-2">⚡</span>
                    Active Quests
                  </div>
                  <span className="text-sm opacity-70">
                    {activeQuests.length}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedTab('available')}
                className={`w-full text-left p-3 rounded transition-colors ${
                  selectedTab === 'available'
                    ? 'bg-valtara-primary text-valtara-bg'
                    : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="mr-2">📋</span>
                    Available
                  </div>
                  <span className="text-sm opacity-70">
                    {availableQuests.length}
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => setSelectedTab('completed')}
                className={`w-full text-left p-3 rounded transition-colors ${
                  selectedTab === 'completed'
                    ? 'bg-valtara-primary text-valtara-bg'
                    : 'bg-valtara-bg-light text-valtara-text hover:bg-valtara-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="mr-2">✅</span>
                    Completed
                  </div>
                  <span className="text-sm opacity-70">
                    {completedQuests.length}
                  </span>
                </div>
              </button>
            </div>

            {/* Current active quest summary */}
            {activeQuest && (
              <div className="mt-6 p-3 bg-valtara-bg-light rounded">
                <h4 className="font-semibold text-valtara-secondary mb-2">Tracking</h4>
                <div className="text-sm">
                  <div className="font-semibold text-valtara-primary mb-1">
                    {activeQuest.title}
                  </div>
                  <div className="space-y-1">
                    {activeQuest.objectives.slice(0, 3).map((objective) => (
                      <div key={objective.id} className="flex items-center gap-1 text-xs">
                        <span>{getObjectiveIcon(objective.type)}</span>
                        <span className={objective.isCompleted ? 'text-valtara-success' : 'text-valtara-text'}>
                          {objective.currentProgress}/{objective.requiredProgress}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quest List */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary capitalize">
              {selectedTab} Quests
            </h3>
            
            <div className="max-h-96 overflow-y-auto">
              {selectedTab === 'available' && renderQuestList(availableQuests)}
              {selectedTab === 'active' && renderQuestList(activeQuests)}
              {selectedTab === 'completed' && renderQuestList(completedQuests)}
            </div>
          </div>

          {/* Quest Details */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-valtara-primary">Quest Details</h3>
            
            {selectedQuest ? (
              <div className="space-y-4">
                {/* Quest Header */}
                <div className="game-panel p-4">
                  <div className="flex items-start gap-3 mb-3">
                    {selectedQuest.pantheonGod && (
                      <div className="text-2xl">
                        {getPantheonInfo(selectedQuest.pantheonGod).icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-lg quest-title">{selectedQuest.title}</h4>
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const difficulty = getQuestDifficulty(selectedQuest);
                          return (
                            <span 
                              className="text-xs px-2 py-1 rounded"
                              style={{ backgroundColor: difficulty.color + '20', color: difficulty.color }}
                            >
                              {difficulty.text}
                            </span>
                          );
                        })()}
                        {selectedQuest.pantheonGod && (
                          <span className="text-xs text-valtara-text-muted">
                            {getPantheonInfo(selectedQuest.pantheonGod).name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="quest-description">{selectedQuest.description}</p>
                </div>

                {/* Objectives */}
                <div className="game-panel p-4">
                  <h5 className="font-semibold text-valtara-secondary mb-3">Objectives</h5>
                  <div className="space-y-2">
                    {selectedQuest.objectives.map((objective) => (
                      <div 
                        key={objective.id}
                        className={`flex items-center gap-3 p-2 rounded ${
                          objective.isCompleted ? 'bg-green-900' : 'bg-valtara-bg-light'
                        }`}
                      >
                        <span className="text-lg">{getObjectiveIcon(objective.type)}</span>
                        <div className="flex-1">
                          <div className={`text-sm ${objective.isCompleted ? 'text-green-400 line-through' : 'text-valtara-text'}`}>
                            {objective.description}
                          </div>
                          <div className="text-xs text-valtara-text-muted">
                            Progress: {objective.currentProgress}/{objective.requiredProgress}
                          </div>
                        </div>
                        {objective.isCompleted && (
                          <span className="text-green-400">✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rewards */}
                <div className="game-panel p-4">
                  <h5 className="font-semibold text-valtara-secondary mb-3">Rewards</h5>
                  <div className="space-y-2">
                    {selectedQuest.rewards.map((reward, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <span>
                          {reward.type === 'experience' && '⭐'}
                          {reward.type === 'item' && '📦'}
                          {reward.type === 'gold' && '🪙'}
                          {reward.type === 'skill_experience' && '📚'}
                        </span>
                        <span className="text-valtara-text">
                          {reward.type === 'experience' && `${reward.value} Experience`}
                          {reward.type === 'item' && reward.item && `${reward.value}x ${reward.item.name}`}
                          {reward.type === 'gold' && `${reward.value} Gold`}
                          {reward.type === 'skill_experience' && `${reward.value} ${reward.skill} XP`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {selectedQuest.status === QuestStatus.AVAILABLE && (
                    <button
                      onClick={() => handleAcceptQuest(selectedQuest)}
                      className="game-button w-full py-3"
                    >
                      📋 Accept Quest
                    </button>
                  )}
                  
                  {selectedQuest.status === QuestStatus.COMPLETED && (
                    <button
                      onClick={() => handleCompleteQuest(selectedQuest)}
                      className="game-button w-full py-3"
                    >
                      ✅ Turn In Quest
                    </button>
                  )}
                  
                  {selectedQuest.status === QuestStatus.ACTIVE && (
                    <div className="text-center p-3 bg-valtara-bg-light rounded">
                      <p className="text-sm text-valtara-text-muted">
                        Complete all objectives to turn in this quest
                      </p>
                    </div>
                  )}
                </div>

                {/* Debug: Complete objectives */}
                {process.env.NODE_ENV === 'development' && selectedQuest.status === QuestStatus.ACTIVE && (
                  <div className="p-2 bg-gray-800 rounded">
                    <h5 className="text-xs font-semibold mb-2">Debug: Complete Objectives</h5>
                    <div className="space-y-1">
                      {selectedQuest.objectives.filter(obj => !obj.isCompleted).map(objective => (
                        <button
                          key={objective.id}
                          onClick={() => updateObjective(selectedQuest.id, objective.id, objective.requiredProgress)}
                          className="text-xs bg-valtara-primary text-valtara-bg px-2 py-1 rounded mr-1"
                        >
                          Complete: {objective.description.substring(0, 20)}...
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="game-panel p-4 text-center text-valtara-text-muted">
                <p>Select a quest to view details</p>
                <p className="text-xs mt-2">
                  Browse through your available, active, and completed quests to track your progress in Valtara.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestLog;
