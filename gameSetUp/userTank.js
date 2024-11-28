import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Tank } from './tank.js';

let labelRenderer;

const TankConfig = {
    speed: 0.3,
    hullRotationSpeed: 0.02,
    turretRotationSpeed: 0.021,
    gravity: 9.81, // in m/s^2
    mass: 5000, // in kg 
    maxAcceleration: 15, // max acceleration in m/s^2
    maxSpeed: 15, // max speed in m/s
    friction: 0.96, // friction factor (slows down tank when no input)
};

const CameraConfig = {
    trackRadius: 15, // Radius of the circular track
    trackHeight: 3, // height of camera track off ground
    smoothing: { x: 0.1, z: 0.1 },
};

const TankState = Object.freeze({
    IDLE: 'idle',
    ACCELERATING: 'accelerating',
    DECELERATING: 'decelerating',
    //other
    TURNING: 'turning',
    BRAKING: 'braking',
    STALLED: 'stalled',
});

const MovementKeys = {
    FORWARD: ['w', 'ArrowUp'],
    BACKWARD: ['s', 'ArrowDown'],
    LEFT: ['a', 'ArrowLeft'],
    RIGHT: ['d', 'ArrowRight'],
};

const TurretKeys = {
    LEFT: 'z',
    RIGHT: 'x',
    CENTER: 'c',
};

const CameraKeys = {
    DOWN: '[',
    UP: ']',
};

const TankKeys = {
    SELF_DESTRUCT: 'Delete',
};

// Handles all hull movement from keyboard inputs and sets state
class Controller_Hull {
    constructor(tank) {
        this.tank = tank;
    }
    handleKeyDown(event) {
        // Movement controls [forward, backward, left, right]
        if (MovementKeys.FORWARD.includes(event.key)) {
            this.tank.hullControl.forward = true;
            this.tank.setState(TankState.ACCELERATING);
        }
        if (MovementKeys.BACKWARD.includes(event.key)) {
            this.tank.hullControl.backward = true;
            this.tank.setState(TankState.DECELERATING);
        }
        if (MovementKeys.LEFT.includes(event.key)) {
            this.tank.hullControl.left = true;
        }
        if (MovementKeys.RIGHT.includes(event.key)) {
            this.tank.hullControl.right = true;
        }
    }
    handleKeyUp(event) {
        // Movement controls
        if (MovementKeys.FORWARD.includes(event.key)) {
            this.tank.hullControl.forward = false;
            this.tank.updateMovementState();
        }
        if (MovementKeys.BACKWARD.includes(event.key)) {
            this.tank.hullControl.backward = false;
            this.tank.updateMovementState();
        }
        if (MovementKeys.LEFT.includes(event.key)) {
            this.tank.hullControl.left = false;
        }
        if (MovementKeys.RIGHT.includes(event.key)) {
            this.tank.hullControl.right = false;
        }
    }
    calculateVerticalShift(gravityForce) {
        // Base case: Flat ground
        // if (this.tankGroup.position.y <= 0) {
        //     return 0; // On the ground
        // }

        // Simulate fall due to gravity
        const potentialNewY = this.tank.tankGroup.position.y + gravityForce;
        return Math.max(potentialNewY, 0); // Clamp to ground level
    }
    // Smooths the acceleration and deceleration of forward and backward movement
    accelerationSmoothing(deltaTime) {
        let acceleration = 0;

        // Handle acceleration or deceleration
        if (this.tank.state === TankState.ACCELERATING) {
            acceleration = -TankConfig.maxAcceleration;
            this.tank.tankVelocity = Math.min(this.tank.tankVelocity + (TankConfig.maxAcceleration * deltaTime), TankConfig.maxSpeed);
        } else if (this.tank.state === TankState.DECELERATING) {
            acceleration = TankConfig.maxAcceleration;
            this.tank.tankVelocity = Math.max(this.tank.tankVelocity - (TankConfig.maxAcceleration * deltaTime), -TankConfig.maxSpeed);
        } else if (this.tank.state === TankState.IDLE) {
            // Gradual slowdown due to friction, but make sure the tank doesn't stop abruptly
            if (Math.abs(this.tank.tankVelocity) < 0.1) {
                this.tank.tankVelocity = 0;
            } else {
                this.tank.tankVelocity *= TankConfig.friction; // Apply friction smoothly
            }
        }

        // Calculate position update
        const dx = Math.sin(this.tank.tankGroup.rotation.y) * this.tank.tankVelocity * deltaTime;
        const dz = Math.cos(this.tank.tankGroup.rotation.y) * this.tank.tankVelocity * deltaTime;

        // Gravity effect on y-axis
        const gravityForce = -TankConfig.gravity * deltaTime;
        const dy = this.calculateVerticalShift(gravityForce);

        // Update tank position
        this.tank.tankGroup.position.x -= dx;
        this.tank.tankGroup.position.z -= dz;
        this.tank.tankGroup.position.y += dy; // Adjust for terrain or jumps

        // Apply weight shift (tilt) dynamics
        // this.applyWeightShift(acceleration, deltaTime);
    }
    update() {
        // Hull (rotation)
        if (this.tank.hullControl.left) {
            this.tank.tankGroup.rotation.y += TankConfig.hullRotationSpeed;
        }
        if (this.tank.hullControl.right) {
            this.tank.tankGroup.rotation.y -= TankConfig.hullRotationSpeed;
        }
        // Hull (movement)
        this.accelerationSmoothing(this.tank.deltaTime);
    }
}
// Handles all turret movement from keyboard inputs
class Controller_Turret {
    constructor(tank) {
        this.tank = tank;
    }
    handleKeyDown(event) {
        // Turret controls
        if (TurretKeys.LEFT.includes(event.key)) {
            this.tank.turretControl.left = true;
        }
        if (TurretKeys.RIGHT.includes(event.key)) {
            this.tank.turretControl.right = true;
        }
        if (TurretKeys.CENTER.includes(event.key)) {
            this.tank.turretControl.center = true;
        }
    }
    handleKeyUp(event) {
        // Turret controls
        if (TurretKeys.LEFT.includes(event.key)) {
            this.tank.turretControl.left = false;
        }
        if (TurretKeys.RIGHT.includes(event.key)) {
            this.tank.turretControl.right = false;
        }
        if (TurretKeys.CENTER.includes(event.key)) {
            this.tank.turretControl.center = false;
        }
    }
    update() {
        // Turret (rotation)
        if (this.tank.turret) {
            if (this.tank.turretControl.left) this.tank.turret.rotation.y += TankConfig.turretRotationSpeed;
            if (this.tank.turretControl.right) this.tank.turret.rotation.y -= TankConfig.turretRotationSpeed;
            if (this.tank.turretControl.center) this.tank.turret.rotation.y = 0; // Reset to center
        }
    }
}
// Handles all camera movement from keyboard inputs
class Controller_Camera {
    constructor(tank) {
        this.tank = tank;
        this.cameraControl = { up: false, down: false };
        // Camera setup
        this.cameraOffset = new THREE.Vector3(0, 2, CameraConfig.trackHeight);  // Camera offset (behind and above the tank)
    }
    handleKeyDown(event) {
        // Camera controls
        if (CameraKeys.UP.includes(event.key)) {
            this.cameraControl.up = true;
        }
        if (CameraKeys.DOWN.includes(event.key)) {
            this.cameraControl.down = true;
        }
    }
    handleKeyUp(event) {
        // Camera controls
        if (CameraKeys.UP.includes(event.key)) {
            this.cameraControl.up = false;
        }
        if (CameraKeys.DOWN.includes(event.key)) {
            this.cameraControl.down = false;
        }
    }
    update(camera) {
        // Camera (position, rotation) based on turret rotation
        if (this.tank.turret) {
            const turretRotation_radians = this.tank.turret.rotation.y + this.tank.tankGroup.rotation.y; // Turret rotation in radians
            // Camera positioning relative to the turret's rotation
            const cameraX = this.tank.tankGroup.position.x + (CameraConfig.trackRadius * Math.sin(turretRotation_radians));  // Circular path along X
            const cameraZ = this.tank.tankGroup.position.z + (CameraConfig.trackRadius * Math.cos(turretRotation_radians));  // Circular path along Z
            const cameraY = this.tank.tankGroup.position.y + this.cameraOffset.y + CameraConfig.trackHeight;  // Constant height above the tank

            // Smooth camera movement
            camera.position.x += (cameraX - camera.position.x) * CameraConfig.smoothing.x;
            camera.position.z += (cameraZ - camera.position.z) * CameraConfig.smoothing.z;
            camera.position.y = cameraY;  // Directly update the Y position to avoid tilting
        } else {
            // Fallback for non-loaded turret: Use default camera position
            camera.position.set(
                this.tank.tankGroup.position.x + this.cameraOffset.x,
                this.tank.tankGroup.position.y + this.cameraOffset.y,
                this.tank.tankGroup.position.z + this.cameraOffset.z
            );
        }

        // Camera (movement) up / down
        if (this.cameraControl.up) this.cameraOffset.y += 0.1
        if (this.cameraControl.down) this.cameraOffset.y -= 0.1
    }
}

// Handles all keyboard inputs for all tank functionality
class KeyboardHandler {
    constructor(tank) {
        this.tank = tank;
        this.hullController = new Controller_Hull(this.tank);
        this.turretController = new Controller_Turret(this.tank);
        this.cameraController = new Controller_Camera(this.tank);
        this.setupEventListeners();
        this.velocity = { x: 0, y: 0, z: 0 }; // Track speed in 3D space
    }

    update(camera) {
        this.hullController.update();
        this.turretController.update();
        this.cameraController.update(camera);
    }

    handleKeyDown(event) {
        // console.log(event.key)
        this.hullController.handleKeyDown(event);
        this.turretController.handleKeyDown(event);
        this.cameraController.handleKeyDown(event);
        // Self-destruct
        if (TankKeys.SELF_DESTRUCT.includes(event.key)) {
            this.tank.tankGroup.position.set(0, 0, 0)
        }
    }

    handleKeyUp(event) {
        this.hullController.handleKeyUp(event);
        this.turretController.handleKeyUp(event);
        this.cameraController.handleKeyUp(event);
    }

    setupEventListeners() {
        // Set up event listeners for tank controls
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
        window.addEventListener('keyup', (event) => this.handleKeyUp(event));
    }

    dispose() {
        // Clean up resources and remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    }

}

// Renders speed, health, inventory, etc
class ScreenText {
    constructor(tank) {
        this.tank = tank;
        this.createText();
        this.textContent = '0';  // Initialize with some default value
    }

    createText() {
        // Create 2D text element
        labelRenderer = new CSS2DRenderer();
        labelRenderer.setSize(window.innerWidth, window.innerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        document.body.appendChild(labelRenderer.domElement);

        // Create a div element for the text "60"
        this.textDiv = document.createElement('div');
        this.textDiv.textContent = this.textContent; // Set initial text content
        this.textDiv.style.position = 'absolute';
        this.textDiv.style.bottom = '10px';  // 10px from the bottom
        this.textDiv.style.left = '10px';    // 10px from the left
        this.textDiv.style.fontSize = '40px'; // Font size
        this.textDiv.style.color = 'white';  // Text color
        this.textDiv.style.fontFamily = 'Arial, sans-serif'; // Font family
        this.textDiv.style.zIndex = '1000'; // Ensure it's on top of everything

        // Add the text div to the document body
        document.body.appendChild(this.textDiv);
    }

    // Function to update the text content
    update() {
        // Example: Update text content with current speed (for example)
        this.textContent = Math.round(this.tank.tankVelocity); // Update the text content with current speed
        if (this.textDiv) this.textDiv.textContent = this.textContent;  // Update the actual text element in the DOM
    }
}

export class UserTank extends Tank {
    constructor(scene, modelAndTexture, onLoadCallback) {
        super(scene, modelAndTexture, onLoadCallback); // Call the parent constructor
        this.keyboardHandler = new KeyboardHandler(this);
        this.screenText = new ScreenText(this);
        this.tankVelocity = 0;
    }
    update(camera, deltaTime) {
        this.deltaTime = deltaTime;
        this.keyboardHandler.update(camera); // hull and turret movement
        this.screenText.update();

        // this.boundingBox.setFromObject(this.tankGroup);
        camera.lookAt(this.tankGroup.position);
    }
    dispose() {
        // Clean up resources and remove event listeners
        this.scene.remove(this.tankGroup);
    }
}
