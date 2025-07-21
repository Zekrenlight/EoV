import { useRef, useMemo, useEffect } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { useWorld } from '../../lib/stores/useWorld';

const Terrain = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { chunks, loadedChunks } = useWorld();
  
  // Load textures
  const grassTexture = useTexture('/textures/grass.png');
  const sandTexture = useTexture('/textures/sand.jpg');
  
  // Configure texture settings
  useMemo(() => {
    [grassTexture, sandTexture].forEach(texture => {
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 8);
      texture.minFilter = THREE.LinearMipMapLinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
  }, [grassTexture, sandTexture]);

  // Generate terrain geometry for all loaded chunks
  const terrainGeometry = useMemo(() => {
    console.log('Generating terrain geometry for', loadedChunks.size, 'chunks');
    
    if (loadedChunks.size === 0) {
      // Return a simple fallback terrain
      const geometry = new THREE.PlaneGeometry(100, 100, 32, 32);
      geometry.rotateX(-Math.PI / 2);
      
      // Add some basic height variation
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] = Math.sin(positions[i] * 0.1) * Math.cos(positions[i + 2] * 0.1) * 2;
      }
      
      geometry.attributes.position.needsUpdate = true;
      geometry.computeVertexNormals();
      
      return geometry;
    }

    // Combine all chunk geometries
    const geometries: THREE.BufferGeometry[] = [];
    
    Array.from(loadedChunks).forEach(chunkKey => {
      const chunk = chunks.get(chunkKey);
      if (!chunk || !chunk.isGenerated) return;
      
      const chunkSize = 32;
      const chunkGeometry = new THREE.PlaneGeometry(
        chunkSize, 
        chunkSize, 
        chunkSize - 1, 
        chunkSize - 1
      );
      
      // Rotate to be horizontal
      chunkGeometry.rotateX(-Math.PI / 2);
      
      // Apply height data
      const positions = chunkGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const localX = Math.floor((i / 3) % chunkSize);
        const localZ = Math.floor((i / 3) / chunkSize);
        
        if (chunk.heightData[localX] && chunk.heightData[localX][localZ] !== undefined) {
          positions[i + 1] = chunk.heightData[localX][localZ];
        }
      }
      
      chunkGeometry.attributes.position.needsUpdate = true;
      chunkGeometry.computeVertexNormals();
      
      // Position the chunk in world space
      chunkGeometry.translate(
        chunk.x * chunkSize,
        0,
        chunk.z * chunkSize
      );
      
      geometries.push(chunkGeometry);
    });

    if (geometries.length === 0) {
      // Fallback geometry
      const geometry = new THREE.PlaneGeometry(32, 32, 16, 16);
      geometry.rotateX(-Math.PI / 2);
      return geometry;
    }

    // Merge all chunk geometries
    const mergedGeometry = new THREE.BufferGeometry();
    const mergedGeometries = THREE.BufferGeometryUtils ? 
      THREE.BufferGeometryUtils.mergeGeometries(geometries) : 
      geometries[0]; // Fallback if utils not available
    
    // Clean up individual geometries
    geometries.forEach(geo => geo.dispose());
    
    return mergedGeometries || geometries[0];
  }, [chunks, loadedChunks]);

  // Create terrain material based on biome
  const terrainMaterial = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      map: grassTexture,
      side: THREE.DoubleSide,
    });
  }, [grassTexture]);

  useEffect(() => {
    return () => {
      // Clean up geometry on unmount
      if (terrainGeometry) {
        terrainGeometry.dispose();
      }
      if (terrainMaterial) {
        terrainMaterial.dispose();
      }
    };
  }, [terrainGeometry, terrainMaterial]);

  return (
    <group>
      {/* Main terrain mesh */}
      <mesh 
        ref={meshRef}
        geometry={terrainGeometry}
        material={terrainMaterial}
        receiveShadow
        castShadow={false}
      />
      
      {/* Water plane for visual appeal */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshLambertMaterial 
          color="#4a90e2" 
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Skybox substitute - simple colored planes */}
      <group position={[0, 50, 0]}>
        <mesh position={[0, 0, -100]}>
          <planeGeometry args={[200, 100]} />
          <meshBasicMaterial color="#87CEEB" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 100]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[200, 100]} />
          <meshBasicMaterial color="#87CEEB" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[-100, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[200, 100]} />
          <meshBasicMaterial color="#98FB98" side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[100, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[200, 100]} />
          <meshBasicMaterial color="#98FB98" side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

export default Terrain;
