import * as THREE from "three";
import { loadOBJModel } from "./loadOBJModel";

export const createRadarDish = async (radarMode: boolean): Promise<THREE.Object3D> => {
    const url = new URL("/models/dish.obj", import.meta.url).href;
    const dish = await loadOBJModel(url);

    dish.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).material = radarMode
                ? new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    wireframe: true,
                    transparent: true,
                    opacity: 0.9,
                })
                : new THREE.MeshStandardMaterial({
                    color: 0x555555,
                    metalness: 0.6,
                    roughness: 0.5,
                });
        }
    });

    dish.scale.set(0.01, 0.01, 0.01);
    dish.position.set(0, 2, 0);
    return dish;
};

