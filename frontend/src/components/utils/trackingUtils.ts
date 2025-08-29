import * as THREE from "three";

export interface TargetTracking {
    lastHitPoint: THREE.Vector3;
    lastTimestamp: number;
    speed: number;
}

export function updateTargetSpeed(
    tracking: TargetTracking,
    newHitPoint: THREE.Vector3,
    radarAngularSpeed: number
): TargetTracking {
    const now = Date.now();
    const elapsedSeconds = (now - tracking.lastTimestamp) / 1000;

    if (elapsedSeconds <= 0) {
        return tracking;
    }

    const distanceMoved = tracking.lastHitPoint.distanceTo(newHitPoint);

    const adjustedSpeed = (distanceMoved / elapsedSeconds) * Math.cos(radarAngularSpeed);

    return {
        lastHitPoint: newHitPoint.clone(),
        lastTimestamp: now,
        speed: adjustedSpeed,
    };
}

