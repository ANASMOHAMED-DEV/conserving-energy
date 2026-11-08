// Entry point — Phaser game config, scene registration, debug/test hook.
(function () {
  const config = {
    // Canvas renderer: reliable on older/school hardware, and canvas capture
    // (screenshots, tests) works without preserveDrawingBuffer.
    type: Phaser.CANVAS,
    parent: 'game-container',
    width: EE.W,
    height: EE.H,
    backgroundColor: '#16323a',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      autoRound: true
    },
    scene: [BootScene, PreloadScene, MenuScene, HouseMapScene, RoomScene, HudScene, ReportScene]
  };

  const game = new Phaser.Game(config);
  EE.game = game;

  // Debug/test surface used by browser automation (and ?hitboxes tuning).
  window.__EE_DEBUG = {
    version: EE.VERSION,
    state: () => EE.GameState.toJSON(),
    scenes: () => game.scene.getScenes(true).map(s => s.scene.key),
    hotspots: () => {
      if (!EE.activeRoomObjects) return [];
      return Object.values(EE.activeRoomObjects).map(o => ({
        id: o.def.id,
        kind: o.def.kind,
        fixed: o.fixed,
        watts: o.def.watts,
        actionType: o.def.actionType || null,
        ...o.screenCenter()
      }));
    },
    buttons: () => {
      // Visible button labels per active scene (recursive — dialogs nest them).
      const out = [];
      const walk = (list, scene) => {
        list.forEach(c => {
          if (c.type === 'Container' && c.btnLabel) {
            const m = c.getWorldTransformMatrix();
            const canvas = game.canvas.getBoundingClientRect();
            out.push({
              label: c.btnLabel(),
              x: canvas.left + (m.tx / EE.W) * canvas.width,
              y: canvas.top + (m.ty / EE.H) * canvas.height,
              scene: scene.scene.key
            });
          }
          if (c.type === 'Container' && c.list) walk(c.list, scene);
        });
      };
      game.scene.getScenes(true).forEach(s => walk(s.children.list, s));
      return out;
    },
    startRun: (seed) => EE.GameState.startRun(seed !== undefined ? seed : EE.newSeed()),
    clickObject: (id) => {
      const o = EE.activeRoomObjects && EE.activeRoomObjects[id];
      if (o && o.onInspect) { o.onInspect(o); return true; }
      return false;
    },
    report: () => EE.GameState.run ? EE.ScoreSystem.report(EE.GameState.run) : null
  };
})();