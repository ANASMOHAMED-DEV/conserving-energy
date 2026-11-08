// WasteObject — interactive energy-waste objects, drawn procedurally so every
// state (on/off, plugged/unplugged, open/closed) is pixel-consistent.
// Generous padded hit areas (>= 64x64), hover shimmer, hint shimmer, focus ring.
(function () {
  const C = EE.COLORS;

  class WasteObject {
    constructor(scene, roomId, def) {
      this.scene = scene;
      this.roomId = roomId;
      this.def = def;
      this.state = 'wasting';   // 'wasting' | intermediate | 'fixed'
      this.fixed = false;
      this.investigated = false; // for donttouch
      this.onInspect = null;

      const cont = scene.add.container(def.x, def.y);
      this.cont = cont;
      this.g = scene.add.graphics();
      this.fx = scene.add.container();   // animated bits (fan blades, bubbles)
      cont.add([this.g, this.fx]);

      // Padded hit area, minimum 64x64 design px.
      const hw = Math.max(def.w, EE.MIN_HIT) + 24;
      const hh = Math.max(def.h, EE.MIN_HIT) + 24;
      this.hitW = hw; this.hitH = hh;
      cont.setSize(hw, hh);
      cont.setInteractive(
        new Phaser.Geom.Rectangle(-hw / 2, -hh / 2, hw, hh),
        Phaser.Geom.Rectangle.Contains,
        { useHandCursor: true }
      );

      this.ring = scene.add.graphics();
      cont.add(this.ring);
      this.label = scene.add.text(0, -hh / 2 - 14, def.name, {
        fontFamily: EE.FONT, fontSize: '20px', fontStyle: 'bold',
        color: '#ffffff', backgroundColor: '#1f4450ee',
        padding: { x: 10, y: 5 }
      }).setOrigin(0.5).setVisible(false);
      cont.add(this.label);

      cont.on('pointerover', () => {
        if (this.fixed) return;
        this.label.setVisible(true);
        this.drawRing(C.gold, 0.9);
        EE.Sfx.hover();
      });
      cont.on('pointerout', () => {
        this.label.setVisible(false);
        this.ring.clear();
      });
      cont.on('pointerup', () => {
        EE.Sfx.unlock();
        if (this.onInspect) this.onInspect(this);
      });

      this.redraw();

      if (EE.hitboxes) {
        const dbg = scene.add.graphics().setDepth(900);
        dbg.lineStyle(2, 0xff00ff, 0.9);
        dbg.strokeRect(def.x - hw / 2, def.y - hh / 2, hw, hh);
        dbg.fillStyle(0xff00ff, 1);
        dbg.fillCircle(def.x, def.y, 4);
      }
    }

    drawRing(color, alpha) {
      this.ring.clear();
      this.ring.lineStyle(4, color, alpha);
      this.ring.strokeRoundedRect(-this.hitW / 2, -this.hitH / 2, this.hitW, this.hitH, 14);
    }

    focusRing(on) {
      if (on) this.drawRing(C.gold, 1);
      else this.ring.clear();
    }

    shimmer() {
      this.drawRing(C.gold, 1);
      this.scene.tweens.add({
        targets: this.cont, scale: 1.08, duration: 350, yoyo: true, repeat: 3,
        onComplete: () => { this.cont.setScale(1); this.ring.clear(); }
      });
    }

    setState(state) {
      this.state = state;
      this.redraw();
    }

    markFixed() {
      this.fixed = true;
      this.state = 'fixed';
      this.label.setVisible(false);
      this.redraw();
      this.drawCheck();
      this.scene.tweens.add({
        targets: this.cont, scale: 1.12, duration: 140, yoyo: true, ease: 'Quad.Out'
      });
    }

    markInvestigated() {
      this.investigated = true;
      const g = this.scene.add.graphics();
      g.fillStyle(C.sky, 1);
      g.fillCircle(this.def.w / 2 - 4, -this.def.h / 2 + 4, 14);
      g.fillStyle(C.ink, 1);
      g.fillRect(this.def.w / 2 - 6, -this.def.h / 2 - 2, 4, 9);
      g.fillCircle(this.def.w / 2 - 4, -this.def.h / 2 + 10, 2.4);
      this.cont.add(g);
    }

    drawCheck() {
      const g = this.scene.add.graphics();
      const x = this.def.w / 2 - 2, y = -this.def.h / 2 + 2;
      g.fillStyle(0x000000, 0.2); g.fillCircle(x + 2, y + 3, 18);
      g.fillStyle(C.good, 1); g.fillCircle(x, y, 18);
      g.lineStyle(5, 0xffffff, 1);
      g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x - 2, y + 7); g.lineTo(x + 9, y - 6); g.strokePath();
      this.cont.add(g);
      g.setScale(0);
      this.scene.tweens.add({ targets: g, scale: 1, duration: 250, ease: 'Back.Out' });
    }

    // ---- rendering ------------------------------------------------------
    redraw() {
      const g = this.g;
      g.clear();
      this.fx.removeAll(true);
      if (this._fanTween) { this._fanTween.stop(); this._fanTween = null; }
      const d = this.def;
      const v = d.visual;
      const s = this.state;
      const fn = WasteObject.drawers[v];
      if (fn) fn(this, g, d, s);
      else { g.fillStyle(C.coral, 1); g.fillRoundedRect(-d.w / 2, -d.h / 2, d.w, d.h, 10); }
    }

    screenCenter() {
      // World == design coords (no camera zoom). Convert to CSS pixels of the canvas.
      const canvas = this.scene.game.canvas;
      const rect = canvas.getBoundingClientRect();
      const sx = rect.left + (this.def.x / EE.W) * rect.width;
      const sy = rect.top + (this.def.y / EE.H) * rect.height;
      return { x: sx, y: sy };
    }

    destroy() { this.cont.destroy(); }
  }

  // ---- helpers -----------------------------------------------------------
  function glow(g, x, y, r, color, strength) {
    for (let i = 3; i >= 1; i--) {
      g.fillStyle(color, strength * (0.12 * i));
      g.fillCircle(x, y, r * (0.6 + i * 0.35));
    }
  }
  function rr(g, x, y, w, h, r, color, alpha) {
    g.fillStyle(color, alpha === undefined ? 1 : alpha);
    g.fillRoundedRect(x, y, w, h, r);
  }
  function steam(g, x, y, color, alpha) {
    g.lineStyle(4, color, alpha);
    for (let i = 0; i < 3; i++) {
      const ox = x - 14 + i * 14;
      g.beginPath();
      g.moveTo(ox, y);
      g.lineTo(ox + 5, y - 10);
      g.lineTo(ox - 3, y - 20);
      g.lineTo(ox + 4, y - 30);
      g.strokePath();
    }
  }
  function led(g, x, y, on, color) {
    g.fillStyle(on ? (color || C.standby) : 0x556066, 1);
    g.fillCircle(x, y, 5);
    if (on) glow(g, x, y, 8, color || C.standby, 0.8);
  }

  // ---- drawers: each renders one visual type centered at (0,0) ------------
  WasteObject.drawers = {
    light(obj, g, d, s) {
      const on = s === 'wasting';
      if (d.variant === 'lamp') {
        g.fillStyle(0x8a6f52, 1); g.fillRect(-4, -10, 8, d.h / 2 + 10);
        g.fillStyle(0x6b543c, 1); g.fillRoundedRect(-26, d.h / 2 - 6, 52, 12, 6);
        g.fillStyle(on ? C.gold : 0xcfc4a6, 1);
        g.fillTriangle(-34, -10, 34, -10, 22, -d.h / 2);
        g.fillTriangle(-34, -10, 34, -10, -22, -d.h / 2);
        if (on) glow(g, 0, -18, 46, C.glow, 1);
      } else if (d.variant === 'wall') {
        rr(g, -18, -22, 36, 44, 10, on ? C.gold : 0xcfc4a6);
        g.fillStyle(0x8a6f52, 1); g.fillRect(-6, 22, 12, 12);
        if (on) glow(g, 0, 0, 34, C.glow, 1);
      } else { // ceiling
        // Cord hangs from the room ceiling (design y=0), not the hitbox top.
        g.lineStyle(4, 0x5c6f78, 1);
        g.beginPath(); g.moveTo(0, -d.y); g.lineTo(0, -14); g.strokePath();
        g.fillStyle(0x5c6f78, 1); g.fillRoundedRect(-24, -16, 48, 14, 6);
        g.fillStyle(on ? C.glow : 0xd8d2c0, 1); g.fillCircle(0, 12, 20);
        if (on) glow(g, 0, 14, 52, C.glow, 1.1);
      }
    },

    screen(obj, g, d, s) {
      const w = d.w, h = d.h;
      const fixed = s === 'fixed';
      // A TV that is ON (toggle) shows a lit cartoon program; standby (unplug)
      // stays dark with only the red LED, so kids can tell the states apart.
      const lit = !fixed && d.actionType === 'toggle' && d.variant !== 'monitor';
      rr(g, -w / 2, -h / 2, w, h - 20, 10, 0x2b3a42);
      // Screen: faint standby sheen vs fully dark/off.
      rr(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 36, 6, lit ? 0x8fc7d8 : (fixed ? 0x1a262c : 0x39505c));
      if (lit) {
        g.fillStyle(0xffd166, 1); g.fillCircle(-w / 6, -h / 6, 12);
        g.fillStyle(0x2f8f6b, 1);
        g.fillTriangle(-w / 2 + 8, h / 2 - 28, -w / 6, -h / 10, w / 6, h / 2 - 28);
        g.fillStyle(0x3f7a63, 1);
        g.fillTriangle(-w / 6, h / 2 - 28, w / 5, -h / 12, w / 2 - 8, h / 2 - 28);
      } else if (!fixed && d.variant !== 'monitor') {
        g.fillStyle(0x4a6774, 0.5);
        g.fillTriangle(-w / 2 + 8, -h / 2 + 8, w / 4, -h / 2 + 8, -w / 2 + 8, h / 4);
      }
      if (d.variant === 'monitor') {
        if (!fixed) {
          // paused game glow
          rr(g, -w / 2 + 14, -h / 2 + 14, w - 28, h - 48, 4, 0x3f7a63);
          g.fillStyle(C.gold, 0.9);
          g.fillRect(-10, -h / 2 + 22, 7, 22); g.fillRect(4, -h / 2 + 22, 7, 22);
          if (s === 'saved') {
            g.fillStyle(0xffffff, 1);
            g.fillCircle(w / 2 - 24, -h / 2 + 24, 10);
          }
        }
        g.fillStyle(0x2b3a42, 1); g.fillRect(-10, h / 2 - 20, 20, 14);
        g.fillRoundedRect(-34, h / 2 - 8, 68, 8, 4);
      } else {
        g.fillStyle(0x2b3a42, 1); g.fillRect(-14, h / 2 - 20, 28, 12);
        g.fillRoundedRect(-40, h / 2 - 10, 80, 8, 4);
      }
      // Standby LED: the tell-tale red dot.
      led(g, w / 2 - 16, h / 2 - 28, !fixed && d.actionType === 'unplug', C.standby);
      if (!fixed && d.actionType === 'toggle') glow(g, 0, -8, 40, 0x9fc4d4, 0.4);
    },

    console(obj, g, d, s) {
      const fixed = s === 'fixed';
      rr(g, -d.w / 2, -d.h / 2 + 10, d.w, d.h - 20, 10, 0x37474f);
      rr(g, -d.w / 2 + 8, -d.h / 2 + 18, d.w - 16, 12, 6, 0x263238);
      led(g, d.w / 2 - 18, 4, !fixed, C.standby);
      g.fillStyle(0x546e7a, 1); g.fillCircle(-d.w / 4, 4, 7);
    },

    plug(obj, g, d, s) {
      const fixed = s === 'fixed';
      // Wall socket
      rr(g, -30, -34, 60, 60, 10, 0xf3ead2);
      g.lineStyle(3, 0xd9cba4, 1); g.strokeRoundedRect(-30, -34, 60, 60, 10);
      g.fillStyle(0x5c6f78, 1);
      g.fillCircle(-10, -8, 4); g.fillCircle(10, -8, 4);
      g.fillRoundedRect(-4, 6, 8, 10, 3);
      if (!fixed) {
        // Charger brick plugged in, tiny sip indicator
        rr(g, -20, 18, 40, 30, 7, 0xe8e2cf);
        g.lineStyle(3, 0x5c6f78, 1);
        g.beginPath(); g.moveTo(0, 26); g.lineTo(0, 12); g.strokePath();
        g.fillStyle(C.goldDark, 1);
        g.fillTriangle(26, -20, 18, -6, 25, -6);
        g.fillTriangle(22, -8, 30, -22, 23, -22);
      } else {
        // Charger popped out to the side
        rr(g, 26, 16, 36, 26, 7, 0xe8e2cf);
        g.fillStyle(0x5c6f78, 1);
        g.fillRect(20, 22, 6, 4); g.fillRect(20, 30, 6, 4);
      }
    },

    ac(obj, g, d, s) {
      const closed = s === 'windowClosed' || s === 'fixed';
      const eco = s === 'fixed';
      // Window (left part)
      const wx = -d.w / 2;
      rr(g, wx, -30, 78, 76, 6, 0xbfe3ea);
      g.lineStyle(4, 0xf3ead2, 1); g.strokeRoundedRect(wx, -30, 78, 76, 6);
      if (!closed) {
        // open sash + breeze lines
        g.fillStyle(0x8fd6e7, 1); g.fillRect(wx + 4, -26, 70, 34);
        g.lineStyle(3, 0xffffff, 0.9);
        for (let i = 0; i < 3; i++) {
          g.beginPath(); g.moveTo(wx + 10, 16 + i * 9); g.lineTo(wx + 60, 12 + i * 9); g.strokePath();
        }
      } else {
        g.lineStyle(3, 0xf3ead2, 1);
        g.beginPath(); g.moveTo(wx + 39, -30); g.lineTo(wx + 39, 46); g.strokePath();
      }
      // AC unit (right part)
      rr(g, 8, -d.h / 2, d.w / 2 - 4, 54, 10, eco ? 0xdff2ec : 0xf3ead2);
      g.lineStyle(3, 0xd9cba4, 1); g.strokeRoundedRect(8, -d.h / 2, d.w / 2 - 4, 54, 10);
      g.lineStyle(3, 0x9aa5a8, 1);
      for (let i = 0; i < 3; i++) {
        g.beginPath(); g.moveTo(16, -d.h / 2 + 30 + i * 7); g.lineTo(d.w / 2 - 4, -d.h / 2 + 30 + i * 7); g.strokePath();
      }
      led(g, d.w / 2 - 14, -d.h / 2 + 12, !eco, eco ? C.good : C.standby);
      if (!eco) glow(g, 40, 20, 30, 0xbfe3ea, 0.5);
      if (eco) {
        // leaf icon
        g.fillStyle(C.good, 1);
        g.fillEllipse(40, 24, 26, 14);
        g.lineStyle(2, 0xffffff, 1);
        g.beginPath(); g.moveTo(30, 28); g.lineTo(50, 20); g.strokePath();
      }
    },

    fridge(obj, g, d, s) {
      const closed = s === 'fixed';
      const w = d.w, h = d.h;
      rr(g, -w / 2, -h / 2, w, h, 12, 0xe8ecef);
      g.lineStyle(3, 0xb8c2c8, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.lineStyle(3, 0xb8c2c8, 1);
      g.beginPath(); g.moveTo(-w / 2, -h / 2 + h * 0.35); g.lineTo(w / 2, -h / 2 + h * 0.35); g.strokePath();
      g.fillStyle(0x9aa5a8, 1);
      g.fillRoundedRect(w / 2 - 18, -h / 2 + 20, 8, 40, 4);
      g.fillRoundedRect(w / 2 - 18, -h / 2 + h * 0.35 + 16, 8, 50, 4);
      if (!closed) {
        // door ajar: dark gap + cold light spilling out
        g.fillStyle(0x22313a, 1);
        g.fillTriangle(w / 2 - 4, -h / 2 + 8, w / 2 + 22, -h / 2 + 30, w / 2 - 4, h / 2 - 8);
        glow(g, w / 2 + 8, 0, 36, 0xcfe9f2, 0.8);
        g.fillStyle(C.gold, 0.85);
        g.fillRect(w / 2 - 2, -h / 2 + 20, 5, h - 40);
      }
    },

    oven(obj, g, d, s) {
      const on = s === 'wasting';
      const w = d.w, h = d.h;
      rr(g, -w / 2, -h / 2, w, h, 10, 0xd8dde0);
      g.lineStyle(3, 0xa8b2b8, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      // knobs
      for (let i = 0; i < 4; i++) {
        g.fillStyle(0x5c6f78, 1);
        g.fillCircle(-w / 2 + 26 + i * ((w - 52) / 3), -h / 2 + 18, 8);
      }
      rr(g, -w / 2 + 14, -h / 2 + 38, w - 28, h - 56, 8, on ? 0xff9d4d : 0x22313a);
      if (on) {
        glow(g, 0, 10, 44, 0xffb066, 0.9);
        g.fillStyle(0xffd166, 0.9);
        g.fillRoundedRect(-w / 2 + 22, h / 2 - 34, w - 44, 10, 5);
      }
      g.fillStyle(0x9aa5a8, 1); g.fillRoundedRect(-w / 2 + 14, -h / 2 + 32, w - 28, 6, 3);
    },

    kettle(obj, g, d, s) {
      const fixed = s === 'fixed';
      rr(g, -26, -20, 52, 52, 14, 0xe76f51);
      g.fillStyle(0xc5573c, 1); g.fillRoundedRect(-30, 28, 60, 12, 6);
      g.lineStyle(6, 0xc5573c, 1);
      g.strokeCircle(30, 0, 16, false);
      g.fillStyle(0xc5573c, 1);
      g.fillTriangle(-26, -14, -44, -26, -26, 2);
      g.fillStyle(0x2b3a42, 1); g.fillRoundedRect(-14, -30, 28, 12, 5);
      // water level window
      rr(g, -8, -12, 16, 36, 6, 0xfdf6e3);
      g.fillStyle(0x6fc2d8, 1);
      g.fillRect(-6, fixed ? 12 : -8, 12, fixed ? 10 : 30);
      if (!fixed) steam(g, -38, -30, 0xffffff, 0.85);
    },

    dishwasher(obj, g, d, s) {
      const fixed = s === 'fixed';
      const w = d.w, h = d.h;
      rr(g, -w / 2, -h / 2, w, h, 10, 0xe8ecef);
      g.lineStyle(3, 0xb8c2c8, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
      g.fillStyle(0x9aa5a8, 1); g.fillRoundedRect(-w / 2 + 10, -h / 2 + 12, w - 20, 8, 4);
      led(g, w / 2 - 18, -h / 2 + 30, !fixed, C.gold);
      // rack window with plates: half vs full
      rr(g, -w / 2 + 14, -h / 2 + 42, w - 28, h - 58, 8, 0x39505c);
      g.fillStyle(0xfdf6e3, 1);
      const plates = fixed ? 6 : 3;
      for (let i = 0; i < plates; i++) {
        g.fillRoundedRect(-w / 2 + 22 + i * ((w - 44) / 6), -h / 2 + 52, 10, h - 80, 4);
      }
      if (fixed) {
        // little clock: "wait for full"
        g.fillStyle(C.gold, 1); g.fillCircle(0, h / 2 - 16, 12);
        g.lineStyle(3, C.ink, 1);
        g.beginPath(); g.moveTo(0, h / 2 - 16); g.lineTo(0, h / 2 - 24); g.strokePath();
        g.beginPath(); g.moveTo(0, h / 2 - 16); g.lineTo(6, h / 2 - 13); g.strokePath();
      }
    },

    washer(obj, g, d, s) {
      const fixed = s === 'fixed';
      const w = d.w, h = d.h;
      rr(g, -w / 2, -h / 2, w, h, 12, 0xf0f3f4);
      g.lineStyle(3, 0xb8c2c8, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.fillStyle(0x9aa5a8, 1);
      g.fillCircle(-w / 2 + 20, -h / 2 + 18, 8);
      g.fillRoundedRect(0, -h / 2 + 12, w / 2 - 14, 12, 6);
      g.fillStyle(0x39505c, 1); g.fillCircle(0, 14, w * 0.32);
      g.fillStyle(fixed ? 0x9fd0dd : 0x6fc2d8, 1); g.fillCircle(0, 14, w * 0.25);
      // clothes swirl
      g.fillStyle(0xfdf6e3, 0.9);
      g.fillEllipse(-8, 10, 22, 12); g.fillEllipse(10, 22, 18, 10);
      g.lineStyle(4, 0xd8dde0, 1); g.strokeCircle(0, 14, w * 0.32);
      if (!fixed) {
        // hot indicator: red waves
        steam(g, w / 2 - 10, -h / 2 - 4, C.coral, 0.9);
      } else {
        // snowflake for cold
        g.lineStyle(3, 0x6fc2d8, 1);
        const cx = w / 2 - 18, cy = -h / 2 + 18;
        for (let i = 0; i < 3; i++) {
          const a = i * Math.PI / 3;
          g.beginPath();
          g.moveTo(cx - Math.cos(a) * 9, cy - Math.sin(a) * 9);
          g.lineTo(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9);
          g.strokePath();
        }
      }
    },

    dryer(obj, g, d, s) {
      const fixed = s === 'fixed';
      const w = d.w, h = d.h;
      rr(g, -w / 2, -h / 2, w, h, 12, 0xe8e2cf);
      g.lineStyle(3, 0xc9bd9c, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
      g.fillStyle(0x39505c, 1); g.fillCircle(0, 10, w * 0.3);
      g.fillStyle(fixed ? 0x22313a : 0x5c7a8a, 1); g.fillCircle(0, 10, w * 0.23);
      if (!fixed) {
        g.fillStyle(0xfdf6e3, 0.85);
        g.fillEllipse(-6, 4, 20, 12); g.fillEllipse(8, 18, 16, 10);
        steam(g, 0, -h / 2 - 2, 0xffffff, 0.7);
      }
      g.lineStyle(4, 0xc9bd9c, 1); g.strokeCircle(0, 10, w * 0.3);
      led(g, w / 2 - 16, -h / 2 + 16, !fixed, C.gold);
      if (fixed) {
        // sun + clothesline above
        g.fillStyle(C.gold, 1); g.fillCircle(-w / 4, -h / 2 - 18, 12);
        g.lineStyle(3, C.gold, 1);
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          g.beginPath();
          g.moveTo(-w / 4 + Math.cos(a) * 15, -h / 2 - 18 + Math.sin(a) * 15);
          g.lineTo(-w / 4 + Math.cos(a) * 21, -h / 2 - 18 + Math.sin(a) * 21);
          g.strokePath();
        }
      }
    },

    freezer(obj, g, d, s) {
      const fixed = s === 'fixed';
      const w = d.w, h = d.h;
      rr(g, -w / 2, -h / 2 + 14, w, h - 14, 12, 0xf0f3f4);
      g.lineStyle(3, 0xb8c2c8, 1); g.strokeRoundedRect(-w / 2, -h / 2 + 14, w, h - 14, 12);
      rr(g, -w / 2 - 4, -h / 2, w + 8, 26, 8, 0xd8dde0);
      g.fillStyle(0x9aa5a8, 1); g.fillRoundedRect(-20, -h / 2 + 34, 40, 8, 4);
      led(g, w / 2 - 18, -h / 2 + 52, !fixed, C.standby);
      // EMPTY label so unplugging is clearly fair
      const t = obj.scene.add.text(0, 10, 'EMPTY', {
        fontFamily: EE.FONT, fontSize: '20px', fontStyle: 'bold', color: '#8a9aa0'
      }).setOrigin(0.5);
      obj.fx.add(t);
      if (!fixed) steam(g, 0, -h / 2 - 6, 0xbfe3ea, 0.6);
    },

    shower(obj, g, d, s) {
      const fixed = s === 'fixed';
      const w = d.w;
      // tray + glass
      rr(g, -w / 2, d.h / 2 - 26, w, 26, 8, 0xd8e2e6);
      g.lineStyle(4, 0xbfe3ea, 0.8);
      g.beginPath(); g.moveTo(w / 2 - 6, -d.h / 2 + 20); g.lineTo(w / 2 - 6, d.h / 2 - 26); g.strokePath();
      // pipe + head
      g.lineStyle(6, 0x9aa5a8, 1);
      g.beginPath(); g.moveTo(-w / 2 + 16, d.h / 2 - 30); g.lineTo(-w / 2 + 16, -d.h / 2 + 16); g.lineTo(-10, -d.h / 2 + 16); g.strokePath();
      g.fillStyle(0x9aa5a8, 1); g.fillRoundedRect(-34, -d.h / 2 + 12, 52, 14, 7);
      if (!fixed) {
        g.lineStyle(4, 0x6fc2d8, 0.85);
        for (let i = 0; i < 5; i++) {
          const x = -28 + i * 10;
          g.beginPath(); g.moveTo(x, -d.h / 2 + 30); g.lineTo(x - 4, d.h / 2 - 40); g.strokePath();
        }
        glow(g, -8, 0, 40, 0xbfe3ea, 0.4);
        // steam wisps
        steam(g, 30, -20, 0xffffff, 0.5);
      } else {
        // one last drop
        g.fillStyle(0x6fc2d8, 1); g.fillCircle(-8, -d.h / 2 + 40, 5);
      }
    },

    fan(obj, g, d, s) {
      const fixed = s === 'fixed';
      rr(g, -d.w / 2, -d.h / 2, d.w, d.h, 12, 0xe8ecef);
      g.lineStyle(3, 0xb8c2c8, 1); g.strokeRoundedRect(-d.w / 2, -d.h / 2, d.w, d.h, 12);
      g.fillStyle(0x39505c, 1); g.fillCircle(0, 0, d.w * 0.36);
      const blades = obj.scene.add.graphics();
      blades.fillStyle(0xd8dde0, 1);
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        blades.fillEllipse(Math.cos(a) * 16, Math.sin(a) * 16, 30, 12);
      }
      blades.fillStyle(0x9aa5a8, 1); blades.fillCircle(0, 0, 7);
      obj.fx.add(blades);
      if (!fixed) {
        obj._fanTween = obj.scene.tweens.add({
          targets: blades, angle: 360, duration: 700, repeat: -1
        });
      }
      g.lineStyle(3, 0xb8c2c8, 1);
      g.strokeCircle(0, 0, d.w * 0.36);
    },

    radiator(obj, g, d, s) {
      const on = s === 'wasting';
      const w = d.w, h = d.h;
      for (let i = 0; i < 5; i++) {
        rr(g, -w / 2 + i * (w / 5) + 3, -h / 2 + 14, w / 5 - 6, h - 24, 8, on ? 0xf4c99a : 0xd8dde0);
      }
      g.fillStyle(0x9aa5a8, 1);
      g.fillRoundedRect(-w / 2, -h / 2 + 6, w, 10, 5);
      g.fillRoundedRect(-w / 2, h / 2 - 14, w, 10, 5);
      if (on) {
        steam(g, 0, -h / 2 - 2, C.coral, 0.7);
        glow(g, 0, 0, 40, 0xf4c99a, 0.5);
      }
    },

    straightener(obj, g, d, s) {
      const on = s === 'wasting';
      // counter edge
      g.fillStyle(0xd9cba4, 1); g.fillRoundedRect(-d.w / 2, 16, d.w, 14, 6);
      g.fillStyle(on ? 0xe76f51 : 0x8a9aa0, 1);
      g.fillRoundedRect(-40, -14, 80, 16, 8);
      g.fillRoundedRect(-40, 2, 80, 12, 6);
      g.fillStyle(0x2b3a42, 1); g.fillRoundedRect(30, -18, 22, 34, 8);
      if (on) {
        glow(g, -10, 0, 34, 0xffb066, 0.8);
        steam(g, -20, -22, C.coral, 0.7);
      }
    },

    router(obj, g, d, s) {
      rr(g, -d.w / 2, -6, d.w, 34, 10, 0x37474f);
      g.lineStyle(4, 0x37474f, 1);
      g.beginPath(); g.moveTo(-d.w / 4, -6); g.lineTo(-d.w / 4 - 6, -34); g.strokePath();
      g.beginPath(); g.moveTo(d.w / 4, -6); g.lineTo(d.w / 4 + 6, -34); g.strokePath();
      led(g, -12, 10, true, C.good);
      led(g, 2, 10, true, C.good);
      led(g, 16, 10, true, C.gold);
    },

    fishTank(obj, g, d, s) {
      const w = d.w, h = d.h;
      rr(g, -w / 2, -h / 2, w, h, 8, 0x9fd0dd, 0.85);
      g.lineStyle(4, 0x5c8a99, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 8);
      g.fillStyle(0xd9c58a, 1); g.fillRoundedRect(-w / 2 + 4, h / 2 - 16, w - 8, 12, 5);
      // fish
      g.fillStyle(C.coral, 1); g.fillEllipse(-10, -4, 26, 14);
      g.fillTriangle(2, -4, 16, -12, 16, 4);
      g.fillStyle(0x2b3a42, 1); g.fillCircle(-17, -6, 2.4);
      // bubbles from pump
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(w / 2 - 16, -h / 2 + 18, 4);
      g.fillCircle(w / 2 - 22, -h / 2 + 32, 3);
      g.fillCircle(w / 2 - 14, -h / 2 + 44, 2.5);
      rr(g, w / 2 - 22, h / 2 - 26, 16, 12, 4, 0x5c6f78);
    },

    nightLight(obj, g, d, s) {
      rr(g, -16, -20, 32, 36, 10, 0xf3ead2);
      g.fillStyle(C.glow, 1); g.fillCircle(0, -6, 10);
      glow(g, 0, -6, 26, C.glow, 0.8);
      g.fillStyle(0x9aa5a8, 1);
      g.fillRect(-8, 16, 5, 8); g.fillRect(3, 16, 5, 8);
    },

    radio(obj, g, d, s) {
      const on = s === 'wasting';
      rr(g, -d.w / 2, -d.h / 2 + 8, d.w, d.h - 8, 12, 0xe76f51);
      g.fillStyle(0xc5573c, 1); g.fillCircle(-d.w / 5, 6, d.h * 0.26);
      g.fillStyle(0xfdf6e3, 1); g.fillCircle(-d.w / 5, 6, d.h * 0.18);
      g.fillStyle(0xfdf6e3, 1); g.fillRoundedRect(d.w / 8, -d.h / 2 + 18, d.w / 3, 14, 6);
      g.fillStyle(0x2b3a42, 1); g.fillCircle(d.w / 4, 14, 8);
      g.lineStyle(3, 0x5c6f78, 1);
      g.beginPath(); g.moveTo(d.w / 3, -d.h / 2 + 8); g.lineTo(d.w / 2 + 6, -d.h / 2 - 16); g.strokePath();
      if (on) {
        // music notes
        g.fillStyle(C.ink, 1);
        g.fillCircle(d.w / 2 + 12, -d.h / 2 - 6, 5);
        g.fillRect(d.w / 2 + 15, -d.h / 2 - 26, 3, 20);
        g.fillCircle(d.w / 2 + 28, -d.h / 2 - 16, 4);
        g.fillRect(d.w / 2 + 30, -d.h / 2 - 34, 3, 18);
      }
    }
  };

  EE.WasteObject = WasteObject;
})();