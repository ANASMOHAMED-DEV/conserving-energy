// localStorage persistence with in-memory fallback (private mode / locked-down
// school browsers must never crash the game). Save is an enhancement, not a requirement.
(function () {
  const KEY = EE.SAVE_KEY;
  let memory = null;
  let storageOk = true;

  function defaults() {
    return {
      version: 1,
      bestStars: {},        // roomId -> 0..3
      badges: [],           // badge ids
      lifetimeWatts: 0,
      inspections: 0,
      muted: false,
      run: null             // in-progress run snapshot for Continue
    };
  }

  const SaveManager = {
    available() { return storageOk; },

    load() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const data = JSON.parse(raw);
          if (data && data.version === 1) return Object.assign(defaults(), data);
        }
      } catch (e) { storageOk = false; }
      return memory || defaults();
    },

    save(data) {
      memory = data;
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) { storageOk = false; }
    },

    update(fn) {
      const data = this.load();
      fn(data);
      this.save(data);
      return data;
    },

    clearRun() {
      this.update(d => { d.run = null; });
    }
  };

  EE.SaveManager = SaveManager;
})();