import * as THREE from 'three'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js';
import { RNG } from './rng.js';
import { blocks, resources } from './blocks.js';


const geometry = new THREE.BoxGeometry();



export class WorldChunk extends THREE.Group {
    /**
     * @type {{
     * id: number,
     * instanceID: number
     * }[][][]}
     */
    data = [];


    constructor(size, params) {
        super();
        this.loaded = false;
        this.size = size;
        this.params = params;
    }

    /**
     * Generates the world data and meshes
     */
    generate() {
        const start = performance.now();

        const rng = new RNG(this.params.seed);
        this.initializeTerrain();
        this.generateResources(rng);
        this.generateTerrain(rng);
        this.generateMeshes();

        this.loaded = true;

        console.log(`loaded chunk in ${performance.now() - start}ms`);
    }

    /**
     * Initializing the empty world
     */
    initializeTerrain() {
        this.data = [];
        for (let x = 0; x < this.size.width; x++) {
            const slice = [];
            for (let y = 0; y < this.size.height; y++) {
                const row = [];
                for (let z = 0; z < this.size.width; z++) {
                    row.push({
                        id: blocks.empty.id,
                        instanceID: null
                    });
                }
                slice.push(row);
            }
            this.data.push(slice);
        }
    }

    /**
     * Generates the resources
     */
    generateResources(rng) {
        const simplex = new SimplexNoise(rng);
        resources.forEach(resource => {
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                    const value = simplex.noise3d(
                        (this.position.x + x) / resource.scale.x,
                        (this.position.y + y) / resource.scale.y, 
                        (this.position.z + z) / resource.scale.z); 
                    if (value > resource.scarcity) {
                        this.setBlock(x, y, z, resource.id);
                    }
                }
            }
        }
    });  
 }
    /**
     * Generates the terrain
     */
    generateTerrain(rng) {
        const simplex = new SimplexNoise(rng);
        for (let x = 0; x < this.size.width; x++) {
            for (let z = 0; z < this.size.width; z++) {

                const value = simplex.noise(
                    (this.position.x + x) / this.params.terrain.scale,
                    (this.position.z + z) / this.params.terrain.scale,
                );
                
                // Sclae the noise based off of the magnitude/offset
                const scaledNoise = this.params.terrain.offset + 
                    this.params.terrain.magnitude * value;

                // computing the height of the terrain at the x-z location
                let height = Math.floor(this.size.height * scaledNoise);

                // Clamp the height to the height of the world
                height = Math.max(0, Math.min(height, this.size.height - 1));

                // Fill in all bloakcs at or below terrain height
                for (let y = 0; y <= this.size.height; y++) {
                    if (y < height && this.getBlock(x, y, z).id ===blocks.empty.id) {
                        this.setBlock(x, y, z, blocks.dirt.id);
                    } else if (y === height) {
                        this.setBlock(x, y, z, blocks.grass.id);
                    } else if (y > height) {
                        this.setBlock(x, y, z, blocks.empty.id);
                    }
                };
            }
        }
    }
    /**
     * Generates the 3d representations of the world fromt he world data
     */
    generateMeshes() {
        this.clear();

        const maxCount = this.size.width * this.size.height * this.size.width;

        // creating a lookup table where the key is the block id
        const meshes = {};

        Object.values(blocks)
            .filter(blockType => blockType.id !== blocks.empty.id)
            .forEach(blockType => {
                const mesh = new THREE.InstancedMesh(geometry, blockType.material, maxCount);
                mesh.name = blockType.name;
                mesh.count = 0;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                meshes[blockType.id] = mesh;
            });

        const matrix = new THREE.Matrix4();
        for (let x = 0; x < this.size.width; x++) {
            for (let y = 0; y < this.size.height; y++) {
                for (let z = 0; z < this.size.width; z++) {
                        const blockId = this.getBlock(x, y, z).id;
                       
                        if (blockId === blocks.empty.id ) continue;

                        const mesh = meshes[blockId];
                        const instanceId = mesh.count;

                        if (!this.isBlockObscured(x, y, z)) {
                        matrix.setPosition(x, y, z);
                        mesh.setMatrixAt(instanceId, matrix);
                        this.setBlockInstance(x, y, z, instanceId);
                        mesh.count++;
                    }
                }
            }
        }

        this.add(...Object.values(meshes));
    } 

    /**
     * Gets the block data at (x, y, z)
     * @param {number} x
     * @param {number} y
     * @param {number} z    
     * @returns {{id: number, instanceID: number}}
     */
    getBlock(x, y, z) {
        if (this.inBounds(x, y, z)) {
            return this.data[x][y][z];
        } else {
            return null;
        }
    }

    /**
     * Sets the block id for the block at (x, y, z)
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} id
     */
    setBlock(x, y, z, id) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].id = id;
        }
    }

    /**
     * Sets the block instance id for the block at (x, y, z)
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} instanceId
     */
    setBlockInstance(x, y, z, instanceId) {
        if (this.inBounds(x, y, z)) {
            this.data[x][y][z].instanceID = instanceId;
        }
    }

    /**
     * check if the (x, y, z) coordinates are within the bounds of the world
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    inBounds(x, y, z) {
        if (x >= 0 && x < this.size.width && 
            y >= 0 && y < this.size.height && 
            z >= 0 && z < this.size.width) {
            return true;
        } else {
            return false;
        }
    }

/**
 * returns true if this block is completely obscured by other blocks
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {boolean}
 */
isBlockObscured(x, y, z) {
    /**
     * returns true if this block is completely obscured by other blocks
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {boolean}
     */
    const up = this.getBlock(x, y + 1, z)?.id ?? blocks.empty.id;
    const down = this.getBlock(x, y - 1, z)?.id ?? blocks.empty.id;
    const left = this.getBlock(x + 1, y, z)?.id ?? blocks.empty.id;
    const right = this.getBlock(x - 1, y, z)?.id ?? blocks.empty.id;
    const forward = this.getBlock(x, y, z + 1)?.id ?? blocks.empty.id;
    const back = this.getBlock(x, y, z - 1)?.id ?? blocks.empty.id;

    // If any of the blocks sides are exposed, it is not obscured
        if (up === blocks.empty.id || 
            down === blocks.empty.id || 
            left === blocks.empty.id || 
            right === blocks.empty.id || 
            forward === blocks.empty.id || 
            back === blocks.empty.id) {
            return false;
        } else {
            return true;
        }
    }

    disposeInstances() {
        this.traverse((obj) => {
            if (obj.dispose) obj.dispose();
        });
        this.clear();
    }

}