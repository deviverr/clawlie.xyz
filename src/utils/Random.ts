/**
 * A simple seeded PRNG using the Mulberry32 algorithm.
 */
export class Random {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a random float between 0 and 1.
     */
    public next(): number {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    /**
     * Returns a random integer between min (inclusive) and max (exclusive).
     */
    public nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min) + min);
    }

    /**
     * Returns a random item from an array.
     */
    public pick<T>(array: T[]): T {
        return array[this.nextInt(0, array.length)];
    }
}
