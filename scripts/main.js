import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { World } from './world.js'
import { createUI } from './ui.js';


const stats = new Stats();
document.body.append(stats.dom);

// Renderer Setup
const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x80a0e0);
document.body.appendChild(renderer.domElement);

// Camera Setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-32, 16, -32);


const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(16, 0, 16);
controls.update();


// Scene Setup
const scene = new THREE.Scene();
const world = new World();
world.generate();
scene.add(world);


function setupLights() {
    const light1 = new THREE.DirectionalLight(0xffffff, 1);
    light1.position.set(1, 1, 1);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 1);
    light2.position.set(-1, .05, -1);
    scene.add(light2);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    ambient.intensity = 0.1;
    scene.add(ambient);
}


// Render Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    stats.update();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
})

setupLights();
createUI(world);
animate();