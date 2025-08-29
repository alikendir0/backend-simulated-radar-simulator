import * as THREE from "three";

interface OnMouseClickParams {
    camera: THREE.Camera;
    instancedMeshesRef: React.RefObject<Map<string, THREE.InstancedMesh | THREE.Group>>;
    instancePoolRef: React.RefObject<Map<string, Map<string, number>>>;
    event: MouseEvent;
    isRadarMode: boolean;
    onAircraftClick?: (aircraftId: string) => void; // Callback for when aircraft is clicked
}

// Alternative: Screen-space distance checking (simpler approach)
const getInstanceIdFromScreenDistance = (
    mouseX: number, 
    mouseY: number, 
    camera: THREE.Camera,
    instancedMeshesRef: React.RefObject<Map<string, THREE.InstancedMesh | THREE.Group>>,
    instancePoolRef: React.RefObject<Map<string, Map<string, number>>>,
    renderer: THREE.WebGLRenderer
): {groupType: string, instanceId: number, aircraftId: string} | null => {
    if (!instancedMeshesRef.current || !instancePoolRef.current) return null;
    
    const tempMatrix = new THREE.Matrix4();
    const tempVector = new THREE.Vector3();
    let closestDistance = Infinity;
    let closestResult: {groupType: string, instanceId: number, aircraftId: string} | null = null;
    
    // Get canvas size for screen coordinate conversion
    const canvas = renderer.domElement;
    
    instancedMeshesRef.current.forEach((group, groupType) => {
        const pool = instancePoolRef.current!.get(groupType);
        if (!pool) return;
        
        // Check each active aircraft instance
        pool.forEach((instanceIndex, aircraftId) => {
            if (group instanceof THREE.Group) {
                group.traverse((child) => {
                    if (child instanceof THREE.InstancedMesh) {
                        // Get instance matrix
                        child.getMatrixAt(instanceIndex, tempMatrix);
                        
                        // Extract position from matrix
                        tempVector.setFromMatrixPosition(tempMatrix);
                        
                        // Transform to screen space
                        tempVector.project(camera);
                        
                        // Convert to canvas coordinates
                        const screenX = (tempVector.x * 0.5 + 0.5) * canvas.clientWidth;
                        const screenY = (-tempVector.y * 0.5 + 0.5) * canvas.clientHeight;
                        
                        // Calculate distance to mouse
                        const distance = Math.sqrt(
                            Math.pow(screenX - mouseX, 2) + 
                            Math.pow(screenY - mouseY, 2)
                        );
                        
                        // Check if this is the closest and within reasonable range (30px for better precision)
                        if (distance < closestDistance && distance < 30) {
                            closestDistance = distance;
                            closestResult = {groupType, instanceId: instanceIndex, aircraftId};
                        }
                    }
                });
            }
        });
    });
    
    return closestResult;
};

export function onMouseClick({ camera, instancedMeshesRef, instancePoolRef, event, isRadarMode, onAircraftClick }: OnMouseClickParams): void {
    // Only handle clicks in non-radar mode (3D mode)
    if (isRadarMode) return;
    
    if (!instancedMeshesRef.current || !instancePoolRef.current) return;
    
    // Get mouse position relative to canvas
    const canvas = event.target as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const result = getInstanceIdFromScreenDistance(
        mouseX, 
        mouseY, 
        camera, 
        instancedMeshesRef, 
        instancePoolRef, 
        { domElement: canvas } as THREE.WebGLRenderer
    );
    
    if (result) {
        
        // Call the callback to show aircraft popup
        if (onAircraftClick) {
            onAircraftClick(result.aircraftId);
        }
    } else {
        let debugCount = 0;
        instancedMeshesRef.current.forEach((group, groupType) => {
            const pool = instancePoolRef.current!.get(groupType);
            if (!pool || debugCount >= 5) return;
            
            pool.forEach((instanceIndex) => {
                if (debugCount >= 5) return;
                
                if (group instanceof THREE.Group) {
                    group.traverse((child) => {
                        if (child instanceof THREE.InstancedMesh && debugCount < 5) {
                            const tempMatrix = new THREE.Matrix4();
                            const tempVector = new THREE.Vector3();
                            
                            child.getMatrixAt(instanceIndex, tempMatrix);
                            tempVector.setFromMatrixPosition(tempMatrix);
                            tempVector.project(camera);
                            
                            // Screen position calculation for debugging (currently unused)
                            // const screenX = (tempVector.x * 0.5 + 0.5) * canvas.clientWidth;
                            // const screenY = (-tempVector.y * 0.5 + 0.5) * canvas.clientHeight;
                            
                            debugCount++;
                        }
                    });
                }
            });
        });
    }
}