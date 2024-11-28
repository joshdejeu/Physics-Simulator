import * as THREE from 'three';
import { Tank } from './tank.js';
import { TankState } from './tank.js';

const TankConfig = {
    speed: 0.3,
    hullRotationSpeed: 0.01,
    turretRotationSpeed: 0.04,
    gravity: 9.81, // in m/s^2
    mass: 5000, // in kg 
    maxAcceleration: 25, // max acceleration in m/s^2
    maxSpeed: 5, // max speed in m/s
    friction: 0.96, // friction factor (slows down tank when no input)
    weightShiftFactor: 0.1,
};

export class AiTank extends Tank {
    constructor(scene, modelAndTexture, onLoadCallback) {
        super(scene, modelAndTexture, onLoadCallback); // Call the parent constructor
        this.tankVelocity = 0;
        this.startAutoPilot();
    }

    // Smooths the acceleration and deceleration of forward and backward movement
    accelerationSmoothing(deltaTime) {
        let acceleration = 0;

        // Handle acceleration or deceleration
        if (this.activeStates.has(TankState.ACCELERATING)) {
            acceleration = -TankConfig.maxAcceleration;
            this.tankVelocity = Math.min(this.tankVelocity + (TankConfig.maxAcceleration * deltaTime), TankConfig.maxSpeed);
        } else if (this.activeStates.has(TankState.DECELERATING)) {
            acceleration = TankConfig.maxAcceleration;
            this.tankVelocity = Math.max(this.tankVelocity - (TankConfig.maxAcceleration * deltaTime), -TankConfig.maxSpeed);
        } else if (this.activeStates.has(TankState.IDLE)) {
            // Gradual slowdown due to friction, but make sure the tank doesn't stop abruptly
            if (Math.abs(this.tankVelocity) < 0.1) {
                this.tankVelocity = 0;
            } else {
                this.tankVelocity *= TankConfig.friction; // Apply friction smoothly
            }
        }

        // Calculate position update
        const dx = Math.sin(this.tankGroup.rotation.y) * this.tankVelocity * deltaTime;
        const dz = Math.cos(this.tankGroup.rotation.y) * this.tankVelocity * deltaTime;

        // Gravity effect on y-axis

        // Update tank position
        this.tankGroup.position.x -= dx;
        this.tankGroup.position.z -= dz;

        // Apply weight shift (tilt) dynamics
        // this.applyWeightShift(acceleration, deltaTime);
    }


    startAutoPilot() {
        this.activeStates.delete([TankState.IDLE])
        this.setState([TankState.DECELERATING, TankState.TURNING_RIGHT])
        let i = 0;
        setInterval(() => {
            i++;
            if (i % 2 == 0) {
                this.activeStates.clear()
                this.setState([TankState.ACCELERATING, TankState.TURNING_LEFT])
            } else {
                this.activeStates.clear()
                this.setState([TankState.DECELERATING])
            }
        }, 5000);

    }

    update(deltaTime) {
        this.deltaTime = deltaTime;
        if (this.hull) {
            this.boundingBox.setFromObject(this.hull);
            const boxHelper = new THREE.Box3Helper(this.boundingBox, 0xffff00); // The color is optional, here it's yellow
            this.scene.add(boxHelper);
        }

        // Hull (rotation)
        if (this.activeStates.has(TankState.TURNING_LEFT)) {
            this.tankGroup.rotation.y += TankConfig.hullRotationSpeed;
        }
        if (this.activeStates.has(TankState.TURNING_RIGHT)) {
            this.tankGroup.rotation.y -= TankConfig.hullRotationSpeed;
        }
        // Hull (movement)
        this.accelerationSmoothing(this.deltaTime);
    }
    dispose() {
        // Clean up resources and remove event listeners
        this.scene.remove(this.tankGroup);
    }

}