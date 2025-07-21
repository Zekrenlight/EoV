# Echoes of Valtara - 3D Isometric RPG

## Overview

Echoes of Valtara is a browser-based 3D isometric RPG inspired by Old School RuneScape (OSRS). Built as a full-stack application using React Three Fiber for 3D rendering, Express.js for the backend, and Socket.IO for real-time multiplayer functionality. The game features a pantheon-based progression system, crafting, questing, and LAN co-op multiplayer for 1-8 players.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React Three Fiber**: 3D scene management and rendering using Three.js
- **React Query**: Server state management and caching
- **Zustand**: Client-side state management for game entities (player, inventory, skills, world)
- **Radix UI + Tailwind CSS**: Component library and styling system
- **KeyboardControls**: Input handling for game controls (WASD movement, hotkeys)

### Backend Architecture
- **Express.js**: REST API server with middleware for logging and error handling
- **Socket.IO**: Real-time multiplayer communication and session management
- **Drizzle ORM**: Database schema definition and migrations
- **PostgreSQL**: Primary database (configured via Neon serverless)
- **Memory Storage**: Fallback in-memory storage for development

### Build System
- **Vite**: Development server and build tool with HMR support
- **esbuild**: Server-side bundling for production
- **TypeScript**: Type safety across client, server, and shared code

## Key Components

### Game Systems
1. **Player System**: Character management, movement, experience tracking
2. **Inventory System**: Item management with drag-and-drop, rarity system
3. **Skills System**: Pantheon-based skill progression (8 gods, each governing specific skills)
4. **Crafting System**: Recipe-based item creation with skill requirements
5. **Quest System**: Dynamic quest generation with multiple objective types
6. **World System**: Chunk-based world loading with procedural generation
7. **Combat System**: Turn-based combat with enemies and loot drops

### Multiplayer Features
1. **Session Management**: Host-based sessions with unique codes for joining
2. **Real-time Synchronization**: Player positions, chat, shared world state
3. **LAN Co-op**: Local network multiplayer support for 1-8 players
4. **Shared Economy**: Trading and resource sharing between players

### 3D Rendering
1. **Isometric Camera**: Fixed-angle camera with zoom and pan controls
2. **Chunk Loading**: Dynamic terrain generation and asset streaming
3. **GLTF Models**: 3D model loading for characters, objects, and environment
4. **Shader Support**: GLSL shader integration for visual effects

## Data Flow

### Client-Side Data Flow
```
User Input → KeyboardControls → Zustand Stores → React Components → Three.js Rendering
                                     ↓
Socket.IO → Multiplayer Store → Game State Synchronization
```

### Server-Side Data Flow
```
REST API ← Express Routes ← Game Services ← Database/Memory Storage
    ↓
Socket.IO → Session Management → Real-time Updates → Connected Clients
```

### State Management
- **Player State**: Position, stats, inventory, current quest
- **World State**: Loaded chunks, resources, enemies, time/weather
- **Multiplayer State**: Connected players, chat messages, session info
- **UI State**: Open panels, selected items, camera settings

## External Dependencies

### Core Dependencies
- **@react-three/fiber**: React renderer for Three.js
- **@react-three/drei**: Helper components and utilities
- **three**: 3D graphics library
- **socket.io**: Real-time bidirectional communication
- **@tanstack/react-query**: Server state management
- **drizzle-orm**: Type-safe ORM for database operations

### UI Dependencies
- **@radix-ui/***: Headless component primitives
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **class-variance-authority**: Component variant management

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **esbuild**: Fast JavaScript bundler

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for client-side code
- **tsx**: TypeScript execution for server development
- **Memory Storage**: In-memory fallback when database unavailable

### Production Environment
- **Static Build**: Vite builds optimized client bundle to `dist/public`
- **Server Bundle**: esbuild packages server code to `dist/index.js`
- **Database**: PostgreSQL via Neon serverless connection
- **Asset Optimization**: GLTF/GLB models and audio files included in build

### Build Commands
- `npm run dev`: Start development server with HMR
- `npm run build`: Create production build (client + server)
- `npm start`: Run production server
- `npm run db:push`: Apply database schema changes

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string (required for production)
- `NODE_ENV`: Environment flag for production optimizations
- Port configuration handled automatically by hosting platform

The application is structured as a monorepo with clear separation between client, server, and shared code, enabling efficient development and deployment of the multiplayer RPG experience.