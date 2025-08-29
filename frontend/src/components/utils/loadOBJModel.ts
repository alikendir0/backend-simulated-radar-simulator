import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

export const loadOBJModel = (path: string): Promise<THREE.Object3D> => {
    return new Promise((resolve, reject) => {
        const loader = new OBJLoader();
        loader.load(
            path,
            (obj) => resolve(obj),
            undefined,
            (err) =>         reject(err)
        );
    });
};

