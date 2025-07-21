import * as THREE from 'three';

// Player related types
export interface PlayerStats {
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  level: number;
  experience: number;
  experienceToNext: number;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  stats: PlayerStats;
  position: THREE.Vector3;
  rotation: number;
  isMoving: boolean;
  targetPosition?: THREE.Vector3;
  pantheonAttunement: PantheonGod;
  appearance: PlayerAppearance;
}

export interface PlayerAppearance {
  skinColor: string;
  hairColor: string;
  eyeColor: string;
  gender: 'male' | 'female';
  outfit: string;
}

// Pantheon system - Gods and attunements
export enum PantheonGod {
  AILURA = 'Ailura', // Vitality and gathering
  THALIRION = 'Thalirion', // Knowledge and puzzles
  KORRATH = 'Korrath', // Strength and combat
  SYLVANA = 'Sylvana', // Nature and crafting
  NEREON = 'Nereon', // Water and fishing
  PYRION = 'Pyrion', // Fire and smithing
  UMBROS = 'Umbros', // Shadow and stealth
  LUXARA = 'Luxara', // Light and healing
}

export interface PantheonAttunement {
  god: PantheonGod;
  level: number;
  experience: number;
  bonuses: string[];
}

// Inventory and items
export interface Item {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  rarity: ItemRarity;
  stackSize: number;
  value: number;
  icon?: string;
  properties?: ItemProperties;
}

export enum ItemType {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  CONSUMABLE = 'consumable',
  MATERIAL = 'material',
  TOOL = 'tool',
  QUEST = 'quest'
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary'
}

export interface ItemProperties {
  damage?: number;
  defense?: number;
  healing?: number;
  durability?: number;
  enchantments?: string[];
}

export interface InventorySlot {
  item: Item | null;
  quantity: number;
}

// Skills system
export interface Skill {
  id: string;
  name: string;
  description: string;
  level: number;
  experience: number;
  experienceToNext: number;
  pantheonGod: PantheonGod;
  icon: string;
  bonuses: SkillBonus[];
}

export interface SkillBonus {
  description: string;
  value: number;
  type: 'percentage' | 'flat';
}

// Crafting system
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  result: Item;
  resultQuantity: number;
  ingredients: CraftingIngredient[];
  skillRequired: string;
  levelRequired: number;
  craftingTime: number;
}

export interface CraftingIngredient {
  item: Item;
  quantity: number;
}

export interface CraftingSession {
  recipe: CraftingRecipe;
  progress: number;
  isActive: boolean;
  startTime: number;
}

// Quest system
export interface Quest {
  id: string;
  title: string;
  description: string;
  objectives: QuestObjective[];
  rewards: QuestReward[];
  status: QuestStatus;
  pantheonGod?: PantheonGod;
  isMainQuest: boolean;
  prerequisites?: string[];
}

export interface QuestObjective {
  id: string;
  description: string;
  type: ObjectiveType;
  target?: string;
  currentProgress: number;
  requiredProgress: number;
  isCompleted: boolean;
}

export enum ObjectiveType {
  KILL = 'kill',
  COLLECT = 'collect',
  CRAFT = 'craft',
  INTERACT = 'interact',
  REACH_LOCATION = 'reach_location',
  TALK_TO_NPC = 'talk_to_npc'
}

export enum QuestStatus {
  AVAILABLE = 'available',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TURNED_IN = 'turned_in'
}

export interface QuestReward {
  type: 'experience' | 'item' | 'gold' | 'skill_experience';
  value: number;
  item?: Item;
  skill?: string;
}

// Combat system
export interface Enemy {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  position: THREE.Vector3;
  type: EnemyType;
  lootTable: LootDrop[];
  experienceReward: number;
  isAlive: boolean;
  isAggressive: boolean;
  aggroRange: number;
  attackRange: number;
  moveSpeed: number;
}

export enum EnemyType {
  GOBLIN = 'goblin',
  ORC = 'orc',
  WOLF = 'wolf',
  BEAR = 'bear',
  SKELETON = 'skeleton',
  SPIDER = 'spider',
  BANDIT = 'bandit',
  ELEMENTAL = 'elemental'
}

export interface LootDrop {
  item: Item;
  quantity: number;
  dropChance: number;
}

export interface CombatAction {
  type: 'attack' | 'defend' | 'special';
  damage?: number;
  attacker: string;
  target: string;
  timestamp: number;
}

// World and environment
export interface Biome {
  type: BiomeType;
  temperature: number;
  humidity: number;
  resourceSpawns: ResourceSpawn[];
  enemySpawns: EnemySpawn[];
  season: Season;
}

export enum BiomeType {
  FOREST = 'forest',
  DESERT = 'desert',
  MOUNTAIN = 'mountain',
  PLAINS = 'plains',
  SWAMP = 'swamp',
  TUNDRA = 'tundra'
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  AUTUMN = 'autumn',
  WINTER = 'winter'
}

export interface ResourceSpawn {
  type: string;
  density: number;
  respawnTime: number;
  skillRequired?: string;
  levelRequired?: number;
}

export interface EnemySpawn {
  enemyType: EnemyType;
  level: number;
  spawnRate: number;
  maxCount: number;
}

// Multiplayer types
export interface MultiplayerSession {
  sessionId: string;
  hostId: string;
  players: PlayerCharacter[];
  maxPlayers: number;
  isPublic: boolean;
  worldSeed: number;
  gameTime: number;
}

export interface NetworkMessage {
  type: MessageType;
  senderId: string;
  timestamp: number;
  data: any;
}

export enum MessageType {
  PLAYER_MOVE = 'player_move',
  PLAYER_ACTION = 'player_action',
  CHAT_MESSAGE = 'chat_message',
  INVENTORY_UPDATE = 'inventory_update',
  COMBAT_ACTION = 'combat_action',
  QUEST_UPDATE = 'quest_update',
  WORLD_UPDATE = 'world_update'
}

// UI Types
export interface UIPanel {
  id: string;
  isOpen: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
}

export interface GameSettings {
  audioEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  graphics: GraphicsQuality;
  controls: ControlSettings;
  ui: UISettings;
}

export enum GraphicsQuality {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  ULTRA = 'ultra'
}

export interface ControlSettings {
  mouseSensitivity: number;
  invertY: boolean;
  keyBindings: { [key: string]: string };
}

export interface UISettings {
  scale: number;
  showMinimap: boolean;
  showHealthBars: boolean;
  showDamageNumbers: boolean;
}

// Pathfinding
export interface PathNode {
  x: number;
  z: number;
  walkable: boolean;
  gCost: number;
  hCost: number;
  fCost: number;
  parent?: PathNode;
}

export interface TerrainChunk {
  x: number;
  z: number;
  heightData: number[][];
  biome: Biome;
  resources: WorldResource[];
  enemies: Enemy[];
  isGenerated: boolean;
  needsUpdate: boolean;
}

export interface WorldResource {
  id: string;
  type: string;
  position: THREE.Vector3;
  remainingUses: number;
  maxUses: number;
  respawnTime: number;
  lastHarvestedTime: number;
  requiredTool?: string;
  skillRequired?: string;
  levelRequired?: number;
}
