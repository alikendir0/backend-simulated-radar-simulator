import * as THREE from "three";

export const loadSkybox = (): THREE.CubeTexture => {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        new URL('/skybox/xpos.png', import.meta.url).href,
        new URL('/skybox/xneg.png', import.meta.url).href,
        new URL('/skybox/ypos.png', import.meta.url).href,
        new URL('/skybox/yneg.png', import.meta.url).href,
        new URL('/skybox/zpos.png', import.meta.url).href,
        new URL('/skybox/zneg.png', import.meta.url).href,
    ]);
    return texture;
};
