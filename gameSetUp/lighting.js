import * as THREE from 'three';

// Function to create a text sprite
function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '100px Arial'; // Font size adjustment
    context.fillStyle = 'white'; // Text color
    context.fillText(text, 10, 100);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);

    return sprite;
}

export function SetLighting(scene, options = {}) {
    // Options for customization with defaults
    const {
        addAxesHelper = true,
        ambientLightIntensity = 0.5, // Slightly brighter ambient light for shadowed areas
        directionalLightIntensity = 2, // Stronger directional light for a late afternoon sun
        directionalLightPosition = { x: -50, y: 30, z: 20 }, // Low and angled position for a 4 PM sun effect
        directionalLightColor = 0xffffff, // Warm orange color for the sun
    } = options;

    // Add AxesHelper for debugging if enabled
    if (addAxesHelper) {
        const axesHelper = new THREE.AxesHelper(3); // Global axes helper with size 3
        scene.add(axesHelper);

        // Create and add text sprites at the end of each axis
        const xLabel = createTextSprite('X');
        xLabel.position.set(3, 0, 0); // Position it at the end of the X axis
        scene.add(xLabel);

        const yLabel = createTextSprite('Y');
        yLabel.position.set(0, 3, 0); // Position it at the end of the Y axis
        scene.add(yLabel);

        const zLabel = createTextSprite('Z');
        zLabel.position.set(0, 0, 3); // Position it at the end of the Z axis
        scene.add(zLabel);
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, ambientLightIntensity);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(directionalLightColor, directionalLightIntensity);
    directionalLight.position.set(
        directionalLightPosition.x,
        directionalLightPosition.y,
        directionalLightPosition.z
    );

    // Optional: Add shadows for more realism
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;

    scene.add(directionalLight);
}
