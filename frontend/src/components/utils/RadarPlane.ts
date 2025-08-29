import * as THREE from "three";

// Generate altitude-based colors (topographical style)
const getAltitudeColor = (altitudeRatio: number): {r: number, g: number, b: number} => {
    // Clamp to 0-1 range
    const t = Math.max(0, Math.min(1, altitudeRatio));
    
    // Define color stops for a nice topographical gradient
    const colorStops = [
        { altitude: 0.0,  color: { r: 0.2, g: 0.4, b: 0.8 } },  // Deep blue (water/lowest)
        { altitude: 0.1,  color: { r: 0.4, g: 0.6, b: 0.9 } },  // Light blue (shallow water)
        { altitude: 0.15, color: { r: 0.9, g: 0.9, b: 0.6 } },  // Sandy beach
        { altitude: 0.3,  color: { r: 0.3, g: 0.7, b: 0.3 } },  // Green (plains/forest)
        { altitude: 0.5,  color: { r: 0.6, g: 0.8, b: 0.4 } },  // Light green (hills)
        { altitude: 0.7,  color: { r: 0.7, g: 0.6, b: 0.4 } },  // Brown (mountains)
        { altitude: 0.85, color: { r: 0.6, g: 0.5, b: 0.5 } },  // Dark brown (high mountains)
        { altitude: 1.0,  color: { r: 1.0, g: 1.0, b: 1.0 } }   // White (snow peaks)
    ];
    
    // Find the two color stops to interpolate between
    let lowerStop = colorStops[0];
    let upperStop = colorStops[colorStops.length - 1];
    
    for (let i = 0; i < colorStops.length - 1; i++) {
        if (t >= colorStops[i].altitude && t <= colorStops[i + 1].altitude) {
            lowerStop = colorStops[i];
            upperStop = colorStops[i + 1];
            break;
        }
    }
    
    // Calculate interpolation factor
    const range = upperStop.altitude - lowerStop.altitude;
    const factor = range === 0 ? 0 : (t - lowerStop.altitude) / range;
    
    // Interpolate between colors
    return {
        r: lowerStop.color.r + (upperStop.color.r - lowerStop.color.r) * factor,
        g: lowerStop.color.g + (upperStop.color.g - lowerStop.color.g) * factor,
        b: lowerStop.color.b + (upperStop.color.b - lowerStop.color.b) * factor
    };
};

export const createRadarPlane = (radarMode: boolean = true, grassTexture?: THREE.Texture): THREE.Mesh => {
    let material: THREE.Material;
    let geometry: THREE.BufferGeometry;

    if (radarMode) {
        // Simple radar mode with dark green circle - made much bigger
        geometry = new THREE.CircleGeometry(400, 64);
        material = new THREE.MeshBasicMaterial({ 
            color: 0x002200, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
    } else {
        // Enhanced realistic mode with heightmap-based terrain - made much bigger
        geometry = new THREE.PlaneGeometry(800, 800, 512, 512); // Higher resolution for better heightmap detail
        
        material = new THREE.MeshStandardMaterial({
            map: grassTexture ?? null,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.9,
            normalScale: new THREE.Vector2(0.5, 0.5),
        });

        // Add a subtle normal map effect even without texture
        if (!grassTexture && material instanceof THREE.MeshStandardMaterial) {
            material.color.setHex(0x2d5a2d); // Forest green
        }
    }

    const radarPlane = new THREE.Mesh(geometry, material);
    radarPlane.rotation.x = -Math.PI / 2;
    radarPlane.receiveShadow = true;
    
    return radarPlane;
};

// New async function to create radar plane with heightmap
export const createRadarPlaneWithHeightmap = async (radarMode: boolean = true, grassTexture?: THREE.Texture): Promise<THREE.Mesh> => {
    let material: THREE.Material;
    let geometry: THREE.BufferGeometry;

    if (radarMode) {
        // Simple radar mode with dark green circle - made much bigger
        geometry = new THREE.CircleGeometry(400, 64);
        material = new THREE.MeshBasicMaterial({ 
            color: 0x002200, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
    } else {
        // Load heightmap texture
        const textureLoader = new THREE.TextureLoader();
        
        try {
            console.log('Loading heightmap...');
            const heightmapTexture = await new Promise<THREE.Texture>((resolve, reject) => {
                textureLoader.load(
                    '/heightMap/heightmap.png', // Assuming heightmap.png is in public folder
                    resolve,
                    undefined,
                    (error) => {
                        console.warn('Failed to load heightmap, falling back to procedural terrain:', error);
                        reject(error);
                    }
                );
            });

            // Create high-resolution terrain geometry - made much bigger
            geometry = new THREE.PlaneGeometry(800, 800, 512, 512);
            
            // Apply heightmap displacement
            await applyHeightmapToGeometry(geometry, heightmapTexture);
            
            console.log('Heightmap applied successfully');
            
        } catch {
            console.warn('Heightmap loading failed, using procedural terrain');
            
            // Fallback to procedural terrain - made much bigger
            geometry = new THREE.PlaneGeometry(800, 800, 256, 256);
            
            // Add some height variation to the terrain with colors
            const positions = geometry.attributes.position.array as Float32Array;
            const colors = new Float32Array(positions.length);
            
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i];
                const y = positions[i + 1];
                const noise = Math.sin(x * 0.01) * Math.cos(y * 0.01) * 2;
                positions[i + 2] = noise; // z coordinate
                
                // Generate altitude-based color for procedural terrain
                const altitudeRatio = (noise + 2) / 4; // Normalize to 0-1 range
                const color = getAltitudeColor(altitudeRatio);
                
                colors[i] = color.r;
                colors[i + 1] = color.g;
                colors[i + 2] = color.b;
            }
            
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.attributes.position.needsUpdate = true;
        }

        geometry.computeVertexNormals();

        material = new THREE.MeshStandardMaterial({
            map: grassTexture ?? null,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.9,
            normalScale: new THREE.Vector2(0.5, 0.5),
            vertexColors: true, // Enable vertex colors for altitude-based coloring
        });

        // Add a subtle normal map effect even without texture
        if (!grassTexture && material instanceof THREE.MeshStandardMaterial) {
            material.color.setHex(0xffffff); // White base color to allow vertex colors to show
        }
    }

    const radarPlane = new THREE.Mesh(geometry, material);
    radarPlane.rotation.x = -Math.PI / 2;
    radarPlane.receiveShadow = true;
    
    return radarPlane;
};

// Helper function to apply heightmap to geometry
const applyHeightmapToGeometry = async (geometry: THREE.BufferGeometry, heightmapTexture: THREE.Texture): Promise<void> => {
    return new Promise((resolve) => {
        // Create a canvas to read pixel data from the heightmap
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Wait for the texture image to load
        const image = heightmapTexture.image;
        canvas.width = image.width;
        canvas.height = image.height;
        
        // Draw the heightmap to canvas
        ctx.drawImage(image, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        // Apply height displacement to geometry vertices
        const positions = geometry.attributes.position.array as Float32Array;
        const heightScale = 20; // Maximum height in units
        
        // Create color array for vertex colors
        const colors = new Float32Array(positions.length); // Same length as positions (3 components per vertex)
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            
            // Convert world coordinates to texture coordinates
            const u = (x + 400) / 800; // Normalize to 0-1 (assuming 800x800 plane)
            const v = (y + 400) / 800; // Normalize to 0-1
            
            // Clamp to texture bounds
            const texX = Math.floor(Math.max(0, Math.min(canvas.width - 1, u * canvas.width)));
            const texY = Math.floor(Math.max(0, Math.min(canvas.height - 1, (1 - v) * canvas.height))); // Flip Y
            
            // Get pixel data (using red channel as height)
            const pixelIndex = (texY * canvas.width + texX) * 4;
            const height = (pixels[pixelIndex] / 255) * heightScale;
            
            // Apply height to Z coordinate
            positions[i + 2] = height;
            
            // Generate altitude-based color
            const altitudeRatio = height / heightScale; // 0-1 range
            const color = getAltitudeColor(altitudeRatio);
            
            // Apply color to vertex
            colors[i] = color.r;     // Red component
            colors[i + 1] = color.g; // Green component  
            colors[i + 2] = color.b; // Blue component
        }
        
        // Add color attribute to geometry
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        // Update geometry
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        resolve();
    });
};