import { create } from 'zustand';
import { Skill, PantheonGod, SkillBonus } from '../types/GameTypes';

interface SkillState {
  skills: Skill[];
  totalLevel: number;
  
  // Actions
  initializeSkills: () => void;
  gainSkillExperience: (skillId: string, amount: number) => void;
  getSkill: (skillId: string) => Skill | undefined;
  getSkillsByPantheon: (god: PantheonGod) => Skill[];
  calculateTotalLevel: () => number;
  getSkillBonus: (skillId: string, bonusType: string) => number;
}

// Define the skill system based on Valtara's pantheon
const INITIAL_SKILLS: Omit<Skill, 'experience' | 'level' | 'experienceToNext'>[] = [
  // Ailura - Vitality and Gathering
  {
    id: 'gathering',
    name: 'Gathering',
    description: 'Harvest resources from nature. Blessed by Ailura for vitality.',
    pantheonGod: PantheonGod.AILURA,
    icon: '🌿',
    bonuses: [
      { description: 'Increased resource yield', value: 5, type: 'percentage' },
      { description: 'Health regeneration while gathering', value: 1, type: 'flat' }
    ]
  },
  {
    id: 'herbalism',
    name: 'Herbalism',
    description: 'Identify and use plants for healing and potions.',
    pantheonGod: PantheonGod.AILURA,
    icon: '🌱',
    bonuses: [
      { description: 'Potion effectiveness', value: 10, type: 'percentage' },
      { description: 'Rare herb discovery chance', value: 2, type: 'percentage' }
    ]
  },
  
  // Thalirion - Knowledge and Puzzles
  {
    id: 'arcane_lore',
    name: 'Arcane Lore',
    description: 'Understanding of magic and ancient knowledge.',
    pantheonGod: PantheonGod.THALIRION,
    icon: '📚',
    bonuses: [
      { description: 'Mana regeneration', value: 15, type: 'percentage' },
      { description: 'Magic damage', value: 8, type: 'percentage' }
    ]
  },
  {
    id: 'puzzle_solving',
    name: 'Puzzle Solving',
    description: 'Ability to decipher riddles and solve complex puzzles.',
    pantheonGod: PantheonGod.THALIRION,
    icon: '🧩',
    bonuses: [
      { description: 'Quest experience bonus', value: 20, type: 'percentage' },
      { description: 'Secret discovery chance', value: 5, type: 'percentage' }
    ]
  },
  
  // Korrath - Strength and Combat
  {
    id: 'melee_combat',
    name: 'Melee Combat',
    description: 'Mastery of close-quarters weapons and techniques.',
    pantheonGod: PantheonGod.KORRATH,
    icon: '⚔️',
    bonuses: [
      { description: 'Melee damage', value: 10, type: 'percentage' },
      { description: 'Critical strike chance', value: 2, type: 'percentage' }
    ]
  },
  {
    id: 'strength',
    name: 'Strength',
    description: 'Raw physical power and endurance.',
    pantheonGod: PantheonGod.KORRATH,
    icon: '💪',
    bonuses: [
      { description: 'Carry capacity', value: 20, type: 'percentage' },
      { description: 'Damage resistance', value: 5, type: 'percentage' }
    ]
  },
  
  // Sylvana - Nature and Crafting
  {
    id: 'woodworking',
    name: 'Woodworking',
    description: 'Craft items from wood and natural materials.',
    pantheonGod: PantheonGod.SYLVANA,
    icon: '🪓',
    bonuses: [
      { description: 'Crafting success rate', value: 15, type: 'percentage' },
      { description: 'Resource efficiency', value: 10, type: 'percentage' }
    ]
  },
  {
    id: 'nature_magic',
    name: 'Nature Magic',
    description: 'Channel the power of plants and animals.',
    pantheonGod: PantheonGod.SYLVANA,
    icon: '🍃',
    bonuses: [
      { description: 'Healing spell effectiveness', value: 25, type: 'percentage' },
      { description: 'Animal companion bond', value: 1, type: 'flat' }
    ]
  },
  
  // Nereon - Water and Fishing
  {
    id: 'fishing',
    name: 'Fishing',
    description: 'Catch fish and aquatic creatures from water sources.',
    pantheonGod: PantheonGod.NEREON,
    icon: '🎣',
    bonuses: [
      { description: 'Rare fish catch rate', value: 8, type: 'percentage' },
      { description: 'Fishing speed', value: 12, type: 'percentage' }
    ]
  },
  {
    id: 'swimming',
    name: 'Swimming',
    description: 'Navigate water with grace and explore underwater areas.',
    pantheonGod: PantheonGod.NEREON,
    icon: '🏊',
    bonuses: [
      { description: 'Underwater breath duration', value: 30, type: 'percentage' },
      { description: 'Water movement speed', value: 20, type: 'percentage' }
    ]
  },
  
  // Pyrion - Fire and Smithing
  {
    id: 'smithing',
    name: 'Smithing',
    description: 'Forge weapons and armor from metal and gems.',
    pantheonGod: PantheonGod.PYRION,
    icon: '🔨',
    bonuses: [
      { description: 'Weapon damage when crafted', value: 15, type: 'percentage' },
      { description: 'Smelting efficiency', value: 20, type: 'percentage' }
    ]
  },
  {
    id: 'fire_magic',
    name: 'Fire Magic',
    description: 'Wield flames for combat and utility.',
    pantheonGod: PantheonGod.PYRION,
    icon: '🔥',
    bonuses: [
      { description: 'Fire damage', value: 20, type: 'percentage' },
      { description: 'Fire resistance', value: 15, type: 'percentage' }
    ]
  },
  
  // Umbros - Shadow and Stealth
  {
    id: 'stealth',
    name: 'Stealth',
    description: 'Move unseen and strike from the shadows.',
    pantheonGod: PantheonGod.UMBROS,
    icon: '👤',
    bonuses: [
      { description: 'Sneak attack damage', value: 30, type: 'percentage' },
      { description: 'Detection avoidance', value: 25, type: 'percentage' }
    ]
  },
  {
    id: 'lockpicking',
    name: 'Lockpicking',
    description: 'Open locked doors and containers.',
    pantheonGod: PantheonGod.UMBROS,
    icon: '🗝️',
    bonuses: [
      { description: 'Lock success chance', value: 18, type: 'percentage' },
      { description: 'Trap detection', value: 12, type: 'percentage' }
    ]
  },
  
  // Luxara - Light and Healing
  {
    id: 'healing',
    name: 'Healing',
    description: 'Restore health to yourself and allies.',
    pantheonGod: PantheonGod.LUXARA,
    icon: '✨',
    bonuses: [
      { description: 'Healing effectiveness', value: 25, type: 'percentage' },
      { description: 'Mana cost reduction for healing', value: 15, type: 'percentage' }
    ]
  },
  {
    id: 'light_magic',
    name: 'Light Magic',
    description: 'Banish darkness and protect against evil.',
    pantheonGod: PantheonGod.LUXARA,
    icon: '💡',
    bonuses: [
      { description: 'Undead damage', value: 40, type: 'percentage' },
      { description: 'Light radius', value: 50, type: 'percentage' }
    ]
  }
];

// Calculate experience needed for next level
const calculateExperienceToNext = (level: number): number => {
  return Math.floor(100 * Math.pow(1.2, level - 1));
};

// Initialize skills with level 1 and 0 experience
const createInitialSkills = (): Skill[] => {
  return INITIAL_SKILLS.map(skillData => ({
    ...skillData,
    level: 1,
    experience: 0,
    experienceToNext: calculateExperienceToNext(1)
  }));
};

export const useSkills = create<SkillState>((set, get) => ({
  skills: [],
  totalLevel: 0,

  initializeSkills: () => {
    const skills = createInitialSkills();
    const totalLevel = skills.reduce((sum, skill) => sum + skill.level, 0);
    
    set({ skills, totalLevel });
    console.log('Skills initialized:', skills.length, 'skills, total level:', totalLevel);
  },

  gainSkillExperience: (skillId, amount) => {
    set((state) => {
      const skillIndex = state.skills.findIndex(skill => skill.id === skillId);
      if (skillIndex === -1) {
        console.warn(`Skill not found: ${skillId}`);
        return state;
      }

      const skills = [...state.skills];
      const skill = { ...skills[skillIndex] };
      
      skill.experience += amount;
      console.log(`${skill.name} gained ${amount} experience (${skill.experience}/${skill.experienceToNext})`);

      // Check for level up
      let leveledUp = false;
      while (skill.experience >= skill.experienceToNext) {
        skill.experience -= skill.experienceToNext;
        skill.level += 1;
        skill.experienceToNext = calculateExperienceToNext(skill.level);
        leveledUp = true;
        
        console.log(`🎉 ${skill.name} leveled up to ${skill.level}!`);
      }

      skills[skillIndex] = skill;
      const totalLevel = skills.reduce((sum, s) => sum + s.level, 0);

      return { skills, totalLevel };
    });
  },

  getSkill: (skillId) => {
    return get().skills.find(skill => skill.id === skillId);
  },

  getSkillsByPantheon: (god) => {
    return get().skills.filter(skill => skill.pantheonGod === god);
  },

  calculateTotalLevel: () => {
    const { skills } = get();
    return skills.reduce((sum, skill) => sum + skill.level, 0);
  },

  getSkillBonus: (skillId, bonusType) => {
    const skill = get().getSkill(skillId);
    if (!skill) return 0;

    // Calculate bonus based on skill level
    // Higher levels provide better bonuses
    const levelMultiplier = 1 + (skill.level - 1) * 0.1; // 10% increase per level
    
    const bonus = skill.bonuses.find(b => b.description.toLowerCase().includes(bonusType.toLowerCase()));
    if (bonus) {
      return bonus.value * levelMultiplier;
    }

    return 0;
  }
}));

// Initialize skills when the store is first used
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const { skills, initializeSkills } = useSkills.getState();
    if (skills.length === 0) {
      initializeSkills();
    }
  }, 100);
}
