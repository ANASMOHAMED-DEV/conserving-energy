// Room — one data-driven scene for all 5 rooms. Spawns WasteObjects from
// rooms.js, handles inspect/fix flows, puzzles, fact toasts, and the clear card.
class RoomScene extends Phaser.Scene {
  constructor() { super('Room'); }

  init(data) {
    this.roomId = data.roomId;
    this.objects = {};       // id -> WasteObject
    this.focusIdx = -1;
    this.toast = null;
    this.clearShown = false;
  }

  create() {
    const def = EE.ROOMS[this.roomId];
    const rs = EE.GameState.roomState(this.roomId);
    EE.GameState.enterRoom(this.roomId);

    // Background: generated art or procedural fallback.
    if (this.textures.exists(def.bg) && !EE.missingArt[def.bg]) {
      this.add.image(EE.W / 2, EE.H / 2, def.bg).setDisplaySize(EE.W, EE.H);
    } else {
      this.drawFallbackRoom();
    }

    // Spawn active wastes + all don't-touch objects.
    def.candidates.forEach(c => {
      const active = c.kind === 'donttouch' || rs.activeIds.includes(c.id);
      if (!active) return;
      const obj = new EE.WasteObject(this, this.roomId, c);
      obj.onInspect = (o) => this.inspect(o);
      this.objects[c.id] = obj;
      // Restore progress for rooms already (partly) cleared.
      if (rs.fixedIds.includes(c.id)) obj.markFixed();
      if (rs.learningIds.includes(c.id)) obj.markInvestigated();
    });

    // Debug registry for automation.
    EE.activeRoomObjects = this.objects;
    EE.activeRoomId = this.roomId;

    if (this.scene.isActive('Hud')) this.scene.stop('Hud');
    this.scene.launch('Hud', { roomId: this.roomId });

    // Bus wiring
    this.onHintVisual = ({ roomId, objId }) => {
      if (roomId === this.roomId && this.objects[objId]) this.objects[objId].shimmer();
    };
    this.onRoomCleared = (info) => {
      if (info.roomId === this.roomId && !this.clearShown) {
        this.clearShown = true;
        this.time.delayedCall(700, () => this.showClearCard(info));
      }
    };
    EE.bus.on('hint-visual', this.onHintVisual);
    EE.bus.on('room-cleared', this.onRoomCleared);

    // Keyboard navigation: Tab/arrows cycle, Enter inspects, H hint, Esc back.
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); this.cycleFocus(1); });
    this.input.keyboard.on('keydown-RIGHT', () => this.cycleFocus(1));
    this.input.keyboard.on('keydown-DOWN', () => this.cycleFocus(1));
    this.input.keyboard.on('keydown-LEFT', () => this.cycleFocus(-1));
    this.input.keyboard.on('keydown-UP', () => this.cycleFocus(-1));
    this.input.keyboard.on('keydown-ENTER', () => {
      const obj = this.focusedObject();
      if (obj) this.inspect(obj);
    });

    this.events.once('shutdown', () => {
      EE.bus.off('hint-visual', this.onHintVisual);
      EE.bus.off('room-cleared', this.onRoomCleared);
      if (this.scene.isActive('Hud')) this.scene.stop('Hud');
      EE.activeRoomObjects = null;
      EE.activeRoomId = null;
    });

    // Room already cleared on entry (revisit): offer the card again.
    if (rs.cleared && !this.clearShown) {
      this.clearShown = true;
      this.time.delayedCall(400, () => this.showClearCard({
        roomId: this.roomId, stars: rs.stars, watts: rs.watts
      }));
    }
  }

  exitToMap() {
    this.scene.stop('Hud');
    this.scene.start('HouseMap');
  }

  // ---- interaction flows ------------------------------------------------
  inspect(obj) {
    if (EE.UI.anyDialogOpen()) return;
    const d = obj.def;

    if (d.kind === 'donttouch') {
      EE.GameState.learningMoment(this.roomId, d.id);
      obj.markInvestigated();
      EE.Sfx.learn();
      EE.UI.dialog(this, {
        title: d.name, icon: 'bulb', body: d.dialog,
        buttons: [{ label: 'Good to know!', fill: EE.COLORS.teal }]
      });
      return;
    }

    if (obj.fixed) return;

    switch (d.actionType) {
      case 'toggle':
      case 'unplug':
      case 'close':
        this.applyFix(obj);
        break;
      case 'choice':
        this.openChoice(obj);
        break;
      case 'twostep':
        this.openStep(obj, 0);
        break;
    }
  }

  applyFix(obj) {
    const result = EE.GameState.fixObject(this.roomId, obj.def.id);
    if (!result) return;
    obj.markFixed();
    EE.Sfx.fix();
    this.floatText(obj.cont.x, obj.cont.y - obj.def.h / 2 - 10, `+${result.watts} W`, EE.CSS.gold);
    this.showFactToast(obj.def);

    const run = EE.GameState.run;
    if (run.streak >= 3) {
      EE.Sfx.streak();
      this.floatText(EE.W / 2, 140, `Hot Streak x1.5! (${run.streak} in a row)`, '#ffd166', 30);
    }
  }

  openChoice(obj) {
    const d = obj.def;
    EE.UI.dialog(this, {
      title: d.name, icon: 'bulb', body: d.prompt,
      buttons: d.options.map(opt => ({
        label: opt.label,
        fill: EE.COLORS.teal,
        cb: () => {
          if (opt.correct) {
            this.applyFix(obj);
          } else {
            EE.Sfx.learn();
            EE.UI.dialog(this, {
              title: 'Hmm, think again…', icon: 'warn', body: opt.explain,
              buttons: [{ label: 'Try again', fill: EE.COLORS.coral, cb: () => this.openChoice(obj) }]
            });
          }
        }
      }))
    });
  }

  openStep(obj, idx) {
    const d = obj.def;
    const step = d.steps[idx];
    EE.UI.dialog(this, {
      title: d.name + ` (step ${idx + 1} of ${d.steps.length})`, icon: 'bulb',
      body: step.prompt,
      buttons: [{
        label: step.button, fill: EE.COLORS.teal,
        cb: () => {
          obj.setState(step.state);
          if (idx + 1 < d.steps.length) this.openStep(obj, idx + 1);
          else this.applyFix(obj);
        }
      }]
    });
  }

  // ---- feedback ----------------------------------------------------------
  floatText(x, y, str, color, size) {
    const t = this.add.text(x, y, str, {
      fontFamily: EE.FONT, fontSize: (size || 34) + 'px', fontStyle: 'bold',
      color: color || EE.CSS.gold, stroke: '#16323a', strokeThickness: 6
    }).setOrigin(0.5).setDepth(600);
    this.tweens.add({
      targets: t, y: y - 70, alpha: 0, duration: 1300, ease: 'Cubic.Out',
      onComplete: () => t.destroy()
    });
  }

  showFactToast(def) {
    if (this.toast) this.toast.destroy();
    const fact = EE.FACTS[def.fact] || 'Nice save, Inspector!';
    const cont = this.add.container(EE.W / 2, EE.H - 64).setDepth(500);
    const text = this.add.text(0, 0, fact, {
      fontFamily: EE.FONT, fontSize: '21px', color: EE.CSS.ink,
      wordWrap: { width: 760 }, align: 'center', lineSpacing: 4
    }).setOrigin(0.5);
    const w = Math.min(960, text.width + 130), h = Math.max(76, text.height + 30);
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.25); bg.fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, 18);
    bg.fillStyle(EE.COLORS.panel, 1); bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
    bg.lineStyle(3, EE.COLORS.gold, 1); bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
    const mascot = this.add.image(-w / 2 + 44, 0, 'mascot').setScale(0.5);
    text.setX(24);
    cont.add([bg, mascot, text]);
    cont.setSize(w, h).setInteractive();
    cont.on('pointerup', () => cont.destroy());
    cont.setAlpha(0).setY(EE.H - 40);
    this.tweens.add({ targets: cont, alpha: 1, y: EE.H - 64, duration: 250, ease: 'Back.Out' });
    this.toast = cont;
    this.time.delayedCall(6500, () => {
      if (cont.active) {
        this.tweens.add({ targets: cont, alpha: 0, duration: 300, onComplete: () => cont.destroy() });
      }
    });
  }

  showClearCard(info) {
    const rs = EE.GameState.roomState(this.roomId);
    const allDone = EE.GameState.allCleared();
    const starWord = info.stars === 3 ? 'Perfect inspection!' :
                     info.stars === 2 ? 'Great inspection!' : 'Room inspected!';
    const buttons = [];
    if (allDone) {
      buttons.push({ label: 'See the Report Card!', fill: EE.COLORS.gold,
        cb: () => { this.scene.stop('Hud'); this.scene.start('Report'); } });
    }
    buttons.push({ label: 'Back to the house', fill: EE.COLORS.teal,
      cb: () => this.exitToMap() });

    EE.Sfx.roomClear();
    EE.UI.dialog(this, {
      title: `${EE.ROOMS[this.roomId].name} — ${starWord}`,
      icon: 'star',
      body: `You saved ${info.watts} watts in this room!\n${'★'.repeat(info.stars)}${'☆'.repeat(3 - info.stars)}  ${
        info.stars === 3 ? 'No hints, sharp eyes — full stars!' :
        info.stars === 2 ? 'No hints used — great work!' :
        'Hints help you learn. Try without one next time for more stars!'
      }${allDone ? '\n\nEvery room is clear — time for your Report Card!' : ''}`,
      buttons
    });
  }

  // ---- keyboard focus -----------------------------------------------------
  focusableObjects() {
    return Object.values(this.objects).filter(o => !o.fixed);
  }

  cycleFocus(dir) {
    if (EE.UI.anyDialogOpen()) return;
    const list = this.focusableObjects();
    if (!list.length) return;
    const old = this.focusedObject();
    if (old) old.focusRing(false);
    this.focusIdx = ((this.focusIdx + dir) % list.length + list.length) % list.length;
    const obj = list[this.focusIdx];
    obj.focusRing(true);
    obj.label.setVisible(true);
  }

  focusedObject() {
    const list = this.focusableObjects();
    if (this.focusIdx >= 0 && this.focusIdx < list.length) return list[this.focusIdx];
    return null;
  }

  // ---- procedural fallback room -------------------------------------------
  drawFallbackRoom() {
    const g = this.add.graphics();
    const palettes = {
      living:  { wall: 0xe8d9b5, floor: 0xb99b72, accent: 0x2a9d8f },
      kitchen: { wall: 0xdfe8e6, floor: 0x9aa5a8, accent: 0xe76f51 },
      bedroom: { wall: 0xd8e2ec, floor: 0xb99b72, accent: 0x5c7a8a },
      bathroom:{ wall: 0xcfe6ea, floor: 0x8fb6bd, accent: 0x2a9d8f },
      laundry: { wall: 0xe2e0d4, floor: 0x8a9aa0, accent: 0xffd166 }
    };
    const p = palettes[this.roomId] || palettes.living;
    g.fillStyle(p.wall, 1); g.fillRect(0, 0, EE.W, 500);
    g.fillStyle(p.floor, 1); g.fillRect(0, 500, EE.W, 220);
    g.fillStyle(0x000000, 0.08); g.fillRect(0, 494, EE.W, 10);
    // window with daylight
    g.fillStyle(0xbfe3ea, 1); g.fillRoundedRect(70, 130, 180, 160, 10);
    g.lineStyle(6, 0xfdf6e3, 1); g.strokeRoundedRect(70, 130, 180, 160, 10);
    g.beginPath(); g.moveTo(160, 130); g.lineTo(160, 290); g.strokePath();
    g.fillStyle(0xffd166, 0.9); g.fillCircle(120, 175, 22);
    // rug
    g.fillStyle(p.accent, 0.35); g.fillEllipse(640, 600, 500, 110);
    // baseboard
    g.fillStyle(0xfdf6e3, 1); g.fillRect(0, 480, EE.W, 16);
  }
}