import { useRef, useState } from 'react';
import { useFrame } from '@react-three/drei';
import * as THREE from 'three';

import { usePlayer } from '../../../lib/stores/usePlayer';
import { useInventory } from '../../../lib/stores/useInventory';
import { useSkills } from '../../../lib/stores/useSkills';
import { useWorld } from '../../../lib/stores/useWorld';
import { SAMPLE_ITEMS } from '../../../lib/stores/useInventory';

interface RockProps {
  position: [number, number, number];
  resourceId: string;
  scale?: number;
}

const Rock: React.FC<RockProps> = ({ position, resourceId, scale = 1 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { player } = usePlayer();
  const { addItem } = useInventory();
  const { gainSkillExperience } = useSkills();
  const { harvestResource } = useWorld();
  
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [rockType] = useState(Math.floor(Math.random() * 3)); // 3 different rock shapes
  
  useFrame(() => {
    if (!meshRef.current || !player) return;

    const distance = new THREE.Vector3(...position).distanceTo(player.position);
    
    // Highlight when player is nearby
    const shouldHighlight = distance < 3;
    if (shouldHighlight !== isHighlighted) {
      setIsHighlighted(shouldHighlight);
    }
  });

  const handleClick = () => {
    if (!player) return;
    
    const distance = new THREE.Vector3(...position).distanceTo(player.position);
    if (distance > 3) {
      console.log('Too far from rock to harvest');
      return;
    }

    // Attempt to harvest the resource
    const harvestedItem = harvestResource(resourceId);
    if (harvestedItem) {
      // Determine what to harvest based on rock type and chance
      const roll = Math.random();
      let itemToAdd;
      let xpGain = 15;
      let skillId = 'gathering';

      if (roll < 0.1) { // 10% chance for iron ore
        itemToAdd = SAMPLE_ITEMS.iron_ore;
        xpGain = 40;
        skillId = 'gathering'; // Would be 'mining' if we had that skill
        console.log('🏔️ Found iron ore!');
      } else { // 90% chance for stone
        itemToAdd = SAMPLE_ITEMS.stone;
        console.log('🪨 Gathered stone');
      }
      
      const success = addItem(itemToAdd, 1);
      
      if (success) {
        console.log(`Harvested ${itemToAdd.name} from rock`);
        
        // Gain experience
        gainSkillExperience(skillId, xpGain);
        
        console.log(`+1 ${itemToAdd.name}, +${xpGain} ${skillId} XP`);
      } else {
        console.log('Inventory full! Cannot harvest resource.');
      }
    } else {
      console.log('This rock has no more resources');
    }
  };

  // Create different rock geometries
  const createRockGeometry = () => {
    switch (rockType) {
      case 0:
        // Irregular rock using noise-distorted sphere
        const geometry1 = new THREE.SphereGeometry(1, 8, 6);
        const positions1 = geometry1.attributes.position.array as Float32Array;
        for (let i = 0; i < positions1.length; i += 3) {
          const noise = (Math.random() - 0.5) * 0.3;
          positions1[i] *= (1 + noise);
          positions1[i + 1] *= (1 + noise);
          positions1[i + 2] *= (1 + noise);
        }
        geometry1.computeVertexNormals();
        return geometry1;

      case 1:
        // Angular rock using octahedron
        return new THREE.OctahedronGeometry(1.2, 1);

      case 2:
        // Boulder using dodecahedron
        return new THREE.DodecahedronGeometry(1, 0);

      default:
        return new THREE.SphereGeometry(1, 8, 6);
    }
  };

  return (
    <group 
      position={position}
      scale={[scale, scale, scale]}
      onClick={handleClick}
      onPointerEnter={() => setIsHighlighted(true)}
      onPointerLeave={() => setIsHighlighted(false)}
    >
      {/* Main Rock */}
      <mesh
        ref={meshRef}
        geometry={createRockGeometry()}
        castShadow
        receiveShadow
      >
        <meshLambertMaterial 
          color={isHighlighted ? '#A0A0A0' : '#696969'}
          roughness={0.8}
        />
      </mesh>

      {/* Smaller rocks around base for detail */}
      <mesh position={[0.8, -0.3, 0.3]} scale={[0.3, 0.3, 0.3]} receiveShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#555555" />
      </mesh>

      <mesh position={[-0.6, -0.2, -0.4]} scale={[0.2, 0.2, 0.2]} receiveShadow>
        <octahedronGeometry args={[1, 0]} />
        <meshLambertMaterial color="#666666" />
      </mesh>

      <mesh position={[0.2, -0.4, -0.8]} scale={[0.25, 0.25, 0.25]} receiveShadow>
        <sphereGeometry args={[1, 6, 4]} />
        <meshLambertMaterial color="#777777" />
      </mesh>

      {/* Harvest indicator when highlighted */}
      {isHighlighted && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.5, 1.8, 16]} />
          <meshBasicMaterial 
            color="#64ffda" 
            transparent 
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Mineral sparkles for iron ore deposits */}
      {rockType === 2 && ( // Only on dodecahedron rocks (iron ore)
        <group>
          {Array.from({ length: 5 }, (_, i) => (
            <mesh 
              key={i}
              position={[
                Math.cos(i * Math.PI * 2 / 5) * 0.8,
                0.2 + Math.sin(Date.now() * 0.002 + i) * 0.1,
                Math.sin(i * Math.PI * 2 / 5) * 0.8
              ]}
            >
              <sphereGeometry args={[0.03]} />
              <meshBasicMaterial 
                color="#FFD700" 
                transparent 
                opacity={0.8}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

export default Rock;
