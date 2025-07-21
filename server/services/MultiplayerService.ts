import { Server as SocketIOServer } from "socket.io";

export interface GameSession {
  id: string;
  hostCode: string;
  hostId: string;
  hostName: string;
  players: SessionPlayer[];
  maxPlayers: number;
  isPublic: boolean;
  createdAt: number;
  lastActivity: number;
  worldSeed: number;
  gameState: GameSessionState;
}

export interface SessionPlayer {
  id: string;
  socketId: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
  position?: { x: number; y: number; z: number };
  level: number;
  isHost: boolean;
  inventory?: any[];
  stats?: any;
}

export interface GameSessionState {
  worldTime: number;
  season: string;
  harvestedResources: string[];
  defeatedEnemies: string[];
  sharedInventory: any[];
  economyState: any;
}

export class MultiplayerService {
  private io: SocketIOServer;
  private sessions: Map<string, GameSession>;
  private playerSessions: Map<string, string>; // socketId -> sessionId
  private hostCodes: Map<string, string>; // hostCode -> sessionId
  
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_SESSIONS = 50;
  private readonly MAX_PLAYERS_PER_SESSION = 8;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.sessions = new Map();
    this.playerSessions = new Map();
    this.hostCodes = new Map();
    
    console.log("MultiplayerService initialized");
  }

  // Session management
  async createSession(hostSocketId: string, hostName: string): Promise<GameSession | null> {
    try {
      // Check session limits
      if (this.sessions.size >= this.MAX_SESSIONS) {
        console.warn("Maximum number of sessions reached");
        return null;
      }

      // Generate unique session ID and host code
      const sessionId = this.generateSessionId();
      const hostCode = this.generateHostCode();
      
      // Create initial game state
      const gameState: GameSessionState = {
        worldTime: 0,
        season: 'spring',
        harvestedResources: [],
        defeatedEnemies: [],
        sharedInventory: [],
        economyState: {}
      };

      // Create host player
      const hostPlayer: SessionPlayer = {
        id: `player_${Date.now()}`,
        socketId: hostSocketId,
        name: hostName,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        level: 1,
        isHost: true
      };

      // Create session
      const session: GameSession = {
        id: sessionId,
        hostCode,
        hostId: hostSocketId,
        hostName,
        players: [hostPlayer],
        maxPlayers: this.MAX_PLAYERS_PER_SESSION,
        isPublic: false,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        worldSeed: Math.floor(Math.random() * 1000000),
        gameState
      };

      // Store session
      this.sessions.set(sessionId, session);
      this.playerSessions.set(hostSocketId, sessionId);
      this.hostCodes.set(hostCode, sessionId);

      console.log(`Session created: ${sessionId} with code: ${hostCode}`);
      return session;
    } catch (error) {
      console.error("Error creating session:", error);
      return null;
    }
  }

  async joinSession(
    socketId: string, 
    hostCode: string, 
    playerName: string
  ): Promise<{ success: boolean; session?: GameSession; error?: string }> {
    try {
      const sessionId = this.hostCodes.get(hostCode);
      if (!sessionId) {
        return { success: false, error: "Invalid session code" };
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return { success: false, error: "Session not found" };
      }

      // Check if session is full
      if (session.players.length >= session.maxPlayers) {
        return { success: false, error: "Session is full" };
      }

      // Check if player is already in a session
      if (this.playerSessions.has(socketId)) {
        return { success: false, error: "Player already in a session" };
      }

      // Create player
      const player: SessionPlayer = {
        id: `player_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        socketId,
        name: playerName,
        joinedAt: Date.now(),
        lastSeen: Date.now(),
        level: 1,
        isHost: false
      };

      // Add player to session
      session.players.push(player);
      session.lastActivity = Date.now();

      // Update mappings
      this.playerSessions.set(socketId, sessionId);

      console.log(`Player ${playerName} joined session ${sessionId}`);
      return { success: true, session };
    } catch (error) {
      console.error("Error joining session:", error);
      return { success: false, error: "Internal server error" };
    }
  }

  removePlayerFromSession(socketId: string): boolean {
    try {
      const sessionId = this.playerSessions.get(socketId);
      if (!sessionId) {
        return false;
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      // Find and remove player
      const playerIndex = session.players.findIndex(p => p.socketId === socketId);
      if (playerIndex === -1) {
        return false;
      }

      const removedPlayer = session.players[playerIndex];
      session.players.splice(playerIndex, 1);
      session.lastActivity = Date.now();

      // Remove from mappings
      this.playerSessions.delete(socketId);

      // If the host left, transfer host to another player or close session
      if (removedPlayer.isHost) {
        if (session.players.length > 0) {
          // Transfer host to the next player
          session.players[0].isHost = true;
          session.hostId = session.players[0].socketId;
          session.hostName = session.players[0].name;
          
          console.log(`Host transferred to ${session.players[0].name} in session ${sessionId}`);
        } else {
          // No players left, schedule session for deletion
          this.deleteSession(sessionId);
          return true;
        }
      }

      console.log(`Player ${removedPlayer.name} removed from session ${sessionId}`);
      return true;
    } catch (error) {
      console.error("Error removing player from session:", error);
      return false;
    }
  }

  deleteSession(sessionId: string): boolean {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }

      // Remove all player mappings
      session.players.forEach(player => {
        this.playerSessions.delete(player.socketId);
      });

      // Remove host code mapping
      this.hostCodes.delete(session.hostCode);

      // Remove session
      this.sessions.delete(sessionId);

      console.log(`Session deleted: ${sessionId}`);
      return true;
    } catch (error) {
      console.error("Error deleting session:", error);
      return false;
    }
  }

  // Player management
  updatePlayerActivity(socketId: string): void {
    const sessionId = this.playerSessions.get(socketId);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const player = session.players.find(p => p.socketId === socketId);
    if (player) {
      player.lastSeen = Date.now();
      session.lastActivity = Date.now();
    }
  }

  updatePlayerPosition(socketId: string, position: { x: number; y: number; z: number }): void {
    const sessionId = this.playerSessions.get(socketId);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const player = session.players.find(p => p.socketId === socketId);
    if (player) {
      player.position = position;
      player.lastSeen = Date.now();
      session.lastActivity = Date.now();
    }
  }

  updatePlayerInventory(socketId: string, inventory: any[]): void {
    const sessionId = this.playerSessions.get(socketId);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const player = session.players.find(p => p.socketId === socketId);
    if (player) {
      player.inventory = inventory;
      player.lastSeen = Date.now();
    }
  }

  updatePlayerStats(socketId: string, stats: any): void {
    const sessionId = this.playerSessions.get(socketId);
    if (!sessionId) return;

    const session = this.sessions.get(sessionId);
    if (!session) return;

    const player = session.players.find(p => p.socketId === socketId);
    if (player) {
      player.stats = stats;
      player.lastSeen = Date.now();
    }
  }

  // Session queries
  getPlayerSession(socketId: string): GameSession | null {
    const sessionId = this.playerSessions.get(socketId);
    return sessionId ? this.sessions.get(sessionId) || null : null;
  }

  getSession(sessionId: string): GameSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getPublicSessions(): Array<{ id: string; hostName: string; playerCount: number; maxPlayers: number }> {
    return Array.from(this.sessions.values())
      .filter(session => session.isPublic)
      .map(session => ({
        id: session.id,
        hostName: session.hostName,
        playerCount: session.players.length,
        maxPlayers: session.maxPlayers
      }));
  }

  validateSessionCode(hostCode: string): boolean {
    return this.hostCodes.has(hostCode);
  }

  getActiveSessionCount(): number {
    return this.sessions.size;
  }

  getTotalPlayerCount(): number {
    return Array.from(this.sessions.values()).reduce(
      (total, session) => total + session.players.length, 
      0
    );
  }

  // Session cleanup
  cleanupInactiveSessions(): void {
    const now = Date.now();
    const inactiveSessions: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.SESSION_TIMEOUT) {
        inactiveSessions.push(sessionId);
      }
    }

    inactiveSessions.forEach(sessionId => {
      console.log(`Cleaning up inactive session: ${sessionId}`);
      this.deleteSession(sessionId);
    });

    if (inactiveSessions.length > 0) {
      console.log(`Cleaned up ${inactiveSessions.length} inactive sessions`);
    }
  }

  // Game state management
  updateGameState(sessionId: string, stateUpdate: Partial<GameSessionState>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.gameState = { ...session.gameState, ...stateUpdate };
    session.lastActivity = Date.now();
    
    return true;
  }

  addHarvestedResource(sessionId: string, resourceId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (!session.gameState.harvestedResources.includes(resourceId)) {
      session.gameState.harvestedResources.push(resourceId);
      session.lastActivity = Date.now();
    }
    
    return true;
  }

  addDefeatedEnemy(sessionId: string, enemyId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (!session.gameState.defeatedEnemies.includes(enemyId)) {
      session.gameState.defeatedEnemies.push(enemyId);
      session.lastActivity = Date.now();
    }
    
    return true;
  }

  // Utility methods
  isActive(): boolean {
    return this.sessions.size > 0;
  }

  getSessionStats(): {
    totalSessions: number;
    totalPlayers: number;
    averagePlayersPerSession: number;
    oldestSession: number;
    newestSession: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const totalSessions = sessions.length;
    const totalPlayers = sessions.reduce((sum, session) => sum + session.players.length, 0);
    
    let oldestSession = Date.now();
    let newestSession = 0;
    
    sessions.forEach(session => {
      if (session.createdAt < oldestSession) oldestSession = session.createdAt;
      if (session.createdAt > newestSession) newestSession = session.createdAt;
    });

    return {
      totalSessions,
      totalPlayers,
      averagePlayersPerSession: totalSessions > 0 ? totalPlayers / totalSessions : 0,
      oldestSession,
      newestSession
    };
  }

  // Private utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateHostCode(): string {
    // Generate a 6-character alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Ensure uniqueness
    if (this.hostCodes.has(code)) {
      return this.generateHostCode();
    }
    
    return code;
  }
}
