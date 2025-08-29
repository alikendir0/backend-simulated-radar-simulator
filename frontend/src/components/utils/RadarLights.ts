import * as THREE from "three";

export const addRadarLights = (scene: THREE.Scene, radarMode: boolean) => {
    // const ambientLight = new THREE.AmbientLight(radarMode ? 0x00ff00 : 0xffffff, 0.3);
    // scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(radarMode ? 0x00ff00 : 0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);
};