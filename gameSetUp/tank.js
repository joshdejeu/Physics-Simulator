import * as THREE from 'three';
import { loadModel } from './modelLoading.js';


const gravity = 9.81;  // in m/s^2
const tankMass = 5000;  // in kg (adjust as needed)
const maxAcceleration = 25;  // max acceleration in m/s^2
const maxSpeed = 50;  // max speed in m/s
const friction = 0.96;  // friction factor (slows down tank when no input)

export const TankState = Object.freeze({
    IDLE: 'idle',
    ACCELERATING: 'accelerating',
    DECELERATING: 'decelerating',
    TURNING_LEFT: "turning_left",
    TURNING_RIGHT: "turning_right",
    //other
    BRAKING: 'braking',
    STALLED: 'stalled',
});

// Function to create a text sprite
class VelocityLabel {
    constructor(tank, scene) {
        this.tank = tank; // Reference to the tank for velocity and position
        this.scene = scene;

        // Create a canvas for text rendering
        this.canvas = document.createElement('canvas');
        this.canvas.width = 256; // Canvas size for high-quality text
        this.canvas.height = 64;
        this.context = this.canvas.getContext('2d');

        // Create a texture from the canvas
        this.texture = new THREE.Texture(this.canvas);
        this.spriteMaterial = new THREE.SpriteMaterial({ map: this.texture });
        this.sprite = new THREE.Sprite(this.spriteMaterial);

        // Initial label position
        this.sprite.scale.set(5, 1.25, 1); // Adjust scale as needed

        // Add the sprite to the scene
        scene.add(this.sprite);
    }

    // Update the text on the canvas and refresh the texture
    updateText(newText) {
        // Clear the canvas
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw the text
        this.context.font = '32px Monospace'; // Font size and style
        this.context.fillStyle = 'white'; // Text color
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillText(newText, this.canvas.width / 2, this.canvas.height / 2);

        // Mark the texture as needing an update
        this.texture.needsUpdate = true;
    }

    // Call this method in the main update loop
    update() {
        // Update the label's position to follow the tank
        const tankPosition = this.tank.tankGroup.position;
        this.sprite.position.set(tankPosition.x, tankPosition.y + 3, tankPosition.z); // Offset label above tank
        // Update the text based on the tank's velocity
        const speed = Math.round(this.tank.tankVelocity.length());
        this.updateText(`${speed} m/s`);
    }

    // Remove the label from the scene
    dispose() {
        this.scene.remove(this.sprite);
    }
}

export class Tank {
    constructor(scene, modelAndTexture, onLoadCallback) {
        this.tankGroup = new THREE.Group(); // Create a group to combine hull and turret
        this.turretControl = { left: false, right: false, center: false };
        this.scene = scene; // The space in which models get placed in
        this.activeStates = new Set(); // Store active states in a set to handle multiple states
        this.activeStates.add(TankState.IDLE)
        this.hull = null;
        this.turret = null;
        this.tankVelocity = new THREE.Vector3(0, 0, 0);

        // Load the hull and turret
        this.initializeTankModel(modelAndTexture, onLoadCallback);
        // Create a bounding box for the hull ONLY (collisions)
        this.boundingBox = new THREE.Box3().setFromObject(this.tankGroup);
        this.scene.add(this.tankGroup);
        this.velocityLabel = new VelocityLabel(this, scene);
    }

    initializeTankModel(modelAndTexture, onLoad) {
        // Load the hull and turret
        loadModel(this.scene, modelAndTexture.hull, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, { ...modelAndTexture.hull_texture },
            (hull) => {
                this.hull = hull;
                this.tankGroup.add(this.hull); // Add the hull to the tank group
                if (this.turret && onLoad) onLoad(this);
            }
        );

        loadModel(this.scene, modelAndTexture.turret, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, { ...modelAndTexture.turret_texture },
            (turret) => {
                this.turret = turret;
                this.turret.position.set(0, 1.33, 0); // Position turret on top of the hull
                this.tankGroup.add(this.turret); // Add the turret to the tank group
                if (this.hull && onLoad) onLoad(this);
            }
        );
    }

    // Add states to the activeStates set
    setState(newStates) {
        if (Array.isArray(newStates)) {
            newStates.forEach((state) => this.activeStates.add(state));
        } else {
            this.activeStates.add(newStates);
        }

        this.updateState();
    }

    // Update the state by processing each active state
    updateState() {
        // For each active state, run the corresponding handler
        if (this.activeStates.has(TankState.ACCELERATING)) {
            this.handleAcceleratingState();
        }

        if (this.activeStates.has(TankState.DECELERATING)) {
            this.handleDeceleratingState();
        }

        if (this.activeStates.has(TankState.TURNING_LEFT)) {
            this.handleTurningState();
        }

        if (this.activeStates.has(TankState.TURNING_RIGHT)) {
            this.handleTurningState();
        }

        if (this.activeStates.has(TankState.IDLE)) {
            this.handleIdleState();
        }
        if (this.activeStates.size > 0) {
            const statesArray = Array.from(this.activeStates);
            let statesDescription;

            if (statesArray.length === 1) {
                statesDescription = statesArray[0];
            } else if (statesArray.length === 2) {
                statesDescription = `${statesArray[0]} and ${statesArray[1]}`;
            } else {
                const lastState = statesArray.pop();
                statesDescription = `${statesArray.join(', ')}, and ${lastState}`;
            }

            console.log(`Tank is ${statesDescription}`);
        }
    }

    handleAcceleratingState() {
        // console.log('Tank is accelerating');
        // Add specific logic for acceleration here
    }

    handleDeceleratingState() {
        // console.log('Tank is decelerating');
        // Add specific logic for deceleration here
    }

    handleTurningState() {
        // console.log('Tank is turning');
        // Add specific logic for turning here
    }

    handleIdleState() {
        // console.log('Tank is idle');
        // Add specific logic for idle here
    }

    // Function to update the tank's movement state
    updateMovementState() {
        // if (this.hullControl.forward && this.hullControl.backward) {
        //     this.setState(TankState.IDLE); // or a specific state for conflicting input
        // } else if (this.hullControl.forward) {
        //     this.setState(TankState.ACCELERATING);
        // } else if (this.hullControl.backward) {
        //     this.setState(TankState.DECELERATING);
        // } else {
        //     this.setState(TankState.IDLE);
        // }
    }

    update(clock) {
        this.velocityLabel.update();
        if (this.hull) {
            this.boundingBox.setFromObject(this.hull);
            const boxHelper = new THREE.Box3Helper(this.boundingBox, 0xffff00); // The color is optional, here it's yellow
            this.scene.add(boxHelper);
        }
        // const deltaTime = clock.getDelta();
    }

    dispose() {
        // Clean up resources
        this.scene.remove(this.tankGroup);
    }
}
