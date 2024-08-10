import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

let scene, camera, renderer, controls;
let groundMesh, raycaster;
let blocks = [];
let highlightMesh;

const worldWidth = 100;
const worldDepth = 100;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const groundGeometry = new THREE.PlaneGeometry(worldWidth, worldDepth);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0; // Ground at y = 0
    scene.add(groundMesh);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    raycaster = new THREE.Raycaster();

    const highlightGeometry = new THREE.BoxGeometry(1, 1, 1);
    const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
    highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
    scene.add(highlightMesh);

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([groundMesh, ...blocks]);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const normal = intersects[0].face.normal;
        
        let placementPosition;
        if (intersects[0].object === groundMesh) {
            placementPosition = new THREE.Vector3(
                Math.floor(intersectionPoint.x) + 0.5,
                0.5, // Half a unit above the ground
                Math.floor(intersectionPoint.z) + 0.5
            );
        } else {
            placementPosition = new THREE.Vector3(
                Math.floor(intersectionPoint.x + normal.x * 0.5) + 0.5,
                Math.floor(intersectionPoint.y + normal.y * 0.5) + 0.5,
                Math.floor(intersectionPoint.z + normal.z * 0.5) + 0.5
            );
        }
        
        highlightMesh.position.copy(placementPosition);
        highlightMesh.visible = true;
    } else {
        highlightMesh.visible = false;
    }
}

function onClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([groundMesh, ...blocks]);

    if (intersects.length > 0) {
        const intersectionPoint = intersects[0].point;
        const normal = intersects[0].face.normal;
        
        let placementPosition;
        if (intersects[0].object === groundMesh) {
            placementPosition = new THREE.Vector3(
                Math.floor(intersectionPoint.x) + 0.5,
                0.5, // Half a unit above the ground
                Math.floor(intersectionPoint.z) + 0.5
            );
        } else {
            placementPosition = new THREE.Vector3(
                Math.floor(intersectionPoint.x + normal.x * 0.5) + 0.5,
                Math.floor(intersectionPoint.y + normal.y * 0.5) + 0.5,
                Math.floor(intersectionPoint.z + normal.z * 0.5) + 0.5
            );
        }
        
        createBlock(placementPosition);
    }
}

function createBlock(position) {
    const blockSize = 1;
    const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
    const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown color
    const block = new THREE.Mesh(geometry, material);
    
    block.position.copy(position);
    
    scene.add(block);
    blocks.push(block);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

init();