import * as THREE from 'three';

// Function to load XML file
async function loadXML(xmlFilePath) {
    const response = await fetch(xmlFilePath); // Fetch the XML file
    if (!response.ok) {
        throw new Error(`Failed to load XML file: ${xmlFilePath}`);
    }
    const text = await response.text(); // Get the XML content as a string
    return new window.DOMParser().parseFromString(text, 'application/xml'); // Parse the XML string into a DOM object
}


// Example usage in your model setup
function createRectangle(width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshBasicMaterial({ color });  // Apply noise texture
    const rectangle = new THREE.Mesh(geometry, material);
    return rectangle;
}
function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}
// Function to load the map and filter models
export function loadMapAssets(xmlFilePathData, scene) {
    return loadXML(xmlFilePathData).then((xmlData) => {
        const props = xmlData.querySelectorAll('prop');
        const promises = [];

        props.forEach((prop) => {
            const modelName = prop.getAttribute('name');  // Get model name
            const libraryName = prop.getAttribute('library-name');  // Get library name

            // Only process specific models
            if (modelName === 'Tile 1x1' || modelName === 'WTile 2' || modelName === 'Bridge 1' || modelName === 'Billboard' || modelName === 'Wall 1') {
                const position = {
                    x: parseFloat(prop.querySelector('position x').textContent) / 100, // Scale down by 100
                    y: parseFloat(prop.querySelector('position z').textContent) / 100, // Scale down by 100
                    z: parseFloat(prop.querySelector('position y').textContent) / 100, // Scale down by 100
                };
                const rotationZ = parseFloat(prop.querySelector('rotation z').textContent);
                const textureName = prop.querySelector('texture-name').textContent;

                // Create the model using a rectangle
                let rectangle = null;
                console.log(modelName)
                switch (modelName) {
                    case 'Tile 1x1':
                        rectangle = createRectangle(5, 0.1, 5, 0x8e8e8e);  // Tile 1x1 model (rectangle)
                        break;
                    case 'WTile 2':
                        rectangle = createRectangle(5, 0.1, 5, 0x7c7c7c);  // Outer Wall tiles (scaled to match Tile 1x1 size)
                        break;
                    case 'Bridge 1':
                        rectangle = createRectangle(8, 0.1, 4, 0x4f4f4f);  // Bridge (scaled up to match proportions)
                        break;
                    case 'Billboard':
                        rectangle = createRectangle(6, 0.2, 2, 0xff0000);  // Billboard (scaled to size with the other assets)
                        break;
                    case 'Wall 1':
                        rectangle = createRectangle(6, 0.2, 5, 0x0000ff);  // Wall (scaled to size with the other assets)
                        break;
                    default:
                        return;  // Ignore other models
                }

                if (rectangle) {
                    // Set the position and rotation of the model
                    rectangle.position.set(position.x, position.y, position.z);
                    if (modelName !== 'Tile 1x1') {
                        rectangle.rotation.set(0, 0, rotationZ);
                    }
                    else {
                        rectangle.rotation.set(0, 0, 0);
                    }
                    // Add the rectangle to the scene
                    scene.add(rectangle);

                    // Add the promise to the promises array (even though rectangles are immediate)
                    promises.push(Promise.resolve(rectangle));
                }

            }
        });

        // Wait for all models (in this case rectangles) to load
        return Promise.all(promises);
    }).catch((error) => {
        console.error('Error loading XML:', error);
        throw error;
    });
}
