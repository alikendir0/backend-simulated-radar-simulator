import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createRadarCamera } from "../utils/RadarCamera";

export const initThreeJs = (
    mount: HTMLDivElement,
    _scene: THREE.Scene,
    cameraRef: React.MutableRefObject<THREE.Camera | null>,
    rendererRef: React.MutableRefObject<THREE.WebGLRenderer | null>,
    isRadarMode: boolean = false
) => {
    const camera = createRadarCamera(window.innerWidth / window.innerHeight, isRadarMode, cameraRef);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current = renderer;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    
    if (!isRadarMode) {
        // Full orbit controls for realistic mode
        controls.minDistance = 10;
        controls.maxDistance = 500;
        controls.maxPolarAngle = Math.PI / 2;
        controls.enableRotate = true;
        controls.enablePan = true;
        controls.enableZoom = true;
    } else {
        // Restricted controls for radar mode - only allow height adjustment
        controls.minDistance = 50;
        controls.maxDistance = 1000;
        controls.enableRotate = false; // Disable rotation to maintain top-down view
        controls.enablePan = false;    // Disable panning to stay centered
        controls.enableZoom = true;    // Allow zoom for height adjustment
        
        // Lock the target to center and maintain top-down view
        controls.target.set(0, 0, 0);
        
        // Add event listener to maintain orthographic camera properties during zoom
        controls.addEventListener('change', () => {
            if (camera instanceof THREE.OrthographicCamera) {
                // Keep camera looking straight down
                camera.position.x = 0;
                camera.position.z = 0;
                camera.lookAt(0, 0, 0);
                camera.up.set(0, 0, -1);
            }
        });
    }

    const animateControls = () => {
        requestAnimationFrame(animateControls);
        controls.update();
    };
    animateControls();
};

export const cleanupThreeJs = (mount: HTMLDivElement, renderer: THREE.WebGLRenderer | null) => {
    if (renderer) {
        renderer.dispose();
        if (mount.contains(renderer.domElement)) {
            mount.removeChild(renderer.domElement);
        }
    }
};