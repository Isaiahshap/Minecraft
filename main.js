import * as THREE from 'three';
import brickDiffuseUrl from './textures/brick_diffuse.jpg';
import brickBumpUrl from './textures/brick_bump.jpg';
import floorDiffuseUrl from './textures/Wood008_4K-JPG_Color.jpg';
import floorNormalUrl from './textures/Wood008_4K-JPG_NormalDX.jpg';
import floorRoughnessUrl from './textures/Wood008_4K-JPG_Roughness.jpg';
import floorBumpUrl from './textures/Wood008_4K-JPG_Displacement.jpg';
import skyUrl from './textures/sky.jpg';

let scene, camera, renderer;
let room, desk, chair, skybox;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let canLook = false;
const moveSpeed = 0.1;
const lookSpeed = 0.002;

// Room dimensions
const roomWidth = 10;
const roomHeight = 8;
const roomDepth = 12;

// Textures
let wallTexture, normalTexture, floorTexture, skyTexture;

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ canvas: document.querySelector('#bg'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const textureLoader = new THREE.TextureLoader();

    Promise.all([
        textureLoader.loadAsync(brickDiffuseUrl),
        textureLoader.loadAsync(brickBumpUrl),
        textureLoader.loadAsync(floorDiffuseUrl),
        textureLoader.loadAsync(floorNormalUrl),
        textureLoader.loadAsync(floorRoughnessUrl),
        textureLoader.loadAsync(floorBumpUrl),
        textureLoader.loadAsync(skyUrl)
    ]).then(([wall, normal, floorColor, floorNormal, floorRoughness, floorBump, sky]) => {
        wallTexture = wall;
        normalTexture = normal;
        floorTexture = floorColor;
        floorTexture.normalMap = floorNormal;
        floorTexture.roughnessMap = floorRoughness;
        floorTexture.bumpMap = floorBump;
        skyTexture = sky;

        createSkybox();
        createRoom();
        createWindow();
        setupLighting();
        createDesk();
        createChair();
        setupCamera();
        setupControls();
        animate();
    }).catch(error => {
        console.error('Error loading textures:', error);
    });
}

function createSkybox() {
    const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
    const skyboxMaterial = new THREE.MeshBasicMaterial({ map: skyTexture, side: THREE.BackSide });
    skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterial);
    scene.add(skybox);
}

function createRoom() {
    room = new THREE.Group();

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        normalMap: normalTexture,
        roughness: 0.8,
        side: THREE.DoubleSide
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
        map: floorTexture,
        normalMap: floorTexture.normalMap,
        roughnessMap: floorTexture.roughnessMap,
        bumpMap: floorTexture.bumpMap,
        roughness: 0.6,
        side: THREE.DoubleSide
    });

    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -roomHeight / 2;
    room.add(floor);

    // Create ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(roomWidth, roomDepth);
    const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = roomHeight / 2;
    room.add(ceiling);

    // Create walls
    const wallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    
    // Back wall (will have the window)
    const backWall = new THREE.Mesh(wallGeometry, wallMaterial);
    backWall.position.z = -roomDepth / 2;
    room.add(backWall);

    // Front wall
    const frontWall = new THREE.Mesh(wallGeometry, wallMaterial);
    frontWall.position.z = roomDepth / 2;
    frontWall.rotation.y = Math.PI;
    room.add(frontWall);

    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.x = -roomWidth / 2;
    leftWall.rotation.y = Math.PI / 2;
    room.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.x = roomWidth / 2;
    rightWall.rotation.y = -Math.PI / 2;
    room.add(rightWall);

    scene.add(room);
}

function createWindow() {
    const windowWidth = 4;
    const windowHeight = 4;
    const windowGeometry = new THREE.PlaneGeometry(windowWidth, windowHeight);
    const windowMaterial = new THREE.MeshBasicMaterial({ 
        transparent: true, 
        opacity: 0,
        side: THREE.DoubleSide 
    });
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
    windowMesh.position.set(0, 1, -roomDepth / 2 + 0.01); // Positioned slightly in front of the back wall
    scene.add(windowMesh);
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(5, 5, -5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
}

function createDesk() {
    desk = new THREE.Group();

    const deskTopGeometry = new THREE.BoxGeometry(2, 0.1, 1);
    const deskMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x5c3a21,
        roughness: 0.7,
        metalness: 0.1
    });
    const deskTop = new THREE.Mesh(deskTopGeometry, deskMaterial);
    deskTop.position.y = 0.75;
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    desk.add(deskTop);

    const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.75, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3c2611,
        roughness: 0.8,
        metalness: 0.2
    });
    
    const positions = [
        { x: 0.9, z: 0.4 },
        { x: -0.9, z: 0.4 },
        { x: 0.9, z: -0.4 },
        { x: -0.9, z: -0.4 }
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos.x, 0.375, pos.z);
        leg.castShadow = true;
        desk.add(leg);
    });

    desk.position.set(0, -roomHeight / 4 + 0.5, 0);
    scene.add(desk);
}

function createChair() {
    chair = new THREE.Group();

    const seatGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.6);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.y = 0.5;
    seat.castShadow = true;
    chair.add(seat);

    const backrestGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.1);
    const backrest = new THREE.Mesh(backrestGeometry, seatMaterial);
    backrest.position.set(0, 0.9, -0.25);
    backrest.castShadow = true;
    chair.add(backrest);

    const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x3c2611 });
    
    const legPositions = [
        { x: 0.25, z: 0.25 },
        { x: -0.25, z: 0.25 },
        { x: 0.25, z: -0.25 },
        { x: -0.25, z: -0.25 }
    ];

    legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos.x, 0.25, pos.z);
        leg.castShadow = true;
        chair.add(leg);
    });

    chair.position.set(0, -roomHeight / 4 + 0.5, 1);
    scene.add(chair);
}

function setupCamera() {
    camera.position.set(0, 0, roomDepth / 2 - 2);
    camera.lookAt(0, 0, -roomDepth / 2);
}

function setupControls() {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('mousedown', () => canLook = true);
    renderer.domElement.addEventListener('mouseup', () => canLook = false);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onWindowResize, false);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

function onMouseMove(event) {
    if (canLook) {
        camera.rotation.y -= event.movementX * lookSpeed;
        camera.rotation.x -= event.movementY * lookSpeed;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function moveCamera() {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    if (moveForward) camera.position.add(direction.multiplyScalar(moveSpeed));
    if (moveBackward) camera.position.add(direction.multiplyScalar(-moveSpeed));
    
    const rightDirection = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
    if (moveRight) camera.position.add(rightDirection.multiplyScalar(moveSpeed));
    if (moveLeft) camera.position.add(rightDirection.multiplyScalar(-moveSpeed));

    camera.position.x = Math.max(-roomWidth/2 + 0.5, Math.min(roomWidth/2 - 0.5, camera.position.x));
    camera.position.y = 0;
    camera.position.z = Math.max(-roomDepth/2 + 0.5, Math.min(roomDepth/2 - 0.5, camera.position.z));
}

function animate() {
    requestAnimationFrame(animate);
    moveCamera();
    renderer.render(scene, camera);
}