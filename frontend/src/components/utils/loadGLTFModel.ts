import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export const loadGLTFModel = (path: string): Promise<THREE.Object3D> => {
    return new Promise((resolve, reject) => {
        const loader = new GLTFLoader();
        loader.load(
            path,
            (gltf) => resolve(gltf.scene),
            undefined,
            (err) => reject(err)
        );
    });
};

export const createInstancedGroupFromGLTF = async (
    path: string,
    instanceCount: number,
    scale: number = 1
): Promise<THREE.Group> => {
    try {
        const gltf = await loadGLTFModel(path);
        
        const instancedGroup = new THREE.Group();
        const meshes: THREE.Mesh[] = [];
        
        // Collect all meshes from the model
        gltf.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.Mesh) {
                // Skip shadow/ground planes
                const childName = child.name.toLowerCase();
                if (childName.includes('shadow') || 
                    childName.includes('ground') || 
                    childName.includes('plane')) {
                    return;
                }
                
                // Check for flat meshes (shadows/ground)
                if (!child.geometry.boundingBox) {
                    child.geometry.computeBoundingBox();
                }
                const bbox = child.geometry.boundingBox!;
                const height = bbox.max.y - bbox.min.y;
                const width = bbox.max.x - bbox.min.x;
                const depth = bbox.max.z - bbox.min.z;
                
                if (height < 0.5 && (width > 20 || depth > 20)) {
                    return;
                }
                
                meshes.push(child as THREE.Mesh);
            }
        });
        
        // Create an InstancedMesh for each unique material/geometry combination
        meshes.forEach((mesh) => {
            const geometry = mesh.geometry.clone();
            
            // Apply scale to geometry
            if (scale !== 1) {
                geometry.scale(scale, scale, scale);
            }
            
            // DON'T apply the mesh's transform to geometry to preserve UV mapping
            // Instead, we'll apply the transform to each instance in the sceneManager
            
            // Use original material to preserve textures
            const material = Array.isArray(mesh.material) ? mesh.material[0].clone() : mesh.material.clone();
            
            const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);
            instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            
            // Store the original mesh transform for later use
            instancedMesh.userData.originalMatrix = mesh.matrix.clone();
            instancedMesh.userData.meshName = mesh.name;
            
            // Ensure proper bounding sphere for raycasting and frustum culling
            if (!geometry.boundingSphere) {
                geometry.computeBoundingSphere();
            }
            if (!geometry.boundingBox) {
                geometry.computeBoundingBox();
            }
            
            // Fix bounding sphere for scaled geometry and prevent disappearing
            if (geometry.boundingSphere) {
                const originalRadius = geometry.boundingSphere.radius;
                const scaledRadius = originalRadius * scale;
                const expandedRadius = Math.max(scaledRadius * 3, 50); // Much larger radius for safety
                geometry.boundingSphere.radius = expandedRadius;
            }
            
            // Set frustum culling to false to prevent disappearing during camera movement
            instancedMesh.frustumCulled = false;
            
            // Initialize all instances as hidden
            const matrix = new THREE.Matrix4();
            for (let i = 0; i < instanceCount; i++) {
                matrix.makeScale(0, 0, 0);
                instancedMesh.setMatrixAt(i, matrix);
            }
            instancedMesh.instanceMatrix.needsUpdate = true;
            
            instancedGroup.add(instancedMesh);
        });
        
        return instancedGroup;
    } catch (error) {
        console.error(`Failed to load GLTF model from ${path}:`, error);
        // Fallback to a simple box
        const boxGeometry = new THREE.BoxGeometry(2, 1, 4);
        const boxMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const instancedMesh = new THREE.InstancedMesh(boxGeometry, boxMaterial, instanceCount);
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        
        const fallbackGroup = new THREE.Group();
        fallbackGroup.add(instancedMesh);
        return fallbackGroup;
    }
};
