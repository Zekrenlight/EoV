import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { MultiplayerService } from "./services/MultiplayerService";
import { GameWorldService } from "./services/GameWorldService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling']
  });

  // Initialize services
  const multiplayerService = new MultiplayerService(io);
  const gameWorldService = new GameWorldService();

  // REST API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        multiplayer: multiplayerService.isActive(),
        gameWorld: gameWorldService.isActive()
      }
    });
  });

  app.get("/api/server-info", (req, res) => {
    res.json({
      version: "1.0.0",
      maxPlayers: 8,
      activeSessions: multiplayerService.getActiveSessionCount(),
      connectedPlayers: multiplayerService.getTotalPlayerCount(),
      worldSeed: gameWorldService.getCurrentWorldSeed(),
      uptime: process.uptime()
    });
  });

  app.get("/api/sessions", (req, res) => {
    const sessions = multiplayerService.getPublicSessions();
    res.json(sessions);
  });

  app.post("/api/sessions/validate", (req, res) => {
    const { sessionCode } = req.body;
    
    if (!sessionCode) {
      return res.status(400).json({ error: "Session code is required" });
    }

    const isValid = multiplayerService.validateSessionCode(sessionCode);
    res.json({ valid: isValid });
  });

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    console.log(`New connection: ${socket.id}`);

    // Session management
    socket.on("create_session", async (data) => {
      try {
        const { hostName } = data;
        const session = await multiplayerService.createSession(socket.id, hostName);
        
        if (session) {
          socket.join(session.id);
          socket.emit("session_created", {
            sessionId: session.id,
            hostCode: session.hostCode
          });
          
          console.log(`Session created: ${session.id} by ${hostName}`);
        } else {
          socket.emit("session_error", "Failed to create session");
        }
      } catch (error) {
        console.error("Error creating session:", error);
        socket.emit("session_error", "Internal server error");
      }
    });

    socket.on("join_session", async (data) => {
      try {
        const { hostCode, playerName } = data;
        const result = await multiplayerService.joinSession(socket.id, hostCode, playerName);
        
        if (result.success && result.session) {
          socket.join(result.session.id);
          
          // Notify the player they joined successfully
          socket.emit("session_joined", {
            sessionId: result.session.id,
            players: result.session.players
          });
          
          // Notify other players in the session
          socket.to(result.session.id).emit("player_joined", {
            id: socket.id,
            name: playerName
          });
          
          console.log(`Player ${playerName} joined session ${result.session.id}`);
        } else {
          socket.emit("join_error", result.error || "Failed to join session");
        }
      } catch (error) {
        console.error("Error joining session:", error);
        socket.emit("join_error", "Internal server error");
      }
    });

    socket.on("leave_session", () => {
      multiplayerService.removePlayerFromSession(socket.id);
      console.log(`Player left session: ${socket.id}`);
    });

    // Game state synchronization
    socket.on("player_update", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        socket.to(session.id).emit("player_update", {
          playerId: socket.id,
          ...data
        });
      }
    });

    socket.on("game_message", (message) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        socket.to(session.id).emit("game_message", {
          ...message,
          senderId: socket.id
        });
      }
    });

    // Chat system
    socket.on("chat_message", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        const message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          sender: data.sender || socket.id,
          message: data.message,
          timestamp: Date.now()
        };
        
        // Broadcast to all players in the session
        io.to(session.id).emit("chat_message", message);
        console.log(`Chat message in session ${session.id}: ${message.message}`);
      }
    });

    // World synchronization
    socket.on("world_update", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        // Update world state and broadcast to other players
        gameWorldService.updateWorldState(session.id, data);
        socket.to(session.id).emit("world_update", data);
      }
    });

    socket.on("resource_harvested", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        // Update resource state for all players
        gameWorldService.harvestResource(session.id, data.resourceId);
        socket.to(session.id).emit("resource_harvested", {
          resourceId: data.resourceId,
          harvestedBy: socket.id,
          timestamp: Date.now()
        });
      }
    });

    socket.on("enemy_defeated", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        gameWorldService.removeEnemy(session.id, data.enemyId);
        socket.to(session.id).emit("enemy_defeated", {
          enemyId: data.enemyId,
          defeatedBy: socket.id,
          experience: data.experience,
          loot: data.loot,
          timestamp: Date.now()
        });
      }
    });

    // Combat synchronization
    socket.on("combat_action", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        socket.to(session.id).emit("combat_action", {
          ...data,
          playerId: socket.id,
          timestamp: Date.now()
        });
      }
    });

    // Inventory and trading
    socket.on("inventory_sync", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        // Store player inventory state
        multiplayerService.updatePlayerInventory(socket.id, data.inventory);
      }
    });

    socket.on("trade_request", (data) => {
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        const targetSocket = data.targetPlayerId;
        socket.to(targetSocket).emit("trade_request", {
          fromPlayer: socket.id,
          fromPlayerName: data.playerName,
          timestamp: Date.now()
        });
      }
    });

    socket.on("trade_response", (data) => {
      const targetSocket = data.targetPlayerId;
      socket.to(targetSocket).emit("trade_response", {
        fromPlayer: socket.id,
        accepted: data.accepted,
        timestamp: Date.now()
      });
    });

    // Error handling
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });

    // Disconnect handling
    socket.on("disconnect", (reason) => {
      console.log(`Player disconnected: ${socket.id} (${reason})`);
      
      const session = multiplayerService.getPlayerSession(socket.id);
      if (session) {
        // Notify other players
        socket.to(session.id).emit("player_left", socket.id);
        
        // Remove player from session
        multiplayerService.removePlayerFromSession(socket.id);
        
        // Clean up session if empty
        if (session.players.length === 0) {
          multiplayerService.deleteSession(session.id);
          console.log(`Empty session cleaned up: ${session.id}`);
        }
      }
    });

    // Heartbeat for connection monitoring
    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  // Periodic cleanup of inactive sessions
  setInterval(() => {
    multiplayerService.cleanupInactiveSessions();
    gameWorldService.cleanupOldWorldStates();
  }, 300000); // Every 5 minutes

  console.log("✅ Multiplayer routes and services initialized");
  
  return httpServer;
}
