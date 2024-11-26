import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { Tank } from './tank.js';

let labelRenderer;

const speed = 0.3;
const rotationSpeed = 0.02;
const turretRotationSpeed = 0.021;

// Define camera track properties
const trackRadius = 15; // Radius of the circular track
const trackHeight = 3; // Height of the camera above the tank
const cameraSmoothing = 0.1
const cameraSmoothingX = cameraSmoothing;
const cameraSmoothingZ = cameraSmoothing;


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

export class UserTank extends Tank {
    constructor(scene, modelAndTexture, onLoadCallback) {
        super(scene, modelAndTexture, onLoadCallback); // Call the parent constructor
        this.cameraControl = { up: false, down: false };
        // Camera setup
        this.cameraOffset = new THREE.Vector3(0, 2, trackHeight);  // Camera offset (behind and above the tank)

        // Create fixed text
        this.createText();
        this.textContent = '0';  // Initialize with some default value

        this.setupEventListeners();
    }

    handleKeyDown(event) {
        // console.log(event.key)
        // Movement controls
        if (MovementKeys.FORWARD.includes(event.key)) {
            // this.movement.forward = true;
            super.setState(TankState.ACCELERATING);
        }
        if (MovementKeys.BACKWARD.includes(event.key)) {
            this.movement.backward = true;
            super.setState(TankState.DECELERATING);
        }
        if (MovementKeys.LEFT.includes(event.key)) {
            this.movement.left = true;
        }
        if (MovementKeys.RIGHT.includes(event.key)) {
            this.movement.right = true;
        }
        // Turret controls
        if (TurretKeys.LEFT.includes(event.key)) {
            this.turretControl.left = true;
        }
        if (TurretKeys.RIGHT.includes(event.key)) {
            this.turretControl.right = true;
        }
        if (TurretKeys.CENTER.includes(event.key)) {
            this.turretControl.center = true;
        }
        // Camera controls
        if (CameraKeys.UP.includes(event.key)) {
            this.cameraControl.up = true;
        }
        if (CameraKeys.DOWN.includes(event.key)) {
            this.cameraControl.down = true;
        }
        // Self-destruct
        if (TankKeys.SELF_DESTRUCT.includes(event.key)) {
            this.tankGroup.position.set(0, 0, 0)
        }
    }

    handleKeyUp(event) {
        // Movement controls
        if (MovementKeys.FORWARD.includes(event.key)) {
            this.movement.forward = false;
            super.updateMovementState();
        }
        if (MovementKeys.BACKWARD.includes(event.key)) {
            this.movement.backward = false;
            super.updateMovementState();
        }
        if (MovementKeys.LEFT.includes(event.key)) {
            this.movement.left = false;
        }
        if (MovementKeys.RIGHT.includes(event.key)) {
            this.movement.right = false;
        }
        // Turret controls
        if (TurretKeys.LEFT.includes(event.key)) {
            this.turretControl.left = false;
        }
        if (TurretKeys.RIGHT.includes(event.key)) {
            this.turretControl.right = false;
        }
        if (TurretKeys.CENTER.includes(event.key)) {
            this.turretControl.center = false;
        }
        // Camera controls
        if (CameraKeys.UP.includes(event.key)) {
            this.cameraControl.up = false;
        }
        if (CameraKeys.DOWN.includes(event.key)) {
            this.cameraControl.down = false;
        }
    }

    setupEventListeners() {
        // Set up event listeners for tank controls
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
        window.addEventListener('keyup', (event) => this.handleKeyUp(event));
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
    updateText() {
        // Example: Update text content with current speed (for example)
        this.textContent = Math.round(this.tankVelocity); // Update the text content with current speed
        if (this.textDiv) this.textDiv.textContent = this.textContent;  // Update the actual text element in the DOM
    }

    update(camera, clock) {
        // Camera (position, rotation) based on turret rotation
        if (this.turret) {
            const turretRotation_radians = this.turret.rotation.y + this.tankGroup.rotation.y; // Turret rotation in radians
            // Camera positioning relative to the turret's rotation
            const cameraX = this.tankGroup.position.x + (trackRadius * Math.sin(turretRotation_radians));  // Circular path along X
            const cameraZ = this.tankGroup.position.z + (trackRadius * Math.cos(turretRotation_radians));  // Circular path along Z
            const cameraY = this.tankGroup.position.y + this.cameraOffset.y + trackHeight;  // Constant height above the tank

            // Smooth camera movement
            camera.position.x += (cameraX - camera.position.x) * cameraSmoothingX;
            camera.position.z += (cameraZ - camera.position.z) * cameraSmoothingZ;
            camera.position.y = cameraY;  // Directly update the Y position to avoid tilting
        } else {
            // Fallback for non-loaded turret: Use default camera position
            camera.position.set(
                this.tankGroup.position.x + this.cameraOffset.x,
                this.tankGroup.position.y + this.cameraOffset.y,
                this.tankGroup.position.z + this.cameraOffset.z
            );
        }
        // Hull (rotation)
        if (this.movement.left) {
            this.tankGroup.rotation.y += rotationSpeed;
        }
        if (this.movement.right) {
            this.tankGroup.rotation.y -= rotationSpeed;
        }

        // Hull (movement)
        if (this.movement.forward) {
            this.tankGroup.position.x -= Math.sin(this.tankGroup.rotation.y) * speed;
            this.tankGroup.position.z -= Math.cos(this.tankGroup.rotation.y) * speed;
        }
        if (this.movement.backward) {
            this.tankGroup.position.x += Math.sin(this.tankGroup.rotation.y) * speed;
            this.tankGroup.position.z += Math.cos(this.tankGroup.rotation.y) * speed;
        }
        // Camera (movement) up / down
        if (this.cameraControl.up) this.cameraOffset.y += 0.1
        if (this.cameraControl.down) this.cameraOffset.y -= 0.1

        // Turret (rotation)
        if (this.turret) {
            if (this.turretControl.left) this.turret.rotation.y += turretRotationSpeed;
            if (this.turretControl.right) this.turret.rotation.y -= turretRotationSpeed;
            if (this.turretControl.center) this.turret.rotation.y = 0; // Reset to center
        }

        this.boundingBox.setFromObject(this.tankGroup);
        const deltaTime = clock.getDelta();
        super.updatePhysics(deltaTime);
        camera.lookAt(this.tankGroup.position);
        this.updateText();
    }

    dispose() {
        // Clean up resources and remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('keyup', this.handleKeyUp.bind(this));
        this.scene.remove(this.tankGroup);
    }
}
