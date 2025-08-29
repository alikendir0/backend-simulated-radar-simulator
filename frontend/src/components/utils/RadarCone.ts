import * as THREE from "three";

interface RadarConeOptions {
  sweepWidthDeg: number;
  distance: number;
  radarMode: boolean;
}

export const createRadarCone = ({
  sweepWidthDeg,
  distance,
  radarMode,
}: RadarConeOptions): THREE.Group => {
  const shape = new THREE.Shape();
  const center = new THREE.Vector2(0, 0);
  const startAngle = THREE.MathUtils.degToRad(-sweepWidthDeg / 2);
  const endAngle = THREE.MathUtils.degToRad(sweepWidthDeg / 2);

  // Start from center
  shape.moveTo(center.x, center.y);
  const radius = distance;

  // Draw arc from -sweep/2 to +sweep/2
  shape.absarc(center.x, center.y, radius, startAngle, endAngle, false);
  shape.lineTo(center.x, center.y);

  const geometry = new THREE.ShapeGeometry(shape);
  geometry.rotateX(-Math.PI / 2); // Put it flat on XZ plane
  geometry.translate(0, 10, 0); // Slightly above ground to avoid z-fighting

  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: radarMode ? 0.2 : 0.0,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  const group = new THREE.Group();
  group.add(mesh);

  // Set group visibility directly based on radar mode
  group.visible = radarMode;

  return group;
};
