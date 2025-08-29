import { worldState } from "../server";

export class RadarSimulator {
    update(deltaTime: number) {
        worldState.update(deltaTime);
    }

    getAircraftStates() {
        return worldState.aircrafts.map(ac => ({
            id: ac.id,
            type: ac.type,
            distance: ac.distance,
            azimuth: ac.azimuthDeg,
            elevation: ac.elevationDeg,
            position: {
                x: ac.position.x,
                y: ac.position.y,
                z: ac.position.z
            }
        }));
    }
}

export const radarSimulator = new RadarSimulator();
