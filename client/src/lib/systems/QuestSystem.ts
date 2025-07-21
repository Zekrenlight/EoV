import { Quest, QuestObjective, QuestStatus, ObjectiveType, QuestReward, PantheonGod } from '../types/GameTypes';

export class QuestSystem {
  private static questTemplates: Map<string, QuestTemplate> = new Map();
  private static questChains: Map<string, string[]> = new Map();
  private static dynamicQuests: Quest[] = [];

  interface QuestTemplate {
    id: string;
    title: string;
    description: string;
    type: 'main' | 'side' | 'daily' | 'pantheon' | 'dynamic';
    pantheonGod?: PantheonGod;
    level: number;
    prerequisites: string[];
    objectives: ObjectiveTemplate[];
    rewards: QuestReward[];
    timeLimit?: number;
    repeatable: boolean;
  }

  interface ObjectiveTemplate {
    id: string;
    description: string;
    type: ObjectiveType;
    target: string;
    requiredProgress: number;
    weight: number; // For dynamic quest generation
  }

  // Initialize quest system with templates
  static initialize() {
    this.loadQuestTemplates();
    this.loadQuestChains();
    console.log('QuestSystem initialized with', this.questTemplates.size, 'quest templates');
  }

  private static loadQuestTemplates() {
    // Main Story Quests
    this.questTemplates.set('valtara_awakening', {
      id: 'valtara_awakening',
      title: 'The Awakening of Valtara',
      description: 'You have been chosen by the pantheon to help restore balance to the realm of Valtara.',
      type: 'main',
      level: 1,
      prerequisites: [],
      objectives: [
        {
          id: 'speak_to_oracle',
          description: 'Speak with the Oracle of Valtara',
          type: ObjectiveType.TALK_TO_NPC,
          target: 'oracle_npc',
          requiredProgress: 1,
          weight: 1
        },
        {
          id: 'gather_essence',
          description: 'Gather 5 essence crystals from the surrounding area',
          type: ObjectiveType.COLLECT,
          target: 'essence_crystal',
          requiredProgress: 5,
          weight: 3
        }
      ],
      rewards: [
        { type: 'experience', value: 250 },
        { type: 'skill_experience', value: 100, skill: 'gathering' }
      ],
      repeatable: false
    });

    // Pantheon-specific quests for each god
    Object.values(PantheonGod).forEach(god => {
      this.generatePantheonQuests(god);
    });

    // Daily/repeatable quests
    this.generateDailyQuests();

    // Dynamic quest templates
    this.generateDynamicQuestTemplates();
  }

  private static generatePantheonQuests(god: PantheonGod) {
    const godInfo = this.getPantheonInfo(god);
    
    // Tier 1 Pantheon Quest
    this.questTemplates.set(`${god.toLowerCase()}_trial_1`, {
      id: `${god.toLowerCase()}_trial_1`,
      title: `${godInfo.name}'s First Trial`,
      description: `Prove your dedication to ${godInfo.name} through ${godInfo.focus}.`,
      type: 'pantheon',
      pantheonGod: god,
      level: 5,
      prerequisites: ['first_steps'],
      objectives: this.generatePantheonObjectives(god, 1),
      rewards: [
        { type: 'experience', value: 300 },
        { type: 'skill_experience', value: 150, skill: godInfo.primarySkill }
      ],
      repeatable: false
    });

    // Tier 2 Pantheon Quest
    this.questTemplates.set(`${god.toLowerCase()}_trial_2`, {
      id: `${god.toLowerCase()}_trial_2`,
      title: `${godInfo.name}'s Greater Trial`,
      description: `Take on a greater challenge in service of ${godInfo.name}.`,
      type: 'pantheon',
      pantheonGod: god,
      level: 15,
      prerequisites: [`${god.toLowerCase()}_trial_1`],
      objectives: this.generatePantheonObjectives(god, 2),
      rewards: [
        { type: 'experience', value: 500 },
        { type: 'skill_experience', value: 300, skill: godInfo.primarySkill }
      ],
      repeatable: false
    });
  }

  private static generatePantheonObjectives(god: PantheonGod, tier: number): ObjectiveTemplate[] {
    const objectives: ObjectiveTemplate[] = [];
    
    switch (god) {
      case PantheonGod.AILURA:
        objectives.push({
          id: `gather_herbs_${tier}`,
          description: `Gather ${tier * 10} healing herbs`,
          type: ObjectiveType.COLLECT,
          target: 'healing_herb',
          requiredProgress: tier * 10,
          weight: 2
        });
        break;
        
      case PantheonGod.KORRATH:
        objectives.push({
          id: `defeat_enemies_${tier}`,
          description: `Defeat ${tier * 5} enemies in combat`,
          type: ObjectiveType.KILL,
          target: 'any_enemy',
          requiredProgress: tier * 5,
          weight: 3
        });
        break;
        
      case PantheonGod.THALIRION:
        objectives.push({
          id: `solve_puzzles_${tier}`,
          description: `Solve ${tier * 2} ancient puzzles`,
          type: ObjectiveType.INTERACT,
          target: 'ancient_puzzle',
          requiredProgress: tier * 2,
          weight: 4
        });
        break;
        
      // Add more pantheon-specific objectives
    }
    
    return objectives;
  }

  private static generateDailyQuests() {
    const dailyTemplates = [
      {
        id: 'daily_gathering',
        title: 'Daily Resource Collection',
        description: 'Gather various resources to help the local community.',
        type: 'daily' as const,
        level: 1,
        prerequisites: [],
        objectives: [
          {
            id: 'daily_wood',
            description: 'Collect 10 pieces of wood',
            type: ObjectiveType.COLLECT,
            target: 'wood',
            requiredProgress: 10,
            weight: 1
          }
        ],
        rewards: [
          { type: 'experience', value: 100 }
        ],
        repeatable: true
      }
    ];

    dailyTemplates.forEach(template => {
      this.questTemplates.set(template.id, template);
    });
  }

  private static generateDynamicQuestTemplates() {
    // Templates for procedurally generated quests
    const dynamicTemplates = [
      {
        id: 'dynamic_hunt',
        title: 'Hunting Request',
        description: 'A local settlement needs help dealing with dangerous creatures.',
        type: 'dynamic' as const,
        level: 5,
        prerequisites: [],
        objectives: [
          {
            id: 'hunt_creatures',
            description: 'Eliminate threatening creatures',
            type: ObjectiveType.KILL,
            target: 'dynamic_enemy',
            requiredProgress: 5,
            weight: 3
          }
        ],
        rewards: [
          { type: 'experience', value: 150 }
        ],
        repeatable: false
      }
    ];

    dynamicTemplates.forEach(template => {
      this.questTemplates.set(template.id, template);
    });
  }

  private static loadQuestChains() {
    // Define quest progression chains
    this.questChains.set('main_story', [
      'first_steps',
      'valtara_awakening',
      'pantheon_choice',
      'elemental_trials',
      'shadow_threat',
      'final_confrontation'
    ]);

    this.questChains.set('ailura_path', [
      'ailura_trial_1',
      'ailura_trial_2',
      'nature_guardian',
      'life_master'
    ]);

    // Add chains for other pantheon gods
    Object.values(PantheonGod).forEach(god => {
      if (god !== PantheonGod.AILURA) {
        this.questChains.set(`${god.toLowerCase()}_path`, [
          `${god.toLowerCase()}_trial_1`,
          `${god.toLowerCase()}_trial_2`
        ]);
      }
    });
  }

  // Quest generation and management
  static generateDynamicQuest(playerLevel: number, location: string): Quest | null {
    const suitableTemplates = Array.from(this.questTemplates.values())
      .filter(template => 
        template.type === 'dynamic' && 
        template.level <= playerLevel + 2 &&
        template.level >= playerLevel - 2
      );

    if (suitableTemplates.length === 0) return null;

    const template = suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)];
    return this.createQuestFromTemplate(template, { location, playerLevel });
  }

  static createQuestFromTemplate(
    template: QuestTemplate, 
    context: { location?: string; playerLevel?: number } = {}
  ): Quest {
    const questId = `${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const objectives: QuestObjective[] = template.objectives.map(objTemplate => ({
      id: objTemplate.id,
      description: this.contextualizeDescription(objTemplate.description, context),
      type: objTemplate.type,
      target: objTemplate.target,
      currentProgress: 0,
      requiredProgress: objTemplate.requiredProgress,
      isCompleted: false
    }));

    const quest: Quest = {
      id: questId,
      title: this.contextualizeDescription(template.title, context),
      description: this.contextualizeDescription(template.description, context),
      objectives,
      rewards: [...template.rewards], // Clone rewards
      status: QuestStatus.AVAILABLE,
      pantheonGod: template.pantheonGod,
      isMainQuest: template.type === 'main',
      prerequisites: [...template.prerequisites]
    };

    return quest;
  }

  private static contextualizeDescription(description: string, context: any): string {
    let result = description;
    
    if (context.location) {
      result = result.replace(/\{location\}/g, context.location);
    }
    
    if (context.playerLevel) {
      // Adjust difficulty based on player level
      result = result.replace(/\{difficulty\}/g, 
        context.playerLevel < 10 ? 'simple' : 
        context.playerLevel < 25 ? 'challenging' : 
        'difficult'
      );
    }
    
    return result;
  }

  // Quest progression tracking
  static updateQuestProgress(
    questId: string, 
    objectiveId: string, 
    progress: number, 
    playerQuests: Quest[]
  ): boolean {
    const quest = playerQuests.find(q => q.id === questId);
    if (!quest || quest.status !== QuestStatus.ACTIVE) return false;

    const objective = quest.objectives.find(obj => obj.id === objectiveId);
    if (!objective) return false;

    objective.currentProgress = Math.min(progress, objective.requiredProgress);
    objective.isCompleted = objective.currentProgress >= objective.requiredProgress;

    console.log(`Quest progress: ${quest.title} - ${objective.description} (${objective.currentProgress}/${objective.requiredProgress})`);

    // Check if all objectives are completed
    const allCompleted = quest.objectives.every(obj => obj.isCompleted);
    if (allCompleted && quest.status === QuestStatus.ACTIVE) {
      quest.status = QuestStatus.COMPLETED;
      console.log(`🎉 Quest completed: ${quest.title}`);
      
      // Trigger completion effects
      this.onQuestCompleted(quest);
    }

    return true;
  }

  private static onQuestCompleted(quest: Quest) {
    // Handle quest completion effects
    if (quest.isMainQuest) {
      this.unlockNextMainQuest(quest.id);
    }
    
    if (quest.pantheonGod) {
      this.increasePantheonFavor(quest.pantheonGod, 50);
    }
    
    // Check for quest chain progression
    this.checkQuestChainProgression(quest.id);
  }

  private static unlockNextMainQuest(completedQuestId: string) {
    const mainChain = this.questChains.get('main_story');
    if (!mainChain) return;

    const currentIndex = mainChain.indexOf(completedQuestId);
    if (currentIndex >= 0 && currentIndex < mainChain.length - 1) {
      const nextQuestId = mainChain[currentIndex + 1];
      console.log(`Unlocked next main quest: ${nextQuestId}`);
      // This would trigger the next quest becoming available
    }
  }

  private static increasePantheonFavor(god: PantheonGod, amount: number) {
    console.log(`Increased favor with ${god} by ${amount}`);
    // This would integrate with a pantheon favor system
  }

  private static checkQuestChainProgression(completedQuestId: string) {
    for (const [chainName, questIds] of this.questChains.entries()) {
      const questIndex = questIds.indexOf(completedQuestId);
      if (questIndex >= 0) {
        console.log(`Quest chain progress: ${chainName} (${questIndex + 1}/${questIds.length})`);
        
        if (questIndex === questIds.length - 1) {
          console.log(`🏆 Quest chain completed: ${chainName}`);
          this.onQuestChainCompleted(chainName);
        }
      }
    }
  }

  private static onQuestChainCompleted(chainName: string) {
    // Handle quest chain completion rewards
    console.log(`Quest chain rewards for: ${chainName}`);
  }

  // Quest validation and prerequisites
  static checkQuestPrerequisites(questId: string, completedQuests: string[]): boolean {
    const template = this.questTemplates.get(questId);
    if (!template) return false;

    return template.prerequisites.every(prereq => completedQuests.includes(prereq));
  }

  static getAvailableQuests(playerLevel: number, completedQuests: string[]): QuestTemplate[] {
    return Array.from(this.questTemplates.values())
      .filter(template => 
        template.level <= playerLevel &&
        this.checkQuestPrerequisites(template.id, completedQuests) &&
        (template.repeatable || !completedQuests.includes(template.id))
      );
  }

  // Quest rewards calculation
  static calculateScaledRewards(baseRewards: QuestReward[], playerLevel: number): QuestReward[] {
    return baseRewards.map(reward => {
      const scaledReward = { ...reward };
      
      if (reward.type === 'experience') {
        // Scale experience based on player level
        scaledReward.value = Math.floor(reward.value * (1 + playerLevel * 0.1));
      }
      
      return scaledReward;
    });
  }

  // Utility functions
  private static getPantheonInfo(god: PantheonGod) {
    const pantheonData = {
      [PantheonGod.AILURA]: { name: 'Ailura', focus: 'gathering and healing', primarySkill: 'gathering' },
      [PantheonGod.THALIRION]: { name: 'Thalirion', focus: 'knowledge and puzzles', primarySkill: 'arcane_lore' },
      [PantheonGod.KORRATH]: { name: 'Korrath', focus: 'combat and strength', primarySkill: 'melee_combat' },
      [PantheonGod.SYLVANA]: { name: 'Sylvana', focus: 'crafting and nature', primarySkill: 'woodworking' },
      [PantheonGod.NEREON]: { name: 'Nereon', focus: 'fishing and water', primarySkill: 'fishing' },
      [PantheonGod.PYRION]: { name: 'Pyrion', focus: 'smithing and fire', primarySkill: 'smithing' },
      [PantheonGod.UMBROS]: { name: 'Umbros', focus: 'stealth and shadows', primarySkill: 'stealth' },
      [PantheonGod.LUXARA]: { name: 'Luxara', focus: 'healing and light', primarySkill: 'healing' }
    };
    
    return pantheonData[god];
  }

  static getQuestTemplate(id: string): QuestTemplate | null {
    return this.questTemplates.get(id) || null;
  }

  static getAllQuestTemplates(): QuestTemplate[] {
    return Array.from(this.questTemplates.values());
  }

  static getQuestChain(chainName: string): string[] {
    return this.questChains.get(chainName) || [];
  }
}

// Initialize the quest system
if (typeof window !== 'undefined') {
  QuestSystem.initialize();
}
