// HouseMap — cross-section of the house; pick any room in any order.
class HouseMapScene extends Phaser.Scene {
  constructor() { super('HouseMap'); }

  create() {
    const C = EE.COLORS;
    if (!EE.GameState.run) EE.GameState.startRun(EE.newSeed());
    const run = EE.GameState.run;

    if (this.textures.exists('bg-house') && !EE.missingArt['bg-house']) {
      this.add.image(EE.W / 2, EE.H / 2, 'bg-house').setDisplaySize(EE.W, EE.H);
      this.add.rectangle(EE.W / 2, EE.H / 2, EE.W, EE.H, 0x16323a, 0.25);
    } else {
      this.drawFallbackHouse();
    }

    this.add.text(EE.W / 2, 46, 'Pick a room to inspect', {
      fontFamily: EE.FONT, fontSize: '36px', fontStyle: 'bold', color: EE.CSS.white,
      stroke: '#16323a', strokeThickness: 6
    }).setOrigin(0.5);

    // Room cards
    this.cards = [];
    EE.ROOM_ORDER.forEach(rid => {
      const def = EE.ROOMS[rid];
      const rs = run.rooms[rid];
      const { x, y } = def.mapPos;
      const w = rid === 'laundry' ? 210 : 260, h = 150;
      const cont = this.add.container(x, y);

      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.25);
      bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, 18);
      bg.fillStyle(rs.cleared ? 0xdff2ec : C.panel, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
      bg.lineStyle(4, rs.cleared ? C.teal : C.panelEdge, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);

      const name = this.add.text(0, -h / 2 + 30, def.name, {
        fontFamily: EE.FONT, fontSize: '26px', fontStyle: 'bold', color: EE.CSS.ink
      }).setOrigin(0.5);

      const remaining = rs.activeIds.length - rs.fixedIds.length;
      const status = this.add.text(0, 8, rs.cleared ? 'All clear!' : `${remaining} waste${remaining === 1 ? '' : 's'} to find`, {
        fontFamily: EE.FONT, fontSize: '20px',
        color: rs.cleared ? EE.CSS.teal : EE.CSS.coral
      }).setOrigin(0.5);

      // stars (this run)
      const starsG = this.add.graphics();
      for (let i = 0; i < 3; i++) {
        const sx = -34 + i * 34;
        if (i < rs.stars) {
          starsG.fillStyle(C.gold, 1);
        } else {
          starsG.fillStyle(0xd8d2c0, 1);
        }
        EE.UI.starPath(starsG, sx, h / 2 - 28, 5, 15, 7);
        starsG.fillPath();
      }

      cont.add([bg, name, status, starsG]);
      cont.setSize(w, h).setInteractive({ useHandCursor: true });
      cont.on('pointerover', () => cont.setScale(1.05));
      cont.on('pointerout', () => cont.setScale(1));
      cont.on('pointerup', () => {
        EE.Sfx.unlock(); EE.Sfx.click();
        this.scene.start('Room', { roomId: rid });
      });
      this.cards.push(cont);
    });

    // Cumulative house meter
    const totalPossible = this.totalPossibleWatts();
    this.houseMeter = EE.UI.meter(this, EE.W / 2 - 220, EE.H - 74, 440, 34, 'House watts saved');
    this.houseMeter.setValueInstant(run.watts, totalPossible);
    this.add.text(EE.W / 2 + 250, EE.H - 57, `Score: ${run.score.toLocaleString()}`, {
      fontFamily: EE.FONT, fontSize: '24px', fontStyle: 'bold', color: EE.CSS.gold
    }).setOrigin(0, 0.5);

    // Back to menu
    EE.UI.makeIconButton(this, 52, 52, 28, (g) => {
      g.lineStyle(5, EE.COLORS.sky, 1);
      g.beginPath(); g.moveTo(8, -10); g.lineTo(-6, 0); g.lineTo(8, 10); g.strokePath();
    }, () => this.scene.start('Menu'), 'Back to menu');

    // Report button when everything is cleared
    if (EE.GameState.allCleared()) {
      EE.UI.makeButton(this, EE.W - 190, EE.H - 57, 300, 58, 'View Report Card', () => {
        this.scene.start('Report');
      }, { fill: C.gold, textColor: EE.CSS.ink, fontSize: 24 });
    }

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }

  totalPossibleWatts() {
    const run = EE.GameState.run;
    let total = 0;
    EE.ROOM_ORDER.forEach(rid => {
      run.rooms[rid].activeIds.forEach(id => {
        const def = EE.GameState.objectDef(rid, id);
        if (def) total += def.watts;
      });
    });
    return total;
  }

  drawFallbackHouse() {
    const g = this.add.graphics();
    const C = EE.COLORS;
    g.fillGradientStyle(0x2a6f7f, 0x2a6f7f, 0x16323a, 0x16323a, 1);
    g.fillRect(0, 0, EE.W, EE.H);
    // house body
    g.fillStyle(0x27505c, 1);
    g.fillRoundedRect(170, 110, 1010, 470, 12);
    // roof
    g.fillStyle(C.coralDark, 1);
    g.fillTriangle(140, 118, 1210, 118, 675, 18);
    g.fillStyle(C.coral, 1);
    g.fillTriangle(160, 110, 1190, 110, 675, 26);
    // floor divider
    g.fillStyle(0x1b3d47, 1);
    g.fillRect(180, 296, 990, 14);
    // chimney
    g.fillStyle(0x8a5a44, 1); g.fillRect(980, 30, 46, 70);
  }
}