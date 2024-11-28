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

export class Tank {
    constructor(scene, modelAndTexture, onLoadCallback) {
        this.tankGroup = new THREE.Group(); // Create a group to combine hull and turret
        this.turretControl = { left: false, right: false, center: false };
        this.scene = scene; // The space in which models get placed in
        this.activeStates = new Set(); // Store active states in a set to handle multiple states
        this.activeStates.add(TankState.IDLE)
        this.hull = null;
        this.turret = null;

        // Load the hull and turret
        this.initializeTankModel(modelAndTexture, onLoadCallback);
        // Create a bounding box for the hull ONLY (collisions)
        this.boundingBox = new THREE.Box3().setFromObject(this.tankGroup);
        this.scene.add(this.tankGroup);
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

        // Add more state handlers as needed
    }

    handleAcceleratingState() {
        console.log('Tank is accelerating');
        // Add specific logic for acceleration here
    }

    handleDeceleratingState() {
        console.log('Tank is decelerating');
        // Add specific logic for deceleration here
    }

    handleTurningState() {
        console.log('Tank is turning');
        // Add specific logic for turning here
    }

    handleIdleState() {
        console.log('Tank is idle');
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
