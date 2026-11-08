// Hud — overlay scene running in parallel with Room. Reads GameState via bus
// events; never mutates room objects directly.
class HudScene extends Phaser.Scene {
  constructor() { super('Hud'); }

  init(data) { this.roomId = data.roomId; }

  create() {
    const C = EE.COLORS;
    const def = EE.ROOMS[this.roomId];
    const rs = EE.GameState.roomState(this.roomId);

    // Back to map
    EE.UI.makeIconButton(this, 52, 52, 28, (g) => {
      g.lineStyle(5, C.sky, 1);
      g.beginPath(); g.moveTo(8, -10); g.lineTo(-6, 0); g.lineTo(8, 10); g.strokePath();
    }, () => this.leaveRoom(), 'Back to house map');

    this.add.text(96, 52, def.name, {
      fontFamily: EE.FONT, fontSize: '28px', fontStyle: 'bold', color: '#ffffff',
      stroke: '#16323a', strokeThickness: 5
    }).setOrigin(0, 0.5);

    // Room watts meter
    const totalWatts = rs.activeIds.reduce((sum, id) => {
      const d = EE.GameState.objectDef(this.roomId, id);
      return sum + (d ? d.watts : 0);
    }, 0);
    this.meter = EE.UI.meter(this, EE.W / 2 - 170, 36, 340, 32);
    this.meter.setValueInstant(rs.watts, totalWatts);
    this.totalWatts = totalWatts;

    // Progress pips
    this.pips = this.add.container(EE.W / 2, 88);
    this.drawPips();

    // Hint button
    EE.UI.makeIconButton(this, EE.W - 124, 52, 28, (g) => {
      g.lineStyle(4, C.gold, 1);
      g.strokeCircle(-3, -3, 11);
      g.lineStyle(5, C.gold, 1);
      g.beginPath(); g.moveTo(5, 5); g.lineTo(14, 14); g.strokePath();
    }, () => this.useHint(), 'Hint');

    // Mute
    this.muteBtn = EE.UI.makeIconButton(this, EE.W - 52, 52, 28, (g) => this.drawMuteIcon(g), () => {
      const m = !EE.Sfx.isMuted();
      EE.Sfx.setMuted(m);
      EE.SaveManager.update(d => { d.muted = m; });
      this.muteBtn.redrawIcon((g) => this.drawMuteIcon(g));
    }, 'Toggle sound');

    // Bus subscriptions (cleaned up on shutdown)
    this.onWatts = () => {
      const r = EE.GameState.roomState(this.roomId);
      this.meter.set(r.watts, this.totalWatts);
      this.meter.pulse();
      this.drawPips();
    };
    EE.bus.on('watts-changed', this.onWatts);

    this.input.keyboard.on('keydown-M', () => {
      const m = !EE.Sfx.isMuted();
      EE.Sfx.setMuted(m);
      EE.SaveManager.update(d => { d.muted = m; });
      this.muteBtn.redrawIcon((g) => this.drawMuteIcon(g));
    });
    this.input.keyboard.on('keydown-H', () => this.useHint());
    this.input.keyboard.on('keydown-ESC', () => this.leaveRoom());

    this.events.once('shutdown', () => {
      EE.bus.off('watts-changed', this.onWatts);
    });
  }

  drawPips() {
    const rs = EE.GameState.roomState(this.roomId);
    this.pips.removeAll(true);
    const n = rs.activeIds.length;
    const g = this.add.graphics();
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * 30;
      const done = i < rs.fixedIds.length;
      g.fillStyle(done ? EE.COLORS.teal : 0x000000, done ? 1 : 0.3);
      g.fillCircle(x, 0, 9);
      if (done) {
        g.lineStyle(3, 0xffffff, 1);
        g.beginPath(); g.moveTo(x - 4, 0); g.lineTo(x - 1, 4); g.lineTo(x + 5, -4); g.strokePath();
      }
    }
    this.pips.add(g);
    const txt = this.add.text(0, 22, `${rs.fixedIds.length} / ${n} fixed`, {
      fontFamily: EE.FONT, fontSize: '17px', color: '#ffffff',
      stroke: '#16323a', strokeThickness: 3
    }).setOrigin(0.5);
    this.pips.add(txt);
  }

  useHint() {
    if (EE.UI.anyDialogOpen()) return;
    const target = EE.GameState.useHint(this.roomId);
    if (target) {
      EE.Sfx.hint();
      EE.bus.emit('hint-visual', { roomId: this.roomId, objId: target });
    }
  }

  drawMuteIcon(g) {
    const on = !EE.Sfx.isMuted();
    g.fillStyle(EE.COLORS.sky, 1);
    g.fillTriangle(-10, -5, -3, -5, 4, -12);
    g.fillRect(-12, -5, 7, 10);
    g.fillTriangle(-10, 5, -3, 5, 4, 12);
    if (on) {
      g.lineStyle(3, EE.COLORS.sky, 1);
      g.beginPath(); g.arc(5, 0, 9, -0.6, 0.6, false); g.strokePath();
    } else {
      g.lineStyle(4, EE.COLORS.coral, 1);
      g.beginPath(); g.moveTo(5, -9); g.lineTo(16, 9); g.strokePath();
    }
  }

  leaveRoom() {
    if (EE.UI.anyDialogOpen()) return;
    const room = this.scene.get('Room');
    if (room && room.exitToMap) room.exitToMap();
    else { this.scene.stop(); this.scene.start('HouseMap'); }
  }
}