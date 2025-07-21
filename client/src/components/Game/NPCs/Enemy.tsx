import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { Enemy as EnemyType, EnemyType as EnemyTypeEnum } from '../../../lib/types/GameTypes';
import { usePlayer } from '../../../lib/stores/usePlayer';
import { useWorld } from '../../../lib/stores/useWorld';
import { CombatSystem } from '../../../lib/systems/CombatSystem';

interface EnemyProps {
  enemyData: EnemyType;
}

const Enemy: React.FC<EnemyProps> = ({ enemyData }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { player, takeDamage } = usePlayer();
  const { updateEnemy, removeEnemy } = useWorld();
  
  const [lastAttackTime, setLastAttackTime] = useState(0);
  const [isChasing, setIsChasing] = useState(false);
  const [targetPosition, setTargetPosition] = useState<THREE.Vector3>(enemyData.position.clone());

  const ATTACK_COOLDOWN = 2000; // 2 seconds between attacks
  const AI_UPDATE_RATE = 100; // Update AI every 100ms
  const lastAIUpdate = useRef(0);

  // Get enemy appearance based on type
  const getEnemyAppearance = (type: EnemyTypeEnum) => {
    switch (type) {
      case EnemyTypeEnum.GOBLIN:
        return { color: '#4a5d23', scale: [0.8, 1.2, 0.8] as [number, number, number] };
      case EnemyTypeEnum.WOLF:
        return { color: '#654321', scale: [1.5, 1, 2] as [number, number, number] };
      case EnemyTypeEnum.ORC:
        return { color: '#2d4a2d', scale: [1.2, 2, 1.2] as [number, number, number] };
      case EnemyTypeEnum.BEAR:
        return { color: '#8b4513', scale: [2, 1.5, 2.5] as [number, number, number] };
      default:
        return { color: '#666666', scale: [1, 1, 1] as [number, number, number] };
    }
  };

  const appearance = getEnemyAppearance(enemyData.type);

  useFrame((state, delta) => {
    if (!enemyData.isAlive || !meshRef.current || !player) return;

    const currentTime = Date.now();
    const mesh = meshRef.current;
    
    // Update AI periodically
    if (currentTime - lastAIUpdate.current > AI_UPDATE_RATE) {
      const distanceToPlayer = enemyData.position.distanceTo(player.position);
      
      // Check if player is in aggro range
      if (distanceToPlayer <= enemyData.aggroRange && enemyData.isAggressive) {
        if (!isChasing) {
          setIsChasing(true);
          console.log(`${enemyData.name} is now chasing the player!`);
        }
        setTargetPosition(player.position.clone());
      } else if (isChasing && distanceToPlayer > enemyData.aggroRange * 1.5) {
        // Stop chasing if player gets too far
        setIsChasing(false);
        setTargetPosition(enemyData.position.clone());
        console.log(`${enemyData.name} stopped chasing`);
      }
      
      lastAIUpdate.current = currentTime;
    }

    // Movement AI
    if (isChasing) {
      const direction = new THREE.Vector3().subVectors(targetPosition, enemyData.position);
      const distance = direction.length();
      
      // Move towards player if not in attack range
      if (distance > enemyData.attackRange) {
        direction.normalize();
        const moveVector = direction.multiplyScalar(enemyData.moveSpeed * delta);
        
        const newPosition = enemyData.position.clone().add(moveVector);
        
        // Update enemy position
        updateEnemy(enemyData.id, { position: newPosition });
        
        // Rotate to face movement direction
        const targetRotation = Math.atan2(direction.x, direction.z);
        mesh.rotation.y = THREE.MathUtils.lerp(mesh.rotation.y, targetRotation, 5 * delta);
      }
      // Attack if in range and cooldown is ready
      else if (distance <= enemyData.attackRange && currentTime - lastAttackTime > ATTACK_COOLDOWN) {
        performAttack();
        setLastAttackTime(currentTime);
      }
    } else {
      // Idle behavior - simple wandering
      const wanderChance = delta * 0.5; // 50% chance per second to change direction
      if (Math.random() < wanderChance) {
        const randomDirection = new THREE.Vector3(
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        ).normalize();
        
        const wanderDistance = 2 + Math.random() * 3;
        const newTarget = enemyData.position.clone().add(
          randomDirection.multiplyScalar(wanderDistance)
        );
        
        setTargetPosition(newTarget);
      }
    }

    // Update mesh position to match enemy data
    mesh.position.copy(enemyData.position);
  });

  const performAttack = () => {
    if (!player) return;
    
    console.log(`${enemyData.name} attacks the player for ${enemyData.damage} damage!`);
    
    // Deal damage to player
    const actualDamage = CombatSystem.calculateDamage(enemyData.damage, 0); // Assuming 0 player defense for now
    takeDamage(actualDamage);
    
    // Visual attack effect (simple scale animation)
    if (meshRef.current) {
      const originalScale = meshRef.current.scale.clone();
      meshRef.current.scale.multiplyScalar(1.2);
      
      setTimeout(() => {
        if (meshRef.current) {
          meshRef.current.scale.copy(originalScale);
        }
      }, 200);
    }
  };

  const handleDeath = () => {
    console.log(`${enemyData.name} has been defeated!`);
    
    // Drop loot
    enemyData.lootTable.forEach(lootDrop => {
      if (Math.random() <= lootDrop.dropChance) {
        console.log(`Dropped ${lootDrop.quantity}x ${lootDrop.item.name}`);
        // This would integrate with the player's inventory system
      }
    });
    
    // Give experience to player
    console.log(`Player gained ${enemyData.experienceReward} experience!`);
    
    // Remove enemy from world
    setTimeout(() => {
      removeEnemy(enemyData.id);
    }, 1000); // Short delay for death animation
  };

  // Check if enemy should die
  useEffect(() => {
    if (enemyData.health <= 0 && enemyData.isAlive) {
      updateEnemy(enemyData.id, { isAlive: false });
      handleDeath();
    }
  }, [enemyData.health, enemyData.isAlive]);

  if (!enemyData.isAlive) {
    return null;
  }

  return (
    <group>
      {/* Enemy Body */}
      <mesh
        ref={meshRef}
        position={[enemyData.position.x, enemyData.position.y, enemyData.position.z]}
        scale={appearance.scale}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshPhongMaterial color={appearance.color} />
      </mesh>

      {/* Enemy Name Tag */}
      <group position={[enemyData.position.x, enemyData.position.y + 2, enemyData.position.z]}>
        <mesh>
          <planeGeometry args={[3, 0.4]} />
          <meshBasicMaterial 
            color={enemyData.isAggressive ? "#ff4444" : "#ffaa44"} 
            opacity={0.8} 
            transparent 
          />
        </mesh>
      </group>

      {/* Health Bar */}
      <group position={[enemyData.position.x, enemyData.position.y + 1.7, enemyData.position.z]}>
        {/* Background */}
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[2, 0.15]} />
          <meshBasicMaterial color="#333333" transparent opacity={0.8} />
        </mesh>
        {/* Health */}
        <mesh position={[-(1 - (enemyData.health / enemyData.maxHealth)), 0, 0.02]}>
          <planeGeometry args={[2 * (enemyData.health / enemyData.maxHealth), 0.1]} />
          <meshBasicMaterial color="#ff4444" />
        </mesh>
      </group>

      {/* Aggro Indicator */}
      {isChasing && (
        <group position={[enemyData.position.x, enemyData.position.y + 2.5, enemyData.position.z]}>
          <mesh>
            <sphereGeometry args={[0.2]} />
            <meshBasicMaterial color="#ff0000" />
          </mesh>
        </group>
      )}

      {/* Attack Range Indicator (debug) */}
      {isChasing && process.env.NODE_ENV === 'development' && (
        <mesh position={[enemyData.position.x, enemyData.position.y + 0.1, enemyData.position.z]}>
          <ringGeometry args={[enemyData.attackRange - 0.1, enemyData.attackRange, 16]} />
          <meshBasicMaterial color="#ff4444" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

export default Enemy;
