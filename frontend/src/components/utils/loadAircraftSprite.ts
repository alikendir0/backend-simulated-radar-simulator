import * as THREE from "three";

export const loadAircraftSprite = async (
  textureUrl: string,
  instanceCount: number
): Promise<THREE.InstancedMesh> => {
  const geometry = new THREE.PlaneGeometry(10, 10);

  // Use await to ensure texture is loaded before creating mesh
  const texture = await new Promise<THREE.Texture>((resolve, reject) => {
    new THREE.TextureLoader().load(
      textureUrl,
      (tex) => {
        tex.minFilter = THREE.NearestFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.anisotropy = 16;
        tex.generateMipmaps = false;
        resolve(tex);
      },
      undefined,
      reject
    );
  });

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    side: THREE.DoubleSide, // Ensure sprite is visible from both sides
  });

  const instancedMesh = new THREE.InstancedMesh(
    geometry,
    material,
    instanceCount
  );

  return instancedMesh;
};
