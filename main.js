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

const ai = new Tank(scene, tankModel, () => {
    ai.tankGroup.position.set(0, 0, -20)
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
function applyCollisionResponse(tank1, tank2, deltaTime) {
    const relativeVelocity = tank2.tankVelocity.clone().sub(tank1.tankVelocity);

    // Calculate the direction of the collision (vector from tank1 to tank2)
    const direction = tank2.tankGroup.position.clone().sub(tank1.tankGroup.position).normalize();

    // Mass of the tanks (you can adjust this based on your simulation)
    const mass1 = 5 || 1;  // Default to 1 if mass is not defined
    const mass2 = 2 || 1;  // Default to 1 if mass is not defined

    // Calculate the change in velocity during the collision
    const velocityChange = relativeVelocity.dot(direction);  // How much velocity change happens in the direction of the impact

    // If the velocity change is positive, then they are moving towards each other
    if (velocityChange > 0) {
        // Calculate impulse based on momentum change (simplified physics, assume elastic collision)
        const impulse = (2 * velocityChange) / (mass1 + mass2);  // Formula for impulse in 1D elastic collision

        // Calculate the force magnitude based on impulse and the time of contact
        const forceMagnitude = impulse / deltaTime;

        // Apply the force to both tanks (simplified physics, applying equal and opposite forces)
        const force = direction.multiplyScalar(forceMagnitude);

        // Update the velocities of both tanks (simplified)
        tank1.tankVelocity.sub(force.clone().divideScalar(mass1));  // Apply force to tank1 (negative direction)
        tank2.tankVelocity.add(force.clone().divideScalar(mass2));  // Apply force to tank2 (positive direction)

        // Log the applied force for debugging
        console.log("Force applied:", force);
    }
}


// Render loop
function animate() {
    const deltaTime = clock.getDelta(); // Get the time since the last frame

    if (tank && ai) {
        // Update tanks
        tank.update(camera, deltaTime); // User tank
        ai.update(deltaTime); // AI bot 1

        if (ai.turret) {
            ai.turret.lookAt(tank.tankGroup.position)
            ai.turret.rotation.y += Math.PI; // Rotate by 180 degrees (PI radians)
            ai.turret.rotation.x = 0;
            ai.turret.rotation.z = 0;
        }

        if (tank.boundingBox.intersectsBox(ai.boundingBox)) {
            // Handle collision
            console.log('test')
            applyCollisionResponse(tank, ai, deltaTime)

        }
        // Update collision detection for the user tank
        // updateCollisionDetection(tank, octree);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
