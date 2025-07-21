import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import * as THREE from 'three';
import { TerrainChunk, Biome, BiomeType, Season, Enemy, WorldResource, EnemyType } from '../types/GameTypes';
import { TerrainGenerator } from '../utils/TerrainGenerator';

interface WorldState {
  chunks: Map<string, TerrainChunk>;
  loadedChunks: Set<string>;
  currentBiome: Biome;
  currentSeason: Season;
  worldSeed: number;
  gameTime: number;
  dayLength: number; // in seconds
  enemies: Enemy[];
  resources: WorldResource[];
  terrainGenerator: TerrainGenerator;
  
  // Actions
  initializeWorld: (seed?: number) => void;
  generateChunk: (chunkX: number, chunkZ: number) => TerrainChunk;
  loadChunk: (chunkX: number, chunkZ: number) => void;
  unloadChunk: (chunkX: number, chunkZ: number) => void;
  updateGameTime: (deltaTime: number) => void;
  spawnEnemy: (type: EnemyType, position: THREE.Vector3) => Enemy;
  removeEnemy: (enemyId: string) => void;
  updateEnemy: (enemyId: string, updates: Partial<Enemy>) => void;
  harvestResource: (resourceId: string) => any | null;
  updateSeason: () => void;
  getChunkKey: (x: number, z: number) => string;
  getChunkAtPosition: (position: THREE.Vector3) => TerrainChunk | null;
  getHeightAtPosition: (x: number, z: number) => number;
  getNearbyEnemies: (position: THREE.Vector3, radius: number) => Enemy[];
  getNearbyResources: (position: THREE.Vector3, radius: number) => WorldResource[];
}

const CHUNK_SIZE = 32;
const WORLD_HEIGHT = 100;
const RENDER_DISTANCE = 3; // chunks

// Default biome configuration
const createDefaultBiome = (season: Season): Biome => ({
  type: BiomeType.FOREST,
  temperature: season === Season.SUMMER ? 0.7 : season === Season.WINTER ? 0.2 : 0.5,
  humidity: 0.6,
  season,
  resourceSpawns: [
    { type: 'wood', density: 0.3, respawnTime: 30000 },
    { type: 'stone', density: 0.2, respawnTime: 60000 },
    { type: 'iron_ore', density: 0.1, respawnTime: 120000, skillRequired: 'mining', levelRequired: 5 }
  ],
  enemySpawns: [
    { enemyType: EnemyType.GOBLIN, level: 1, spawnRate: 0.1, maxCount: 5 },
    { enemyType: EnemyType.WOLF, level: 2, spawnRate: 0.05, maxCount: 3 }
  ]
});

export const useWorld = create<WorldState>()(
  subscribeWithSelector((set, get) => ({
    chunks: new Map(),
    loadedChunks: new Set(),
    currentBiome: createDefaultBiome(Season.SPRING),
    currentSeason: Season.SPRING,
    worldSeed: Math.floor(Math.random() * 1000000),
    gameTime: 0,
    dayLength: 1200, // 20 minutes per day
    enemies: [],
    resources: [],
    terrainGenerator: new TerrainGenerator(),

    initializeWorld: (seed) => {
      const worldSeed = seed || Math.floor(Math.random() * 1000000);
      const terrainGenerator = new TerrainGenerator(worldSeed);
      const currentBiome = createDefaultBiome(Season.SPRING);
      
      set({
        worldSeed,
        terrainGenerator,
        currentBiome,
        gameTime: 0,
        chunks: new Map(),
        loadedChunks: new Set(),
        enemies: [],
        resources: []
      });
      
      console.log(`World initialized with seed: ${worldSeed}`);
      
      // Load initial chunks around spawn
      const { loadChunk } = get();
      for (let x = -1; x <= 1; x++) {
        for (let z = -1; z <= 1; z++) {
          loadChunk(x, z);
        }
      }
    },

    generateChunk: (chunkX, chunkZ) => {
      const { terrainGenerator, currentBiome, worldSeed } = get();
      
      // Generate height data
      const heightData = terrainGenerator.generateHeightMap(
        chunkX * CHUNK_SIZE,
        chunkZ * CHUNK_SIZE,
        CHUNK_SIZE,
        CHUNK_SIZE
      );
      
      // Generate resources
      const resources: WorldResource[] = [];
      currentBiome.resourceSpawns.forEach(spawn => {
        for (let i = 0; i < CHUNK_SIZE; i++) {
          for (let j = 0; j < CHUNK_SIZE; j++) {
            if (Math.random() < spawn.density) {
              const worldX = chunkX * CHUNK_SIZE + i;
              const worldZ = chunkZ * CHUNK_SIZE + j;
              const height = heightData[i][j];
              
              resources.push({
                id: `${spawn.type}_${worldX}_${worldZ}`,
                type: spawn.type,
                position: new THREE.Vector3(worldX, height, worldZ),
                remainingUses: getResourceMaxUses(spawn.type),
                maxUses: getResourceMaxUses(spawn.type),
                respawnTime: spawn.respawnTime,
                lastHarvestedTime: 0,
                requiredTool: getRequiredTool(spawn.type),
                skillRequired: spawn.skillRequired,
                levelRequired: spawn.levelRequired
              });
            }
          }
        }
      });
      
      // Generate enemies
      const enemies: Enemy[] = [];
      currentBiome.enemySpawns.forEach(spawn => {
        const spawnCount = Math.floor(Math.random() * spawn.maxCount * spawn.spawnRate);
        for (let i = 0; i < spawnCount; i++) {
          const x = chunkX * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
          const z = chunkZ * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
          const height = terrainGenerator.getHeightAtPoint(x, z);
          
          enemies.push(createEnemy(spawn.enemyType, spawn.level, new THREE.Vector3(x, height, z)));
        }
      });
      
      const chunk: TerrainChunk = {
        x: chunkX,
        z: chunkZ,
        heightData,
        biome: currentBiome,
        resources,
        enemies,
        isGenerated: true,
        needsUpdate: false
      };
      
      return chunk;
    },

    loadChunk: (chunkX, chunkZ) => {
      const { chunks, loadedChunks, generateChunk, getChunkKey } = get();
      const key = getChunkKey(chunkX, chunkZ);
      
      if (loadedChunks.has(key)) return;
      
      let chunk = chunks.get(key);
      if (!chunk) {
        chunk = generateChunk(chunkX, chunkZ);
        chunks.set(key, chunk);
      }
      
      loadedChunks.add(key);
      
      // Add chunk resources and enemies to world arrays
      set((state) => ({
        resources: [...state.resources, ...chunk.resources],
        enemies: [...state.enemies, ...chunk.enemies],
        loadedChunks: new Set(state.loadedChunks).add(key)
      }));
      
      console.log(`Loaded chunk: (${chunkX}, ${chunkZ})`);
    },

    unloadChunk: (chunkX, chunkZ) => {
      const { loadedChunks, getChunkKey } = get();
      const key = getChunkKey(chunkX, chunkZ);
      
      if (!loadedChunks.has(key)) return;
      
      // Remove chunk resources and enemies from world arrays
      set((state) => {
        const minX = chunkX * CHUNK_SIZE;
        const maxX = (chunkX + 1) * CHUNK_SIZE;
        const minZ = chunkZ * CHUNK_SIZE;
        const maxZ = (chunkZ + 1) * CHUNK_SIZE;
        
        const filteredResources = state.resources.filter(resource => {
          const pos = resource.position;
          return !(pos.x >= minX && pos.x < maxX && pos.z >= minZ && pos.z < maxZ);
        });
        
        const filteredEnemies = state.enemies.filter(enemy => {
          const pos = enemy.position;
          return !(pos.x >= minX && pos.x < maxX && pos.z >= minZ && pos.z < maxZ);
        });
        
        const newLoadedChunks = new Set(state.loadedChunks);
        newLoadedChunks.delete(key);
        
        return {
          resources: filteredResources,
          enemies: filteredEnemies,
          loadedChunks: newLoadedChunks
        };
      });
      
      console.log(`Unloaded chunk: (${chunkX}, ${chunkZ})`);
    },

    updateGameTime: (deltaTime) => {
      set((state) => {
        const newGameTime = state.gameTime + deltaTime;
        
        // Check if we need to update the season
        const daysPassed = Math.floor(newGameTime / state.dayLength);
        const seasonIndex = Math.floor(daysPassed / 30) % 4; // 30 days per season
        const seasons = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];
        const newSeason = seasons[seasonIndex];
        
        if (newSeason !== state.currentSeason) {
          console.log(`Season changed to: ${newSeason}`);
          return {
            gameTime: newGameTime,
            currentSeason: newSeason,
            currentBiome: createDefaultBiome(newSeason)
          };
        }
        
        return { gameTime: newGameTime };
      });
    },

    spawnEnemy: (type, position) => {
      const enemy = createEnemy(type, 1, position);
      
      set((state) => ({
        enemies: [...state.enemies, enemy]
      }));
      
      console.log(`Spawned ${type} at position:`, position);
      return enemy;
    },

    removeEnemy: (enemyId) => {
      set((state) => ({
        enemies: state.enemies.filter(enemy => enemy.id !== enemyId)
      }));
      
      console.log(`Removed enemy: ${enemyId}`);
    },

    updateEnemy: (enemyId, updates) => {
      set((state) => ({
        enemies: state.enemies.map(enemy =>
          enemy.id === enemyId ? { ...enemy, ...updates } : enemy
        )
      }));
    },

    harvestResource: (resourceId) => {
      const { resources } = get();
      const resource = resources.find(r => r.id === resourceId);
      
      if (!resource || resource.remainingUses <= 0) {
        return null;
      }
      
      const harvestedItem = getResourceItem(resource.type);
      
      set((state) => ({
        resources: state.resources.map(r =>
          r.id === resourceId
            ? {
                ...r,
                remainingUses: r.remainingUses - 1,
                lastHarvestedTime: Date.now()
              }
            : r
        )
      }));
      
      console.log(`Harvested ${harvestedItem.name} from ${resource.type}`);
      return harvestedItem;
    },

    updateSeason: () => {
      const { currentSeason } = get();
      const seasons = [Season.SPRING, Season.SUMMER, Season.AUTUMN, Season.WINTER];
      const currentIndex = seasons.indexOf(currentSeason);
      const nextSeason = seasons[(currentIndex + 1) % 4];
      
      set({
        currentSeason: nextSeason,
        currentBiome: createDefaultBiome(nextSeason)
      });
      
      console.log(`Season updated to: ${nextSeason}`);
    },

    getChunkKey: (x, z) => `${x},${z}`,

    getChunkAtPosition: (position) => {
      const chunkX = Math.floor(position.x / CHUNK_SIZE);
      const chunkZ = Math.floor(position.z / CHUNK_SIZE);
      const key = get().getChunkKey(chunkX, chunkZ);
      
      return get().chunks.get(key) || null;
    },

    getHeightAtPosition: (x, z) => {
      return get().terrainGenerator.getHeightAtPoint(x, z);
    },

    getNearbyEnemies: (position, radius) => {
      return get().enemies.filter(enemy => {
        const distance = position.distanceTo(enemy.position);
        return distance <= radius && enemy.isAlive;
      });
    },

    getNearbyResources: (position, radius) => {
      return get().resources.filter(resource => {
        const distance = position.distanceTo(resource.position);
        return distance <= radius && resource.remainingUses > 0;
      });
    }
  }))
);

// Helper functions
function getResourceMaxUses(type: string): number {
  switch (type) {
    case 'wood': return 3;
    case 'stone': return 5;
    case 'iron_ore': return 2;
    default: return 1;
  }
}

function getRequiredTool(type: string): string | undefined {
  switch (type) {
    case 'wood': return 'axe';
    case 'stone': return undefined; // Can be gathered by hand
    case 'iron_ore': return 'pickaxe';
    default: return undefined;
  }
}

function getResourceItem(type: string): any {
  // This would return the appropriate item from the inventory system
  return {
    id: type,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    type: 'material'
  };
}

function createEnemy(type: EnemyType, level: number, position: THREE.Vector3): Enemy {
  const baseStats = getEnemyBaseStats(type);
  
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: type.charAt(0).toUpperCase() + type.slice(1),
    level,
    health: baseStats.health * level,
    maxHealth: baseStats.health * level,
    damage: baseStats.damage * level,
    defense: baseStats.defense * level,
    position: position.clone(),
    type,
    lootTable: baseStats.lootTable,
    experienceReward: baseStats.experience * level,
    isAlive: true,
    isAggressive: baseStats.isAggressive,
    aggroRange: baseStats.aggroRange,
    attackRange: baseStats.attackRange,
    moveSpeed: baseStats.moveSpeed
  };
}

function getEnemyBaseStats(type: EnemyType) {
  const stats = {
    [EnemyType.GOBLIN]: {
      health: 30,
      damage: 8,
      defense: 2,
      experience: 25,
      isAggressive: true,
      aggroRange: 8,
      attackRange: 2,
      moveSpeed: 2,
      lootTable: [
        { item: { id: 'wood', name: 'Wood' }, quantity: 1, dropChance: 0.3 },
        { item: { id: 'stone', name: 'Stone' }, quantity: 1, dropChance: 0.2 }
      ]
    },
    [EnemyType.WOLF]: {
      health: 45,
      damage: 12,
      defense: 1,
      experience: 35,
      isAggressive: true,
      aggroRange: 12,
      attackRange: 2,
      moveSpeed: 4,
      lootTable: [
        { item: { id: 'meat', name: 'Meat' }, quantity: 2, dropChance: 0.8 }
      ]
    },
    [EnemyType.ORC]: {
      health: 80,
      damage: 20,
      defense: 5,
      experience: 60,
      isAggressive: true,
      aggroRange: 10,
      attackRange: 3,
      moveSpeed: 2.5,
      lootTable: [
        { item: { id: 'iron_ore', name: 'Iron Ore' }, quantity: 1, dropChance: 0.4 }
      ]
    }
  };
  
  return stats[type] || stats[EnemyType.GOBLIN];
}

// Auto-initialize world
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const { chunks, initializeWorld } = useWorld.getState();
    if (chunks.size === 0) {
      initializeWorld();
    }
  }, 300);
}
