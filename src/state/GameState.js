// GameState — single source of truth for the current inspection run.
// Emits events on EE.bus; scenes subscribe, never mutate room objects directly.
(function () {
  EE.bus = new Phaser.Events.EventEmitter();

  const State = {
    run: null,          // active run object
    save: null,         // persisted profile (best stars, badges, lifetime)
    currentRoom: null,

    init() {
      this.save = EE.SaveManager.load();
    },

    // ---- run lifecycle -------------------------------------------------
    startRun(seed) {
      const rng = new EE.Rng(seed);
      const rooms = {};
      EE.ROOM_ORDER.forEach(roomId => {
        const def = EE.ROOMS[roomId];
        const wastes = def.candidates.filter(c => c.kind !== 'donttouch');
        const active = rng.sample(wastes, def.activeCount).map(c => c.id);
        rooms[roomId] = {
          activeIds: active,
          fixedIds: [],
          hintsUsed: 0,
          learningIds: [],   // don't-touch objects the kid investigated
          cleared: false,
          stars: 0,
          watts: 0
        };
      });
      this.run = {
        seed,
        rooms,
        score: 0,
        watts: 0,
        streak: 0,
        maxStreak: 0,
        standbyFixed: 0,
        hintsTotal: 0,
        startedAt: Date.now(),
        finished: false
      };
      this.currentRoom = null;
      this.persistRun();
      EE.bus.emit('run-started', this.run);
      return this.run;
    },

    continueRun() {
      const snap = this.save && this.save.run;
      if (!snap || snap.finished) return false;
      this.run = JSON.parse(JSON.stringify(snap));
      this.currentRoom = null;
      EE.bus.emit('run-started', this.run);
      return true;
    },

    hasSavedRun() {
      return !!(this.save && this.save.run && !this.save.run.finished);
    },

    persistRun() {
      if (!this.run) return;
      EE.SaveManager.update(d => { d.run = JSON.parse(JSON.stringify(this.run)); });
      this.save = EE.SaveManager.load();
    },

    // ---- room play -----------------------------------------------------
    enterRoom(roomId) {
      this.currentRoom = roomId;
      EE.bus.emit('room-entered', roomId);
    },

    roomState(roomId) { return this.run.rooms[roomId]; },

    objectDef(roomId, objId) {
      return EE.ROOMS[roomId].candidates.find(c => c.id === objId);
    },

    fixObject(roomId, objId) {
      const rs = this.run.rooms[roomId];
      if (rs.fixedIds.includes(objId)) return null;
      const def = this.objectDef(roomId, objId);
      if (!def || def.kind === 'donttouch') return null;

      rs.fixedIds.push(objId);
      rs.watts += def.watts;
      this.run.watts += def.watts;
      this.run.streak += 1;
      this.run.maxStreak = Math.max(this.run.maxStreak, this.run.streak);
      if (def.tags && def.tags.includes('standby')) this.run.standbyFixed += 1;

      const points = EE.ScoreSystem.fixPoints(def.watts, this.run.streak);
      this.run.score += points;

      EE.bus.emit('object-fixed', { roomId, objId, def, points, watts: def.watts });
      EE.bus.emit('watts-changed', this.run.watts);

      if (rs.fixedIds.length >= rs.activeIds.length) this.clearRoom(roomId);
      this.persistRun();
      return { points, watts: def.watts };
    },

    learningMoment(roomId, objId) {
      const rs = this.run.rooms[roomId];
      if (!rs.learningIds.includes(objId)) {
        rs.learningIds.push(objId);
        this.run.streak = 0; // gentle: streak resets, score never drops
        EE.bus.emit('learning-moment', { roomId, objId });
        this.persistRun();
      }
    },

    useHint(roomId) {
      const rs = this.run.rooms[roomId];
      const remaining = rs.activeIds.filter(id => !rs.fixedIds.includes(id));
      if (!remaining.length) return null;
      rs.hintsUsed += 1;
      this.run.hintsTotal += 1;
      this.run.streak = 0;
      const target = remaining[0];
      EE.bus.emit('hint-used', { roomId, objId: target });
      this.persistRun();
      return target;
    },

    clearRoom(roomId) {
      const rs = this.run.rooms[roomId];
      if (rs.cleared) return;
      rs.cleared = true;
      rs.stars = EE.ScoreSystem.stars(rs.hintsUsed, rs.learningIds.length);
      // best stars persist immediately
      EE.SaveManager.update(d => {
        d.bestStars[roomId] = Math.max(d.bestStars[roomId] || 0, rs.stars);
      });
      this.save = EE.SaveManager.load();
      EE.bus.emit('room-cleared', { roomId, stars: rs.stars, watts: rs.watts });

      if (EE.ROOM_ORDER.every(id => this.run.rooms[id].cleared)) {
        this.finishRun();
      }
      this.persistRun();
    },

    allCleared() {
      return this.run && EE.ROOM_ORDER.every(id => this.run.rooms[id].cleared);
    },

    finishRun() {
      if (this.run.finished) return;
      this.run.finished = true;
      const newBadges = EE.ScoreSystem.evaluateBadges(this.run, this.save);
      EE.SaveManager.update(d => {
        d.lifetimeWatts += this.run.watts;
        d.inspections += 1;
        newBadges.forEach(b => { if (!d.badges.includes(b)) d.badges.push(b); });
        d.run = null;
      });
      this.save = EE.SaveManager.load();
      EE.bus.emit('run-completed', { run: this.run, newBadges });
    },

    // ---- test / debug surface -------------------------------------------
    toJSON() {
      return {
        version: EE.VERSION,
        hasRun: !!this.run,
        currentRoom: this.currentRoom,
        run: this.run ? JSON.parse(JSON.stringify(this.run)) : null,
        save: this.save ? JSON.parse(JSON.stringify(this.save)) : null
      };
    }
  };

  EE.GameState = State;
})();