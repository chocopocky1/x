import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';



// Data structure defining models and their positions
const modelsData = [
    { path: './assets/Tavern.glb', position: new THREE.Vector3(4, 0, -7) },
    { path: './assets/Dock.glb', position: new THREE.Vector3(-8, 0, -7) },
    { path: './assets/Windmill.glb', position: new THREE.Vector3(14, 0, -5) },
    { path: './assets/Castle.glb', position: new THREE.Vector3(0, 0, -1) },
    { path: './assets/Fountain.glb', position: new THREE.Vector3(0, 0, -9) },
    { path: './assets/Houses.glb', position: new THREE.Vector3(11, 0, -9) },
    { path: './assets/BigHouse.glb', position: new THREE.Vector3(-8, 0, -1) },
    { path: './assets/SmallHouses.glb', position: new THREE.Vector3(11, 0, -9) },


];

// Mapping of model names to their corresponding data index
const modelMap = {
    'Tavern': 0,
    'Dock': 1,
    'Windmill': 2,
    'Castle': 3,
    'Fountain': 4,
    'Houses': 5,
    'BigHouse': 6,
    'SmallHouse': 7,
};

// Singleton pattern
const modelLoader = {
    loader: new GLTFLoader(),
    scene : null,
    animationList: [],  // Array to hold AnimationMixers

    //Holds scene reference
    init(scene, tilesArray) {
        this.scene = scene;
        this.handleProgressLoader(tilesArray);
    },

    //Loads plane and populates tiles array
    loadPlane(tilesArray, loadManager)
    {
        loadManager.load('./assets/Tileset.glb', (gltf) => {

            console.log('GLTF loaded successfully:', gltf);

            //Traverse through tileset to get individual tile references
            gltf.scene.traverse(function(child) {

                if (child) {
                    console.log('Processing child:', child.name);
                }

                if (child && child.isMesh && child.name.startsWith('tile')) {
                    
                    tilesArray.push(child);
                }
            });

            console.log(tilesArray.length);

            this.scene.add(gltf.scene); 
    
        }); 
    },

    loadModel(modelName)
    {
        const modelIndex = modelMap[modelName];
        if (modelIndex === undefined) {
            console.error('Unknown model name:', modelName);
            return;
        }

        const modelData = modelsData[modelIndex];

        this.loader.load(modelData.path, (gltf) => {
            gltf.scene.position.copy(modelData.position);
            this.scene.add(gltf.scene);

            if (gltf.animations && gltf.animations.length) {
                const mixer = new THREE.AnimationMixer(gltf.scene);
                gltf.animations.forEach((clip) => {
                    mixer.clipAction(clip).play();
                });
                this.animationList.push(mixer);
            }
        }, undefined, (error) => {
            console.error('Error loading model:', error);
        });
    },

    handleAnimations(deltaTime) {
        for (let i = 0; i < this.animationList.length; i++) {
            let mixer = this.animationList[i];
            mixer.update(deltaTime);
        }
    },

    fadeOutOverlay(overlayMaterial, clock)
    {
        const duration = 3; // Duration of the fade-out in seconds
        const initialAlpha = overlayMaterial.uniforms.uAlpha.value;
        const fadeOutLoop = () => {
            const elapsedTime = clock.getElapsedTime();
            const alpha = THREE.MathUtils.lerp(initialAlpha, 0, elapsedTime / duration);
            overlayMaterial.uniforms.uAlpha.value = alpha;
    
            if (alpha > 0) {
                requestAnimationFrame(fadeOutLoop);
            } else {
                overlayMaterial.uniforms.uAlpha.value = 0;
            }
        }
        clock.start();
        fadeOutLoop();
    },

    handleProgressLoader(tilesArray) {
        // Overlay (Plane that covers camera until all assets loaded)
        const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1) // Fill screen
        const overlayMaterial = new THREE.ShaderMaterial({
            transparent: true,
            uniforms: 
            {
                uAlpha: { value: 1 }
            },
            vertexShader: `
                void main()
                {
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uAlpha;

                void main()
                {
                    gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
                }
            `
        });
        const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
        this.scene.add(overlay)
        const clock = new THREE.Clock();
        const loadingBarElement = document.querySelector('.loading-bar');
        const loadingManager = new THREE.LoadingManager(
            // Loaded 
            () =>
            {
                window.setTimeout(() =>
                {
                    console.log('loaded');
                    this.fadeOutOverlay(overlayMaterial, clock);
                    loadingBarElement.classList.add('ended');
                    loadingBarElement.style.transform = ''; // Removes override from js transform property
                }, 500);
            },
            
            // Progress
            (itemURL, itemsLoaded, itemsTotal) =>
            {
                console.log(itemsLoaded / itemsTotal); // Ratio drives progress bar
                const progressRatio = itemsLoaded / itemsTotal;
                loadingBarElement.style.transform = `scaleX(${progressRatio})`;
            },
        );
        const gltfLoader = new GLTFLoader(loadingManager)

        this.loadPlane(tilesArray, gltfLoader);
    },


};

export default modelLoader;

