import { Vector3 } from 'three';

export class Radar {
    public origin: Vector3;

    constructor(origin: Vector3 = new Vector3(0, 0, 0)) {
        this.origin = origin;
    }
}