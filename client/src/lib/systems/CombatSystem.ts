import { PlayerCharacter, Enemy } from '../types/GameTypes';
import * as THREE from 'three';

export interface CombatParticipant {
  id: string;
  name: string;
  level: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stats: {
    attack: number;
    defense: number;
    accuracy: number;
    criticalChance: number;
    speed: number;
  };
  statusEffects: StatusEffect[];
  position: THREE.Vector3;
  isPlayer: boolean;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff' | 'neutral';
  duration: number;
  effect: any;
  stackable: boolean;
  stacks: number;
}

export interface CombatAction {
  id: string;
  type: 'attack' | 'defend' | 'special' | 'item' | 'flee';
  actorId: string;
  targetId?: string;
  damage?: number;
  healing?: number;
  manaCost?: number;
  cooldown?: number;
  accuracy?: number;
  criticalHit?: boolean;
  statusEffects?: StatusEffect[];
  timestamp: number;
}

export interface CombatSession {
  id: string;
  participants: CombatParticipant[];
  turnOrder: string[];
  currentTurnIndex: number;
  round: number;
  startTime: number;
  endTime?: number;
  status: 'active' | 'ended' | 'paused';
  environment: string;
  rewards: CombatReward[];
  actions: CombatAction[];
}

export interface CombatReward {
  type: 'experience' | 'item' | 'gold';
  value: number;
  itemId?: string;
  recipientId: string;
}

export class CombatSystem {
  private activeCombats: Map<string, CombatSession> = new Map();
  private combatCallbacks: Map<string, (session: CombatSession) => void> = new Map();

  // Combat calculations
  calculateDamage(
    baseDamage: number,
    defense: number,
    damageModifiers: number[] = []
  ): number {
    let damage = baseDamage;
    
    // Apply modifiers
    damageModifiers.forEach(modifier => {
      damage *= modifier;
    });
    
    // Apply defense reduction
    const defenseReduction = Math.max(0, defense * 0.5);
    damage = Math.max(1, damage - defenseReduction);
    
    return Math.round(damage);
  }

  calculateHitChance(
    attackerLevel: number,
    defenderLevel: number,
    accuracy: number = 1.0
  ): number {
    const levelDifference = attackerLevel - defenderLevel;
    const baseChance = 0.8 + (levelDifference * 0.02);
    const finalChance = Math.min(0.95, Math.max(0.05, baseChance * accuracy));
    
    return finalChance;
  }

  calculateCriticalChance(
    baseCritChance: number,
    critModifiers: number[] = []
  ): number {
    let critChance = baseCritChance;
    
    critModifiers.forEach(modifier => {
      critChance += modifier;
    });
    
    return Math.min(1.0, Math.max(0.0, critChance));
  }

  calculateExperienceGain(
    enemyLevel: number,
    playerLevel: number,
    baseExperience: number
  ): number {
    const levelDifference = enemyLevel - playerLevel;
    const experienceMultiplier = Math.max(0.1, 1 + (levelDifference * 0.1));
    
    return Math.round(baseExperience * experienceMultiplier);
  }

  // Combat actions
  performAttack(
    attacker: CombatParticipant,
    target: CombatParticipant,
    combatId: string
  ): CombatAction {
    const session = this.activeCombats.get(combatId);
    if (!session) {
      throw new Error(`Combat session ${combatId} not found`);
    }

    const hitChance = this.calculateHitChance(
      attacker.level,
      target.level,
      attacker.stats.accuracy
    );

    const action: CombatAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'attack',
      actorId: attacker.id,
      targetId: target.id,
      timestamp: Date.now()
    };

    if (Math.random() <= hitChance) {
      // Hit successful
      const critChance = this.calculateCriticalChance(attacker.stats.criticalChance);
      const isCritical = Math.random() <= critChance;
      
      const baseDamage = attacker.stats.attack;
      const criticalMultiplier = isCritical ? 1.5 : 1.0;
      const damage = this.calculateDamage(
        baseDamage * criticalMultiplier,
        target.stats.defense
      );

      action.damage = damage;
      action.criticalHit = isCritical;
      
      // Apply damage to target
      target.health = Math.max(0, target.health - damage);
      
      // Check if target is defeated
      if (target.health === 0) {
        this.handleParticipantDefeated(target, session);
      }
    } else {
      // Miss
      action.damage = 0;
    }

    // Add action to session
    session.actions.push(action);
    this.triggerCombatUpdate(combatId, session);
    
    return action;
  }

  performDefend(defender: CombatParticipant): CombatAction {
    return {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'defend',
      actorId: defender.id,
      timestamp: Date.now()
    };
  }

  performSpecialAttack(
    attacker: CombatParticipant,
    target: CombatParticipant,
    specialType: string
  ): CombatAction {
    const action: CombatAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'special',
      actorId: attacker.id,
      targetId: target.id,
      timestamp: Date.now()
    };

    switch (specialType) {
      case 'power_strike':
        // Deal 1.5x damage but reduce accuracy
        const powerDamage = this.calculateDamage(
          attacker.stats.attack * 1.5,
          target.stats.defense
        );
        const powerHitChance = this.calculateHitChance(
          attacker.level,
          target.level,
          attacker.stats.accuracy * 0.8
        );
        
        if (Math.random() <= powerHitChance) {
          action.damage = powerDamage;
          target.health = Math.max(0, target.health - powerDamage);
        } else {
          action.damage = 0;
        }
        break;

      case 'heal':
        const healAmount = Math.round(attacker.maxHealth * 0.3);
        attacker.health = Math.min(attacker.maxHealth, attacker.health + healAmount);
        action.healing = healAmount;
        action.targetId = attacker.id;
        break;

      default:
        console.warn(`Unknown special attack type: ${specialType}`);
    }

    return action;
  }

  // Combat session management
  startCombat(participants: CombatParticipant[]): string {
    const combatId = `combat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Sort participants by speed for turn order
    const turnOrder = participants
      .sort((a, b) => b.stats.speed - a.stats.speed)
      .map(p => p.id);

    const session: CombatSession = {
      id: combatId,
      participants: [...participants],
      turnOrder,
      currentTurnIndex: 0,
      round: 1,
      startTime: Date.now(),
      status: 'active',
      environment: 'default',
      rewards: [],
      actions: []
    };

    this.activeCombats.set(combatId, session);
    console.log(`Combat started: ${combatId}`);
    
    return combatId;
  }

  endCombat(combatId: string): CombatSession | null {
    const session = this.activeCombats.get(combatId);
    if (!session) return null;

    session.status = 'ended';
    session.endTime = Date.now();
    
    // Process rewards
    this.processCombatRewards(session);
    
    // Clean up
    this.activeCombats.delete(combatId);
    this.triggerCombatUpdate(combatId, session);
    
    console.log(`Combat ended: ${combatId}`);
    return session;
  }

  private processCombatRewards(session: CombatSession): void {
    const survivors = session.participants.filter(p => p.health > 0);
    const defeated = session.participants.filter(p => p.health === 0);

    survivors.forEach(survivor => {
      if (survivor.isPlayer) {
        // Award experience based on defeated enemies
        defeated.forEach(enemy => {
          if (!enemy.isPlayer) {
            const expGain = this.calculateExperienceGain(
              enemy.level,
              survivor.level,
              enemy.level * 25
            );

            const reward: CombatReward = {
              type: 'experience',
              value: expGain,
              recipientId: survivor.id
            };
            session.rewards.push(reward);
          }
        });

        // Award gold
        const goldReward: CombatReward = {
          type: 'gold',
          value: Math.floor(Math.random() * 100) + 50,
          recipientId: survivor.id
        };
        session.rewards.push(goldReward);
      }
    });
  }

  // Turn management
  getCurrentTurn(combatId: string): string | null {
    const session = this.activeCombats.get(combatId);
    if (!session || session.status !== 'active') return null;

    return session.turnOrder[session.currentTurnIndex];
  }

  nextTurn(combatId: string): void {
    const session = this.activeCombats.get(combatId);
    if (!session || session.status !== 'active') return;

    session.currentTurnIndex = (session.currentTurnIndex + 1) % session.turnOrder.length;
    
    // Check if we completed a full round
    if (session.currentTurnIndex === 0) {
      session.round++;
    }

    // Process status effects
    this.processStatusEffects(session);
    
    // Check win conditions
    if (this.checkCombatEnd(session)) {
      this.endCombat(combatId);
    } else {
      this.triggerCombatUpdate(combatId, session);
    }
  }

  private processStatusEffects(session: CombatSession): void {
    session.participants.forEach(participant => {
      participant.statusEffects = participant.statusEffects.filter(effect => {
        effect.duration--;
        
        if (effect.duration <= 0) {
          console.log(`Status effect ${effect.name} expired for ${participant.name}`);
          return false;
        }
        return true;
      });
    });
  }

  private checkCombatEnd(session: CombatSession): boolean {
    const alivePlayers = session.participants.filter(p => p.isPlayer && p.health > 0);
    const aliveEnemies = session.participants.filter(p => !p.isPlayer && p.health > 0);
    
    return alivePlayers.length === 0 || aliveEnemies.length === 0;
  }

  private handleParticipantDefeated(participant: CombatParticipant, session: CombatSession): void {
    console.log(`${participant.name} has been defeated in combat ${session.id}`);
    
    // Remove from turn order if present
    const turnIndex = session.turnOrder.indexOf(participant.id);
    if (turnIndex !== -1) {
      session.turnOrder.splice(turnIndex, 1);
      
      // Adjust current turn index if necessary
      if (session.currentTurnIndex >= turnIndex) {
        session.currentTurnIndex = Math.max(0, session.currentTurnIndex - 1);
      }
    }
  }

  // Utility methods
  getCombatSession(combatId: string): CombatSession | null {
    return this.activeCombats.get(combatId) || null;
  }

  getParticipant(combatId: string, participantId: string): CombatParticipant | null {
    const session = this.activeCombats.get(combatId);
    if (!session) return null;

    return session.participants.find(p => p.id === participantId) || null;
  }

  isInCombat(participantId: string): boolean {
    for (const session of this.activeCombats.values()) {
      if (session.participants.some(p => p.id === participantId)) {
        return true;
      }
    }
    return false;
  }

  // Event handling
  onCombatUpdate(combatId: string, callback: (session: CombatSession) => void): void {
    this.combatCallbacks.set(combatId, callback);
  }

  private triggerCombatUpdate(combatId: string, session: CombatSession): void {
    const callback = this.combatCallbacks.get(combatId);
    if (callback) {
      callback(session);
    }
  }

  // AI combat behavior
  performAIAction(participantId: string, combatId: string): CombatAction | null {
    const session = this.activeCombats.get(combatId);
    if (!session) return null;

    const participant = session.participants.find(p => p.id === participantId);
    if (!participant || participant.isPlayer) return null;

    // Find valid targets (players)
    const targets = session.participants.filter(p => p.isPlayer && p.health > 0);
    if (targets.length === 0) return null;

    // Simple AI: attack the player with lowest health
    const target = targets.reduce((lowest, current) => 
      current.health < lowest.health ? current : lowest
    );

    // Decide action based on AI's health
    const healthPercentage = participant.health / participant.maxHealth;
    
    if (healthPercentage < 0.3 && Math.random() < 0.4) {
      // Low health: chance to heal
      return this.performSpecialAttack(participant, participant, 'heal');
    } else if (Math.random() < 0.2) {
      // Small chance for special attack
      return this.performSpecialAttack(participant, target, 'power_strike');
    } else {
      // Default: regular attack
      return this.performAttack(participant, target, combatId);
    }
  }

  // Cleanup
  cleanup(): void {
    this.activeCombats.clear();
    this.combatCallbacks.clear();
    console.log('CombatSystem cleaned up');
  }
}

export const combatSystem = new CombatSystem();