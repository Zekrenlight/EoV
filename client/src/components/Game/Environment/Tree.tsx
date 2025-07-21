import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import { usePlayer } from '../../../lib/stores/usePlayer';
import { useInventory } from '../../../lib/stores/useInventory';
import { useSkills } from '../../../lib/stores/useSkills';
import { useWorld } from '../../../lib/stores/useWorld';
import { SAMPLE_ITEMS } from '../../../lib/stores/useInventory';

interface TreeProps {
  position: [number, number, number];
  resourceId: string;
  scale?: number;
}

const Tree: React.FC<TreeProps> = ({ position, resourceId, scale = 1 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const { player } = usePlayer();
  const { addItem } = useInventory();
  const { gainSkillExperience } = useSkills();
  const { harvestResource } = useWorld();
  
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [swayOffset] = useState(Math.random() * Math.PI * 2);
  
  // Load wood texture if available
  const woodTexture = useTexture('/textures/wood.jpg');
  
  // Configure wood texture
  woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
  woodTexture.repeat.set(1, 4);

  useFrame((state) => {
    if (!groupRef.current || !player) return;

    const tree = groupRef.current;
    const distance = new THREE.Vector3(...position).distanceTo(player.position);
    
    // Highlight when player is nearby
    const shouldHighlight = distance < 3;
    if (shouldHighlight !== isHighlighted) {
      setIsHighlighted(shouldHighlight);
    }

    // Gentle swaying animation
    const sway = Math.sin(state.clock.elapsedTime * 0.5 + swayOffset) * 0.02;
    tree.rotation.z = sway * scale;
    tree.children.forEach((child, index) => {
      if (child instanceof THREE.Mesh && index > 0) { // Skip trunk
        child.rotation.x = sway * (1 + index * 0.1);
      }
    });
  });

  const handleClick = () => {
    if (!player) return;
    
    const distance = new THREE.Vector3(...position).distanceTo(player.position);
    if (distance > 3) {
      console.log('Too far from tree to harvest');
      return;
    }

    // Attempt to harvest the resource
    const harvestedItem = harvestResource(resourceId);
    if (harvestedItem) {
      // Add wood to inventory
      const woodItem = SAMPLE_ITEMS.wood;
      const success = addItem(woodItem, 1);
      
      if (success) {
        console.log('Harvested wood from tree');
        
        // Gain gathering experience
        gainSkillExperience('gathering', 25);
        
        // Play harvest sound effect would go here
        console.log('🌲 Tree harvested! +1 Wood, +25 Gathering XP');
      } else {
        console.log('Inventory full! Cannot harvest wood.');
      }
    } else {
      console.log('This tree has no more resources');
    }
  };

  return (
    <group 
      ref={groupRef} 
      position={position}
      scale={[scale, scale, scale]}
      onClick={handleClick}
      onPointerEnter={() => setIsHighlighted(true)}
      onPointerLeave={() => setIsHighlighted(false)}
    >
      {/* Tree Trunk */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.4, 2, 8]} />
        <meshLambertMaterial 
          map={woodTexture}
          color={isHighlighted ? '#8B7355' : '#654321'} 
        />
      </mesh>

      {/* Tree Foliage - Multiple layers for fuller appearance */}
      <mesh position={[0, 2.8, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1.5, 8, 6]} />
        <meshLambertMaterial 
          color={isHighlighted ? '#90EE90' : '#228B22'}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Second layer of leaves */}
      <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
        <sphereGeometry args={[1.2, 8, 6]} />
        <meshLambertMaterial 
          color={isHighlighted ? '#98FB98' : '#32CD32'}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Top layer */}
      <mesh position={[0, 4.1, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.8, 8, 6]} />
        <meshLambertMaterial 
          color={isHighlighted ? '#ADFF2F' : '#228B22'}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Harvest indicator when highlighted */}
      {isHighlighted && (
        <mesh position={[0, 0.1, 0]}>
          <ringGeometry args={[1.8, 2.2, 16]} />
          <meshBasicMaterial 
            color="#64ffda" 
            transparent 
            opacity={0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Resource indicator particles */}
      <group position={[0, 3, 0]}>
        {Array.from({ length: 3 }, (_, i) => (
          <mesh 
            key={i}
            position={[
              Math.cos(i * Math.PI * 2 / 3) * 1.2,
              Math.sin(Date.now() * 0.001 + i) * 0.2,
              Math.sin(i * Math.PI * 2 / 3) * 1.2
            ]}
          >
            <sphereGeometry args={[0.05]} />
            <meshBasicMaterial 
              color="#90EE90" 
              transparent 
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default Tree;
