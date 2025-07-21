export interface WorldState {
  sessionId: string;
  worldSeed: number;
  gameTime: number;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  dayLength: number;
  loadedChunks: Set<string>;
  resources: Map<string, WorldResource>;
  enemies: Map<string, WorldEnemy>;
  discoveredLocations: string[];
  weatherState: WeatherState;
  economyState: EconomyState;
  eventQueue: WorldEvent[];
  lastUpdate: number;
  playerCount: number;
}

export interface WorldResource {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  remainingUses: number;
  maxUses: number;
  respawnTime: number;
  lastHarvestedTime: number;
  harvestedBy?: string;
  chunkId: string;
  isRespawning: boolean;
}

export interface WorldEnemy {
  id: string;
  type: string;
  level: number;
  position: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  isAlive: boolean;
  spawnTime: number;
  lastActivity: number;
  chunkId: string;
  aggroTarget?: string;
  lootTable: LootDrop[];
  experienceReward: number;
}

export interface LootDrop {
  itemId: string;
  quantity: number;
  dropChance: number;
  rarity: string;
}

export interface WeatherState {
  type: 'clear' | 'rain' | 'storm' | 'snow' | 'fog';
  intensity: number;
  duration: number;
  startTime: number;
}

export interface EconomyState {
  marketPrices: Map<string, number>;
  resourceDemand: Map<string, number>;
  tradeVolume: Map<string, number>;
  inflationRate: number;
  lastMarketUpdate: number;
}

export interface WorldEvent {
  id: string;
  type: 'resource_respawn' | 'enemy_spawn' | 'weather_change' | 'market_fluctuation' | 'seasonal_change';
  scheduledTime: number;
  data: any;
  processed: boolean;
}

export class GameWorldService {
  private worldStates: Map<string, WorldState>;
  private readonly WORLD_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private readonly MAX_ENEMIES_PER_CHUNK = 5;
  private readonly RESOURCE_RESPAWN_MULTIPLIER = 1.5; // Faster respawn in multiplayer
  private readonly CHUNK_SIZE = 32;
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.worldStates = new Map();
    this.startWorldUpdateLoop();
    console.log("GameWorldService initialized");
  }

  // World state management
  createWorldState(sessionId: string, worldSeed: number, playerCount: number = 1): WorldState {
    const worldState: WorldState = {
      sessionId,
      worldSeed,
      gameTime: 0,
      season: 'spring',
      dayLength: 1200000, // 20 minutes in milliseconds
      loadedChunks: new Set(),
      resources: new Map(),
      enemies: new Map(),
      discoveredLocations: [],
      weatherState: {
        type: 'clear',
        intensity: 0,
        duration: 600000, // 10 minutes
        startTime: Date.now()
      },
      economyState: {
        marketPrices: new Map(),
        resourceDemand: new Map(),
        tradeVolume: new Map(),
        inflationRate: 1.0,
        lastMarketUpdate: Date.now()
      },
      eventQueue: [],
      lastUpdate: Date.now(),
      playerCount
    };

    // Initialize basic economy
    this.initializeEconomy(worldState);
    
    // Schedule initial events
    this.scheduleInitialEvents(worldState);

    this.worldStates.set(sessionId, worldState);
    console.log(`World state created for session: ${sessionId} with seed: ${worldSeed}`);
    
    return worldState;
  }

  getWorldState(sessionId: string): WorldState | null {
    return this.worldStates.get(sessionId) || null;
  }

  deleteWorldState(sessionId: string): boolean {
    const deleted = this.worldStates.delete(sessionId);
    if (deleted) {
      console.log(`World state deleted for session: ${sessionId}`);
    }
    return deleted;
  }

  updateWorldState(sessionId: string, updates: Partial<WorldState>): boolean {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) {
      console.warn(`World state not found for session: ${sessionId}`);
      return false;
    }

    // Apply updates
    Object.assign(worldState, updates);
    worldState.lastUpdate = Date.now();
    
    console.log(`World state updated for session: ${sessionId}`);
    return true;
  }

  // Resource management
  generateChunkResources(sessionId: string, chunkX: number, chunkZ: number): WorldResource[] {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return [];

    const chunkId = `${chunkX},${chunkZ}`;
    if (worldState.loadedChunks.has(chunkId)) {
      return this.getChunkResources(sessionId, chunkId);
    }

    const resources: WorldResource[] = [];
    const seed = worldState.worldSeed;
    
    // Generate resources based on world seed and chunk position
    const resourceDensity = this.calculateResourceDensity(chunkX, chunkZ, seed);
    const resourceCount = Math.floor(resourceDensity * (3 + Math.random() * 7));

    for (let i = 0; i < resourceCount; i++) {
      const resource = this.generateResource(sessionId, chunkX, chunkZ, chunkId, i, seed);
      resources.push(resource);
      worldState.resources.set(resource.id, resource);
    }

    worldState.loadedChunks.add(chunkId);
    console.log(`Generated ${resources.length} resources for chunk (${chunkX}, ${chunkZ}) in session ${sessionId}`);
    
    return resources;
  }

  harvestResource(sessionId: string, resourceId: string, playerId?: string): { success: boolean; item?: any; message?: string } {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) {
      return { success: false, message: "World state not found" };
    }

    const resource = worldState.resources.get(resourceId);
    if (!resource) {
      return { success: false, message: "Resource not found" };
    }

    if (resource.remainingUses <= 0) {
      return { success: false, message: "Resource is depleted" };
    }

    if (resource.isRespawning) {
      return { success: false, message: "Resource is respawning" };
    }

    // Harvest the resource
    resource.remainingUses--;
    resource.lastHarvestedTime = Date.now();
    resource.harvestedBy = playerId;

    // Determine harvested item based on resource type
    const harvestedItem = this.getResourceItem(resource.type);

    // Schedule respawn if depleted
    if (resource.remainingUses <= 0) {
      this.scheduleResourceRespawn(worldState, resourceId);
    }

    console.log(`Resource ${resourceId} harvested by ${playerId} in session ${sessionId}`);
    
    return { success: true, item: harvestedItem };
  }

  private scheduleResourceRespawn(worldState: WorldState, resourceId: string): void {
    const resource = worldState.resources.get(resourceId);
    if (!resource) return;

    resource.isRespawning = true;
    
    // Faster respawn in multiplayer
    const respawnTime = resource.respawnTime / (worldState.playerCount * this.RESOURCE_RESPAWN_MULTIPLIER);
    
    const respawnEvent: WorldEvent = {
      id: `respawn_${resourceId}`,
      type: 'resource_respawn',
      scheduledTime: Date.now() + respawnTime,
      data: { resourceId },
      processed: false
    };

    worldState.eventQueue.push(respawnEvent);
  }

  // Enemy management
  generateChunkEnemies(sessionId: string, chunkX: number, chunkZ: number): WorldEnemy[] {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return [];

    const chunkId = `${chunkX},${chunkZ}`;
    const existingEnemies = this.getChunkEnemies(sessionId, chunkId);
    
    // Don't over-spawn enemies
    if (existingEnemies.length >= this.MAX_ENEMIES_PER_CHUNK) {
      return existingEnemies;
    }

    const enemies: WorldEnemy[] = [...existingEnemies];
    const seed = worldState.worldSeed;
    const spawnCount = Math.min(
      this.MAX_ENEMIES_PER_CHUNK - existingEnemies.length,
      1 + Math.floor(Math.random() * 3)
    );

    for (let i = 0; i < spawnCount; i++) {
      const enemy = this.generateEnemy(sessionId, chunkX, chunkZ, chunkId, seed);
      enemies.push(enemy);
      worldState.enemies.set(enemy.id, enemy);
    }

    console.log(`Generated ${spawnCount} enemies for chunk (${chunkX}, ${chunkZ}) in session ${sessionId}`);
    return enemies;
  }

  removeEnemy(sessionId: string, enemyId: string): boolean {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return false;

    const enemy = worldState.enemies.get(enemyId);
    if (!enemy) return false;

    enemy.isAlive = false;
    enemy.health = 0;

    // Schedule enemy removal after loot timeout
    setTimeout(() => {
      worldState.enemies.delete(enemyId);
    }, 30000); // 30 seconds to collect loot

    console.log(`Enemy ${enemyId} removed from session ${sessionId}`);
    return true;
  }

  updateEnemyState(sessionId: string, enemyId: string, updates: Partial<WorldEnemy>): boolean {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return false;

    const enemy = worldState.enemies.get(enemyId);
    if (!enemy) return false;

    Object.assign(enemy, updates);
    enemy.lastActivity = Date.now();

    return true;
  }

  // Time and season management
  updateGameTime(sessionId: string, deltaTime: number): void {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return;

    worldState.gameTime += deltaTime;
    
    // Check for seasonal changes
    const daysPassed = Math.floor(worldState.gameTime / worldState.dayLength);
    const seasonIndex = Math.floor(daysPassed / 30) % 4;
    const seasons: Array<'spring' | 'summer' | 'autumn' | 'winter'> = ['spring', 'summer', 'autumn', 'winter'];
    const newSeason = seasons[seasonIndex];
    
    if (newSeason !== worldState.season) {
      this.changeSeason(worldState, newSeason);
    }
  }

  private changeSeason(worldState: WorldState, newSeason: 'spring' | 'summer' | 'autumn' | 'winter'): void {
    worldState.season = newSeason;
    
    // Schedule seasonal events
    const seasonalEvent: WorldEvent = {
      id: `season_${Date.now()}`,
      type: 'seasonal_change',
      scheduledTime: Date.now(),
      data: { newSeason, previousSeason: worldState.season },
      processed: false
    };
    
    worldState.eventQueue.push(seasonalEvent);
    
    console.log(`Season changed to ${newSeason} in session ${worldState.sessionId}`);
  }

  // Weather system
  updateWeather(sessionId: string): void {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return;

    const now = Date.now();
    const weather = worldState.weatherState;
    
    // Check if weather should change
    if (now - weather.startTime > weather.duration) {
      const newWeatherType = this.generateWeatherType(worldState.season);
      const newDuration = 300000 + Math.random() * 900000; // 5-20 minutes
      const newIntensity = Math.random();
      
      worldState.weatherState = {
        type: newWeatherType,
        intensity: newIntensity,
        duration: newDuration,
        startTime: now
      };
      
      const weatherEvent: WorldEvent = {
        id: `weather_${now}`,
        type: 'weather_change',
        scheduledTime: now,
        data: { weatherType: newWeatherType, intensity: newIntensity },
        processed: false
      };
      
      worldState.eventQueue.push(weatherEvent);
      
      console.log(`Weather changed to ${newWeatherType} in session ${sessionId}`);
    }
  }

  private generateWeatherType(season: string): 'clear' | 'rain' | 'storm' | 'snow' | 'fog' {
    const seasonalWeather = {
      spring: ['clear', 'rain', 'fog'],
      summer: ['clear', 'storm', 'rain'],
      autumn: ['clear', 'rain', 'fog'],
      winter: ['clear', 'snow', 'fog']
    };
    
    const possibleWeather = seasonalWeather[season] || ['clear'];
    return possibleWeather[Math.floor(Math.random() * possibleWeather.length)] as any;
  }

  // Economy system
  private initializeEconomy(worldState: WorldState): void {
    const baseItems = [
      'wood', 'stone', 'iron_ore', 'health_potion', 'mana_potion',
      'leather', 'healing_herb', 'mana_herb', 'water'
    ];

    baseItems.forEach(item => {
      const basePrice = this.getBaseItemPrice(item);
      worldState.economyState.marketPrices.set(item, basePrice);
      worldState.economyState.resourceDemand.set(item, 1.0);
      worldState.economyState.tradeVolume.set(item, 0);
    });
  }

  updateEconomy(sessionId: string): void {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return;

    const now = Date.now();
    const timeSinceLastUpdate = now - worldState.economyState.lastMarketUpdate;
    
    // Update economy every 10 minutes
    if (timeSinceLastUpdate < 600000) return;

    // Fluctuate prices based on supply and demand
    for (const [item, currentPrice] of worldState.economyState.marketPrices.entries()) {
      const demand = worldState.economyState.resourceDemand.get(item) || 1.0;
      const tradeVolume = worldState.economyState.tradeVolume.get(item) || 0;
      
      // Calculate price fluctuation
      const demandFactor = 0.8 + (demand * 0.4); // 0.8 to 1.2
      const volumeFactor = Math.min(1.2, 1 + (tradeVolume * 0.01)); // Up to 20% increase
      const randomFactor = 0.95 + (Math.random() * 0.1); // ±5% random
      
      const newPrice = Math.max(1, currentPrice * demandFactor * volumeFactor * randomFactor);
      worldState.economyState.marketPrices.set(item, newPrice);
      
      // Reset trade volume
      worldState.economyState.tradeVolume.set(item, 0);
    }

    worldState.economyState.lastMarketUpdate = now;
    
    const marketEvent: WorldEvent = {
      id: `market_${now}`,
      type: 'market_fluctuation',
      scheduledTime: now,
      data: { prices: Array.from(worldState.economyState.marketPrices.entries()) },
      processed: false
    };
    
    worldState.eventQueue.push(marketEvent);
  }

  // Event processing
  processWorldEvents(sessionId: string): WorldEvent[] {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return [];

    const now = Date.now();
    const processedEvents: WorldEvent[] = [];
    
    worldState.eventQueue = worldState.eventQueue.filter(event => {
      if (event.processed || event.scheduledTime > now) {
        return true; // Keep unprocessed future events
      }
      
      // Process the event
      this.processWorldEvent(worldState, event);
      event.processed = true;
      processedEvents.push(event);
      
      return false; // Remove processed events
    });
    
    return processedEvents;
  }

  private processWorldEvent(worldState: WorldState, event: WorldEvent): void {
    switch (event.type) {
      case 'resource_respawn':
        this.processResourceRespawn(worldState, event.data.resourceId);
        break;
        
      case 'enemy_spawn':
        this.processEnemySpawn(worldState, event.data);
        break;
        
      case 'weather_change':
        // Weather changes are handled in updateWeather
        break;
        
      case 'market_fluctuation':
        // Market changes are handled in updateEconomy
        break;
        
      case 'seasonal_change':
        this.processSeasonalChange(worldState, event.data);
        break;
    }
  }

  private processResourceRespawn(worldState: WorldState, resourceId: string): void {
    const resource = worldState.resources.get(resourceId);
    if (!resource) return;

    resource.remainingUses = resource.maxUses;
    resource.isRespawning = false;
    resource.lastHarvestedTime = 0;
    resource.harvestedBy = undefined;
    
    console.log(`Resource ${resourceId} respawned in session ${worldState.sessionId}`);
  }

  private processSeasonalChange(worldState: WorldState, data: any): void {
    // Update resource spawn rates based on season
    for (const resource of worldState.resources.values()) {
      resource.respawnTime = this.calculateSeasonalRespawnTime(resource.type, worldState.season);
    }
    
    // Spawn seasonal enemies
    this.spawnSeasonalEnemies(worldState);
  }

  // World maintenance and cleanup
  cleanupOldWorldStates(): void {
    const now = Date.now();
    const statesToDelete: string[] = [];
    
    for (const [sessionId, worldState] of this.worldStates.entries()) {
      if (now - worldState.lastUpdate > this.WORLD_CLEANUP_INTERVAL) {
        statesToDelete.push(sessionId);
      }
    }
    
    statesToDelete.forEach(sessionId => {
      this.deleteWorldState(sessionId);
    });
    
    if (statesToDelete.length > 0) {
      console.log(`Cleaned up ${statesToDelete.length} old world states`);
    }
  }

  private startWorldUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      for (const [sessionId, worldState] of this.worldStates.entries()) {
        this.updateGameTime(sessionId, 1000); // 1 second tick
        this.updateWeather(sessionId);
        this.updateEconomy(sessionId);
        this.processWorldEvents(sessionId);
      }
    }, 1000); // Update every second
  }

  // Utility methods
  isActive(): boolean {
    return this.worldStates.size > 0;
  }

  getCurrentWorldSeed(): number {
    const worldStates = Array.from(this.worldStates.values());
    return worldStates.length > 0 ? worldStates[0].worldSeed : 0;
  }

  getActiveWorldCount(): number {
    return this.worldStates.size;
  }

  // Private helper methods
  private calculateResourceDensity(chunkX: number, chunkZ: number, seed: number): number {
    // Simple noise function for resource density
    const x = chunkX * 0.1 + seed * 0.001;
    const z = chunkZ * 0.1 + seed * 0.001;
    return 0.3 + 0.7 * Math.abs(Math.sin(x) * Math.cos(z));
  }

  private generateResource(sessionId: string, chunkX: number, chunkZ: number, chunkId: string, index: number, seed: number): WorldResource {
    const localX = (Math.sin(seed + chunkX * 10 + index) + 1) * 0.5 * this.CHUNK_SIZE;
    const localZ = (Math.cos(seed + chunkZ * 10 + index) + 1) * 0.5 * this.CHUNK_SIZE;
    
    const worldX = chunkX * this.CHUNK_SIZE + localX;
    const worldZ = chunkZ * this.CHUNK_SIZE + localZ;
    
    const resourceTypes = ['wood', 'stone', 'iron_ore', 'healing_herb'];
    const resourceType = resourceTypes[Math.floor(Math.abs(Math.sin(seed + worldX + worldZ)) * resourceTypes.length)];
    
    return {
      id: `resource_${sessionId}_${chunkX}_${chunkZ}_${index}`,
      type: resourceType,
      position: { x: worldX, y: 0, z: worldZ },
      remainingUses: this.getResourceMaxUses(resourceType),
      maxUses: this.getResourceMaxUses(resourceType),
      respawnTime: this.getResourceRespawnTime(resourceType),
      lastHarvestedTime: 0,
      chunkId,
      isRespawning: false
    };
  }

  private generateEnemy(sessionId: string, chunkX: number, chunkZ: number, chunkId: string, seed: number): WorldEnemy {
    const localX = Math.random() * this.CHUNK_SIZE;
    const localZ = Math.random() * this.CHUNK_SIZE;
    
    const worldX = chunkX * this.CHUNK_SIZE + localX;
    const worldZ = chunkZ * this.CHUNK_SIZE + localZ;
    
    const enemyTypes = ['goblin', 'wolf', 'orc'];
    const enemyType = enemyTypes[Math.floor(Math.abs(Math.sin(seed + worldX + worldZ)) * enemyTypes.length)];
    const level = 1 + Math.floor(Math.random() * 5);
    const maxHealth = 30 * level;
    
    return {
      id: `enemy_${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: enemyType,
      level,
      position: { x: worldX, y: 0, z: worldZ },
      health: maxHealth,
      maxHealth,
      isAlive: true,
      spawnTime: Date.now(),
      lastActivity: Date.now(),
      chunkId,
      lootTable: this.generateLootTable(enemyType, level),
      experienceReward: level * 25
    };
  }

  private getChunkResources(sessionId: string, chunkId: string): WorldResource[] {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return [];
    
    return Array.from(worldState.resources.values()).filter(resource => resource.chunkId === chunkId);
  }

  private getChunkEnemies(sessionId: string, chunkId: string): WorldEnemy[] {
    const worldState = this.worldStates.get(sessionId);
    if (!worldState) return [];
    
    return Array.from(worldState.enemies.values()).filter(enemy => enemy.chunkId === chunkId && enemy.isAlive);
  }

  private getResourceMaxUses(type: string): number {
    const useCounts = {
      wood: 3,
      stone: 5,
      iron_ore: 2,
      healing_herb: 1
    };
    return useCounts[type] || 1;
  }

  private getResourceRespawnTime(type: string): number {
    const respawnTimes = {
      wood: 30000, // 30 seconds
      stone: 60000, // 1 minute
      iron_ore: 120000, // 2 minutes
      healing_herb: 45000 // 45 seconds
    };
    return respawnTimes[type] || 60000;
  }

  private calculateSeasonalRespawnTime(type: string, season: string): number {
    const baseTime = this.getResourceRespawnTime(type);
    const seasonalMultipliers = {
      spring: { wood: 0.8, healing_herb: 0.7 },
      summer: { healing_herb: 0.6, stone: 1.1 },
      autumn: { wood: 0.9, iron_ore: 0.9 },
      winter: { wood: 1.2, healing_herb: 1.5 }
    };
    
    const multiplier = seasonalMultipliers[season]?.[type] || 1.0;
    return baseTime * multiplier;
  }

  private getResourceItem(type: string): any {
    const items = {
      wood: { id: 'wood', name: 'Wood', quantity: 1 },
      stone: { id: 'stone', name: 'Stone', quantity: 1 },
      iron_ore: { id: 'iron_ore', name: 'Iron Ore', quantity: 1 },
      healing_herb: { id: 'healing_herb', name: 'Healing Herb', quantity: 1 }
    };
    return items[type] || { id: type, name: type, quantity: 1 };
  }

  private getBaseItemPrice(item: string): number {
    const prices = {
      wood: 2,
      stone: 1,
      iron_ore: 5,
      health_potion: 25,
      mana_potion: 20,
      leather: 3,
      healing_herb: 2,
      mana_herb: 4,
      water: 1
    };
    return prices[item] || 1;
  }

  private generateLootTable(enemyType: string, level: number): LootDrop[] {
    const baseLoot = {
      goblin: [
        { itemId: 'wood', quantity: 1, dropChance: 0.3, rarity: 'common' },
        { itemId: 'stone', quantity: 1, dropChance: 0.2, rarity: 'common' }
      ],
      wolf: [
        { itemId: 'meat', quantity: 2, dropChance: 0.8, rarity: 'common' },
        { itemId: 'pelt', quantity: 1, dropChance: 0.4, rarity: 'common' }
      ],
      orc: [
        { itemId: 'iron_ore', quantity: 1, dropChance: 0.4, rarity: 'uncommon' },
        { itemId: 'weapon_parts', quantity: 1, dropChance: 0.3, rarity: 'uncommon' }
      ]
    };
    
    return baseLoot[enemyType] || [];
  }

  private scheduleInitialEvents(worldState: WorldState): void {
    // Schedule first weather change
    const weatherEvent: WorldEvent = {
      id: `initial_weather_${worldState.sessionId}`,
      type: 'weather_change',
      scheduledTime: Date.now() + 300000 + Math.random() * 600000, // 5-15 minutes
      data: {},
      processed: false
    };
    
    worldState.eventQueue.push(weatherEvent);
  }

  private spawnSeasonalEnemies(worldState: WorldState): void {
    // This could spawn special seasonal enemies
    console.log(`Spawning seasonal enemies for ${worldState.season} in session ${worldState.sessionId}`);
  }

  // Cleanup on service destruction
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.worldStates.clear();
    console.log("GameWorldService destroyed");
  }
}
