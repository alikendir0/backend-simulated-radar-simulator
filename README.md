# Radar Simulation System

A real-time radar simulation system built with TypeScript, featuring a Node.js backend and a React frontend with Three.js for 3D visualization. The system simulates aircraft detection within a radar cone with rotating radar sweeps and provides both radar and realistic view modes.

![Radar Simulation](https://img.shields.io/badge/Type-Radar%20Simulation-green)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Three.js-blue)
![Backend](https://img.shields.io/badge/Backend-Node.js%20%2B%20WebSocket-orange)

## Features

### Core Functionality
- **Real-time Radar Simulation**: Rotating radar cone with configurable sweep width and detection range
- **Aircraft Detection**: Multiple aircraft types (Military, Civilian, Police) with realistic flight patterns
- **Dual View Modes**: 
  - Radar Mode: Top-down orthographic view with green wireframe aesthetics
  - Realistic Mode: 3D perspective view with terrain, skybox, and detailed aircraft models
- **Live Data Streaming**: WebSocket-based real-time updates between backend and frontend

### Aircraft Management
- **100+ Simulated Aircraft**: Multiple instances of different aircraft types
- **Aircraft Types**:
  - **Military**: F-16D Fighting Jet, Baykar Bayraktar TB2 UAV
  - **Civilian**: C20A - AFRC
  - **Police**: Eurocopter AS350 Écureuil
- **Dynamic Properties**: Position, altitude, speed, azimuth tracking
- **Instanced Rendering**: Optimized performance for large numbers of aircraft

### Interactive Features
- **Aircraft Inspection**: Click on aircraft to view detailed information
- **Camera Controls**: Zoom, pan, and rotate in 3D space
- **Real-time Stats Panel**: Live display of detected aircraft with distance and speed data
- **Height Indicator**: Dynamic camera altitude percentage display
- **Toggle Controls**: Switch between radar and realistic modes with 'S' key

### Visual Elements
- **3D Terrain**: Heightmap-based realistic terrain with grass textures
- **Skybox Environment**: 360-degree environment mapping
- **Radar Components**: Animated radar dish and detection cone
- **Grid Overlay**: Visual reference grid in radar mode
- **Dynamic Lighting**: Adaptive lighting for different view modes

## Project Structure

### Backend (`/backend`)
```
backend/
├── src/
│   ├── app.ts              # Express application setup
│   ├── server.ts           # HTTP & WebSocket server with world state
│   ├── models/
│   │   ├── Aircraft.ts     # Aircraft class with movement logic
│   │   ├── Radar.ts        # Base radar class
│   │   └── RadarCone.ts    # Radar detection logic
│   └── services/
│       └── RadarSimulator.ts # Main simulation orchestrator
├── db/
│   ├── aircraftmodel.json  # Aircraft specifications database
│   └── images/icons/       # Aircraft sprite images
└── package.json
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/
│   │   ├── RadarScene.tsx        # Main 3D scene component
│   │   ├── RadarHitsPanel.tsx    # Live aircraft detection panel
│   │   ├── Popup.tsx             # Aircraft details modal
│   │   └── utils/
│   │       ├── sceneManager.ts   # Three.js scene orchestration
│   │       ├── threeJsSetup.ts   # Renderer and camera setup
│   │       ├── modelLoader.ts    # 3D model loading and instancing
│   │       ├── RadarCamera.ts    # Camera configuration
│   │       ├── RadarCone.ts      # Radar cone visualization
│   │       ├── RadarDish.ts      # 3D radar dish model
│   │       ├── RadarPlane.ts     # Terrain generation
│   │       └── api.ts            # Backend communication
│   └── assets/
├── public/
│   ├── heightMap/              # Terrain heightmaps
│   ├── skybox/                 # Environment textures
│   └── textures/               # Material textures
└── package.json
```

## Getting Started

### Prerequisites
- Node.js

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend server will start on `http://localhost:3000` with WebSocket support.

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173` (Vite default).

3. **Access the Application**
   Open your browser and navigate to the frontend URL. The application will automatically connect to the backend WebSocket server.

## Usage

### Controls
- **Mouse**: Rotate and zoom camera (3D mode)
- **S Key**: Toggle between Radar and Realistic view modes
- **Click Aircraft**: Open detailed information popup
- **Mouse Wheel**: Zoom in/out

### View Modes

#### Radar Mode
- Top-down orthographic view
- Green wireframe aesthetics
- Grid overlay for reference
- Simplified aircraft visualization
- Focus on detection and tracking

#### Realistic Mode
- 3D perspective camera
- Detailed aircraft models
- Terrain with heightmap
- Skybox environment
- Enhanced visual fidelity

### Aircraft Detection
- Aircraft are detected when they enter the radar cone
- Detection depends on:
  - Distance from radar origin
  - Azimuth within sweep range
  - Elevation within cone bounds
- Real-time updates via WebSocket

## 🌐 API Endpoints

### WebSocket (`ws://localhost:3000`)
- **Connection**: Automatic radar state initialization
- **Updates**: Real-time aircraft positions and radar azimuth
- **Message Types**:
  - `initial_radar_state`: Radar configuration
  - `radar_update`: Live aircraft and radar data

### REST API (`http://localhost:3000`)
- **Static Assets**: Aircraft icons and images

## Customization

### Adding Aircraft Types
1. Add aircraft data to `backend/db/aircraftmodel.json`
2. Place icon images in `backend/db/images/icons/`
3. Update `AircraftType` enum in `backend/src/models/Aircraft.ts`
4. Add corresponding 3D models and textures to frontend

### Modifying Radar Parameters
- Edit radar configuration in `backend/src/server.ts`
- Adjust visualization in `frontend/src/components/utils/RadarCone.ts`
- Update detection logic in `backend/src/models/RadarCone.ts`

### Tech Stack

#### Backend
- **Node.js** with **Express** for HTTP server
- **WebSocket (ws)** for real-time communication
- **Three.js** for 3D math utilities
- **TypeScript** for type safety
- **CORS** for cross-origin support

#### Frontend
- **React 19** with hooks
- **Three.js** for 3D rendering
- **TypeScript** for development
- **Vite** for build tooling
- **Axios** for HTTP requests
