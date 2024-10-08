import * as THREE from 'three';
import { WorldChunk } from './worldChunk';

export class World extends THREE.Group {

    /**
     * whether or not we want to load the chunks asynchronously
     */
    asyncLoading = true;

/**
* The number of chunks to render around the player.
* When this is set to 0, the chunk the player is on
* is the only one that is rendered. If it is set to 1,
* the adjacent chunks are rendered; if set to 2, the
* chunks adjacent to those are rendered, and so on.
*/
    drawDistance = 1;

    chunkSize = { 
        width: 32, 
        height: 32 
    };

    params = {
        seed: 0,
        terrain: {
            scale: 30,
            magnitude: 1,
            offset: 0.2 
        }
    };

    constructor(seed = 0) {
        super();
        this.seed = seed;
    }

    /**
     * Regenerate the world data model and the meshes
     */
    generate() {
        this.disposeChunks();

        for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
            for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
                const chunk = new WorldChunk(this.chunkSize, this.params);
                chunk.position.set(
                    x * this.chunkSize.width, 
                    0, 
                    z * this.chunkSize.width);
                chunk.userData = { x, z };
                chunk.generate();
                this.add(chunk);
            }
        }
    }

    /**
     * updates the visible portions of the world based on the current player position
     * @param {Player} player
     */
    update(player) {
        const visibleChunks = this.getVisibleChunks(player);
        const chunksToAdd = this.getChunksToAdd(visibleChunks);
        this.removeUnusedChunks(visibleChunks);
        
        for (const chunk of chunksToAdd) {
            this.generateChunk(chunk.x, chunk.z);
        }
    }

        /**
         * Retuurns an array containing the visible chunks to player
         * @param {Player} player
         * @returns {{x: number, z: number}[]}
         */
        getVisibleChunks(player) {
            const visibleChunks = [];

            const coords = this.worldToChunkCoords(
                player.position.x, 
                player.position.y, 
                player.position.z
            );

            const chunkX = coords.chunk.x;
            const chunkZ = coords.chunk.z;

            for (let x = chunkX - this.drawDistance; x <= chunkX + this.drawDistance; x++) {
                for (let z = chunkZ - this.drawDistance; z <= chunkZ + this.drawDistance; z++) {
                    visibleChunks.push({ x, z });
                }
            }

            return visibleChunks;
        }

    /**
     * returns an array containing the coordinates of the chunks that
     * are not yet loaded and ened to be added to the scene
     * @param {{ x: number, z: number}[]} visibleChunks
     * @returns {{ x: number, z: number}[]}
     */
    getChunksToAdd(visibleChunks) {
        //Filter down the visible chunks to those not alreasdy in the world
        return visibleChunks.filter((chunk) => {
            const chunkExists = this.children
                .map((obj) => obj.userData)
                .find(({ x, z }) => (
                    chunk.x === x && chunk.z === z
                ));

            return !chunkExists;
        })
    }

    /**
     * Removes Current laoded chnks that are no longer visile to the player
     * @param {{ x: number, z: number}[]} visibleChunks
     */
    removeUnusedChunks(visibleChunks) {
        //Filter down the visible chunks to those not alreasdy in the world
        const chunksToRemove = this.children.filter((chunk) => {
            const { x, z } = chunk.userData;
            const chunkExists = visibleChunks
                .find((visibleChunk) => (
                    visibleChunk.x === x && visibleChunk.z === z
                ));

            return !chunkExists;
         });

         for (const chunk of chunksToRemove) {
            chunk.disposeInstances();
            this.remove(chunk);
            console.log(`removing chunk at x: ${chunk.userData.x}, z: ${chunk.userData.z}`);
         }
    }

    /**
     * Generates the chunk at the (x, z) coordinates
     * @param {number} x
     * @param {number} z
     */
    generateChunk(x, z) {
        const chunk = new WorldChunk(this.chunkSize, this.params);
        chunk.position.set(
            x * this.chunkSize.width, 
            0, 
            z * this.chunkSize.width);
        chunk.userData = { x, z };

        if (this.asyncLoading) {
            requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
        } else {
            chunk.generate();
        }

        this.add(chunk);
        console.log(`adding chunk at x: ${x}, z: ${z}`);
    }
    
    /**
     * gets the block data at (x, y, z)
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {{id: number, instanceID: number} | null}
     */
    getBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);


        if (chunk && chunk.loaded) {
            return chunk.getBlock(
                coords.block.x, 
                coords.block.y, 
                coords.block.z
            );
        } else {
            return null;
        }
    }

  /**
   * Returns the coordinates of the block at the world x, y, z
   *  - Chunk is the coordinates of the chunk containing the block
   *  - Block is the coordinates of the block relative to the chunk
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @returns {{
   *    chunk: { x: number, z: number}, 
   *    block: { x: number, y: number, z: number}
   * }}
   */
  worldToChunkCoords(x, y, z) {
    const chunkCoords = {
        x: Math.floor(x / this.chunkSize.width),
        z: Math.floor(z / this.chunkSize.width)
    };



    const blockCoords = {
        x: x - this.chunkSize.width * chunkCoords.x,
        y, 
        z: z - this.chunkSize.width * chunkCoords.z
    };



    return { 
        chunk: chunkCoords, 
        block: blockCoords 
    }
}

  /**
   * returns the worldchunk object at the specified coordinates
   * @param {number} chunkX
   * @param {number} chunkZ
   * @returns {WorldChunk | null}
   */
  getChunk(chunkX, chunkZ) {
    return this.children.find(chunk =>
        chunk.userData.x === chunkX && 
        chunk.userData.z === chunkZ
    );
  }

    disposeChunks() {
      this.traverse((chunk) => {
        if (chunk.disposeInstances) {
          chunk.disposeInstances();
            }
        });  
        this.clear();
    }
}