# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React + TypeScript radar simulation frontend using Three.js for 3D visualization. The application displays a real-time radar interface that can toggle between radar mode (dark grid) and realistic mode (skybox with terrain). It connects to a WebSocket backend at `ws://localhost:3000` for real-time radar data and uses a REST API at `http://127.0.0.1:5000/api` for aircraft information.

## Common Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview

# Launch Claude Code (already configured)
npm run claude
```

## Architecture Overview

### Core Components
- **RadarScene.tsx**: Main component managing the 3D scene, WebSocket connections, and radar state
- **RadarHitsPanel.tsx**: UI panel displaying detected aircraft with inspection functionality
- **Popup.tsx**: Modal for displaying detailed aircraft information

### Three.js Scene Management
The application uses a modular approach for Three.js scene setup:

- **sceneManager.ts**: Handles scene setup, radar component updates, and aircraft management
- **threeJsSetup.ts**: Initializes Three.js renderer, camera, and OrbitControls
- **modelLoader.ts**: Manages instanced meshes for performance with multiple aircraft

### Utility Modules
- **RadarCamera.ts**: Camera configuration and positioning
- **RadarCone.ts**: Creates the radar sweep visualization
- **RadarDish.ts**: 3D radar dish model
- **RadarPlane.ts**: Ground plane (grid or textured terrain)
- **loadGLTFModel.ts / loadOBJModel.ts**: 3D model loaders
- **api.ts**: HTTP client for backend API calls

### Real-time Data Flow
1. WebSocket connection receives radar updates with aircraft positions
2. Scene manager updates instanced meshes for aircraft visualization
3. Radar dish and cone rotate based on current azimuth
4. Hits panel updates with current detections
5. User can inspect aircraft to fetch detailed info via REST API

### Key Features
- **Mode Toggle**: 'S' key switches between radar and realistic visualization
- **Instanced Rendering**: Efficient rendering of multiple aircraft using THREE.InstancedMesh
- **Fade Effects**: Aircraft fade out when no longer detected
- **Interactive Inspection**: Click aircraft in hits panel to view details

## Backend Integration

- **WebSocket**: Real-time radar updates on `ws://localhost:3000`
- **REST API**: Aircraft data queries on `http://127.0.0.1:5000/api`

Message types from WebSocket:
- `initial_radar_state`: Sets detection range and sweep width
- `radar_update`: Current radar azimuth and detected aircraft array

## Development Notes

- Uses Vite for fast development and building
- TypeScript strict mode enabled
- ESLint configured with React and TypeScript rules
- Three.js types included for development
- Models stored in `public/models/` (GLTF and OBJ formats)
- Textures and skybox assets in `public/textures/` and `public/skybox/`