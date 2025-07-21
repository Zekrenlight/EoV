import { Skill, PantheonGod, SkillBonus } from '../types/GameTypes';

export class SkillSystem {
  private static skillMultipliers: Map<string, number> = new Map();
  private static skillUnlocks: Map<number, string[]> = new Map();
  private static pantheonBonuses: Map<PantheonGod, string[]> = new Map();

  // Initialize skill system with progression rules
  static initialize() {
    this.setupSkillMultipliers();
    this.setupLevelUnlocks();
    this.setupPantheonBonuses();
    console.log('SkillSystem initialized with progression rules');
  }

  private static setupSkillMultipliers() {
    // Experience multipliers for different skill types
    this.skillMultipliers.set('gathering', 1.0);
    this.skillMultipliers.set('herbalism', 1.2);
    this.skillMultipliers.set('melee_combat', 1.1);
    this.skillMultipliers.set('strength', 1.3);
    this.skillMultipliers.set('woodworking', 1.1);
    this.skillMultipliers.set('nature_magic', 1.4);
    this.skillMultipliers.set('fishing', 1.0);
    this.skillMultipliers.set('swimming', 1.2);
    this.skillMultipliers.set('smithing', 1.3);
    this.skillMultipliers.set('fire_magic', 1.4);
    this.skillMultipliers.set('stealth', 1.2);
    this.skillMultipliers.set('lockpicking', 1.3);
    this.skillMultipliers.set('healing', 1.3);
    this.skillMultipliers.set('light_magic', 1.4);
    this.skillMultipliers.set('arcane_lore', 1.5);
    this.skillMultipliers.set('puzzle_solving', 1.3);
  }

  private static setupLevelUnlocks() {
    // Level-based unlocks for features and abilities
    this.skillUnlocks.set(5, ['basic_recipes', 'simple_enchantments']);
    this.skillUnlocks.set(10, ['intermediate_recipes', 'skill_synergy']);
    this.skillUnlocks.set(15, ['advanced_techniques', 'combo_abilities']);
    this.skillUnlocks.set(20, ['expert_recipes', 'mastery_bonuses']);
    this.skillUnlocks.set(25, ['legendary_recipes', 'divine_abilities']);
    this.skillUnlocks.set(30, ['ancient_knowledge', 'transcendent_skills']);
    this.skillUnlocks.set(40, ['master_crafting', 'elemental_mastery']);
    this.skillUnlocks.set(50, ['grandmaster_tier', 'world_shaping']);
  }

  private static setupPantheonBonuses() {
    // Pantheon-specific skill bonuses
    this.pantheonBonuses.set(PantheonGod.AILURA, ['gathering', 'herbalism']);
    this.pantheonBonuses.set(PantheonGod.THALIRION, ['arcane_lore', 'puzzle_solving']);
    this.pantheonBonuses.set(PantheonGod.KORRATH, ['melee_combat', 'strength']);
    this.pantheonBonuses.set(PantheonGod.SYLVANA, ['woodworking', 'nature_magic']);
    this.pantheonBonuses.set(PantheonGod.NEREON, ['fishing', 'swimming']);
    this.pantheonBonuses.set(PantheonGod.PYRION, ['smithing', 'fire_magic']);
    this.pantheonBonuses.set(PantheonGod.UMBROS, ['stealth', 'lockpicking']);
    this.pantheonBonuses.set(PantheonGod.LUXARA, ['healing', 'light_magic']);
  }

  // Experience and level calculations
  static calculateExperienceToNext(level: number): number {
    // Exponential growth formula with reasonable progression
    const baseExp = 100;
    const growthRate = 1.15;
    return Math.floor(baseExp * Math.pow(growthRate, level - 1));
  }

  static calculateTotalExperienceForLevel(level: number): number {
    let total = 0;
    for (let i = 1; i < level; i++) {
      total += this.calculateExperienceToNext(i);
    }
    return total;
  }

  static getLevelFromTotalExperience(totalExp: number): number {
    let level = 1;
    let expForNextLevel = 0;
    
    while (expForNextLevel <= totalExp) {
      expForNextLevel += this.calculateExperienceToNext(level);
      if (expForNextLevel <= totalExp) {
        level++;
      }
    }
    
    return level;
  }

  // Skill progression and bonuses
  static applyExperienceGain(
    skill: Skill, 
    baseExperience: number, 
    pantheonGod?: PantheonGod,
    bonusMultipliers: number[] = []
  ): { levelUp: boolean; newLevel: number; totalExpGained: number } {
    let expGain = baseExperience;
    
    // Apply skill-specific multiplier
    const skillMultiplier = this.skillMultipliers.get(skill.id) || 1.0;
    expGain *= skillMultiplier;
    
    // Apply pantheon bonus
    if (pantheonGod && this.isPantheonSkill(skill.id, pantheonGod)) {
      expGain *= 1.25; // 25% bonus for pantheon-aligned skills
    }
    
    // Apply additional multipliers
    bonusMultipliers.forEach(multiplier => {
      expGain *= multiplier;
    });
    
    expGain = Math.floor(expGain);
    const oldLevel = skill.level;
    
    // Add experience
    skill.experience += expGain;
    
    // Check for level ups
    let levelUp = false;
    while (skill.experience >= skill.experienceToNext) {
      skill.experience -= skill.experienceToNext;
      skill.level++;
      skill.experienceToNext = this.calculateExperienceToNext(skill.level);
      levelUp = true;
      
      console.log(`🎉 ${skill.name} leveled up to ${skill.level}!`);
      
      // Check for unlocks
      this.checkSkillUnlocks(skill);
    }
    
    return {
      levelUp,
      newLevel: skill.level,
      totalExpGained: expGain
    };
  }

  private static isPantheonSkill(skillId: string, pantheonGod: PantheonGod): boolean {
    const pantheonSkills = this.pantheonBonuses.get(pantheonGod) || [];
    return pantheonSkills.includes(skillId);
  }

  private static checkSkillUnlocks(skill: Skill) {
    const unlocks = this.skillUnlocks.get(skill.level);
    if (unlocks) {
      console.log(`🔓 ${skill.name} Level ${skill.level} unlocked:`, unlocks);
      // This would trigger UI notifications or unlock new features
    }
  }

  // Skill bonus calculations
  static calculateSkillBonus(skill: Skill, bonusType: string): number {
    const baseBonus = skill.bonuses.find(bonus => 
      bonus.description.toLowerCase().includes(bonusType.toLowerCase())
    );
    
    if (!baseBonus) return 0;
    
    // Scale bonus with level
    const levelMultiplier = 1 + ((skill.level - 1) * 0.02); // 2% per level above 1
    const milestoneBonus = this.getMilestoneBonus(skill.level);
    
    return baseBonus.value * levelMultiplier * milestoneBonus;
  }

  private static getMilestoneBonus(level: number): number {
    if (level >= 50) return 2.0; // Grandmaster
    if (level >= 40) return 1.8; // Master
    if (level >= 30) return 1.6; // Expert
    if (level >= 20) return 1.4; // Adept
    if (level >= 10) return 1.2; // Skilled
    return 1.0; // Novice
  }

  // Skill synergy system
  static calculateSkillSynergy(skills: Skill[], action: string): number {
    const relevantSkills = this.getRelevantSkills(skills, action);
    if (relevantSkills.length < 2) return 1.0;
    
    // Calculate synergy bonus based on related skill levels
    const averageLevel = relevantSkills.reduce((sum, skill) => sum + skill.level, 0) / relevantSkills.length;
    const synergyBonus = 1 + (relevantSkills.length - 1) * 0.05 * (averageLevel / 10);
    
    return Math.min(synergyBonus, 1.5); // Cap at 50% bonus
  }

  private static getRelevantSkills(skills: Skill[], action: string): Skill[] {
    const actionSkillMap = {
      'woodcutting': ['woodworking', 'strength', 'nature_magic'],
      'mining': ['smithing', 'strength'],
      'fishing': ['fishing', 'swimming'],
      'crafting': ['woodworking', 'smithing'],
      'combat': ['melee_combat', 'strength'],
      'magic': ['arcane_lore', 'fire_magic', 'nature_magic', 'light_magic'],
      'stealth': ['stealth', 'lockpicking'],
      'healing': ['healing', 'herbalism', 'light_magic']
    };
    
    const relevantSkillIds = actionSkillMap[action] || [];
    return skills.filter(skill => relevantSkillIds.includes(skill.id));
  }

  // Skill requirements and gating
  static checkSkillRequirement(skills: Skill[], requiredSkill: string, requiredLevel: number): boolean {
    const skill = skills.find(s => s.id === requiredSkill);
    return skill ? skill.level >= requiredLevel : false;
  }

  static getSkillRequirementsForAction(action: string): { skillId: string; level: number }[] {
    const requirements = {
      'advanced_crafting': [{ skillId: 'woodworking', level: 15 }],
      'enchanting': [{ skillId: 'arcane_lore', level: 10 }],
      'master_smithing': [{ skillId: 'smithing', level: 25 }],
      'ancient_magic': [{ skillId: 'arcane_lore', level: 30 }],
      'legendary_fishing': [{ skillId: 'fishing', level: 40 }],
      'shadow_techniques': [{ skillId: 'stealth', level: 20 }],
      'divine_healing': [{ skillId: 'healing', level: 35 }]
    };
    
    return requirements[action] || [];
  }

  // Skill degradation and maintenance
  static applySkillDecay(skills: Skill[], daysInactive: number): Skill[] {
    if (daysInactive < 7) return skills; // No decay for first week
    
    return skills.map(skill => {
      const decayRate = this.getSkillDecayRate(skill.id);
      const experienceLoss = Math.floor(daysInactive * decayRate * skill.level);
      
      if (experienceLoss > 0) {
        skill.experience = Math.max(0, skill.experience - experienceLoss);
        
        // Check if level should decrease
        while (skill.level > 1 && skill.experience < 0) {
          skill.level--;
          const prevLevelExp = this.calculateExperienceToNext(skill.level);
          skill.experience += prevLevelExp;
          skill.experienceToNext = this.calculateExperienceToNext(skill.level);
        }
        
        console.log(`${skill.name} decayed by ${experienceLoss} experience due to inactivity`);
      }
      
      return skill;
    });
  }

  private static getSkillDecayRate(skillId: string): number {
    // Different skills decay at different rates
    const decayRates = {
      'melee_combat': 5, // Combat skills decay faster
      'strength': 3,
      'stealth': 4,
      'gathering': 1, // Gathering skills decay slower
      'woodworking': 2,
      'smithing': 2,
      'arcane_lore': 1, // Knowledge skills decay very slowly
      'puzzle_solving': 1
    };
    
    return decayRates[skillId] || 2;
  }

  // Skill mastery and prestige
  static calculateMasteryProgress(skill: Skill): number {
    if (skill.level < 50) return 0;
    
    const masteryExp = skill.experience;
    const maxMasteryExp = 1000000; // 1 million exp for full mastery
    
    return Math.min(masteryExp / maxMasteryExp, 1.0);
  }

  static canPrestigeSkill(skill: Skill): boolean {
    return skill.level >= 50 && this.calculateMasteryProgress(skill) >= 1.0;
  }

  static prestigeSkill(skill: Skill): Skill {
    if (!this.canPrestigeSkill(skill)) {
      throw new Error('Skill not ready for prestige');
    }
    
    const prestigedSkill = { ...skill };
    prestigedSkill.level = 1;
    prestigedSkill.experience = 0;
    prestigedSkill.experienceToNext = this.calculateExperienceToNext(1);
    
    // Add prestige bonuses
    prestigedSkill.bonuses = prestigedSkill.bonuses.map(bonus => ({
      ...bonus,
      value: bonus.value * 1.1 // 10% bonus for prestiged skills
    }));
    
    console.log(`🌟 ${skill.name} has been prestiged! Gained permanent bonuses.`);
    
    return prestigedSkill;
  }

  // Skill training and practice
  static getOptimalTrainingMethod(skill: Skill): {
    method: string;
    experienceRate: number;
    requirements: string[];
    description: string;
  } {
    const trainingMethods = {
      'gathering': {
        method: 'Rare Resource Gathering',
        experienceRate: skill.level * 15,
        requirements: ['High-level areas', 'Gathering tools'],
        description: 'Gather rare materials in dangerous territories for maximum experience.'
      },
      'melee_combat': {
        method: 'Elite Enemy Training',
        experienceRate: skill.level * 20,
        requirements: ['Strong weapons', 'Healing supplies'],
        description: 'Fight challenging enemies to rapidly improve combat skills.'
      },
      'smithing': {
        method: 'Masterwork Crafting',
        experienceRate: skill.level * 12,
        requirements: ['Rare materials', 'Advanced forge'],
        description: 'Create complex items to master the art of smithing.'
      }
      // Add more training methods for other skills
    };
    
    return trainingMethods[skill.id] || {
      method: 'Standard Practice',
      experienceRate: skill.level * 10,
      requirements: ['Basic materials'],
      description: 'Practice the fundamentals to steadily improve.'
    };
  }

  // Skill comparison and progression tracking
  static compareSkillProgress(playerSkills: Skill[], targetSkills: Skill[]): {
    skillId: string;
    currentLevel: number;
    targetLevel: number;
    experienceNeeded: number;
    timeEstimate: string;
  }[] {
    return targetSkills.map(targetSkill => {
      const playerSkill = playerSkills.find(s => s.id === targetSkill.id);
      const currentLevel = playerSkill ? playerSkill.level : 1;
      const experienceNeeded = this.calculateTotalExperienceForLevel(targetSkill.level) - 
                              (playerSkill ? this.calculateTotalExperienceForLevel(currentLevel) : 0);
      
      const optimalMethod = this.getOptimalTrainingMethod(targetSkill);
      const hoursNeeded = experienceNeeded / optimalMethod.experienceRate;
      const timeEstimate = this.formatTimeEstimate(hoursNeeded);
      
      return {
        skillId: targetSkill.id,
        currentLevel,
        targetLevel: targetSkill.level,
        experienceNeeded,
        timeEstimate
      };
    });
  }

  private static formatTimeEstimate(hours: number): string {
    if (hours < 1) return `${Math.ceil(hours * 60)} minutes`;
    if (hours < 24) return `${Math.ceil(hours)} hours`;
    return `${Math.ceil(hours / 24)} days`;
  }
}

// Initialize the skill system
if (typeof window !== 'undefined') {
  SkillSystem.initialize();
}
