// modelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export function loadModel(scene, modelFileName, position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }, scale = { x: 1, y: 1, z: 1 }, textures = {}, callback = null) {
    const loader = new GLTFLoader();
    const textureLoader = new THREE.TextureLoader();

    // Load textures if provided
    const loadedTextures = {};
    for (const [key, texturePath] of Object.entries(textures)) {
        loadedTextures[key] = textureLoader.load(texturePath);
    }

    loader.load(
        `./models/${modelFileName}.glb`, // Model path
        (gltf) => {
            const object = gltf.scene;
            // // Apply a default texture if needed
            // child.material = new THREE.MeshStandardMaterial({
            //     map: textureLoader.load('./textures/missing.jpg'),
            // });

            const texture = loadedTextures.details; // Assuming loadedTextures.details is your texture
            texture.wrapS = THREE.RepeatWrapping; // Texture wrap (horizontal)
            texture.wrapT = THREE.RepeatWrapping; // Texture wrap (vertical)x

            // Optional: adjust the texture scale (this can help if your texture looks stretched)
            texture.repeat.set(1, -1);  // Repeat the texture (adjust the values if needed)

            // Optional: adjust the offset (useful if the texture is off-center)
            texture.offset.set(0, 0); // You can change the offset values if needed (0.5, 0.5 for example)

            // Optional: rotate the texture (if it's sideways)
            // texture.rotation = Math.PI; // Rotate 90 degrees (PI/2), change if needed


            // Apply loaded textures to the model if any
            object.traverse((child) => {
                if (child.isMesh) {
                    // Only apply textures to the hull_1, hull_2, and turret meshes
                    if (child.name === 'hull_1' || child.name === 'hull_2' || child.name === 'turret') {
                        child.material = new THREE.MeshStandardMaterial({
                            map: loadedTextures.details || null,
                        });
                        child.material.map.needsUpdate = true;  // Ensure the texture is updated
                    } else {
                        // Ensure other meshes are not applying the texture
                        child.material = new THREE.MeshBasicMaterial({
                            color: 0x000000, // Set a default black color (or use a transparent material)
                            opacity: 0,      // Fully transparent if you want them invisible
                            transparent: true,
                        });
                    }
                }
            });


            // Apply transformations
            object.position.set(position.x, position.y, position.z);
            object.rotation.set(rotation.x, rotation.y, rotation.z);
            object.scale.set(scale.x, scale.y, scale.z);

            // Add the object to the scene
            scene.add(object);
            console.log(`%c${modelFileName} loaded successfully`, 'color: green; font-weight: bold;');

            // Execute the async function if provided (e.g., applying keyboard controls)
            if (callback) {
                callback(object); // Pass the loaded object to the async function
            }
        },
        (xhr) => {
            console.log(`Loading: ${(xhr.loaded / xhr.total) * 100}%`);
        },
        (error) => {
            console.error('Error loading model:', error);
        }
    );
}
