import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';

import { Controls } from '../../App';
import { usePlayer } from '../../lib/stores/usePlayer';
import { useWorld } from '../../lib/stores/useWorld';
import { useMultiplayer } from '../../lib/stores/useMultiplayer';
import { PathfindingSystem } from '../../lib/systems/PathfindingSystem';

const Player = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { player, setPosition, setMoving, setTargetPosition, targetPosition, isMoving } = usePlayer();
  const { getHeightAtPosition } = useWorld();
  const { updatePlayerPosition, isConnected } = useMultiplayer();
  
  const [subscribe, get] = useKeyboardControls<Controls>();
  const [lastPosition, setLastPosition] = useState<THREE.Vector3>(new THREE.Vector3());
  const pathfinder = useRef(new PathfindingSystem());

  // Movement constants
  const MOVE_SPEED = 5;
  const ROTATION_SPEED = 10;

  useFrame((state, delta) => {
    if (!player || !meshRef.current) return;

    const mesh = meshRef.current;
    const controls = get();
    let moved = false;
    let newPosition = player.position.clone();

    // Handle keyboard movement (WASD)
    const moveVector = new THREE.Vector3();
    
    if (controls.forward) moveVector.z -= 1;
    if (controls.backward) moveVector.z += 1;
    if (controls.leftward) moveVector.x -= 1;
    if (controls.rightward) moveVector.x += 1;

    // Normalize movement vector for diagonal movement
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.multiplyScalar(MOVE_SPEED * delta);
      
      newPosition.add(moveVector);
      moved = true;
      
      // Set rotation based on movement direction
      if (moveVector.length() > 0) {
        const targetRotation = Math.atan2(moveVector.x, moveVector.z);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation, ROTATION_SPEED * delta);
      }
      
      console.log('Player moving via keyboard:', newPosition.toArray());
    }
    
    // Handle pathfinding movement (click-to-move)
    else if (targetPosition && isMoving) {
      const direction = new THREE.Vector3().subVectors(targetPosition, player.position);
      const distance = direction.length();
      
      if (distance > 0.5) { // Still moving towards target
        direction.normalize();
        direction.multiplyScalar(MOVE_SPEED * delta);
        
        newPosition.add(direction);
        moved = true;
        
        // Rotate towards movement direction
        const targetRotation = Math.atan2(direction.x, direction.z);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation, ROTATION_SPEED * delta);
        
        console.log('Player moving via pathfinding to:', targetPosition.toArray());
      } else {
        // Reached target
        setTargetPosition(null);
        setMoving(false);
        console.log('Player reached pathfinding target');
      }
    }

    // Update position if player moved
    if (moved) {
      // Adjust height based on terrain
      const terrainHeight = getHeightAtPosition(newPosition.x, newPosition.z);
      newPosition.y = terrainHeight + 1; // Player height above ground

      // Update player position
      setPosition(newPosition);
      mesh.position.copy(newPosition);
      
      // Update movement state
      setMoving(true);
      
      // Sync position with other players in multiplayer
      if (isConnected && player) {
        const positionChanged = lastPosition.distanceTo(newPosition) > 0.1;
        if (positionChanged) {
          updatePlayerPosition(player.id, {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z,
            rotation: mesh.rotation.y
          });
          setLastPosition(newPosition.clone());
        }
      }
    } else {
      // Player stopped moving
      if (isMoving) {
        setMoving(false);
      }
    }

    // Update mesh position to match player
    mesh.position.copy(player.position);
  });

  // Handle mouse clicks for pathfinding
  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      // Only handle clicks if not on UI elements
      const target = event.target as HTMLElement;
      if (target.tagName === 'CANVAS') {
        // This would integrate with a raycasting system to determine world position
        // For now, we'll log the click
        console.log('Canvas clicked for pathfinding');
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  // Debug logging for movement controls
  useEffect(() => {
    return subscribe(
      (state) => state.forward,
      (pressed) => console.log('Forward key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  useEffect(() => {
    return subscribe(
      (state) => state.backward,
      (pressed) => console.log('Backward key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  useEffect(() => {
    return subscribe(
      (state) => state.leftward,
      (pressed) => console.log('Left key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  useEffect(() => {
    return subscribe(
      (state) => state.rightward,
      (pressed) => console.log('Right key:', pressed ? 'pressed' : 'released')
    );
  }, [subscribe]);

  if (!player) return null;

  return (
    <group>
      {/* Player Character Mesh */}
      <mesh
        ref={meshRef}
        position={[player.position.x, player.position.y, player.position.z]}
        castShadow
        receiveShadow
      >
        {/* Simple box geometry for now - can be replaced with GLTF model */}
        <boxGeometry args={[1, 2, 1]} />
        <meshPhongMaterial 
          color={player.appearance.skinColor || '#F4C2A1'} 
          shininess={30}
        />
      </mesh>

      {/* Player Name Tag */}
      <group position={[player.position.x, player.position.y + 2.5, player.position.z]}>
        <mesh>
          <planeGeometry args={[3, 0.5]} />
          <meshBasicMaterial color="#000000" opacity={0.7} transparent />
        </mesh>
        {/* Text would be rendered here with troika-three-text or similar */}
      </group>

      {/* Health Bar */}
      {player.stats.health < player.stats.maxHealth && (
        <group position={[player.position.x, player.position.y + 2.2, player.position.z]}>
          {/* Background bar */}
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[2, 0.2]} />
            <meshBasicMaterial color="#333333" transparent opacity={0.8} />
          </mesh>
          {/* Health bar */}
          <mesh position={[-(1 - (player.stats.health / player.stats.maxHealth)), 0, 0.02]}>
            <planeGeometry args={[2 * (player.stats.health / player.stats.maxHealth), 0.15]} />
            <meshBasicMaterial color="#ff4444" />
          </mesh>
        </group>
      )}

      {/* Movement indicator when pathfinding */}
      {targetPosition && (
        <group position={[targetPosition.x, targetPosition.y + 0.1, targetPosition.z]}>
          <mesh>
            <ringGeometry args={[0.8, 1.2, 8]} />
            <meshBasicMaterial color="#64ffda" transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
};

export default Player;
