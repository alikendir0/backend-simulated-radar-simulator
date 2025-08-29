import * as THREE from "three";

export const createRadarCamera = (
  aspect: number,
  isRadarMode: boolean,
  ref?: React.MutableRefObject<THREE.Camera | null>
): THREE.Camera => {
  let camera: THREE.Camera;

  if (isRadarMode) {
    // Orthographic camera for radar mode
    const frustumSize = 600;
    const left = -frustumSize / 2;
    const right = frustumSize / 2;
    const top = frustumSize / 2 / aspect;
    const bottom = -frustumSize / 2 / aspect;

    camera = new THREE.OrthographicCamera(left, right, top, bottom, 0.1, 2000);
    camera.position.set(0, 400, 0); // High above, looking straight down
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 0, -1);
  } else {
    // Perspective camera for realistic mode
    camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 2000);
    camera.position.set(0, 100, 200); // Angled view for realistic mode
    camera.lookAt(0, 0, 0);
    camera.up.set(0, 1, 0); // Normal up vector
  }

  if (ref) ref.current = camera;
  return camera;
};
