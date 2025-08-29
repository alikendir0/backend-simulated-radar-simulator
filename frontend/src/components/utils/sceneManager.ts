import * as THREE from "three";
import { addRadarLights } from "../utils/RadarLights";
import { createRadarPlaneWithHeightmap } from "../utils/RadarPlane";
import { createRadarDish } from "../utils/RadarDish";
import { createRadarCone } from "./RadarCone";
import { loadSkybox } from "../utils/loadSkybox";

interface SetupSceneParams {
  scene: THREE.Scene;
  isRadarMode: boolean;
  radarGroup: React.MutableRefObject<THREE.Group>;
  radarDishRef: React.MutableRefObject<THREE.Object3D | null>;
  radarConeGroup: React.MutableRefObject<THREE.Group | null>;
  renderer: THREE.WebGLRenderer;
  camera: THREE.Camera;
}

var sweepDeg = 12;
var dist = 400;

export const setupScene = async ({
  scene,
  isRadarMode,
  radarGroup,
  radarDishRef,
  radarConeGroup,
}: SetupSceneParams) => {
  const textureLoader = new THREE.TextureLoader();
  const grassTexture = textureLoader.load(
    new URL("/textures/grass_texture.jpg", import.meta.url).href
  );
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(128, 128); // Increased to maintain same texture scale on bigger plane

  addRadarLights(scene, isRadarMode);

  // Use heightmap-based radar plane for non-radar mode
  const radarPlane = await createRadarPlaneWithHeightmap(
    isRadarMode,
    isRadarMode ? undefined : grassTexture
  );
  scene.add(radarPlane);

  if (isRadarMode) {
    scene.background = new THREE.Color(0x000000);
    scene.add(new THREE.GridHelper(800, 512, 0xff3300, 0x001100)); // Made grid much bigger to match plane
  } else {
    scene.background = loadSkybox();
  }

  radarGroup.current = new THREE.Group();
  radarGroup.current.position.set(0, 3, 0);

  const dish = await createRadarDish(isRadarMode);
  radarDishRef.current = dish;
  radarGroup.current.add(dish);

  // Create initial radar cone if in radar mode
  if (isRadarMode) {
    console.log("Creating initial radar cone in setupScene");
    radarConeGroup.current = createRadarCone({
      sweepWidthDeg: sweepDeg, // Default sweep width
      distance: dist, // Default distance
      radarMode: isRadarMode,
    });
    radarGroup.current.add(radarConeGroup.current);
    console.log("Initial radar cone created and added");
  }

  scene.add(radarGroup.current);
};

interface UpdateRadarComponentsParams {
  radarGroup: THREE.Group;
  radarConeGroup: React.MutableRefObject<THREE.Group | null>;
  sweepWidthDeg?: number;
  distance?: number;
  radarMode: boolean;
}

export const updateRadarComponents = ({
  radarGroup,
  radarConeGroup,
  sweepWidthDeg,
  distance,
  radarMode,
}: UpdateRadarComponentsParams) => {
  // Only recreate cone if we have the required parameters from WebSocket
  if (sweepWidthDeg !== undefined && distance !== undefined) {
    if (radarConeGroup.current) {
      radarGroup.remove(radarConeGroup.current);
    }
    sweepDeg = sweepWidthDeg;
    dist = distance;
    radarConeGroup.current = createRadarCone({
      sweepWidthDeg: sweepWidthDeg,
      distance: distance,
      radarMode: radarMode,
    });
    radarGroup.add(radarConeGroup.current);
  } else if (radarConeGroup.current) {
    // Simple visibility update for existing cone
    radarConeGroup.current.visible = radarMode;

    // Update material opacity
    radarConeGroup.current.traverse((child) => {
      if (
        child instanceof THREE.Mesh &&
        child.material instanceof THREE.MeshBasicMaterial
      ) {
        child.material.opacity = radarMode ? 0.2 : 0.0;
      }
    });
  }
};

interface AircraftData {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  distance: number;
  speedDegPerSecond: number;
}

interface HandleAircraftUpdatesParams {
  currentAircrafts: AircraftData[];
  instancedMeshesRef: React.MutableRefObject<
    Map<string, THREE.InstancedMesh | THREE.Group>
  >;
  instancePoolRef: React.MutableRefObject<Map<string, Map<string, number>>>;
  availableIndicesRef: React.MutableRefObject<Map<string, number[]>>;
  fadeMapRef: React.MutableRefObject<
    Map<string, Map<string, { progress: number }>>
  >;
  previousPositionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>;
  previousRotationsRef: React.MutableRefObject<Map<string, number>>;
  isRadarMode: boolean;
}

// Helper function to apply matrix and color to all InstancedMeshes in an object
const updateInstancedObject = (
  obj: THREE.InstancedMesh | THREE.Group,
  index: number,
  baseMatrix: THREE.Matrix4,
  color: THREE.Color
) => {
  if (obj instanceof THREE.InstancedMesh) {
    obj.setMatrixAt(index, baseMatrix);
    obj.setColorAt(index, color);
  } else if (obj instanceof THREE.Group) {
    obj.traverse((child) => {
      if (child instanceof THREE.InstancedMesh) {
        // Apply the original mesh transform to position this part correctly
        const finalMatrix = new THREE.Matrix4();
        if (child.userData.originalMatrix) {
          // Combine base transform with original mesh transform
          finalMatrix.multiplyMatrices(
            baseMatrix,
            child.userData.originalMatrix
          );
        } else {
          finalMatrix.copy(baseMatrix);
        }
        child.setMatrixAt(index, finalMatrix);
        child.setColorAt(index, color);
      }
    });
  }
};

// Helper function to update instance matrices
const updateInstanceMatrices = (obj: THREE.InstancedMesh | THREE.Group) => {
  if (obj instanceof THREE.InstancedMesh) {
    obj.instanceMatrix.needsUpdate = true;
    if (obj.instanceColor) {
      obj.instanceColor.needsUpdate = true;
    }
  } else if (obj instanceof THREE.Group) {
    obj.traverse((child) => {
      if (child instanceof THREE.InstancedMesh) {
        child.instanceMatrix.needsUpdate = true;
        if (child.instanceColor) {
          child.instanceColor.needsUpdate = true;
        }
      }
    });
  }
};

export const handleAircraftUpdates = ({
  currentAircrafts,
  instancedMeshesRef,
  instancePoolRef,
  availableIndicesRef,
  fadeMapRef,
  previousPositionsRef,
  previousRotationsRef,
  isRadarMode,
}: HandleAircraftUpdatesParams) => {
  if (!currentAircrafts || instancedMeshesRef.current.size === 0) return;

  // Debug: Count aircraft by type
  const typeCount = new Map<string, number>();
  currentAircrafts.forEach((aircraft) => {
    typeCount.set(aircraft.type, (typeCount.get(aircraft.type) || 0) + 1);
  });
  const dummy = new THREE.Object3D();
  const usedIndicesPerType = new Map<string, Set<number>>();
  const activeIds = new Set<string>();

  currentAircrafts.forEach((aircraft: AircraftData) => {
    const { id, type, position } = aircraft;

    activeIds.add(id);

    const instancedObject = instancedMeshesRef.current.get(type);
    if (!instancedObject) return;

    if (!instancePoolRef.current.has(type))
      instancePoolRef.current.set(type, new Map());
    if (!availableIndicesRef.current.has(type))
      availableIndicesRef.current.set(type, []);
    if (!usedIndicesPerType.has(type)) usedIndicesPerType.set(type, new Set());
    if (!fadeMapRef.current.has(type)) fadeMapRef.current.set(type, new Map());

    const pool = instancePoolRef.current.get(type)!;
    const available = availableIndicesRef.current.get(type)!;
    const usedIndices = usedIndicesPerType.get(type)!;

    let index = pool.get(id);
    if (index === undefined) {
      index = available.pop();
      if (index === undefined) {
        console.warn(
          `No available instances for type ${type}! Available: ${available.length}, Pool size: ${pool.size}`
        );
        return;
      }
      pool.set(id, index);
    }

    usedIndices.add(index);

    const currentPosition = new THREE.Vector3(
      position.x,
      position.y,
      position.z
    );
    let heading = 0;

    // Calculate heading based on movement direction
    if (previousPositionsRef.current.has(id)) {
      const prevPosition = previousPositionsRef.current.get(id)!;
      const direction = new THREE.Vector3().subVectors(
        currentPosition,
        prevPosition
      );

      if (direction.length() > 0.01) {
        // Only update heading if there's significant movement
        heading = Math.atan2(direction.x, direction.z); // Y is up, so use X and Z for horizontal plane
      }
    }

    // Store current position and heading for next frame
    previousPositionsRef.current.set(id, currentPosition.clone());
    previousRotationsRef.current.set(id, heading);

    // Check what type of model is actually loaded (not just the current mode)
    const isSprite = instancedObject instanceof THREE.InstancedMesh;
    const is3DModel = instancedObject instanceof THREE.Group;

    if (is3DModel && !isRadarMode) {
      // 3D models in realistic mode - position higher and rotate to face movement direction
      dummy.position.set(position.x, 10 + position.y, position.z);
      dummy.rotation.set(0, heading, 0); // Rotate around Y-axis to face heading
      dummy.scale.set(1, 1, 1);
    } else if (isSprite && isRadarMode) {
      // Sprites in radar mode - lay flat and point up (towards negative Z due to camera up vector)
      dummy.position.set(position.x, 0.1 + position.y, position.z);
      dummy.rotation.set(-Math.PI / 2, Math.PI, 0); // Lay flat on ground, point towards -Z (up in radar view)
      dummy.scale.set(1, 1, 1);
    } else if (is3DModel && isRadarMode) {
      // 3D models in radar mode (shouldn't happen but handle it)
      dummy.position.set(position.x, 10 + position.y, position.z);
      dummy.rotation.set(0, heading, 0);
      dummy.scale.set(1, 1, 1);
    } else if (isSprite && !isRadarMode) {
      // Sprites in realistic mode (shouldn't happen but handle it)
      dummy.position.set(position.x, 0.1 + position.y, position.z);
      dummy.rotation.set(-Math.PI / 2, Math.PI, 0);
      dummy.scale.set(1, 1, 1);
    } else {
      // Fallback
      dummy.position.set(position.x, position.y, position.z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
    }

    dummy.updateMatrix();
    updateInstancedObject(
      instancedObject,
      index,
      dummy.matrix,
      new THREE.Color(1, 1, 1)
    ); // Keep original white color
  });

  instancedMeshesRef.current.forEach((instancedObject, type) => {
    const pool = instancePoolRef.current.get(type);
    const available = availableIndicesRef.current.get(type);
    const fadeMap = fadeMapRef.current.get(type);

    if (!pool || !available || !fadeMap) return;

    for (const [id, index] of pool.entries()) {
      if (!activeIds.has(id)) {
        let fade = fadeMap.get(id);
        if (!fade) {
          fade = { progress: 0 };
          fadeMap.set(id, fade);
        }

        // Gradual fade out when aircraft is not detected
        fade.progress += 0.02; // Gradual fade speed

        if (fade.progress >= 1) {
          // Completely hide by setting scale to 0
          const fadeDummy = new THREE.Object3D();
          fadeDummy.scale.set(0, 0, 0);
          fadeDummy.updateMatrix();
          updateInstancedObject(
            instancedObject,
            index,
            fadeDummy.matrix,
            new THREE.Color(1, 1, 1)
          );

          available.push(index);
          pool.delete(id);
          fadeMap.delete(id);
        } else {
          // Apply gradual scaling during fade while maintaining position and rotation
          const scale = 1 - fade.progress;
          const fadeDummy = new THREE.Object3D();

          // Get the last known position and heading
          const lastPosition =
            previousPositionsRef.current.get(id) || new THREE.Vector3();
          const lastHeading = previousRotationsRef.current.get(id) || 0;

          // Check what type of model is being faded
          const isSprite = instancedObject instanceof THREE.InstancedMesh;

          if (isSprite && isRadarMode) {
            // Sprites in radar mode - lay flat and point up
            fadeDummy.position.set(
              lastPosition.x,
              0.1 + lastPosition.y,
              lastPosition.z
            );
            fadeDummy.rotation.set(-Math.PI / 2, Math.PI, 0);
            fadeDummy.scale.set(scale, scale, scale);
          } else if (!isSprite && !isRadarMode) {
            // 3D models in realistic mode - maintain last heading
            fadeDummy.position.set(
              lastPosition.x,
              10 + lastPosition.y,
              lastPosition.z
            );
            fadeDummy.rotation.set(0, lastHeading, 0); // Keep last rotation
            fadeDummy.scale.set(scale, scale, scale);
          } else {
            // Fallback
            fadeDummy.position.copy(lastPosition);
            fadeDummy.rotation.set(0, lastHeading, 0);
            fadeDummy.scale.set(scale, scale, scale);
          }

          fadeDummy.updateMatrix();
          updateInstancedObject(
            instancedObject,
            index,
            fadeDummy.matrix,
            new THREE.Color(1, 1, 1)
          );
        }
      } else {
        // Reset fading state if aircraft is active
        if (fadeMap.has(id)) {
          fadeMap.delete(id);
        }
      }
    }

    updateInstanceMatrices(instancedObject);
  });
};
