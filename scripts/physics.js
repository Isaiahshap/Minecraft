import * as THREE from 'three';

export class Physics {

    constructor() {

    }


    /**
     * Moves the Physics simulation forward in time by 'dt'
     * @param {number} dt
     * @param {Player} player
     * @param {World} world
     */
    update(dt, player, world) {
        this.detectCollisions(player, world);
    }


    /**
     * Main function for detecting collisions
     * @param {Player} player
     * @param {World} world
     */
    detectCollisions(player, world) {
        const candidates = this.broadPhase(player, world);
        const collisions = this.narrowPhase(candidates, player);

        if (collisions.length > 0) {
            this.resolveCollisions(collisions);
        }
    }

    /**
     * Narrows down the blocks found in the broad-phase to the ones that can collide with the player
     * @param {Player} Player
     * @param {World} World
     * @returns {[]}
     */

    narrowPhase(candidates, player) {
        const collisions = [];
    
        // implement the narrow phase collision detection logic here
        // this will depend on the specific collision detection algorithm you're using
    
        return collisions; // ensure that an array is always returned
    }
    broadPhase(player, world) {
        const candidates = [];

        // Get the extents of the Player
        const extents = {
            x: {
                min: Math.floor(player.position.x - player.radius),
                max: Math.ceil(player.position.x + player.radius)
            },
            y: {
                min: Math.floor(player.position.y - player.height),
                max: Math.ceil(player.position.y)
            },
            z: {
                min: Math.floor(player.position.z - player.radius),
                max: Math.ceil(player.position.z + player.radius)
            }
        }

        // Loop through the blocks in the player's extenets
        // if they arent empty then they are a possible collision candidate
        for (let x = extents.x.min; x <= extents.x.max; x++) {
            for (let y = extents.y.min; y <= extents.y.max; y++) {
                for (let z = extents.z.min; z <= extents.z.max; z++) {
                    const block = world.getBlock(x, y, z);
                    if (block && block.id !== (block.empty && block.empty.id)) {
                        candidates.push(block);
                    }
                }
            }
        }

        console.log(`Broadphase Candidates: ${candidates.length}`);

        return candidates;
    }


    /**
     * narows down the blocks found in the broad-phase to the ones that can collide with the player
     * @param {[]} candidates
     * @param {Player} player
     * @returns  {[]}
     */
}

