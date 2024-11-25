// THREE.js setup for scene, camera, and renderer
import * as THREE from 'three';
import { Tank } from './gameSetUp/tank.js';
import { SetLighting } from './gameSetUp/lighting.js';
import { setBackground } from './gameSetUp/skyBackground.js';
import { loadMapAssets } from './gameSetUp/mapLoader.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const clock = new THREE.Clock(); // Create a new Clock instance
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Basic setup with default lighting
SetLighting(scene);
// Add HDR background
setBackground(scene, '/textures/skybox/skybox3.jpg');

const xmlFilePath = '/maps/map_stadium.xml';
loadMapAssets(xmlFilePath, scene).then(() => {
    console.log('Map assets loaded successfully!');
}).catch(error => {
    console.error('Error loading map assets:', error);
});

const tankModel = {
    hull: "hornet",
    turret: "railgun",
    hull_texture: { details: "/textures/hornet/lightmap.jpg" },
    turret_texture: { details: "/textures/railgun/lightmap.jpg" },
}

const tank = new Tank(scene, tankModel, () => {
    console.log('Tank loaded and ready!');
    camera.position.set(0, 15, 15); // Position camera behind and above the tank
    camera.lookAt(tank.tankGroup.position); // Set camera to look at the tank's position
});

const bot = new Tank(scene, tankModel, () => {
    bot.tankGroup.position.set(-10, 0, -10)
    bot.tankGroup.rotation.set(0, -2, 0)
    bot.turret.rotation.set(0, -0.5, 0)
});


// Resize handling for window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// Render loop
function animate() {
    // Update the tank (and camera) position and movement
    if (tank) {
        tank.update(camera, clock); // Update the tank's movement and camera position
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
