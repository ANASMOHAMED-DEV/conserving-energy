// Menu — title screen with Start / Continue / How to play.
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    const C = EE.COLORS;
    if (this.textures.exists('bg-title') && !EE.missingArt['bg-title']) {
      this.add.image(EE.W / 2, EE.H / 2, 'bg-title').setDisplaySize(EE.W, EE.H);
      this.add.rectangle(EE.W / 2, EE.H / 2, EE.W, EE.H, 0x16323a, 0.35);
    } else {
      // Procedural sky + hills fallback
      const g = this.add.graphics();
      g.fillGradientStyle(0x2a6f7f, 0x2a6f7f, 0x16323a, 0x16323a, 1);
      g.fillRect(0, 0, EE.W, EE.H);
      g.fillStyle(0x1f4450, 1);
      g.fillEllipse(300, 720, 900, 300);
      g.fillEllipse(1000, 740, 1000, 340);
      // cozy house silhouette
      g.fillStyle(0x2a9d8f, 0.35);
      g.fillRect(900, 420, 260, 220);
      g.fillTriangle(880, 420, 1180, 420, 1030, 300);
      g.fillStyle(C.gold, 0.7);
      g.fillRect(950, 470, 50, 50); g.fillRect(1060, 470, 50, 50);
    }

    const mascot = this.add.image(EE.W / 2 - 330, 205, 'mascot').setScale(1.5);
    this.tweens.add({ targets: mascot, y: 195, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.InOut' });

    const title = this.add.text(EE.W / 2 + 40, 150, 'WATT WATCHERS', {
      fontFamily: EE.FONT, fontSize: '72px', fontStyle: 'bold', color: EE.CSS.gold,
      stroke: '#16323a', strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(EE.W / 2 + 40, 218, 'House Inspector Adventure', {
      fontFamily: EE.FONT, fontSize: '30px', color: EE.CSS.white
    }).setOrigin(0.5);
    this.add.text(EE.W / 2, 285, 'Find the energy waste. Fix it. Save the day!', {
      fontFamily: EE.FONT, fontSize: '24px', color: EE.CSS.sky
    }).setOrigin(0.5);

    const hasRun = EE.GameState.hasSavedRun();
    const startBtn = EE.UI.makeButton(this, EE.W / 2, 400, 380, 70,
      hasRun ? 'New Inspection' : 'Start Inspection', () => {
        EE.GameState.startRun(EE.newSeed());
        this.scene.start('HouseMap');
      }, { fill: C.coral, fontSize: 30 });

    let howY = 490;
    if (hasRun) {
      EE.UI.makeButton(this, EE.W / 2, 490, 380, 62, 'Continue Inspection', () => {
        if (EE.GameState.continueRun()) this.scene.start('HouseMap');
        else this.scene.start('HouseMap');
      }, { fill: C.teal, fontSize: 26 });
      howY = 572;
    }

    EE.UI.makeButton(this, EE.W / 2, howY, 380, 58, 'How to Play', () => this.showHow(),
      { fill: C.bgPanel, fontSize: 24 });

    // Mute toggle
    this.muteBtn = EE.UI.makeIconButton(this, EE.W - 56, 56, 30, (g) => this.drawMuteIcon(g), () => {
      const m = !EE.Sfx.isMuted();
      EE.Sfx.setMuted(m);
      EE.SaveManager.update(d => { d.muted = m; });
      this.muteBtn.redrawIcon((g) => this.drawMuteIcon(g));
    }, 'Toggle sound');

    // Profile strip
    const save = EE.GameState.save;
    if (save && (save.inspections > 0 || save.lifetimeWatts > 0)) {
      this.add.text(EE.W / 2, EE.H - 36,
        `Inspector record: ${save.inspections} inspection${save.inspections === 1 ? '' : 's'} · ${save.lifetimeWatts.toLocaleString()} W saved · ${save.badges.length} badges`, {
        fontFamily: EE.FONT, fontSize: '20px', color: EE.CSS.sky
      }).setOrigin(0.5);
    } else {
      this.add.text(EE.W / 2, EE.H - 36, 'A free game about real energy-saving habits. Play offline, share with friends!', {
        fontFamily: EE.FONT, fontSize: '19px', color: EE.CSS.sky
      }).setOrigin(0.5);
    }

    // Keyboard: Enter starts.
    this.input.keyboard.once('keydown-ENTER', () => {
      EE.Sfx.unlock();
      EE.GameState.startRun(EE.newSeed());
      this.scene.start('HouseMap');
    });
  }

  drawMuteIcon(g) {
    const on = !EE.Sfx.isMuted();
    g.fillStyle(EE.COLORS.sky, 1);
    g.fillTriangle(-12, -6, -4, -6, 4, -14);
    g.fillRect(-14, -6, 8, 12);
    g.fillTriangle(-12, 6, -4, 6, 4, 14);
    g.fillRect(-14, -6, 8, 12);
    if (on) {
      g.lineStyle(3, EE.COLORS.sky, 1);
      g.beginPath(); g.arc(6, 0, 10, -0.6, 0.6, false); g.strokePath();
      g.beginPath(); g.arc(6, 0, 16, -0.6, 0.6, false); g.strokePath();
    } else {
      g.lineStyle(4, EE.COLORS.coral, 1);
      g.beginPath(); g.moveTo(6, -10); g.lineTo(18, 10); g.strokePath();
    }
  }

  showHow() {
    EE.UI.dialog(this, {
      title: 'How to play',
      icon: 'bulb',
      body: 'Walk through the house and tap anything wasting energy — lights left on, TVs on standby, doors left open.\n\nEvery fix saves watts and teaches a real energy tip. Some things MUST stay on (like the fridge!) — tap them to learn why.\n\nEarn stars and badges, then check your Report Card. Use the magnifier if you get stuck!',
      buttons: [{ label: 'Let\'s inspect!', fill: EE.COLORS.coral }]
    });
  }
}