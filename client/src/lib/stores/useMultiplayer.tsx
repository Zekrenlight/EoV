import { create } from 'zustand';
import { PlayerCharacter, MultiplayerSession, NetworkMessage, MessageType } from '../types/GameTypes';
import { io, Socket } from 'socket.io-client';

interface MultiplayerState {
  isHost: boolean;
  isConnected: boolean;
  sessionId: string | null;
  connectedPlayers: PlayerCharacter[];
  socket: Socket | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  hostCode: string | null;
  chatMessages: Array<{
    id: string;
    sender: string;
    message: string;
    timestamp: number;
  }>;
  
  // Actions
  createSession: (hostName: string) => Promise<boolean>;
  joinSession: (hostCode: string, playerName: string) => Promise<boolean>;
  leaveSession: () => void;
  sendMessage: (type: MessageType, data: any) => void;
  sendChatMessage: (message: string) => void;
  updatePlayerPosition: (playerId: string, position: any) => void;
  syncInventory: (inventory: any[]) => void;
}

// Socket.io connection options
const SOCKET_OPTIONS = {
  transports: ['websocket', 'polling'],
  timeout: 5000,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
};

export const useMultiplayer = create<MultiplayerState>((set, get) => ({
  isHost: false,
  isConnected: false,
  sessionId: null,
  connectedPlayers: [],
  socket: null,
  connectionStatus: 'disconnected',
  hostCode: null,
  chatMessages: [],

  createSession: async (hostName) => {
    try {
      set({ connectionStatus: 'connecting' });
      
      // Connect to local server
      const socket = io('http://localhost:8000', SOCKET_OPTIONS);
      
      return new Promise((resolve) => {
        socket.on('connect', () => {
          console.log('Connected to multiplayer server as host');
          
          // Create a new session
          socket.emit('create_session', { hostName });
          
          socket.on('session_created', (data: { sessionId: string; hostCode: string }) => {
            set({
              socket,
              isHost: true,
              isConnected: true,
              sessionId: data.sessionId,
              hostCode: data.hostCode,
              connectionStatus: 'connected',
              connectedPlayers: [],
              chatMessages: [
                {
                  id: `msg_${Date.now()}`,
                  sender: 'System',
                  message: `Session created! Share code: ${data.hostCode}`,
                  timestamp: Date.now()
                }
              ]
            });
            
            console.log('Session created with code:', data.hostCode);
            resolve(true);
          });
        });
        
        socket.on('connect_error', (error) => {
          console.error('Connection failed:', error);
          set({ connectionStatus: 'error' });
          resolve(false);
        });
        
        // Set up event listeners
        setupSocketListeners(socket);
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      set({ connectionStatus: 'error' });
      return false;
    }
  },

  joinSession: async (hostCode, playerName) => {
    try {
      set({ connectionStatus: 'connecting' });
      
      const socket = io('http://localhost:8000', SOCKET_OPTIONS);
      
      return new Promise((resolve) => {
        socket.on('connect', () => {
          console.log('Connected to multiplayer server as client');
          
          socket.emit('join_session', { hostCode, playerName });
          
          socket.on('session_joined', (data: { sessionId: string; players: PlayerCharacter[] }) => {
            set({
              socket,
              isHost: false,
              isConnected: true,
              sessionId: data.sessionId,
              hostCode,
              connectionStatus: 'connected',
              connectedPlayers: data.players,
              chatMessages: [
                {
                  id: `msg_${Date.now()}`,
                  sender: 'System',
                  message: `Joined session: ${hostCode}`,
                  timestamp: Date.now()
                }
              ]
            });
            
            console.log('Joined session successfully');
            resolve(true);
          });
          
          socket.on('join_error', (error: string) => {
            console.error('Failed to join session:', error);
            set({ connectionStatus: 'error' });
            resolve(false);
          });
        });
        
        socket.on('connect_error', (error) => {
          console.error('Connection failed:', error);
          set({ connectionStatus: 'error' });
          resolve(false);
        });
        
        setupSocketListeners(socket);
      });
    } catch (error) {
      console.error('Failed to join session:', error);
      set({ connectionStatus: 'error' });
      return false;
    }
  },

  leaveSession: () => {
    const { socket } = get();
    
    if (socket) {
      socket.emit('leave_session');
      socket.disconnect();
    }
    
    set({
      isHost: false,
      isConnected: false,
      sessionId: null,
      connectedPlayers: [],
      socket: null,
      connectionStatus: 'disconnected',
      hostCode: null,
      chatMessages: []
    });
    
    console.log('Left multiplayer session');
  },

  sendMessage: (type, data) => {
    const { socket, sessionId } = get();
    
    if (socket && sessionId) {
      const message: NetworkMessage = {
        type,
        senderId: socket.id || 'unknown',
        timestamp: Date.now(),
        data
      };
      
      socket.emit('game_message', message);
    }
  },

  sendChatMessage: (message) => {
    const { socket } = get();
    
    if (socket && message.trim()) {
      socket.emit('chat_message', {
        sender: socket.id,
        message: message.trim(),
        timestamp: Date.now()
      });
      
      console.log('Sent chat message:', message);
    }
  },

  updatePlayerPosition: (playerId, position) => {
    get().sendMessage(MessageType.PLAYER_MOVE, {
      playerId,
      position,
      timestamp: Date.now()
    });
  },

  syncInventory: (inventory) => {
    get().sendMessage(MessageType.INVENTORY_UPDATE, {
      inventory,
      timestamp: Date.now()
    });
  }
}));

// Set up socket event listeners
function setupSocketListeners(socket: Socket) {
  const { set, get } = useMultiplayer;
  
  socket.on('player_joined', (player: PlayerCharacter) => {
    set((state) => ({
      connectedPlayers: [...state.connectedPlayers, player],
      chatMessages: [
        ...state.chatMessages,
        {
          id: `msg_${Date.now()}`,
          sender: 'System',
          message: `${player.name} joined the game`,
          timestamp: Date.now()
        }
      ]
    }));
    
    console.log('Player joined:', player.name);
  });
  
  socket.on('player_left', (playerId: string) => {
    set((state) => {
      const leavingPlayer = state.connectedPlayers.find(p => p.id === playerId);
      
      return {
        connectedPlayers: state.connectedPlayers.filter(p => p.id !== playerId),
        chatMessages: leavingPlayer ? [
          ...state.chatMessages,
          {
            id: `msg_${Date.now()}`,
            sender: 'System',
            message: `${leavingPlayer.name} left the game`,
            timestamp: Date.now()
          }
        ] : state.chatMessages
      };
    });
    
    console.log('Player left:', playerId);
  });
  
  socket.on('chat_message', (data: { sender: string; message: string; timestamp: number }) => {
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        {
          id: `msg_${Date.now()}`,
          sender: data.sender,
          message: data.message,
          timestamp: data.timestamp
        }
      ].slice(-50) // Keep only last 50 messages
    }));
  });
  
  socket.on('game_message', (message: NetworkMessage) => {
    // Handle different types of game messages
    switch (message.type) {
      case MessageType.PLAYER_MOVE:
        // Update player position for other players
        console.log('Player moved:', message.data);
        break;
        
      case MessageType.COMBAT_ACTION:
        // Handle combat actions
        console.log('Combat action:', message.data);
        break;
        
      case MessageType.INVENTORY_UPDATE:
        // Sync inventory changes
        console.log('Inventory updated:', message.data);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
  });
  
  socket.on('session_error', (error: string) => {
    console.error('Session error:', error);
    set({ connectionStatus: 'error' });
  });
  
  socket.on('disconnect', (reason: string) => {
    console.log('Disconnected from server:', reason);
    set({
      isConnected: false,
      connectionStatus: 'disconnected',
      chatMessages: [
        ...get().chatMessages,
        {
          id: `msg_${Date.now()}`,
          sender: 'System',
          message: 'Disconnected from server',
          timestamp: Date.now()
        }
      ]
    });
  });
  
  socket.on('reconnect', () => {
    console.log('Reconnected to server');
    set({
      isConnected: true,
      connectionStatus: 'connected',
      chatMessages: [
        ...get().chatMessages,
        {
          id: `msg_${Date.now()}`,
          sender: 'System',
          message: 'Reconnected to server',
          timestamp: Date.now()
        }
      ]
    });
  });
}
