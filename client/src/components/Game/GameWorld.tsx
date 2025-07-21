import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Game Components
import Player from './Player';
import Terrain from './Terrain';
import Camera from './Camera';
import Enemy from './NPCs/Enemy';
import Tree from './Environment/Tree';
import Rock from './Environment/Rock';

// Stores and utilities
import { usePlayer } from '../../lib/stores/usePlayer';
import { useWorld } from '../../lib/stores/useWorld';
import { useSkills } from '../../lib/stores/useSkills';
import { useQuests } from '../../lib/stores/useQuests';

const GameWorld = () => {
  const { player } = usePlayer();
  const { enemies, resources, loadChunk, unloadChunk, updateGameTime, getChunkKey } = useWorld();
  const gameWorldRef = useRef<THREE.Group>(null);
  const lastPlayerChunk = useRef({ x: 0, z: 0 });

  // Update game world every frame
  useFrame((state, delta) => {
    // Update game time
    updateGameTime(delta);

    // Dynamic chunk loading based on player position
    if (player) {
      const currentChunkX = Math.floor(player.position.x / 32);
      const currentChunkZ = Math.floor(player.position.z / 32);
      
      // Only update chunks if player moved to a new chunk
      if (currentChunkX !== lastPlayerChunk.current.x || currentChunkZ !== lastPlayerChunk.current.z) {
        console.log(`Player moved to chunk: (${currentChunkX}, ${currentChunkZ})`);
        
        // Load chunks around player
        const renderDistance = 2;
        for (let x = currentChunkX - renderDistance; x <= currentChunkX + renderDistance; x++) {
          for (let z = currentChunkZ - renderDistance; z <= currentChunkZ + renderDistance; z++) {
            loadChunk(x, z);
          }
        }

        // Unload distant chunks
        const unloadDistance = renderDistance + 1;
        const chunksToUnload: { x: number; z: number }[] = [];
        
        // Check if any loaded chunks are too far
        for (let x = lastPlayerChunk.current.x - unloadDistance; x <= lastPlayerChunk.current.x + unloadDistance; x++) {
          for (let z = lastPlayerChunk.current.z - unloadDistance; z <= lastPlayerChunk.current.z + unloadDistance; z++) {
            const distance = Math.max(Math.abs(x - currentChunkX), Math.abs(z - currentChunkZ));
            if (distance > renderDistance) {
              chunksToUnload.push({ x, z });
            }
          }
        }

        chunksToUnload.forEach(({ x, z }) => {
          unloadChunk(x, z);
        });

        lastPlayerChunk.current = { x: currentChunkX, z: currentChunkZ };
      }
    }
  });

  // Initialize world systems on mount
  useEffect(() => {
    console.log('GameWorld mounted, initializing systems...');
    
    // Initialize world chunks around spawn
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        loadChunk(x, z);
      }
    }

    return () => {
      console.log('GameWorld unmounting...');
    };
  }, []);

  // Generate trees and rocks based on resources
  const environmentObjects = resources.map((resource) => {
    if (resource.type === 'wood' && resource.remainingUses > 0) {
      return (
        <Tree
          key={resource.id}
          position={[resource.position.x, resource.position.y, resource.position.z]}
          resourceId={resource.id}
          scale={0.8 + Math.random() * 0.4}
        />
      );
    } else if (resource.type === 'stone' && resource.remainingUses > 0) {
      return (
        <Rock
          key={resource.id}
          position={[resource.position.x, resource.position.y, resource.position.z]}
          resourceId={resource.id}
          scale={0.6 + Math.random() * 0.6}
        />
      );
    }
    return null;
  }).filter(Boolean);

  return (
    <group ref={gameWorldRef}>
      {/* Terrain */}
      <Terrain />
      
      {/* Environment Objects */}
      {environmentObjects}
      
      {/* Player Character */}
      {player && <Player />}
      
      {/* Enemies */}
      {enemies.filter(enemy => enemy.isAlive).map((enemy) => (
        <Enemy
          key={enemy.id}
          enemyData={enemy}
        />
      ))}
      
      {/* Camera Controller */}
      <Camera />
    </group>
  );
};

export default GameWorld;
