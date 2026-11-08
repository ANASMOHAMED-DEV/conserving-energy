// Report — end-of-inspection report card: animated totals, real-world
// equivalents (labeled estimates), badges, stars, and replay.
class ReportScene extends Phaser.Scene {
  constructor() { super('Report'); }

  create() {
    const C = EE.COLORS;
    const run = EE.GameState.run;
    if (!run) { this.scene.start('Menu'); return; }
    const rep = EE.ScoreSystem.report(run);
    EE.Sfx.report();

    const g = this.add.graphics();
    g.fillGradientStyle(0x1f4450, 0x1f4450, 0x16323a, 0x16323a, 1);
    g.fillRect(0, 0, EE.W, EE.H);

    this.add.image(120, 100, 'mascot').setScale(1.1);
    this.add.text(220, 62, 'Inspection Report Card', {
      fontFamily: EE.FONT, fontSize: '42px', fontStyle: 'bold', color: EE.CSS.gold
    });
    this.add.text(220, 112, 'Every watt counts — here\'s what your fixes add up to!', {
      fontFamily: EE.FONT, fontSize: '22px', color: EE.CSS.sky
    });

    // Big totals with count-up animation
    const totals = [
      { label: 'Watts saved', value: rep.watts, suffix: ' W', x: 200 },
      { label: 'Score', value: rep.score, suffix: '', x: 490 },
      { label: 'Est. kWh / year*', value: rep.kwhYear, suffix: '', x: 800 },
      { label: 'Est. kg CO₂ / year*', value: rep.co2Kg, suffix: '', x: 1090 }
    ];
    totals.forEach(t => {
      const txt = this.add.text(t.x, 200, '0' + t.suffix, {
        fontFamily: EE.FONT, fontSize: '44px', fontStyle: 'bold', color: EE.CSS.white
      }).setOrigin(0.5);
      this.add.text(t.x, 240, t.label, {
        fontFamily: EE.FONT, fontSize: '19px', color: EE.CSS.sky
      }).setOrigin(0.5);
      this.tweens.addCounter({
        from: 0, to: t.value, duration: 1400, ease: 'Cubic.Out',
        onUpdate: (tw) => txt.setText(Math.round(tw.getValue()).toLocaleString() + t.suffix)
      });
    });

    // Real-world equivalents
    this.add.text(EE.W / 2, 292,
      `That's like ${rep.phoneCharges.toLocaleString()} smartphone charges, or ${rep.tvHours.toLocaleString()} hours of LED TV — or about ${rep.seedlings} tree seedlings growing!`, {
      fontFamily: EE.FONT, fontSize: '22px', color: EE.CSS.gold, align: 'center',
      wordWrap: { width: 1100 }
    }).setOrigin(0.5);

    // Per-room stars
    const rowY = 352;
    EE.ROOM_ORDER.forEach((rid, i) => {
      const x = 130 + i * 255;
      const rs = run.rooms[rid];
      const panel = this.add.graphics();
      panel.fillStyle(C.panel, 1);
      panel.fillRoundedRect(x - 110, rowY - 30, 220, 86, 14);
      this.add.text(x, rowY - 8, EE.ROOMS[rid].name, {
        fontFamily: EE.FONT, fontSize: '20px', fontStyle: 'bold', color: EE.CSS.ink
      }).setOrigin(0.5);
      const sg = this.add.graphics();
      for (let s = 0; s < 3; s++) {
        sg.fillStyle(s < rs.stars ? C.gold : 0xd8d2c0, 1);
        EE.UI.starPath(sg, x - 30 + s * 30, rowY + 28, 5, 13, 6);
        sg.fillPath();
      }
      this.add.text(x + 88, rowY + 28, `${rs.watts}W`, {
        fontFamily: EE.FONT, fontSize: '16px', color: EE.CSS.inkSoft
      }).setOrigin(0.5);
    });

    // Badge gallery
    const badges = EE.GameState.save.badges;
    this.add.text(70, 462, 'Badges earned', {
      fontFamily: EE.FONT, fontSize: '24px', fontStyle: 'bold', color: EE.CSS.white
    });
    if (!badges.length) {
      this.add.text(70, 500, 'Replay to collect them all!', {
        fontFamily: EE.FONT, fontSize: '20px', color: EE.CSS.sky
      });
    } else {
      badges.slice(0, 10).forEach((id, i) => {
        const b = EE.badgeById(id);
        if (!b) return;
        const x = 90 + (i % 5) * 240, y = 512 + Math.floor(i / 5) * 52;
        const bg = this.add.graphics();
        bg.fillStyle(C.bgPanel, 1); bg.fillRoundedRect(x - 20, y - 20, 225, 42, 12);
        bg.lineStyle(2, C.gold, 0.8); bg.strokeRoundedRect(x - 20, y - 20, 225, 42, 12);
        bg.fillStyle(C.gold, 1); bg.fillCircle(x, y + 1, 13);
        bg.fillStyle(C.bgPanel, 1);
        EE.UI.starPath(bg, x, y + 1, 5, 9, 4); bg.fillPath();
        this.add.text(x + 22, y + 1, b.name, {
          fontFamily: EE.FONT, fontSize: '18px', fontStyle: 'bold', color: EE.CSS.gold
        }).setOrigin(0, 0.5);
      });
    }

    this.add.text(EE.W / 2, EE.H - 108,
      '*Estimates: watts × 4 hours/day × 365 days, grid average 0.4 kg CO₂ per kWh. Your real superpower is doing this at home!', {
      fontFamily: EE.FONT, fontSize: '16px', color: EE.CSS.sky, align: 'center'
    }).setOrigin(0.5);

    // Actions
    EE.UI.makeButton(this, EE.W / 2 - 200, EE.H - 52, 360, 62, 'Inspect Again (new layout!)', () => {
      EE.GameState.startRun(EE.newSeed());
      this.scene.start('HouseMap');
    }, { fill: C.coral, fontSize: 24 });
    EE.UI.makeButton(this, EE.W / 2 + 200, EE.H - 52, 300, 62, 'Back to Menu', () => {
      this.scene.start('Menu');
    }, { fill: C.teal, fontSize: 24 });

    this.input.keyboard.on('keydown-ESC', () => this.scene.start('Menu'));
  }
}