// THREE.js setup for scene, camera, and renderer
import * as THREE from 'three';
import { Tank } from './gameSetUp/tank.js';
import { AiTank } from './gameSetUp/aiTank.js';
import { UserTank } from './gameSetUp/userTank.js';
import { SetLighting } from './gameSetUp/lighting.js';
import { setBackground } from './gameSetUp/skyBackground.js';
import { Octree } from 'three/examples/jsm/math/Octree.js';

const scene = new THREE.Scene();
const octree = new Octree();
octree.fromGraphNode(scene); // Build octree from all objects in the scene

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const clock = new THREE.Clock(); // Create a new Clock instance
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Basic setup with default lighting
SetLighting(scene);
// Add HDR background
setBackground(scene, '/textures/skybox/skybox3.jpg');

// const xmlFilePath = '/maps/map_stadium.xml';
// loadMapAssets(xmlFilePath, scene).then(() => {
//     console.log('Map assets loaded successfully!');
// }).catch(error => {
//     console.error('Error loading map assets:', error);
// });

const tankModel = {
    hull: "hornet",
    turret: "railgun",
    hull_texture: { details: "/textures/hornet/lightmap.jpg" },
    turret_texture: { details: "/textures/railgun/lightmap.jpg" },
}

const tank = new UserTank(scene, tankModel, () => {
    console.log('Tank loaded and ready!');
    camera.position.set(0, 15, 15); // Position camera behind and above the tank
    camera.lookAt(tank.tankGroup.position); // Set camera to look at the tank's position
});

const ai = new AiTank(scene, tankModel, () => {
    ai.tankGroup.position.set(0, 0, -10)
    ai.tankGroup.rotation.set(0, 3 * Math.PI / 2, 0)
    ai.turret.rotation.set(0, -0.5, 0)
});


// Resize handling for window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


// Function to apply force when collision occurs
function applyCollisionResponse(tank1, tank2) {
    // Find the direction of the collision (vector from tank1 to tank2)
    const direction = tank2.position.clone().sub(tank1.position).normalize();

    // Apply a simple force based on this direction (scaled by the mass of the tanks)
    const forceMagnitude = 1; // Adjust this based on how strong you want the push to be
    const force = direction.multiplyScalar(forceMagnitude);

    // Apply the force to tank2's velocity (simplified physics)
    tank2.position.x += (force.x);
    tank2.position.y += (force.y);
    tank2.position.z += (force.z);
    console.log(force)

}

// Render loop
function animate() {
    const deltaTime = clock.getDelta(); // Get the time since the last frame

    if (tank) {
        // Update tanks
        tank.update(camera, deltaTime); // User tank
        ai.update(deltaTime); // AI bot 1

        if (tank.boundingBox.intersectsBox(ai.boundingBox)) {
            // Handle collision
            applyCollisionResponse(tank.tankGroup, ai.tankGroup)
            
        }

        if(ai.turret){
            ai.turret.lookAt(tank.tankGroup.position)
            ai.turret.rotation.y += Math.PI; // Rotate by 180 degrees (PI radians)
            ai.turret.rotation.x = 0;
            ai.turret.rotation.z = 0;
        }

        // Update collision detection for the user tank
        // updateCollisionDetection(tank, octree);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
