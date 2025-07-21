import React, { useState, useEffect } from 'react';
import { useMultiplayer } from '../../lib/stores/useMultiplayer';

interface MultiplayerMenuProps {
  onReady: () => void;
  onBack: () => void;
  connectionStatus: string;
  isConnected: boolean;
}

const MultiplayerMenu: React.FC<MultiplayerMenuProps> = ({ onReady, onBack, connectionStatus, isConnected }) => {
  const { 
    createSession, 
    joinSession, 
    leaveSession, 
    hostCode, 
    connectedPlayers,
    chatMessages,
    sendChatMessage 
  } = useMultiplayer();
  
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [hostName, setHostName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [isJoiningSession, setIsJoiningSession] = useState(false);

  // Auto-generate default names
  useEffect(() => {
    if (!hostName) {
      setHostName(`Host_${Math.floor(Math.random() * 1000)}`);
    }
    if (!playerName) {
      setPlayerName(`Player_${Math.floor(Math.random() * 1000)}`);
    }
  }, []);

  const handleCreateSession = async () => {
    if (!hostName.trim()) {
      alert('Please enter a host name');
      return;
    }

    setIsCreatingSession(true);
    
    try {
      const success = await createSession(hostName.trim());
      if (success) {
        setMode('host');
        console.log('Session created successfully');
      } else {
        alert('Failed to create session. Make sure the server is running on port 8000.');
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Could not connect to multiplayer server. Please check your connection.');
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim() || !playerName.trim()) {
      alert('Please enter both join code and player name');
      return;
    }

    setIsJoiningSession(true);
    
    try {
      const success = await joinSession(joinCode.trim(), playerName.trim());
      if (success) {
        setMode('join');
        console.log('Joined session successfully');
      } else {
        alert('Failed to join session. Check the join code and try again.');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      alert('Could not connect to multiplayer server. Please check your connection.');
    } finally {
      setIsJoiningSession(false);
    }
  };

  const handleLeaveSession = () => {
    leaveSession();
    setMode('select');
  };

  const handleStartGame = () => {
    if (isConnected) {
      onReady();
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && isConnected) {
      sendChatMessage(chatInput);
      setChatInput('');
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-400';
      case 'connecting': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢 Connected';
      case 'connecting': return '🟡 Connecting...';
      case 'error': return '🔴 Connection Error';
      default: return '⚪ Disconnected';
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-valtara-bg via-valtara-bg-light to-valtara-bg flex items-center justify-center p-4">
      <div className="game-panel w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="game-panel-header flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Multiplayer Co-op</h2>
            <div className={`text-sm ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </div>
          </div>
          <button onClick={onBack} className="text-2xl hover:text-red-400">
            ←
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
          {mode === 'select' && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-valtara-primary mb-2">
                  Join Friends in Valtara
                </h3>
                <p className="text-valtara-text-muted">
                  Create or join a local/LAN session to play with up to 8 players
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Host Session */}
                <div className="game-panel p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-valtara-secondary">
                    🏠 Host Session
                  </h4>
                  
                  <p className="text-sm text-valtara-text-muted">
                    Create a new multiplayer session and invite friends to join your world
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-valtara-text mb-2">
                      Host Name
                    </label>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="Enter your host name"
                      className="game-input w-full"
                      maxLength={20}
                    />
                  </div>

                  <button
                    onClick={handleCreateSession}
                    disabled={isCreatingSession || !hostName.trim()}
                    className={`game-button w-full py-3 ${
                      isCreatingSession ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isCreatingSession ? '🔄 Creating...' : '🏠 Create Session'}
                  </button>

                  <div className="text-xs text-valtara-text-muted">
                    • You'll get a join code to share with friends<br/>
                    • Your world will be the main game world<br/>
                    • Up to 8 players can join
                  </div>
                </div>

                {/* Join Session */}
                <div className="game-panel p-6 space-y-4">
                  <h4 className="text-lg font-semibold text-valtara-secondary">
                    🚪 Join Session
                  </h4>
                  
                  <p className="text-sm text-valtara-text-muted">
                    Enter a friend's session code to join their world
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-valtara-text mb-2">
                      Player Name
                    </label>
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter your player name"
                      className="game-input w-full"
                      maxLength={20}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-valtara-text mb-2">
                      Join Code
                    </label>
                    <input
                      type="text"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      placeholder="Enter session code"
                      className="game-input w-full font-mono"
                      maxLength={10}
                    />
                  </div>

                  <button
                    onClick={handleJoinSession}
                    disabled={isJoiningSession || !joinCode.trim() || !playerName.trim()}
                    className={`game-button w-full py-3 ${
                      isJoiningSession ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {isJoiningSession ? '🔄 Joining...' : '🚪 Join Session'}
                  </button>

                  <div className="text-xs text-valtara-text-muted">
                    • Get the join code from your friend<br/>
                    • You'll join their world and progress<br/>
                    • All players must have the same version
                  </div>
                </div>
              </div>

              {/* Multiplayer Info */}
              <div className="game-panel p-4">
                <h4 className="font-semibold text-valtara-secondary mb-2">Multiplayer Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-valtara-primary font-semibold">🤝 Cooperation</div>
                    <div className="text-valtara-text-muted">Work together on quests, share resources, trade items</div>
                  </div>
                  <div>
                    <div className="text-valtara-primary font-semibold">🌍 Shared World</div>
                    <div className="text-valtara-text-muted">Explore the same world, persistent changes for all</div>
                  </div>
                  <div>
                    <div className="text-valtara-primary font-semibold">💬 Communication</div>
                    <div className="text-valtara-text-muted">Built-in chat system for coordination</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(mode === 'host' || mode === 'join') && isConnected && (
            <div className="space-y-6">
              {/* Session Info */}
              <div className="game-panel p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-valtara-primary">
                    {mode === 'host' ? '🏠 Hosting Session' : '🚪 In Session'}
                  </h3>
                  <button
                    onClick={handleLeaveSession}
                    className="game-button secondary py-2 px-4"
                  >
                    Leave Session
                  </button>
                </div>

                {mode === 'host' && hostCode && (
                  <div className="mb-4 p-3 bg-valtara-primary bg-opacity-20 rounded">
                    <div className="text-sm font-semibold text-valtara-primary mb-1">
                      Session Code (Share with friends):
                    </div>
                    <div className="text-2xl font-mono font-bold text-valtara-primary">
                      {hostCode}
                    </div>
                    <div className="text-xs text-valtara-text-muted mt-1">
                      Friends can use this code to join your session
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Connected Players */}
                  <div>
                    <h4 className="font-semibold text-valtara-secondary mb-2">
                      Connected Players ({connectedPlayers.length + 1}/8)
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      <div className="flex items-center gap-2 p-2 bg-green-900 bg-opacity-30 rounded">
                        <span className="text-green-400">🟢</span>
                        <span className="text-valtara-text">
                          {mode === 'host' ? hostName : 'You'} 
                          {mode === 'host' && ' (Host)'}
                        </span>
                      </div>
                      {connectedPlayers.map((player, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-valtara-bg-light rounded">
                          <span className="text-green-400">🟢</span>
                          <span className="text-valtara-text">{player.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Session Settings */}
                  <div>
                    <h4 className="font-semibold text-valtara-secondary mb-2">Session Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-valtara-text-muted">Max Players:</span>
                        <span className="text-valtara-text">8</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-valtara-text-muted">World Seed:</span>
                        <span className="text-valtara-text font-mono">#{Math.floor(Math.random() * 999999)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-valtara-text-muted">Difficulty:</span>
                        <span className="text-valtara-text">Balanced</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-valtara-text-muted">PvP:</span>
                        <span className="text-valtara-text">Disabled</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="game-panel p-4">
                <h4 className="font-semibold text-valtara-secondary mb-3">Chat</h4>
                
                <div className="bg-valtara-bg h-32 overflow-y-auto p-2 rounded mb-3">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-valtara-text-muted text-sm py-4">
                      No messages yet. Say hello to your party!
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {chatMessages.slice(-10).map((msg) => (
                        <div key={msg.id} className="text-sm">
                          <span className="font-semibold text-valtara-primary">
                            {msg.sender}:
                          </span>{' '}
                          <span className="text-valtara-text">{msg.message}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="game-input flex-1"
                    maxLength={100}
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="game-button px-4"
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Start Game */}
              <div className="text-center">
                <button
                  onClick={handleStartGame}
                  className="game-button py-4 px-8 text-lg font-bold"
                >
                  🎮 Start Multiplayer Adventure
                </button>
                <p className="text-xs text-valtara-text-muted mt-2">
                  {mode === 'host' 
                    ? 'All players will start character creation when you begin'
                    : 'Waiting for host to start the game...'
                  }
                </p>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="game-panel p-6 text-center">
              <div className="text-red-400 text-4xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Connection Failed</h3>
              <p className="text-valtara-text-muted mb-4">
                Could not connect to the multiplayer server. Please make sure:
              </p>
              <ul className="text-left text-sm text-valtara-text space-y-1 max-w-md mx-auto">
                <li>• The server is running on port 8000</li>
                <li>• Your firewall allows the connection</li>
                <li>• You're on the same network (for LAN play)</li>
                <li>• The session code is correct (for joining)</li>
              </ul>
              <button
                onClick={() => setMode('select')}
                className="game-button mt-4"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiplayerMenu;
