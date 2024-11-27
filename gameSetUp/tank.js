import * as THREE from 'three';
import { loadModel } from './modelLoading.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';


const speed = 0.3;
const rotationSpeed = 0.02;
const turretRotationSpeed = 0.021;
let labelRenderer;

// Define camera track properties
const trackRadius = 10; // Radius of the circular track
const trackHeight = 1.75; // Height of the camera above the tank
const cameraSmoothingX = 0.1;
const cameraSmoothingZ = 0.1;


const gravity = 9.81;  // in m/s^2
const tankMass = 5000;  // in kg (adjust as needed)
const maxAcceleration = 10;  // max acceleration in m/s^2
const maxSpeed = 15;  // max speed in m/s
const friction = 0.95;  // friction factor (slows down tank when no input)

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

export class Tank {
    constructor(scene, modelAndTexture, onLoadCallback) {
        this.state = TankState.IDLE;
        this.setupEventListeners();

        this.scene = scene;
        this.tankVelocity = 0;
        this.hull = null;
        this.turret = null;
        this.movement = { forward: false, backward: false, left: false, right: false };
        this.turretControl = { left: false, right: false, center: false };
        this.cameraControl = { up: false, down: false };
        // Camera setup
        this.cameraOffset = new THREE.Vector3(0, 2, trackHeight);  // Camera offset (behind and above the tank)

        // Create a group to combine hull and turret
        this.tankGroup = new THREE.Group();
        this.scene.add(this.tankGroup);

        this.tankBar();

        // Load the hull and turret
        this.loadModel(modelAndTexture.hull, modelAndTexture.hull_texture, (hull) => {
            this.hull = hull;
            this.tankGroup.add(this.hull); // Add the hull to the tank group
            if (this.turret && onLoadCallback) onLoadCallback(this);
        });

        this.loadModel(modelAndTexture.turret, modelAndTexture.turret_texture, (turret) => {
            this.turret = turret;
            this.turret.position.set(0, 1.33, 0); // Position turret on top of the hull
            this.tankGroup.add(this.turret); // Add the turret to the tank group
            if (this.hull && onLoadCallback) onLoadCallback(this);
        });

        // Create fixed text
        this.createText();
        this.textContent = '60';  // Initialize with some default value
        this.fire();
    }

    fire() {
        this.fireEffect = new THREE.Group();

        // Create a new geometry for the vertical line
        const lineGeometry = new THREE.BufferGeometry();
        const vertices2 = [];
        vertices2.push(1, -1, 1); // Start from the circle (x, 0, y)
        vertices2.push(1, 1, 1); // Go upwards (x, 5, y)

        // Set the position attribute for the line
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices2, 3));

        const geometry = new THREE.CylinderGeometry(0.1, 0.1, 100, 3); // Small radius for line thickness, height for line length
        geometry.rotateX(Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        // Create the line material and line
        const line = new THREE.Mesh(geometry, material);
        line.position.z -= 56;
        // Position the cylinder at the correct point
        this.fireEffect.add(line);


        this.fireEffect.position.set(this.tankGroup.position.x, this.tankGroup.position.y + 2, this.tankGroup.position.z + 2);
        this.scene.add(this.fireEffect);
    }

    updateFire() {
        if(this.tankGroup?.children[1]?.children[0])
        {
            const test = this.tankGroup.children[1].children[0].position;
            this.fireEffect.position.set(test);
        }
    }

    tankBar() {
        // Create the health bar container
        this.barContainer = new THREE.Group();


        // Create the inner bar
        const outterBarGeometry = new THREE.PlaneGeometry(2, 0.07); // Initially set to full width
        const outterBarMaterial = new THREE.MeshBasicMaterial({ color: 0x1cac10 }); // Green for health
        const outterBar = new THREE.Mesh(outterBarGeometry, outterBarMaterial);
        outterBar.position.z += 1.6;
        this.barContainer.add(outterBar);
        // Create the inner bar
        const innerBarGeometry = new THREE.PlaneGeometry(2, 0.07); // Initially set to full width
        const innerBarMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green for health
        const innerBar = new THREE.Mesh(innerBarGeometry, innerBarMaterial);
        innerBar.position.z += 1.601;
        this.barContainer.add(innerBar);
        this.scene.add(this.barContainer);
        this.updateBars(this.tankGroup)
        this.updateHealthBar(60);
    }

    updateBars(camera) {
        this.barContainer.position.set(
            this.tankGroup.position.x,
            this.tankGroup.position.y + 1.5,
            this.tankGroup.position.z)

        this.barContainer.lookAt(camera.position);
    }


    // Function to update the inner bar based on health value (0 to 1)
    updateHealthBar = function (healthValue) {
        const newHealth = (parseFloat(healthValue) / 100);
        // Get the inner bar mesh
        const innerBar = this.barContainer.children[1];

        // Update the width of the inner bar based on the health value (0 = left, 1 = right)
        innerBar.scale.x = newHealth; // Multiply by 2 to match the full width of the outer bar

        // Position the inner bar to shrink from right to left by adjusting the X position
        innerBar.position.x = newHealth - 1; // Move left as the health decreases
    };


    setupEventListeners() {
        // Set up event listeners for tank controls
        window.addEventListener('keydown', (event) => this.handleKeyDown(event));
        window.addEventListener('keyup', (event) => this.handleKeyUp(event));
    }

    loadModel(model, texture, onLoad) {
        // Replace with your existing model loader
        loadModel(this.scene, model, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, { ...texture }, onLoad);
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

    handleKeyDown(event) {
        // console.log(event.key)
        // Movement controls
        if (MovementKeys.FORWARD.includes(event.key)) {
            // this.movement.forward = true;
            this.setState(TankState.ACCELERATING);
        }
        if (MovementKeys.BACKWARD.includes(event.key)) {
            this.movement.backward = true;
            this.setState(TankState.DECELERATING);
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
            this.updateMovementState();
        }
        if (MovementKeys.BACKWARD.includes(event.key)) {
            this.movement.backward = false;
            this.updateMovementState();
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

    // Function to update the tank's movement state
    updateMovementState() {
        if (this.movement.forward && this.movement.backward) {
            this.setState(TankState.IDLE); // or a specific state for conflicting input
        } else if (this.movement.forward) {
            this.setState(TankState.ACCELERATING);
        } else if (this.movement.backward) {
            this.setState(TankState.DECELERATING);
        } else {
            this.setState(TankState.IDLE);
        }
    }

    update(camera, clock) {
        this.updateBars(camera);
        this.updateFire();
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

        // Camera (movement) up / down
        if (this.cameraControl.up) this.cameraOffset.y += 0.1
        if (this.cameraControl.down) this.cameraOffset.y -= 0.1

        // Hull (movement)
        // if (this.movement.forward) {
        //     this.tankGroup.position.x -= Math.sin(this.tankGroup.rotation.y) * speed;
        //     this.tankGroup.position.z -= Math.cos(this.tankGroup.rotation.y) * speed;
        // }
        // if (this.movement.backward) {
        //     this.tankGroup.position.x += Math.sin(this.tankGroup.rotation.y) * speed;
        //     this.tankGroup.position.z += Math.cos(this.tankGroup.rotation.y) * speed;
        // }
        if (this.movement.left) {
            this.tankGroup.rotation.y += rotationSpeed;
        }
        if (this.movement.right) {
            this.tankGroup.rotation.y -= rotationSpeed;
        }

        // Turret (rotation)
        if (this.turret) {
            if (this.turretControl.left) this.turret.rotation.y += turretRotationSpeed;
            if (this.turretControl.right) this.turret.rotation.y -= turretRotationSpeed;
            if (this.turretControl.center) this.turret.rotation.y = 0; // Reset to center
        }
        camera.lookAt(this.tankGroup.position);
        const deltaTime = clock.getDelta();
        this.updatePhysics(deltaTime);
        this.updateText();
    }

    dispose() {
        // Clean up resources and remove event listeners
        window.removeEventListener('keydown', this.handleKeyDown.bind(this));
        window.removeEventListener('keyup', this.handleKeyUp.bind(this));
        this.scene.remove(this.tankGroup);
    }


    calculateVerticalShift(gravityForce) {
        // Base case: Flat ground
        // if (this.tankGroup.position.y <= 0) {
        //     return 0; // On the ground
        // }

        // Simulate fall due to gravity
        const potentialNewY = this.tankGroup.position.y + gravityForce;
        return Math.max(potentialNewY, 0); // Clamp to ground level
    }

    updatePhysics(deltaTime) {
        let acceleration = 0;
        // Handle acceleration or deceleration
        if (this.state === TankState.ACCELERATING) {
            acceleration = -maxAcceleration;
            this.tankVelocity = Math.min(this.tankVelocity + maxAcceleration * deltaTime, maxSpeed);
        } else if (this.state === TankState.DECELERATING) {
            acceleration = maxAcceleration;
            this.tankVelocity = Math.max(this.tankVelocity - maxAcceleration * deltaTime, -maxSpeed);
        } else if (this.state === TankState.IDLE) {
            this.tankVelocity *= friction; // Gradual slowdown due to friction
        }

        // Calculate position update
        const dx = Math.sin(this.tankGroup.rotation.y) * this.tankVelocity * deltaTime;
        const dz = Math.cos(this.tankGroup.rotation.y) * this.tankVelocity * deltaTime;

        // Gravity effect on y-axis
        const gravityForce = -gravity * deltaTime;
        const dy = this.calculateVerticalShift(gravityForce);

        // Update tank position
        this.tankGroup.position.x -= dx;
        this.tankGroup.position.z -= dz;
        this.tankGroup.position.y += dy; // Adjust for terrain or jumps

        // Apply weight shift (tilt) dynamics
        // this.applyWeightShift(acceleration, deltaTime);
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
}
