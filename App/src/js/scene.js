import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import modelLoader from './modelLoader.js';

/* Set up before Scene */

const buttonSound = new Audio('./sound-effects/button-sound.mp3');



//Stats
const stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);

const canvas = document.querySelector('#myCanvas');

// Array to store tile references
const tiles = [];


// Scene
const scene = new THREE.Scene()


// Raycaster
const raycaster = new THREE.Raycaster();

// Model Loader
modelLoader.init(scene, tiles);



// Event listener for mouse actions
const mouse = new THREE.Vector2();
window.addEventListener('click', (event) => {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;


    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(tiles);

    if (intersects.length > 0) {
        const intersectedTile = intersects[0].object;
        console.log('Tile clicked:', intersectedTile);
        console.log(intersects);
        //intersectedTile.material.color.set('blue');

        // Log the coordinates of the intersected tile
        console.log('Tile coordinates:', intersectedTile.position);

        buttonSound.play();


        //needs refactor, part where we clear references needs to be moved to own function
        //IMPORTANT: Also consider only naming the tiles that will be occupied in blender
        switch(intersectedTile.name)
        {
            case "tilecastle":
                modelLoader.loadModel('Castle' );
                break;
            case "tiledock":
                modelLoader.loadModel('Dock');
                break;
            case "tilefountain":
                modelLoader.loadModel('Fountain');
                break;
            case "tiletavern":
                modelLoader.loadModel('Tavern');
                break;
            case "tilewindmill":
                modelLoader.loadModel('Windmill');
                break;
            case "tilehouses":
                modelLoader.loadModel("Houses");
                break;
            case "tilebighouses":
                modelLoader.loadModel("BigHouse");
                break;
            case "tilesmallhouses":
                modelLoader.loadModel("SmallHouse");
                break;
            default:
                break;

        }


        const index = tiles.indexOf(intersectedTile);
        if (index > -1) {
            tiles.splice(index, 1);
        } else {
            console.error('Tile not found in array:', intersectedTile);
        }

        //intersectedTile.BufferGeometry.dispose();
        intersectedTile.material.dispose();
        intersectedTile.removeFromParent();
            
    }
});

//IMPORTANT; When testing performance, turn this function off to test
let hoveredTile = null; //For mouseHover function!
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(tiles);

    if (hoveredTile !== null) {
        hoveredTile.material.emissive.setHex(0);
        hoveredTile = null;
    }


    if (intersects.length) {
        // Undo hover effect on previously hovered tile
        if (hoveredTile !== null && hoveredTile !== intersects[0].object) {
            hoveredTile.material.emissive.setHex(0);
        }

        // Set the hover effect on the currently hovered tile
        hoveredTile = intersects[0].object;
        hoveredTile.material.emissive.setHex(0x555555);
    }
}

// Throttling function
function throttle(fn, wait) {
    let time = Date.now();
    return function (...args) {
        if ((time + wait - Date.now()) < 0) {
            fn(...args);
            time = Date.now();
        }
    };
}

window.addEventListener('mousemove', throttle(onMouseMove, 50));

/**
 * Lights 
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 3.6)
directionalLight.position.set(-8, 7, 1.4)
scene.add(directionalLight)


/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(-7.02, 9.82, -17)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1, 0)
controls.enableDamping = true
controls.dampingFactor = 0.05; //Controls how quickly camera movement slows down
controls.screenSpacePanning = false; //Disables user from right-click panning
controls.maxPolarAngle = Math.PI / 2; //Maximum viewing angle
controls.mouseButtons.RIGHT = null; // Disable right-click

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    stats.begin();
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime;
    
    //Update mixer
    modelLoader.handleAnimations(deltaTime);

    // Update controls
    controls.update(deltaTime);
    
    // Render
    renderer.render(scene, camera)

    stats.end();
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

