import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import Popup from "./Popup";
import {
  setupScene,
  updateRadarComponents,
  handleAircraftUpdates,
} from "./utils/sceneManager";
import { initThreeJs, cleanupThreeJs } from "./utils/threeJsSetup";
import { useKeyboardControls } from "./utils/inputControls";
import { preloadAircraftModels } from "./utils/modelLoader";
import RadarHitsPanel from "./RadarHitsPanel";
import { getAircraftInfoByName } from "./utils/getAircraftInfoByName";
import { onMouseClick } from "./utils/mouseController";

const RadarScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isRadarMode, setIsRadarMode] = useState(false);
  const radarGroup = useRef<THREE.Group>(new THREE.Group());
  const radarConeGroup = useRef<THREE.Group | null>(null);
  const radarDishRef = useRef<THREE.Object3D | null>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const instancedMeshesRef = useRef<
    Map<string, THREE.InstancedMesh | THREE.Group>
  >(new Map());
  const availableIndicesRef = useRef<Map<string, number[]>>(new Map());
  const fadeMapRef = useRef<Map<string, Map<string, { progress: number }>>>(
    new Map()
  );
  const instancePoolRef = useRef<Map<string, Map<string, number>>>(new Map()); // type → id → index
  const previousPositionsRef = useRef<Map<string, THREE.Vector3>>(new Map()); // id → previous position
  const previousRotationsRef = useRef<Map<string, number>>(new Map()); // id → previous rotation
  var detectionRange: number;
  var sweepWidth: number;

  interface HitData {
    id: string;
    name: string;
    distance: number;
    speed: number;
    time: number;
    hitPoint: { x: number; y: number; z: number };
  }

  const [radarHits, setRadarHits] = useState<Record<string, HitData>>({});
  interface AircraftData {
    id: string;
    type: string;
    position: { x: number; y: number; z: number };
    distance: number;
    speedDegPerSecond: number;
  }

  const lastAircraftsRef = useRef<AircraftData[]>([]);

  const [heightPercent, setHeightPercent] = useState(16);
  const [popupData, setPopupData] = useState<{
    image: string;
    name: string;
    type: string;
    class: string;
    altitude?: number;
    speed?: number;
    distance?: number;
  } | null>(null);

  const handleInspect = useCallback(
    async (id: string) => {
      try {
        const cleanId = id.replace(/ Instance:\s*\d+/i, "").trim();
        const info = await getAircraftInfoByName(cleanId);

        const radarHit = radarHits[id];

        if (!radarHit) {
          const fallbackAircraft = lastAircraftsRef.current.find(
            (ac) => ac.id === id
          );

          setPopupData({
            ...info,
            name: id,
            altitude: fallbackAircraft?.position.y,
            speed: fallbackAircraft?.speedDegPerSecond,
            distance: fallbackAircraft?.distance,
          });
        } else {
          setPopupData({
            ...info,
            name: id,
            altitude: radarHit.hitPoint.z,
            speed: radarHit.speed,
            distance: radarHit.distance,
          });
        }
      } catch (error) {
        console.error("Error fetching aircraft info:", error);
      }
    },
    [radarHits]
  );

  // Initial setup for Three.js scene, camera, and renderer
  useEffect(() => {
    const mount = mountRef.current!;
    const scene = sceneRef.current;
    // The cameraRef will be updated by initThreeJs

    initThreeJs(mount, scene, cameraRef, rendererRef, isRadarMode);

    const animate = () => {
      requestAnimationFrame(animate);
      // Update camera height percentage display
      if (cameraRef.current) {
        let heightPercentage: number;

        if (
          isRadarMode &&
          cameraRef.current instanceof THREE.OrthographicCamera
        ) {
          // For orthographic camera, use zoom value (higher zoom = closer/lower, lower zoom = farther/higher)
          const zoom = cameraRef.current.zoom;
          const maxZoom = 2.0; // Max zoom (closest)
          const minZoom = 0.1; // Min zoom (farthest)

          // Invert the zoom to match height semantics (higher percentage = higher altitude)
          const invertedZoom = maxZoom - zoom + minZoom;
          const zoomRange = maxZoom - minZoom;
          heightPercentage = Math.min(
            100,
            Math.max(0, ((invertedZoom - minZoom) / zoomRange) * 100)
          );
        } else {
          // For perspective camera, use position.y
          const cameraHeight = cameraRef.current.position.y;
          const maxHeight = 500;
          const minHeight = 10;
          const heightRange = maxHeight - minHeight;
          const adjustedHeight = cameraHeight - minHeight;
          heightPercentage = Math.min(
            100,
            Math.max(0, (adjustedHeight / heightRange) * 100)
          );
        }

        setHeightPercent(Math.round(heightPercentage));
      }
      // Ensure radar cone visibility is updated in real-time
      if (radarConeGroup.current) {
        radarConeGroup.current.visible = isRadarMode;
      }

      // OrbitControls update is handled inside initThreeJs's internal animation loop
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(scene, cameraRef.current);
      }
    };
    animate();

    return () => {
      cleanupThreeJs(mount, rendererRef.current);
    };
  }, [isRadarMode]); // Recreate when radar mode changes

  // Keyboard controls for toggling radar mode
  useKeyboardControls("s", () => setIsRadarMode((prev) => !prev));

  // WebSocket for radar updates - independent of radar mode
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "initial_radar_state") {
        sweepWidth = message.payload.sweepWidt;
        detectionRange = message.payload.detectionRange;
        updateRadarComponents({
          radarGroup: radarGroup.current,
          radarConeGroup,
          sweepWidthDeg: sweepWidth,
          distance: detectionRange,
          radarMode: isRadarMode,
        });
      }

      if (message.type === "radar_update") {
        const { currentRadarAzimuth, currentAircrafts } = message.payload;

        // Update radar dish and cone rotation
        const radians = THREE.MathUtils.degToRad(-currentRadarAzimuth);
        if (radarConeGroup.current) {
          radarConeGroup.current.rotation.y = radians;
        }
        if (radarDishRef.current) {
          radarDishRef.current.rotation.y = radians;
        }

        // Convert to radarHits structure
        const newHits: Record<string, HitData> = {};
        const now = Date.now();
        for (const ac of currentAircrafts) {
          newHits[ac.id] = {
            id: ac.id,
            name: ac.type ?? ac.id,
            distance: ac.distance,
            speed: ac.speedDegPerSecond,
            time: now,
            hitPoint: ac.position,
          };
        }

        setRadarHits(newHits);

        // Store aircrafts for mode switching
        lastAircraftsRef.current = currentAircrafts;

        // Handle aircraft updates with current radar mode
        // Only process if we have meshes loaded
        if (instancedMeshesRef.current.size > 0) {
          handleAircraftUpdates({
            currentAircrafts,
            instancedMeshesRef,
            instancePoolRef,
            availableIndicesRef,
            fadeMapRef,
            previousPositionsRef,
            previousRotationsRef,
            isRadarMode,
          });
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
    };

    return () => {
      ws.close();
    };
  }, []); // No dependencies - WebSocket should persist across mode changes

  // Setup scene elements based on radar mode
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || !rendererRef.current || !cameraRef.current) return;

    // Clear previous scene elements
    scene.clear();

    // IMPORTANT: Clear instancedMeshesRef when scene is cleared
    instancedMeshesRef.current.clear();
    instancePoolRef.current.clear();
    availableIndicesRef.current.clear();
    fadeMapRef.current.clear();
    previousPositionsRef.current.clear();
    previousRotationsRef.current.clear();

    // Pass only the necessary refs and states for scene setup
    setupScene({
      scene,
      isRadarMode,
      radarGroup,
      radarDishRef,
      radarConeGroup,
      renderer: rendererRef.current,
      camera: cameraRef.current,
    });

    // Preload aircraft models for instancing
    preloadAircraftModels({
      radarGroup,
      instancedMeshesRef,
      availableIndicesRef,
      isRadarMode,
    });

    // Restore aircraft positions after scene recreated with multiple attempts
    const restoreAircraft = (attempt = 1, maxAttempts = 10) => {
      if (
        lastAircraftsRef.current.length > 0 &&
        instancedMeshesRef.current.size > 0
      ) {
        handleAircraftUpdates({
          currentAircrafts: lastAircraftsRef.current,
          instancedMeshesRef,
          instancePoolRef,
          availableIndicesRef,
          fadeMapRef,
          previousPositionsRef,
          previousRotationsRef,
          isRadarMode,
        });
      } else if (attempt < maxAttempts) {
        setTimeout(
          () => restoreAircraft(attempt + 1, maxAttempts),
          attempt * 100
        );
      }
    };

    setTimeout(() => restoreAircraft(), 100);

    const handleMouseClick = (event: MouseEvent) => {
      if (cameraRef.current) {
        onMouseClick({
          camera: cameraRef.current,
          instancedMeshesRef,
          instancePoolRef,
          event,
          isRadarMode,
          onAircraftClick: handleInspect,
        });
      }
    };

    window.addEventListener("click", handleMouseClick);

    return () => {
      window.removeEventListener("click", handleMouseClick);
    };
  }, [isRadarMode]);

  // Update radar components when mode changes (for existing radar state)
  useEffect(() => {
    console.log(sweepWidth);
    if (sweepWidth !== undefined && detectionRange !== undefined)
      updateRadarComponents({
        radarGroup: radarGroup.current,
        radarConeGroup,
        sweepWidthDeg: sweepWidth, // Will use existing values
        distance: detectionRange, // Will use existing values
        radarMode: isRadarMode,
      });
  }, [isRadarMode]);

  return (
    <>
      <div ref={mountRef} style={{ width: "100%", height: "100vh" }} />
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#00ff00",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: "5px 10px",
          borderRadius: "4px",
          fontFamily: "monospace",
        }}
      >
        Camera Height: {heightPercent}%
      </div>
      <RadarHitsPanel radarHits={radarHits} onInspect={handleInspect} />
      {popupData && (
        <Popup data={popupData} onClose={() => setPopupData(null)} />
      )}
    </>
  );
};

export default RadarScene;
