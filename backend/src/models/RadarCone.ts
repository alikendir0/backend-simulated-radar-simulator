import { Vector3 } from 'three';
import { Aircraft } from './Aircraft';

export class RadarCone {
    private origin: Vector3;
    private detectionRange: number;
    private sweepWidth: number;
    private currentAzimuth: number;
    private minElevation: number = 0;
    private maxElevation: number;

    constructor(origin: Vector3, detectionRange: number = 200, sweepWidth: number = 10, maxElevation: number) {
        this.origin = origin;
        this.detectionRange = detectionRange;
        this.sweepWidth = sweepWidth;
        this.currentAzimuth = 0;
        this.maxElevation = maxElevation;
    }

    updateRotation(deltaDegrees: number) {
        this.currentAzimuth = (this.currentAzimuth + deltaDegrees + 360) % 360;
    }

    detect(aircrafts: Aircraft[]): Aircraft[] {
        return aircrafts.filter(ac =>
            this.isWithinCone(ac.azimuthDeg, ac.distance, ac.elevationDeg)
        );
    }

    getSweepAzimuth(){
        return this.currentAzimuth;
    }

    getRadarProperities(){
        const data={
            detectionRange: this.detectionRange,
            sweepWidt:this.sweepWidth,
            maxElevation:this.maxElevation
        }
        return data;
    }

    private isWithinCone(
        targetAzimuth: number,
        targetDistance: number,
        targetElevation: number
    ): boolean {
        if (targetDistance > this.detectionRange) return false;

        let minAzimuth = (this.currentAzimuth - this.sweepWidth / 2 + 360) % 360;
        let maxAzimuth = (this.currentAzimuth + this.sweepWidth / 2) % 360;
        const azimuthInCone =
            minAzimuth < maxAzimuth
                ? targetAzimuth >= minAzimuth && targetAzimuth <= maxAzimuth
                : targetAzimuth >= minAzimuth || targetAzimuth <= maxAzimuth;

        const elevationInCone =
            targetElevation >= this.minElevation && targetElevation <= this.maxElevation;

        return azimuthInCone && elevationInCone;
    }
}