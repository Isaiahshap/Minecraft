import * as THREE from 'three';
import { WorldChunk } from './worldChunk';

export class World extends THREE.Group {

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

        for (let x = -1; x <= 1; x++) {
            for (let z = -1; z <= 1; z++) {
                const chunk = new WorldChunk(this.chunkSize, this.params);
                chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
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
        console.log(visibleChunks);
        //2. comapre with the current set of chunks
        //3. Remove chunks that are no longer visible
        //4. Add new chunks that just came into view
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
     * gets the block data at (x, y, z)
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {{id: number, instanceID: number} | null}
     */
    getBlock(x, y, z) {
        const coords = this.worldToChunkCoords(x, y, z);
        const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);


        if (chunk) {
            //console.log(coords.block);
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