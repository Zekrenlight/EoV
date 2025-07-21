import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@fontsource/inter";

// Game Components
import GameWorld from "./components/Game/GameWorld";
import GameUI from "./components/UI/GameUI";
import MainMenu from "./components/UI/MainMenu";
import CharacterCreation from "./components/UI/CharacterCreation";
import MultiplayerMenu from "./components/UI/MultiplayerMenu";

// Stores
import { usePlayer } from "./lib/stores/usePlayer";
import { useAudio } from "./lib/stores/useAudio";
import { useMultiplayer } from "./lib/stores/useMultiplayer";

// Define control keys for the game
export enum Controls {
  forward = 'forward',
  backward = 'backward',
  leftward = 'leftward',
  rightward = 'rightward',
  interact = 'interact',
  inventory = 'inventory',
  crafting = 'crafting',
  skills = 'skills',
  quests = 'quests',
  chat = 'chat',
  menu = 'menu',
  cameraUp = 'cameraUp',
  cameraDown = 'cameraDown',
  cameraLeft = 'cameraLeft',
  cameraRight = 'cameraRight',
  cameraZoomIn = 'cameraZoomIn',
  cameraZoomOut = 'cameraZoomOut',
}

const keyMap = [
  { name: Controls.forward, keys: ['KeyW'] },
  { name: Controls.backward, keys: ['KeyS'] },
  { name: Controls.leftward, keys: ['KeyA'] },
  { name: Controls.rightward, keys: ['KeyD'] },
  { name: Controls.interact, keys: ['KeyE', 'Space'] },
  { name: Controls.inventory, keys: ['KeyI', 'Tab'] },
  { name: Controls.crafting, keys: ['KeyC'] },
  { name: Controls.skills, keys: ['KeyK'] },
  { name: Controls.quests, keys: ['KeyJ'] },
  { name: Controls.chat, keys: ['KeyT', 'Enter'] },
  { name: Controls.menu, keys: ['Escape'] },
  { name: Controls.cameraUp, keys: ['ArrowUp'] },
  { name: Controls.cameraDown, keys: ['ArrowDown'] },
  { name: Controls.cameraLeft, keys: ['ArrowLeft'] },
  { name: Controls.cameraRight, keys: ['ArrowRight'] },
  { name: Controls.cameraZoomIn, keys: ['Equal', 'NumpadAdd'] },
  { name: Controls.cameraZoomOut, keys: ['Minus', 'NumpadSubtract'] },
];

// Game phases
export type GamePhase = 'menu' | 'character_creation' | 'multiplayer_setup' | 'playing';

// Create query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  const [gamePhase, setGamePhase] = useState<GamePhase>('menu');
  const [showCanvas, setShowCanvas] = useState(false);
  const { player, createPlayer } = usePlayer();
  const { toggleMute } = useAudio();
  const { isConnected, connectionStatus } = useMultiplayer();

  // Initialize audio and game systems
  useEffect(() => {
    // Set up audio
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    
    const hitSound = new Audio('/sounds/hit.mp3');
    const successSound = new Audio('/sounds/success.mp3');
    
    // Audio is muted by default to comply with browser policies
    console.log('Audio system initialized');
    
    // Show canvas after brief delay
    const timer = setTimeout(() => {
      setShowCanvas(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Handle game phase transitions
  const handleStartSinglePlayer = () => {
    setGamePhase('character_creation');
  };

  const handleStartMultiplayer = () => {
    setGamePhase('multiplayer_setup');
  };

  const handleCharacterCreated = (characterData: any) => {
    createPlayer(characterData);
    setGamePhase('playing');
  };

  const handleMultiplayerReady = () => {
    setGamePhase('character_creation');
  };

  const handleBackToMenu = () => {
    setGamePhase('menu');
  };

  // Render loading screen while canvas is not ready
  if (!showCanvas) {
    return null; // Loading screen is handled in HTML
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <KeyboardControls map={keyMap}>
          {/* Main Menu */}
          {gamePhase === 'menu' && (
            <MainMenu
              onStartSinglePlayer={handleStartSinglePlayer}
              onStartMultiplayer={handleStartMultiplayer}
              onToggleAudio={toggleMute}
            />
          )}

          {/* Character Creation */}
          {gamePhase === 'character_creation' && (
            <CharacterCreation
              onCharacterCreated={handleCharacterCreated}
              onBack={handleBackToMenu}
            />
          )}

          {/* Multiplayer Setup */}
          {gamePhase === 'multiplayer_setup' && (
            <MultiplayerMenu
              onReady={handleMultiplayerReady}
              onBack={handleBackToMenu}
              connectionStatus={connectionStatus}
              isConnected={isConnected}
            />
          )}

          {/* Game World */}
          {gamePhase === 'playing' && player && (
            <>
              <Canvas
                shadows
                camera={{
                  position: [10, 10, 10],
                  fov: 50,
                  near: 0.1,
                  far: 1000
                }}
                gl={{
                  antialias: true,
                  powerPreference: "high-performance",
                  alpha: false
                }}
                style={{
                  background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 50%, #8FBC8F 100%)'
                }}
              >
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight
                  position={[50, 50, 50]}
                  intensity={0.8}
                  castShadow
                  shadow-mapSize={[2048, 2048]}
                  shadow-camera-far={100}
                  shadow-camera-left={-50}
                  shadow-camera-right={50}
                  shadow-camera-top={50}
                  shadow-camera-bottom={-50}
                />
                
                {/* Fog for depth */}
                <fog attach="fog" args={['#8FBC8F', 50, 200]} />

                <Suspense fallback={null}>
                  <GameWorld />
                </Suspense>
              </Canvas>

              {/* Game UI Overlay */}
              <GameUI onBackToMenu={handleBackToMenu} />
            </>
          )}
        </KeyboardControls>
      </div>
    </QueryClientProvider>
  );
}

export default App;
