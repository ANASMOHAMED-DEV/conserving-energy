// WebAudio-synthesized sound effects — zero audio files, zero CORS issues.
// AudioContext is created ONLY on the first user gesture (autoplay policy).
// Every sound is duplicated visually (icons/text), so mute loses nothing.
(function () {
  let ctx = null;
  let muted = false;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, when, vol, glideTo) {
    const c = ensureCtx();
    if (!c || muted) return;
    const t0 = c.currentTime + (when || 0);
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  const Sfx = {
    unlock() { ensureCtx(); },   // call from first pointerdown
    setMuted(m) { muted = !!m; },
    isMuted() { return muted; },

    click()   { tone(600, 0.08, 'sine', 0, 0.1); },
    hover()   { tone(800, 0.04, 'sine', 0, 0.04); },
    fix()     { tone(523, 0.12, 'sine', 0, 0.14); tone(784, 0.2, 'sine', 0.09, 0.16); },
    learn()   { tone(392, 0.15, 'triangle', 0, 0.1); tone(440, 0.18, 'triangle', 0.13, 0.1); },
    badge()   { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'sine', i * 0.09, 0.13)); },
    streak()  { tone(440, 0.25, 'sine', 0, 0.1, 880); },
    hint()    { tone(988, 0.1, 'sine', 0, 0.08); tone(1319, 0.15, 'sine', 0.08, 0.08); },
    roomClear() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.1, 0.12)); },
    report()  { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.25, 'sine', i * 0.12, 0.12)); }
  };

  EE.Sfx = Sfx;
})();