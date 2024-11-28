import * as THREE from 'three';
import { loadModel } from './modelLoading.js';


const gravity = 9.81;  // in m/s^2
const tankMass = 5000;  // in kg (adjust as needed)
const maxAcceleration = 25;  // max acceleration in m/s^2
const maxSpeed = 50;  // max speed in m/s
const friction = 0.96;  // friction factor (slows down tank when no input)

const TankState = Object.freeze({
    IDLE: 'idle',
    ACCELERATING: 'accelerating',
    DECELERATING: 'decelerating',
    //other
    TURNING: 'turning',
    BRAKING: 'braking',
    STALLED: 'stalled',
});



export class Tank {
    constructor(scene, modelAndTexture, onLoadCallback) {
        this.tankGroup = new THREE.Group(); // Create a group to combine hull and turret
        this.hullControl = { forward: false, backward: false, left: false, right: false };
        this.turretControl = { left: false, right: false, center: false };
        this.scene = scene; // The space in which models get placed in
        this.state = TankState.IDLE;
        this.hull = null;
        this.turret = null;

        // Load the hull and turret
        this.initializeTankModel(modelAndTexture, onLoadCallback);
        
        // Create a bounding box for the tank (collisions)
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

    // Sets and handles state changes
    setState(newState) {
        if (this.setState !== newState) {
            this.state = newState;
            switch (this.state) {
                case TankState.ACCELERATING:
                    this.handleAcceleratingState();
                    break;
                case TankState.DECELERATING:
                    this.handleDeceleratingState();
                    break;
                case TankState.IDLE:
                    this.handleIdleState();
                    break;
            }
        }
    }

    handleAcceleratingState() {
        console.log('Tank is accelerating');
        // Add specific logic for acceleration here
    }

    handleDeceleratingState() {
        console.log('Tank is decelerating');
        // Add specific logic for deceleration here
    }

    handleIdleState() {
        console.log('Tank is idle');
        // Add specific logic for idle here
    }

    // Function to update the tank's movement state
    updateMovementState() {
        if (this.hullControl.forward && this.hullControl.backward) {
            this.setState(TankState.IDLE); // or a specific state for conflicting input
        } else if (this.hullControl.forward) {
            this.setState(TankState.ACCELERATING);
        } else if (this.hullControl.backward) {
            this.setState(TankState.DECELERATING);
        } else {
            this.setState(TankState.IDLE);
        }
    }

    update(clock) {
        this.boundingBox.setFromObject(this.tankGroup);
        // const deltaTime = clock.getDelta();
    }

    dispose() {
        // Clean up resources
        this.scene.remove(this.tankGroup);
    }



    applyWeightShift(acceleration, deltaTime) {
        // Simulate weight shift based on acceleration
        const maxTiltAngle = 0.1; // Maximum tilt angle in radians
        const tiltSpeed = 3; // Speed of tilt transition
        const damping = 2; // Damping factor for oscillation

        // Calculate desired tilt based on acceleration
        const targetTilt = -maxTiltAngle * (acceleration / maxAcceleration);

        // Smooth transition using damping
        const currentTilt = this.tankGroup.rotation.x; // Current pitch
        const tiltDelta = (targetTilt - currentTilt) * tiltSpeed * deltaTime;

        this.tankGroup.rotation.x += tiltDelta;

        // Apply damping to settle the tilt
        if (Math.abs(targetTilt - currentTilt) < 0.001) {
            this.tankGroup.rotation.x = 0; // Reset to neutral
        }
    }


}
