// Preload — load generated backgrounds if present; missing art falls back to
// procedural rooms so the game never blocks on assets.
class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    EE.missingArt = {};
    const bar = this.add.graphics();
    const label = this.add.text(EE.W / 2, EE.H / 2 - 60, 'Warming up the house…', {
      fontFamily: EE.FONT, fontSize: '28px', color: EE.CSS.sky
    }).setOrigin(0.5);

    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(EE.COLORS.bgPanel, 1);
      bar.fillRoundedRect(EE.W / 2 - 200, EE.H / 2, 400, 22, 11);
      bar.fillStyle(EE.COLORS.teal, 1);
      bar.fillRoundedRect(EE.W / 2 - 197, EE.H / 2 + 3, 394 * v, 16, 8);
    });
    this.load.on('loaderror', (file) => {
      EE.missingArt[file.key] = true;
    });

    const files = [
      ['bg-living', 'assets/backgrounds/living-room.jpg'],
      ['bg-kitchen', 'assets/backgrounds/kitchen.jpg'],
      ['bg-bedroom', 'assets/backgrounds/bedroom.jpg'],
      ['bg-bathroom', 'assets/backgrounds/bathroom.jpg'],
      ['bg-laundry', 'assets/backgrounds/laundry.jpg'],
      ['bg-house', 'assets/backgrounds/house-map.jpg'],
      ['bg-title', 'assets/backgrounds/title.jpg']
    ];
    files.forEach(([key, url]) => this.load.image(key, url));
  }

  create() {
    // Debug shortcuts: ?room=living jumps into a room; otherwise menu.
    if (EE.roomParam && EE.ROOMS[EE.roomParam]) {
      if (!EE.GameState.run) EE.GameState.startRun(EE.newSeed());
      this.scene.start('Room', { roomId: EE.roomParam });
    } else {
      this.scene.start('Menu');
    }
  }
}