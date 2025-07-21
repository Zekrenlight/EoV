import { PlayerCharacter, InventorySlot, Skill, Quest } from '../types/GameTypes';
import * as THREE from 'three';

export interface SaveData {
  version: string;
  timestamp: number;
  player: SerializablePlayer;
  inventory: InventorySlot[];
  skills: Skill[];
  quests: Quest[];
  world: WorldSaveData;
  settings: GameSettings;
  statistics: GameStatistics;
}

interface SerializablePlayer {
  id: string;
  name: string;
  stats: any;
  position: { x: number; y: number; z: number };
  rotation: number;
  isMoving: boolean;
  pantheonAttunement: string;
  appearance: any;
  playtime: number;
  level: number;
}

interface WorldSaveData {
  seed: number;
  exploredChunks: string[];
  harvestedResources: string[];
  defeatedEnemies: string[];
  discoveredLocations: string[];
  worldTime: number;
  season: string;
}

interface GameSettings {
  audioEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  graphics: string;
  autoSave: boolean;
  autoSaveInterval: number;
}

interface GameStatistics {
  totalPlaytime: number;
  distanceTraveled: number;
  enemiesDefeated: number;
  itemsCrafted: number;
  resourcesGathered: number;
  questsCompleted: number;
  skillLevelsGained: number;
  sessionsPlayed: number;
  firstPlayDate: number;
  lastPlayDate: number;
}

export class SaveSystem {
  private static readonly SAVE_VERSION = '1.0.0';
  private static readonly SAVE_KEY = 'valtara_save';
  private static readonly BACKUP_KEY = 'valtara_save_backup';
  private static readonly SETTINGS_KEY = 'valtara_settings';
  private static readonly STATISTICS_KEY = 'valtara_statistics';
  private static readonly MAX_SAVE_SLOTS = 5;
  
  private static compressionEnabled = true;
  private static autoSaveInterval: number | null = null;

  // Main save operations
  static saveGame(
    player: PlayerCharacter,
    inventory: InventorySlot[],
    skills: Skill[],
    quests: Quest[],
    worldData: Partial<WorldSaveData> = {},
    slotName: string = 'default'
  ): boolean {
    try {
      const saveData: SaveData = {
        version: this.SAVE_VERSION,
        timestamp: Date.now(),
        player: this.serializePlayer(player),
        inventory: this.serializeInventory(inventory),
        skills: this.serializeSkills(skills),
        quests: this.serializeQuests(quests),
        world: this.serializeWorldData(worldData),
        settings: this.loadSettings(),
        statistics: this.updateStatistics()
      };

      // Validate save data before saving
      if (!this.validateSaveData(saveData)) {
        console.error('Save data validation failed');
        return false;
      }

      // Create backup of current save
      this.createBackup(slotName);

      // Compress and save
      const serializedData = this.compressionEnabled 
        ? this.compressData(JSON.stringify(saveData))
        : JSON.stringify(saveData);

      localStorage.setItem(`${this.SAVE_KEY}_${slotName}`, serializedData);
      
      // Update save metadata
      this.updateSaveMetadata(slotName, saveData);
      
      console.log(`Game saved successfully to slot: ${slotName}`);
      console.log(`Save size: ${this.formatBytes(serializedData.length)}`);
      
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  static loadGame(slotName: string = 'default'): SaveData | null {
    try {
      const savedData = localStorage.getItem(`${this.SAVE_KEY}_${slotName}`);
      if (!savedData) {
        console.log(`No save data found for slot: ${slotName}`);
        return null;
      }

      // Decompress if needed
      const jsonData = this.compressionEnabled 
        ? this.decompressData(savedData)
        : savedData;

      const saveData: SaveData = JSON.parse(jsonData);

      // Validate loaded data
      if (!this.validateSaveData(saveData)) {
        console.error('Loaded save data is invalid');
        return this.attemptRecovery(slotName);
      }

      // Check version compatibility
      if (!this.isVersionCompatible(saveData.version)) {
        console.warn(`Save version ${saveData.version} may be incompatible with current version ${this.SAVE_VERSION}`);
        saveData = this.migrateSaveData(saveData);
      }

      // Deserialize complex objects
      saveData.player = this.deserializePlayer(saveData.player);
      saveData.inventory = this.deserializeInventory(saveData.inventory);
      saveData.skills = this.deserializeSkills(saveData.skills);
      saveData.quests = this.deserializeQuests(saveData.quests);

      console.log(`Game loaded successfully from slot: ${slotName}`);
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return this.attemptRecovery(slotName);
    }
  }

  // Serialization methods
  private static serializePlayer(player: PlayerCharacter): SerializablePlayer {
    return {
      id: player.id,
      name: player.name,
      stats: player.stats,
      position: {
        x: player.position.x,
        y: player.position.y,
        z: player.position.z
      },
      rotation: player.rotation,
      isMoving: player.isMoving,
      pantheonAttunement: player.pantheonAttunement,
      appearance: player.appearance,
      playtime: 0, // This would be tracked separately
      level: player.stats.level
    };
  }

  private static deserializePlayer(data: SerializablePlayer): any {
    return {
      ...data,
      position: new THREE.Vector3(data.position.x, data.position.y, data.position.z)
    };
  }

  private static serializeInventory(inventory: InventorySlot[]): InventorySlot[] {
    // Deep clone to avoid modifying original data
    return inventory.map(slot => ({
      item: slot.item ? { ...slot.item } : null,
      quantity: slot.quantity
    }));
  }

  private static deserializeInventory(data: InventorySlot[]): InventorySlot[] {
    return data.map(slot => ({
      item: slot.item,
      quantity: slot.quantity
    }));
  }

  private static serializeSkills(skills: Skill[]): Skill[] {
    return skills.map(skill => ({ ...skill }));
  }

  private static deserializeSkills(data: Skill[]): Skill[] {
    return data.map(skill => ({ ...skill }));
  }

  private static serializeQuests(quests: Quest[]): Quest[] {
    return quests.map(quest => ({ ...quest }));
  }

  private static deserializeQuests(data: Quest[]): Quest[] {
    return data.map(quest => ({ ...quest }));
  }

  private static serializeWorldData(worldData: Partial<WorldSaveData>): WorldSaveData {
    return {
      seed: worldData.seed || Math.floor(Math.random() * 1000000),
      exploredChunks: worldData.exploredChunks || [],
      harvestedResources: worldData.harvestedResources || [],
      defeatedEnemies: worldData.defeatedEnemies || [],
      discoveredLocations: worldData.discoveredLocations || [],
      worldTime: worldData.worldTime || 0,
      season: worldData.season || 'spring'
    };
  }

  // Save slot management
  static getSaveSlots(): Array<{ name: string; metadata: SaveMetadata }> {
    const slots: Array<{ name: string; metadata: SaveMetadata }> = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.SAVE_KEY + '_')) {
        const slotName = key.replace(this.SAVE_KEY + '_', '');
        const metadata = this.getSaveMetadata(slotName);
        
        if (metadata) {
          slots.push({ name: slotName, metadata });
        }
      }
    }
    
    return slots.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp);
  }

  static deleteSave(slotName: string): boolean {
    try {
      localStorage.removeItem(`${this.SAVE_KEY}_${slotName}`);
      localStorage.removeItem(`${this.SAVE_KEY}_${slotName}_metadata`);
      localStorage.removeItem(`${this.BACKUP_KEY}_${slotName}`);
      
      console.log(`Save slot deleted: ${slotName}`);
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }

  static copySave(fromSlot: string, toSlot: string): boolean {
    try {
      const saveData = localStorage.getItem(`${this.SAVE_KEY}_${fromSlot}`);
      const metadata = localStorage.getItem(`${this.SAVE_KEY}_${fromSlot}_metadata`);
      
      if (!saveData) {
        console.error(`Source save slot not found: ${fromSlot}`);
        return false;
      }

      localStorage.setItem(`${this.SAVE_KEY}_${toSlot}`, saveData);
      if (metadata) {
        localStorage.setItem(`${this.SAVE_KEY}_${toSlot}_metadata`, metadata);
      }
      
      console.log(`Save copied from ${fromSlot} to ${toSlot}`);
      return true;
    } catch (error) {
      console.error('Failed to copy save:', error);
      return false;
    }
  }

  // Auto-save functionality
  static enableAutoSave(intervalMinutes: number = 5) {
    this.disableAutoSave(); // Clear existing interval
    
    this.autoSaveInterval = window.setInterval(() => {
      // This would need to be called with current game state
      console.log('Auto-save triggered');
      // Auto-save logic would go here
    }, intervalMinutes * 60 * 1000);
    
    console.log(`Auto-save enabled with ${intervalMinutes} minute interval`);
  }

  static disableAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('Auto-save disabled');
    }
  }

  // Settings management
  static saveSettings(settings: GameSettings): boolean {
    try {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
      console.log('Settings saved');
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  static loadSettings(): GameSettings {
    try {
      const settings = localStorage.getItem(this.SETTINGS_KEY);
      if (settings) {
        return JSON.parse(settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    
    // Return default settings
    return {
      audioEnabled: true,
      musicVolume: 0.5,
      sfxVolume: 0.7,
      graphics: 'medium',
      autoSave: true,
      autoSaveInterval: 5
    };
  }

  // Statistics tracking
  private static updateStatistics(): GameStatistics {
    const existing = this.loadStatistics();
    const now = Date.now();
    
    const statistics: GameStatistics = {
      ...existing,
      lastPlayDate: now,
      sessionsPlayed: existing.sessionsPlayed + 1
    };
    
    this.saveStatistics(statistics);
    return statistics;
  }

  static saveStatistics(stats: GameStatistics): boolean {
    try {
      localStorage.setItem(this.STATISTICS_KEY, JSON.stringify(stats));
      return true;
    } catch (error) {
      console.error('Failed to save statistics:', error);
      return false;
    }
  }

  static loadStatistics(): GameStatistics {
    try {
      const stats = localStorage.getItem(this.STATISTICS_KEY);
      if (stats) {
        return JSON.parse(stats);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
    
    const now = Date.now();
    return {
      totalPlaytime: 0,
      distanceTraveled: 0,
      enemiesDefeated: 0,
      itemsCrafted: 0,
      resourcesGathered: 0,
      questsCompleted: 0,
      skillLevelsGained: 0,
      sessionsPlayed: 0,
      firstPlayDate: now,
      lastPlayDate: now
    };
  }

  // Data validation and recovery
  private static validateSaveData(data: SaveData): boolean {
    if (!data || typeof data !== 'object') return false;
    if (!data.version || !data.timestamp) return false;
    if (!data.player || !data.player.id) return false;
    if (!Array.isArray(data.inventory)) return false;
    if (!Array.isArray(data.skills)) return false;
    if (!Array.isArray(data.quests)) return false;
    
    return true;
  }

  private static createBackup(slotName: string): boolean {
    try {
      const currentSave = localStorage.getItem(`${this.SAVE_KEY}_${slotName}`);
      if (currentSave) {
        localStorage.setItem(`${this.BACKUP_KEY}_${slotName}`, currentSave);
        console.log(`Backup created for slot: ${slotName}`);
      }
      return true;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return false;
    }
  }

  private static attemptRecovery(slotName: string): SaveData | null {
    console.log(`Attempting to recover save data for slot: ${slotName}`);
    
    try {
      // Try to load from backup
      const backupData = localStorage.getItem(`${this.BACKUP_KEY}_${slotName}`);
      if (backupData) {
        const jsonData = this.compressionEnabled 
          ? this.decompressData(backupData)
          : backupData;
        
        const saveData: SaveData = JSON.parse(jsonData);
        
        if (this.validateSaveData(saveData)) {
          console.log('Recovery successful using backup data');
          return saveData;
        }
      }
    } catch (error) {
      console.error('Backup recovery failed:', error);
    }
    
    console.log('Recovery failed - no valid save data found');
    return null;
  }

  // Version migration
  private static isVersionCompatible(version: string): boolean {
    const current = this.SAVE_VERSION.split('.').map(Number);
    const save = version.split('.').map(Number);
    
    // Major version must match
    return current[0] === save[0];
  }

  private static migrateSaveData(data: SaveData): SaveData {
    console.log(`Migrating save data from version ${data.version} to ${this.SAVE_VERSION}`);
    
    // Add migration logic here for different versions
    const migrated = { ...data };
    migrated.version = this.SAVE_VERSION;
    
    return migrated;
  }

  // Compression utilities
  private static compressData(data: string): string {
    // Simple compression using base64 encoding
    // In a real implementation, you might use a library like pako for gzip compression
    try {
      return btoa(unescape(encodeURIComponent(data)));
    } catch (error) {
      console.warn('Compression failed, saving uncompressed:', error);
      return data;
    }
  }

  private static decompressData(data: string): string {
    try {
      return decodeURIComponent(escape(atob(data)));
    } catch (error) {
      console.warn('Decompression failed, assuming uncompressed data:', error);
      return data;
    }
  }

  // Metadata management
  private static updateSaveMetadata(slotName: string, saveData: SaveData) {
    const metadata: SaveMetadata = {
      timestamp: saveData.timestamp,
      playerName: saveData.player.name,
      playerLevel: saveData.player.level,
      playtime: saveData.player.playtime,
      worldSeed: saveData.world.seed,
      version: saveData.version
    };
    
    localStorage.setItem(`${this.SAVE_KEY}_${slotName}_metadata`, JSON.stringify(metadata));
  }

  private static getSaveMetadata(slotName: string): SaveMetadata | null {
    try {
      const metadata = localStorage.getItem(`${this.SAVE_KEY}_${slotName}_metadata`);
      return metadata ? JSON.parse(metadata) : null;
    } catch (error) {
      console.error('Failed to load save metadata:', error);
      return null;
    }
  }

  // Utility methods
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getStorageUsage(): { used: number; available: number; percentage: number } {
    try {
      const used = new Blob(Object.values(localStorage)).size;
      const available = 5 * 1024 * 1024; // Approximate localStorage limit (5MB)
      const percentage = (used / available) * 100;
      
      return { used, available, percentage };
    } catch (error) {
      console.error('Failed to calculate storage usage:', error);
      return { used: 0, available: 0, percentage: 0 };
    }
  }

  static exportSave(slotName: string): string | null {
    try {
      const saveData = localStorage.getItem(`${this.SAVE_KEY}_${slotName}`);
      if (!saveData) return null;
      
      const exportData = {
        version: this.SAVE_VERSION,
        exportDate: Date.now(),
        slotName,
        data: saveData
      };
      
      return JSON.stringify(exportData);
    } catch (error) {
      console.error('Failed to export save:', error);
      return null;
    }
  }

  static importSave(exportedData: string, targetSlot: string): boolean {
    try {
      const importData = JSON.parse(exportedData);
      
      if (!importData.data || !importData.version) {
        console.error('Invalid export data format');
        return false;
      }
      
      localStorage.setItem(`${this.SAVE_KEY}_${targetSlot}`, importData.data);
      console.log(`Save imported to slot: ${targetSlot}`);
      
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }
}

interface SaveMetadata {
  timestamp: number;
  playerName: string;
  playerLevel: number;
  playtime: number;
  worldSeed: number;
  version: string;
}
