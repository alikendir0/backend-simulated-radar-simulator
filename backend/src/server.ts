import { Server as WebSocketServer } from "ws";
import { radarSimulator } from "./services/RadarSimulator";
import http from "http";
import expressApp from "./app";
import { Vector3 } from "three";
import { Aircraft, AircraftType } from "./models/Aircraft";
import { RadarCone } from "./models/RadarCone";

export class WorldState {
  public aircrafts: Aircraft[] = [];
  public radarOrigin: Vector3 = new Vector3(0, 0, 0);
  public radar: RadarCone;

  constructor() {
    this.radar = new RadarCone(this.radarOrigin, 400, 120, 100);
    this.pushAircrafts();
  }

  update(deltaTime: number) {
    this.radar.updateRotation(deltaTime * 0.5);
    this.aircrafts.forEach((ac) => ac.updateAzimuth(deltaTime * 0.05));
  }

  getDetectedAircrafts() {
    return this.radar.detect(this.aircrafts);
  }

  getRadarAzimuth() {
    return this.radar.getSweepAzimuth();
  }

  getRandomInt(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  pushAircrafts() {
    const instanceCount = 100;

    for (var i = 0; i < instanceCount; i++) {
      this.aircrafts.push(
        new Aircraft(
          `C20A - AFRC Instance: ${i}`,
          AircraftType.Civilian,
          this.radarOrigin,
          this.getRandomInt(1, 3),
          this.getRandomInt(200, 400),
          this.getRandomInt(0, 360),
          40
        ),
        new Aircraft(
          `Eurocopter AS350 Écureuil Instance: ${i}`,
          AircraftType.Police,
          this.radarOrigin,
          this.getRandomInt(1, 3),
          this.getRandomInt(40, 300),
          this.getRandomInt(0, 360),
          20
        ),
        new Aircraft(
          `F-16D Instance: ${i}`,
          AircraftType.Military,
          this.radarOrigin,
          this.getRandomInt(1, 3),
          this.getRandomInt(100, 300),
          this.getRandomInt(0, 360),
          10
        )
      );
    }
  }

  getVisibleAircraftStates() {
    const detectedAircrafts = this.getDetectedAircrafts();
    return detectedAircrafts.map((ac) => ({
      id: ac.id,
      type: ac.type,
      distance: ac.distance,
      azimuth: ac.azimuthDeg,
      elevation: ac.elevationDeg,
      position: {
        x: ac.position.x,
        y: ac.position.y,
        z: ac.position.z,
      },
    }));
  }
}

const server = http.createServer(expressApp);
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log("Radar client connected.");

  const data = worldState.radar.getRadarProperities();

  const initialData = JSON.stringify({
    type: "initial_radar_state",
    payload: data,
  });

  ws.send(initialData);
});

function broadcastRadarData() {
  const deltaTime = 0.5;
  radarSimulator.update(deltaTime);
  const visibleAircrafts = worldState.getDetectedAircrafts();
  const radarAzimuth = worldState.getRadarAzimuth();

  const data = JSON.stringify({
    type: "radar_update",
    payload: {
      currentAircrafts: visibleAircrafts,
      currentRadarAzimuth: radarAzimuth,
    },
  });

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(data);
    }
  });
}

setInterval(broadcastRadarData, 16.7);

server.listen(3000, () => {
  console.log("HTTP + WebSocket server listening on http://localhost:3000");
});

export const worldState = new WorldState();
