// Seeded PRNG (mulberry32) — reproducible waste layouts for tests and replays.
(function () {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Rng {
    constructor(seed) {
      this.seed = seed >>> 0;
      this._next = mulberry32(this.seed);
    }
    float() { return this._next(); }
    int(min, max) { return min + Math.floor(this._next() * (max - min + 1)); }
    pick(arr) { return arr[this.int(0, arr.length - 1)]; }
    // Fisher-Yates, returns a new array.
    shuffle(arr) {
      const out = arr.slice();
      for (let i = out.length - 1; i > 0; i--) {
        const j = this.int(0, i);
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    }
    // Pick n distinct items from arr.
    sample(arr, n) { return this.shuffle(arr).slice(0, Math.min(n, arr.length)); }
  }

  EE.Rng = Rng;
  EE.newSeed = function () {
    if (EE.seedParam !== null && EE.seedParam !== '') {
      const n = parseInt(EE.seedParam, 10);
      if (!isNaN(n)) return n >>> 0;
    }
    return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;
  };
})();