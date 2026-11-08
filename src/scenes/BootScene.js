// Boot — generate procedural textures (mascot), init state, apply URL params.
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    EE.GameState.init();

    // Mute from save or ?mute=1
    let muted = !!(EE.GameState.save && EE.GameState.save.muted);
    if (EE.params.get('mute') === '1') muted = true;
    EE.Sfx.setMuted(muted);

    this.makeMascot();

    // Unlock audio on the very first user gesture anywhere.
    this.input.once('pointerdown', () => EE.Sfx.unlock());

    this.scene.start('Preload');
  }

  // Wattson — a friendly round inspection robot with a bolt antenna.
  makeMascot() {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const C = EE.COLORS;
    // antenna
    g.lineStyle(5, C.goldDark, 1);
    g.beginPath(); g.moveTo(70, 26); g.lineTo(70, 8); g.strokePath();
    g.fillStyle(C.gold, 1);
    g.fillTriangle(76, 0, 62, 14, 71, 14);
    g.fillTriangle(68, 12, 80, 2, 72, 2);
    // body
    g.fillStyle(C.tealDark, 1); g.fillCircle(70, 78, 52);
    g.fillStyle(C.teal, 1); g.fillCircle(70, 74, 48);
    // face plate
    g.fillStyle(C.panel, 1); g.fillRoundedRect(34, 50, 72, 48, 22);
    // eyes
    g.fillStyle(C.ink, 1);
    g.fillCircle(54, 70, 8); g.fillCircle(86, 70, 8);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(57, 67, 3); g.fillCircle(89, 67, 3);
    // smile
    g.lineStyle(4, C.ink, 1);
    g.beginPath(); g.arc(70, 78, 14, 0.25 * Math.PI, 0.75 * Math.PI, false); g.strokePath();
    // cheeks
    g.fillStyle(C.coral, 0.5);
    g.fillCircle(42, 82, 6); g.fillCircle(98, 82, 6);
    // badge bolt on belly
    g.fillStyle(C.gold, 1);
    g.fillTriangle(74, 104, 62, 118, 70, 118);
    g.fillTriangle(68, 116, 78, 106, 70, 106);
    g.generateTexture('mascot', 140, 132);
    g.destroy();
  }
}