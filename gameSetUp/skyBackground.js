import * as THREE from 'three';

export function setBackground(scene, imagePath) {
    const loader = new THREE.CubeTextureLoader();
    const texture = loader.load([
        './textures/skyboxes/skybox35/02.jpg', // Positive X (Right)
        './textures/skyboxes/skybox35/01.jpg', // Negative X (Left)
        './textures/skyboxes/skybox35/06.jpg', // Positive Y (Top) (Sky)
        './textures/skyboxes/skybox35/05.jpg', // Negative Y (Bottom) (Ground)
        './textures/skyboxes/skybox35/04.jpg', // Positive Z (Front) (One giant mountain)
        './textures/skyboxes/skybox35/03.jpg', // Negative Z (Back) (Mountains)
    ]);
    scene.background = texture; // Set the cube texture as the scene background
}
