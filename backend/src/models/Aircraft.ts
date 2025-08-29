import { Vector3 } from 'three';

export enum AircraftType {
    Civilian = "Civilian",
    Police = "Police",
    Military = "Military",
    International = "International",
    Unknown = "Unknown",
}

export enum AircraftClass {
    Helicopter = "Helicopter",
    Plane = "Plane",
    Drone = "Drone",
    UAV = "UAV",
    Unknown = "Unknown",
}

function polarToCartesian(
    origin: Vector3,
    distance: number,
    azimuthDeg: number,
    elevationDeg: number
): Vector3 {
    const azimuthRad = (azimuthDeg * Math.PI) / 180;
    const elevationRad = (elevationDeg * Math.PI) / 180;

    const x = origin.x + distance * Math.cos(elevationRad) * Math.cos(azimuthRad);
    const y = origin.y + distance * Math.sin(elevationRad);
    const z = origin.z + distance * Math.cos(elevationRad) * Math.sin(azimuthRad);

    return new Vector3(x, y, z);
}

export interface AircraftMetadata {
    id: string;
    type: AircraftType;
    class: AircraftClass;
    name: string;
    parts: string[];
    image: string;
    recordedTopSpeed: number;
}

export class Aircraft {
    public id: string;
    public type: AircraftType;
    public distance: number;
    public azimuthDeg: number;
    public elevationDeg: number;
    public position: Vector3;
    private origin: Vector3;
    public speedDegPerSecond: number;

    constructor(
        id: string,
        type: AircraftType,
        origin: Vector3,
        speedDegPerSecond: number,
        distance: number,
        azimuthDeg: number,
        elevationDeg: number = 0
    ) {
        this.id = id;
        this.type = type;
        this.origin = origin;
        this.speedDegPerSecond = speedDegPerSecond;
        this.distance = distance;
        this.azimuthDeg = azimuthDeg;
        this.elevationDeg = elevationDeg;
        this.position = this.calculatePosition();
    }

    updateAzimuth(deltaTime: number) {
        this.azimuthDeg = (this.azimuthDeg + this.speedDegPerSecond * deltaTime + 360) % 360;
        this.position = this.calculatePosition();
    }

    setSpeed(degreesPerSecond: number) {
        this.speedDegPerSecond = degreesPerSecond;
    }

    private calculatePosition(): Vector3 {
        return polarToCartesian(this.origin, this.distance, this.azimuthDeg, this.elevationDeg);
    }
}
