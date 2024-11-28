// THREE.js setup for scene, camera, and renderer
import * as THREE from 'three';
import { Tank } from './gameSetUp/tank.js';
import { AiTank } from './gameSetUp/aiTank.js';
import { UserTank } from './gameSetUp/userTank.js';
import { SetLighting } from './gameSetUp/lighting.js';
import { setBackground } from './gameSetUp/skyBackground.js';
import { loadMapAssets, loadTestMap } from './gameSetUp/mapLoader.js';
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
setBackground(scene);

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
    if (deltaTime < 1e-5) return; // Prevent division by zero or excessive force

    const relativeVelocity = tank2.tankVelocity.clone().sub(tank1.tankVelocity);

    const direction = tank2.tankGroup.position.clone().sub(tank1.tankGroup.position).normalize();

    const mass1 = 5;
    const mass2 = 2;

    const velocityChange = relativeVelocity.dot(direction);

    if (velocityChange > 0) {
        const restitution = 0.8; // Coefficient for inelastic collisions
        const impulse = restitution * (2 * velocityChange) / (mass1 + mass2);

        const maxForce = 5; // Cap force magnitude
        const forceMagnitude = Math.min(impulse / deltaTime, maxForce);

        const force = direction.multiplyScalar(forceMagnitude);

        tank1.tankVelocity.sub(force.clone().divideScalar(mass1));
        tank2.tankVelocity.add(force.clone().divideScalar(mass2));

        console.log("Collision Applied - Force:", force);
        console.log("After Collision - Tank1 Velocity:", tank1.tankVelocity);
        console.log("After Collision - Tank2 Velocity:", tank2.tankVelocity);
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
            applyCollisionResponse(tank, ai, deltaTime)
        }
        // Update collision detection for the user tank
        // updateCollisionDetection(tank, octree);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

animate();
