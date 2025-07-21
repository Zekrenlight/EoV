import { create } from 'zustand';
import { Quest, QuestStatus, QuestObjective, ObjectiveType, QuestReward, PantheonGod } from '../types/GameTypes';
import { SAMPLE_ITEMS } from './useInventory';

interface QuestState {
  quests: Quest[];
  activeQuest: Quest | null;
  completedQuests: string[];
  
  // Actions
  initializeQuests: () => void;
  activateQuest: (questId: string) => void;
  updateObjective: (questId: string, objectiveId: string, progress: number) => void;
  completeQuest: (questId: string) => QuestReward[];
  getAvailableQuests: () => Quest[];
  getActiveQuests: () => Quest[];
  getCompletedQuests: () => Quest[];
  checkQuestCompletion: (questId: string) => boolean;
}

// Define initial quests for the game
const INITIAL_QUESTS: Quest[] = [
  {
    id: 'first_steps',
    title: 'First Steps in Valtara',
    description: 'Welcome to the world of Valtara! Learn the basics of survival and exploration.',
    objectives: [
      {
        id: 'gather_wood',
        description: 'Gather 5 pieces of wood',
        type: ObjectiveType.COLLECT,
        target: 'wood',
        currentProgress: 0,
        requiredProgress: 5,
        isCompleted: false
      },
      {
        id: 'gather_stone',
        description: 'Gather 3 pieces of stone',
        type: ObjectiveType.COLLECT,
        target: 'stone',
        currentProgress: 0,
        requiredProgress: 3,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'experience', value: 100 },
      { type: 'item', value: 1, item: SAMPLE_ITEMS.health_potion },
      { type: 'skill_experience', value: 50, skill: 'gathering' }
    ],
    status: QuestStatus.AVAILABLE,
    pantheonGod: PantheonGod.AILURA,
    isMainQuest: true,
    prerequisites: []
  },
  {
    id: 'craft_your_first_tool',
    title: 'Craft Your First Tool',
    description: 'Learn the art of crafting by creating a basic fishing rod.',
    objectives: [
      {
        id: 'craft_fishing_rod',
        description: 'Craft a fishing rod',
        type: ObjectiveType.CRAFT,
        target: 'fishing_rod',
        currentProgress: 0,
        requiredProgress: 1,
        isCompleted: false
      },
      {
        id: 'catch_fish',
        description: 'Catch 3 fish using your fishing rod',
        type: ObjectiveType.COLLECT,
        target: 'fish',
        currentProgress: 0,
        requiredProgress: 3,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'experience', value: 150 },
      { type: 'skill_experience', value: 100, skill: 'woodworking' },
      { type: 'skill_experience', value: 75, skill: 'fishing' }
    ],
    status: QuestStatus.AVAILABLE,
    pantheonGod: PantheonGod.SYLVANA,
    isMainQuest: true,
    prerequisites: ['first_steps']
  },
  {
    id: 'combat_training',
    title: 'Combat Training',
    description: 'Prove your worth in battle by defeating enemies that threaten the realm.',
    objectives: [
      {
        id: 'defeat_goblins',
        description: 'Defeat 5 goblins',
        type: ObjectiveType.KILL,
        target: 'goblin',
        currentProgress: 0,
        requiredProgress: 5,
        isCompleted: false
      },
      {
        id: 'craft_weapon',
        description: 'Craft or acquire a weapon',
        type: ObjectiveType.CRAFT,
        target: 'iron_sword',
        currentProgress: 0,
        requiredProgress: 1,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'experience', value: 200 },
      { type: 'item', value: 1, item: SAMPLE_ITEMS.leather_armor },
      { type: 'skill_experience', value: 150, skill: 'melee_combat' }
    ],
    status: QuestStatus.AVAILABLE,
    pantheonGod: PantheonGod.KORRATH,
    isMainQuest: true,
    prerequisites: ['first_steps']
  },
  {
    id: 'thalirions_riddle',
    title: "Thalirion's Riddle",
    description: 'The god of knowledge has presented you with a challenging puzzle. Solve it to gain his favor.',
    objectives: [
      {
        id: 'solve_stone_puzzle',
        description: 'Solve the ancient stone puzzle',
        type: ObjectiveType.INTERACT,
        target: 'stone_puzzle',
        currentProgress: 0,
        requiredProgress: 1,
        isCompleted: false
      },
      {
        id: 'collect_knowledge_tome',
        description: 'Collect the Knowledge Tome as your reward',
        type: ObjectiveType.COLLECT,
        target: 'knowledge_tome',
        currentProgress: 0,
        requiredProgress: 1,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'experience', value: 300 },
      { type: 'skill_experience', value: 200, skill: 'puzzle_solving' },
      { type: 'skill_experience', value: 150, skill: 'arcane_lore' }
    ],
    status: QuestStatus.AVAILABLE,
    pantheonGod: PantheonGod.THALIRION,
    isMainQuest: false,
    prerequisites: ['first_steps']
  },
  {
    id: 'healing_herbs',
    title: 'Gathering Healing Herbs',
    description: 'Ailura has blessed certain plants with healing properties. Learn to identify and harvest them.',
    objectives: [
      {
        id: 'collect_healing_herbs',
        description: 'Collect 10 healing herbs',
        type: ObjectiveType.COLLECT,
        target: 'healing_herb',
        currentProgress: 0,
        requiredProgress: 10,
        isCompleted: false
      },
      {
        id: 'brew_health_potions',
        description: 'Brew 3 health potions',
        type: ObjectiveType.CRAFT,
        target: 'health_potion',
        currentProgress: 0,
        requiredProgress: 3,
        isCompleted: false
      }
    ],
    rewards: [
      { type: 'experience', value: 120 },
      { type: 'item', value: 3, item: SAMPLE_ITEMS.health_potion },
      { type: 'skill_experience', value: 100, skill: 'herbalism' }
    ],
    status: QuestStatus.AVAILABLE,
    pantheonGod: PantheonGod.AILURA,
    isMainQuest: false,
    prerequisites: []
  }
];

export const useQuests = create<QuestState>((set, get) => ({
  quests: [],
  activeQuest: null,
  completedQuests: [],

  initializeQuests: () => {
    set({ quests: [...INITIAL_QUESTS] });
    console.log('Quests initialized:', INITIAL_QUESTS.length, 'quests available');
  },

  activateQuest: (questId) => {
    set((state) => {
      const questIndex = state.quests.findIndex(q => q.id === questId);
      if (questIndex === -1) {
        console.warn(`Quest not found: ${questId}`);
        return state;
      }

      const quest = state.quests[questIndex];
      if (quest.status !== QuestStatus.AVAILABLE) {
        console.warn(`Quest ${questId} is not available for activation`);
        return state;
      }

      // Check prerequisites
      if (quest.prerequisites && quest.prerequisites.length > 0) {
        const unmetPrereqs = quest.prerequisites.filter(prereq => 
          !state.completedQuests.includes(prereq)
        );
        
        if (unmetPrereqs.length > 0) {
          console.warn(`Quest ${questId} has unmet prerequisites:`, unmetPrereqs);
          return state;
        }
      }

      const updatedQuests = [...state.quests];
      updatedQuests[questIndex] = {
        ...quest,
        status: QuestStatus.ACTIVE
      };

      console.log(`Quest activated: ${quest.title}`);
      
      return {
        quests: updatedQuests,
        activeQuest: updatedQuests[questIndex]
      };
    });
  },

  updateObjective: (questId, objectiveId, progress) => {
    set((state) => {
      const questIndex = state.quests.findIndex(q => q.id === questId);
      if (questIndex === -1) return state;

      const quest = state.quests[questIndex];
      if (quest.status !== QuestStatus.ACTIVE) return state;

      const objectiveIndex = quest.objectives.findIndex(obj => obj.id === objectiveId);
      if (objectiveIndex === -1) return state;

      const updatedQuests = [...state.quests];
      const updatedObjectives = [...quest.objectives];
      const objective = { ...updatedObjectives[objectiveIndex] };

      objective.currentProgress = Math.min(progress, objective.requiredProgress);
      objective.isCompleted = objective.currentProgress >= objective.requiredProgress;

      updatedObjectives[objectiveIndex] = objective;
      updatedQuests[questIndex] = {
        ...quest,
        objectives: updatedObjectives
      };

      if (objective.isCompleted) {
        console.log(`Objective completed: ${objective.description}`);
      }

      // Check if quest is completed
      const allObjectivesComplete = updatedObjectives.every(obj => obj.isCompleted);
      if (allObjectivesComplete && quest.status === QuestStatus.ACTIVE) {
        updatedQuests[questIndex].status = QuestStatus.COMPLETED;
        console.log(`🎉 Quest completed: ${quest.title}`);
      }

      return {
        quests: updatedQuests,
        activeQuest: state.activeQuest?.id === questId ? updatedQuests[questIndex] : state.activeQuest
      };
    });
  },

  completeQuest: (questId) => {
    const { quests } = get();
    const quest = quests.find(q => q.id === questId);
    
    if (!quest || quest.status !== QuestStatus.COMPLETED) {
      console.warn(`Cannot complete quest: ${questId}`);
      return [];
    }

    set((state) => {
      const updatedQuests = [...state.quests];
      const questIndex = updatedQuests.findIndex(q => q.id === questId);
      
      if (questIndex !== -1) {
        updatedQuests[questIndex] = {
          ...updatedQuests[questIndex],
          status: QuestStatus.TURNED_IN
        };
      }

      return {
        quests: updatedQuests,
        completedQuests: [...state.completedQuests, questId],
        activeQuest: state.activeQuest?.id === questId ? null : state.activeQuest
      };
    });

    console.log(`Quest turned in: ${quest.title}`);
    console.log('Rewards earned:', quest.rewards);
    
    return quest.rewards;
  },

  getAvailableQuests: () => {
    const { quests, completedQuests } = get();
    return quests.filter(quest => {
      if (quest.status !== QuestStatus.AVAILABLE) return false;
      
      // Check prerequisites
      if (quest.prerequisites && quest.prerequisites.length > 0) {
        return quest.prerequisites.every(prereq => completedQuests.includes(prereq));
      }
      
      return true;
    });
  },

  getActiveQuests: () => {
    return get().quests.filter(quest => quest.status === QuestStatus.ACTIVE);
  },

  getCompletedQuests: () => {
    return get().quests.filter(quest => 
      quest.status === QuestStatus.COMPLETED || quest.status === QuestStatus.TURNED_IN
    );
  },

  checkQuestCompletion: (questId) => {
    const quest = get().quests.find(q => q.id === questId);
    if (!quest) return false;
    
    return quest.objectives.every(objective => objective.isCompleted);
  }
}));

// Initialize quests when the store is first used
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const { quests, initializeQuests } = useQuests.getState();
    if (quests.length === 0) {
      initializeQuests();
    }
  }, 200);
}
