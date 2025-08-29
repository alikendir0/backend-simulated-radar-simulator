import * as THREE from "three";
import { createInstancedGroupFromGLTF } from "./loadGLTFModel";
import { loadAircraftSprite } from "./loadAircraftSprite";

type AircraftType = "Police" | "Military" | "Civilian";

// Define the model loaders using GLTF models for 3D instances
const modelLoaders: Record<
  AircraftType,
  (
    instanceCount: number,
    isRadarMode: boolean
  ) => Promise<THREE.InstancedMesh | THREE.Group>
> = {
  Police: async (instanceCount, isRadarMode) => {
    if (isRadarMode) {
      return loadAircraftSprite(
        new URL("/textures/bell412.png", import.meta.url).href,
        instanceCount
      );
    } else {
      return createInstancedGroupFromGLTF(
        new URL("/models/chopper.glb", import.meta.url).href,
        instanceCount,
        30 // Reasonable scale for chopper model
      );
    }
  },
  Military: async (instanceCount, isRadarMode) => {
    if (isRadarMode) {
      return loadAircraftSprite(
        new URL("/textures/f16.png", import.meta.url).href,
        instanceCount
      );
    } else {
      return createInstancedGroupFromGLTF(
        new URL("/models/f-16d.gltf", import.meta.url).href,
        instanceCount,
        0.9 // Reasonable scale for chopper model
      );
    }
  },
  Civilian: async (instanceCount, isRadarMode) => {
    if (isRadarMode) {
      return loadAircraftSprite(
        new URL("/textures/c20a.png", import.meta.url).href,
        instanceCount
      );
    } else {
      return createInstancedGroupFromGLTF(
        new URL("/models/civilian_aircraft.glb", import.meta.url).href,
        instanceCount,
        0.6 // Reasonable scale for civilian aircraft model
      );
    }
  },
};

interface PreloadModelsParams {
  radarGroup: React.MutableRefObject<THREE.Group>;
  instancedMeshesRef: React.MutableRefObject<
    Map<string, THREE.InstancedMesh | THREE.Group>
  >;
  availableIndicesRef: React.MutableRefObject<Map<string, number[]>>;
  isRadarMode: boolean;
}

export const preloadAircraftModels = async ({
  radarGroup,
  instancedMeshesRef,
  availableIndicesRef,
  isRadarMode,
}: PreloadModelsParams) => {
  const instanceCount = 100; // Increased for more aircraft instances
  const matrix = new THREE.Matrix4();

  const types: AircraftType[] = ["Police", "Military", "Civilian"];

  for (const type of types) {
    const instancedObject = await modelLoaders[type](
      instanceCount,
      isRadarMode
    );
    instancedObject.name = `${type}_instances`;

    if (instancedObject instanceof THREE.InstancedMesh) {
      // Handle single InstancedMesh (sprites)
      instancedObject.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

      // Initialize all instances as hidden (scale 0)
      for (let i = 0; i < instanceCount; i++) {
        matrix.makeScale(0, 0, 0);
        instancedObject.setMatrixAt(i, matrix);
      }
      instancedObject.instanceMatrix.needsUpdate = true;
    } else if (instancedObject instanceof THREE.Group) {
      // Handle Group of InstancedMeshes (3D models)
      instancedObject.traverse((child) => {
        if (child instanceof THREE.InstancedMesh) {
          child.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

          // Initialize all instances as hidden (scale 0)
          for (let i = 0; i < instanceCount; i++) {
            matrix.makeScale(0, 0, 0);
            child.setMatrixAt(i, matrix);
          }
          child.instanceMatrix.needsUpdate = true;
        }
      });
    }

    // Store in refs
    instancedMeshesRef.current.set(type, instancedObject);
    radarGroup.current.add(instancedObject);

    // Initialize available indices pool for this type
    if (!availableIndicesRef.current.has(type)) {
      availableIndicesRef.current.set(type, []);
    }
    const pool = availableIndicesRef.current.get(type)!;
    for (let i = 0; i < instanceCount; i++) {
      pool.push(i);
    }
  }
};
