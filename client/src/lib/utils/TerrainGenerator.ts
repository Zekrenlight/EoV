import * as THREE from 'three';

export class TerrainGenerator {
  private seed: number;
  private noiseScale: number;
  private octaves: number;
  private persistence: number;
  private lacunarity: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
    this.noiseScale = 0.05;
    this.octaves = 4;
    this.persistence = 0.5;
    this.lacunarity = 2.0;
    
    console.log(`TerrainGenerator initialized with seed: ${seed}`);
  }

  // Pseudo-random number generator based on seed
  private seededRandom(x: number, y: number): number {
    const value = Math.sin(x * 12.9898 + y * 78.233 + this.seed) * 43758.5453;
    return value - Math.floor(value);
  }

  // Simple noise function
  private noise(x: number, y: number): number {
    const intX = Math.floor(x);
    const intY = Math.floor(y);
    const fracX = x - intX;
    const fracY = y - intY;

    // Get noise values at corners
    const a = this.seededRandom(intX, intY);
    const b = this.seededRandom(intX + 1, intY);
    const c = this.seededRandom(intX, intY + 1);
    const d = this.seededRandom(intX + 1, intY + 1);

    // Smooth interpolation
    const i1 = this.smoothInterpolate(a, b, fracX);
    const i2 = this.smoothInterpolate(c, d, fracX);
    return this.smoothInterpolate(i1, i2, fracY);
  }

  private smoothInterpolate(a: number, b: number, t: number): number {
    const smoothT = t * t * (3 - 2 * t); // Smoothstep function
    return a * (1 - smoothT) + b * smoothT;
  }

  // Fractal noise using multiple octaves
  private fractalNoise(x: number, y: number): number {
    let value = 0;
    let amplitude = 1;
    let frequency = this.noiseScale;
    let maxValue = 0;

    for (let i = 0; i < this.octaves; i++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= this.persistence;
      frequency *= this.lacunarity;
    }

    return value / maxValue;
  }

  // Generate height map for terrain
  generateHeightMap(offsetX: number, offsetZ: number, width: number, height: number): number[][] {
    const heightMap: number[][] = [];
    
    for (let x = 0; x < width; x++) {
      heightMap[x] = [];
      for (let z = 0; z < height; z++) {
        const worldX = offsetX + x;
        const worldZ = offsetZ + z;
        
        // Generate base terrain height
        const baseHeight = this.fractalNoise(worldX, worldZ) * 15; // Max height of 15 units
        
        // Add some variation for different biomes
        const biomeVariation = this.getBiomeHeight(worldX, worldZ);
        
        heightMap[x][z] = Math.max(0, baseHeight + biomeVariation);
      }
    }
    
    // Smooth the heightmap to reduce harsh transitions
    return this.smoothHeightMap(heightMap);
  }

  private getBiomeHeight(x: number, z: number): number {
    // Create different height patterns for different biomes
    const mountainNoise = this.noise(x * 0.01, z * 0.01);
    const valleyNoise = this.noise(x * 0.02, z * 0.02);
    const detailNoise = this.noise(x * 0.1, z * 0.1);
    
    let heightModifier = 0;
    
    // Mountains
    if (mountainNoise > 0.6) {
      heightModifier += (mountainNoise - 0.6) * 25; // Tall mountains
    }
    
    // Valleys
    if (valleyNoise < 0.3) {
      heightModifier -= (0.3 - valleyNoise) * 10; // Deep valleys
    }
    
    // Add fine detail
    heightModifier += detailNoise * 3;
    
    return heightModifier;
  }

  private smoothHeightMap(heightMap: number[][]): number[][] {
    const smoothed: number[][] = [];
    const width = heightMap.length;
    const height = heightMap[0].length;
    
    for (let x = 0; x < width; x++) {
      smoothed[x] = [];
      for (let z = 0; z < height; z++) {
        let sum = 0;
        let count = 0;
        
        // Average with neighbors
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const nx = x + dx;
            const nz = z + dz;
            
            if (nx >= 0 && nx < width && nz >= 0 && nz < height) {
              sum += heightMap[nx][nz];
              count++;
            }
          }
        }
        
        smoothed[x][z] = sum / count;
      }
    }
    
    return smoothed;
  }

  // Get height at a specific world position
  getHeightAtPoint(x: number, z: number): number {
    const baseHeight = this.fractalNoise(x, z) * 15;
    const biomeVariation = this.getBiomeHeight(x, z);
    return Math.max(0, baseHeight + biomeVariation);
  }

  // Generate terrain mesh geometry
  generateTerrainGeometry(
    offsetX: number, 
    offsetZ: number, 
    chunkSize: number, 
    resolution: number = 32
  ): THREE.BufferGeometry {
    const heightMap = this.generateHeightMap(offsetX, offsetZ, resolution, resolution);
    const geometry = new THREE.PlaneGeometry(chunkSize, chunkSize, resolution - 1, resolution - 1);
    
    // Apply height data to vertices
    const positions = geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = Math.floor((i / 3) % resolution);
      const z = Math.floor((i / 3) / resolution);
      
      if (heightMap[x] && heightMap[x][z] !== undefined) {
        positions[i + 1] = heightMap[x][z]; // Y coordinate
      }
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }

  // Biome determination
  getBiomeAtPosition(x: number, z: number): string {
    const temperature = this.noise(x * 0.005, z * 0.005);
    const humidity = this.noise(x * 0.008, z * 0.008 + 1000);
    const elevation = this.getHeightAtPoint(x, z);
    
    // Determine biome based on temperature, humidity, and elevation
    if (elevation > 20) {
      return 'mountain';
    } else if (temperature > 0.7 && humidity < 0.3) {
      return 'desert';
    } else if (temperature < 0.3) {
      return 'tundra';
    } else if (humidity > 0.7) {
      return 'swamp';
    } else if (temperature > 0.4 && humidity > 0.4) {
      return 'forest';
    } else {
      return 'plains';
    }
  }

  // Resource spawn point generation
  generateResourceSpawns(
    offsetX: number, 
    offsetZ: number, 
    chunkSize: number, 
    biome: string
  ): Array<{ type: string; position: THREE.Vector3; rarity: number }> {
    const spawns: Array<{ type: string; position: THREE.Vector3; rarity: number }> = [];
    const spawnDensity = this.getResourceDensityForBiome(biome);
    
    for (let i = 0; i < spawnDensity; i++) {
      const localX = Math.random() * chunkSize;
      const localZ = Math.random() * chunkSize;
      const worldX = offsetX + localX;
      const worldZ = offsetZ + localZ;
      const height = this.getHeightAtPoint(worldX, worldZ);
      
      const resourceType = this.determineResourceType(biome, worldX, worldZ);
      const rarity = this.calculateResourceRarity(resourceType, worldX, worldZ);
      
      spawns.push({
        type: resourceType,
        position: new THREE.Vector3(worldX, height, worldZ),
        rarity
      });
    }
    
    return spawns;
  }

  private getResourceDensityForBiome(biome: string): number {
    const densities = {
      forest: 15,
      plains: 10,
      mountain: 8,
      desert: 5,
      swamp: 12,
      tundra: 6
    };
    
    return densities[biome] || 10;
  }

  private determineResourceType(biome: string, x: number, z: number): string {
    const resourceRandom = this.seededRandom(x * 0.1, z * 0.1);
    
    const biomeResources = {
      forest: ['wood', 'berries', 'herbs'],
      plains: ['stone', 'grain', 'wildflowers'],
      mountain: ['iron_ore', 'stone', 'crystals'],
      desert: ['sand', 'cactus', 'salt'],
      swamp: ['peat', 'mushrooms', 'herbs'],
      tundra: ['ice', 'stone', 'rare_minerals']
    };
    
    const resources = biomeResources[biome] || ['stone', 'wood'];
    const index = Math.floor(resourceRandom * resources.length);
    return resources[index];
  }

  private calculateResourceRarity(type: string, x: number, z: number): number {
    const rarityNoise = this.noise(x * 0.03, z * 0.03);
    
    const baseRarities = {
      wood: 0.1,
      stone: 0.1,
      iron_ore: 0.5,
      crystals: 0.8,
      rare_minerals: 0.9,
      herbs: 0.3,
      berries: 0.2
    };
    
    const baseRarity = baseRarities[type] || 0.1;
    return Math.min(1, baseRarity + rarityNoise * 0.3);
  }

  // Cave and underground generation
  generateCaveSystem(
    offsetX: number, 
    offsetZ: number, 
    chunkSize: number
  ): Array<{ position: THREE.Vector3; size: number; depth: number }> {
    const caves: Array<{ position: THREE.Vector3; size: number; depth: number }> = [];
    const caveNoise = this.noise(offsetX * 0.01, offsetZ * 0.01);
    
    if (caveNoise > 0.7) { // Only generate caves in some areas
      const numCaves = Math.floor(caveNoise * 5);
      
      for (let i = 0; i < numCaves; i++) {
        const localX = Math.random() * chunkSize;
        const localZ = Math.random() * chunkSize;
        const worldX = offsetX + localX;
        const worldZ = offsetZ + localZ;
        const surfaceHeight = this.getHeightAtPoint(worldX, worldZ);
        
        const caveDepth = 5 + Math.random() * 10;
        const caveSize = 3 + Math.random() * 7;
        
        caves.push({
          position: new THREE.Vector3(worldX, surfaceHeight - caveDepth, worldZ),
          size: caveSize,
          depth: caveDepth
        });
      }
    }
    
    return caves;
  }

  // Water body generation
  generateWaterBodies(
    offsetX: number, 
    offsetZ: number, 
    chunkSize: number,
    heightMap: number[][]
  ): Array<{ center: THREE.Vector3; radius: number; type: 'lake' | 'river' }> {
    const waterBodies: Array<{ center: THREE.Vector3; radius: number; type: 'lake' | 'river' }> = [];
    
    // Find low-lying areas for lakes
    const resolution = heightMap.length;
    for (let x = 1; x < resolution - 1; x++) {
      for (let z = 1; z < resolution - 1; z++) {
        const height = heightMap[x][z];
        const avgNeighborHeight = (
          heightMap[x-1][z] + heightMap[x+1][z] + 
          heightMap[x][z-1] + heightMap[x][z+1]
        ) / 4;
        
        // If this point is significantly lower than neighbors, place a lake
        if (height < avgNeighborHeight - 3 && height < 5) {
          const worldX = offsetX + (x / resolution) * chunkSize;
          const worldZ = offsetZ + (z / resolution) * chunkSize;
          
          waterBodies.push({
            center: new THREE.Vector3(worldX, height, worldZ),
            radius: 5 + Math.random() * 10,
            type: 'lake'
          });
        }
      }
    }
    
    return waterBodies;
  }

  // Vegetation placement
  generateVegetation(
    offsetX: number, 
    offsetZ: number, 
    chunkSize: number, 
    biome: string,
    heightMap: number[][]
  ): Array<{ type: string; position: THREE.Vector3; scale: number }> {
    const vegetation: Array<{ type: string; position: THREE.Vector3; scale: number }> = [];
    const density = this.getVegetationDensityForBiome(biome);
    
    for (let i = 0; i < density; i++) {
      const localX = Math.random() * chunkSize;
      const localZ = Math.random() * chunkSize;
      const worldX = offsetX + localX;
      const worldZ = offsetZ + localZ;
      
      // Get height at this position
      const gridX = Math.floor((localX / chunkSize) * heightMap.length);
      const gridZ = Math.floor((localZ / chunkSize) * heightMap[0].length);
      const height = heightMap[gridX] ? heightMap[gridX][gridZ] || 0 : 0;
      
      const vegetationType = this.determineVegetationType(biome, worldX, worldZ);
      const scale = 0.8 + Math.random() * 0.4; // Random scale variation
      
      vegetation.push({
        type: vegetationType,
        position: new THREE.Vector3(worldX, height, worldZ),
        scale
      });
    }
    
    return vegetation;
  }

  private getVegetationDensityForBiome(biome: string): number {
    const densities = {
      forest: 50,
      plains: 20,
      mountain: 10,
      desert: 3,
      swamp: 30,
      tundra: 5
    };
    
    return densities[biome] || 15;
  }

  private determineVegetationType(biome: string, x: number, z: number): string {
    const vegetationRandom = this.seededRandom(x * 0.05, z * 0.05);
    
    const biomeVegetation = {
      forest: ['oak_tree', 'pine_tree', 'bush', 'fern'],
      plains: ['grass', 'wildflower', 'small_tree'],
      mountain: ['pine_tree', 'rock_moss', 'mountain_flower'],
      desert: ['cactus', 'desert_bush', 'dead_tree'],
      swamp: ['willow_tree', 'cattails', 'moss'],
      tundra: ['pine_tree', 'tundra_grass', 'ice_crystal']
    };
    
    const vegetation = biomeVegetation[biome] || ['grass'];
    const index = Math.floor(vegetationRandom * vegetation.length);
    return vegetation[index];
  }

  // Seasonal variations
  applySeasonalModifications(
    heightMap: number[][], 
    season: 'spring' | 'summer' | 'autumn' | 'winter'
  ): number[][] {
    const modified = heightMap.map(row => [...row]); // Deep copy
    
    switch (season) {
      case 'winter':
        // Add snow layer to high elevations
        for (let x = 0; x < modified.length; x++) {
          for (let z = 0; z < modified[x].length; z++) {
            if (modified[x][z] > 10) {
              modified[x][z] += 0.5; // Snow layer
            }
          }
        }
        break;
        
      case 'spring':
        // Slight height increase from vegetation growth
        for (let x = 0; x < modified.length; x++) {
          for (let z = 0; z < modified[x].length; z++) {
            if (modified[x][z] < 15 && modified[x][z] > 2) {
              modified[x][z] += 0.2;
            }
          }
        }
        break;
        
      case 'autumn':
        // No significant height changes
        break;
        
      case 'summer':
        // Vegetation at peak, similar to spring but more pronounced
        for (let x = 0; x < modified.length; x++) {
          for (let z = 0; z < modified[x].length; z++) {
            if (modified[x][z] < 15 && modified[x][z] > 2) {
              modified[x][z] += 0.3;
            }
          }
        }
        break;
    }
    
    return modified;
  }

  // Utility methods
  setSeed(newSeed: number) {
    this.seed = newSeed;
    console.log(`TerrainGenerator seed changed to: ${newSeed}`);
  }

  setNoiseParameters(scale: number, octaves: number, persistence: number, lacunarity: number) {
    this.noiseScale = scale;
    this.octaves = octaves;
    this.persistence = persistence;
    this.lacunarity = lacunarity;
    console.log('Terrain noise parameters updated');
  }
}
