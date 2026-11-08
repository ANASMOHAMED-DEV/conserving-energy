// Watt Watchers — global constants. Classic script; everything hangs off window.EE.
window.EE = window.EE || {};

EE.VERSION = '1.0.0';
EE.W = 1280;
EE.H = 720;

// Warm teal/coral/cream palette. Feedback never relies on color alone:
// every state also carries an icon + text label.
EE.COLORS = {
  bgDark:    0x16323a,
  bgPanel:   0x1f4450,
  panel:     0xfdf6e3,
  panelEdge: 0xe8d9b5,
  ink:       0x2b3a42,
  inkSoft:   0x5c6f78,
  teal:      0x2a9d8f,
  tealDark:  0x1f7a70,
  coral:     0xe76f51,
  coralDark: 0xc5573c,
  gold:      0xffd166,
  goldDark:  0xd9a83f,
  sky:       0x8fd6c7,
  white:     0xffffff,
  danger:    0xd64545,   // used with a warning icon, never alone
  good:      0x2a9d8f,   // used with a check icon, never alone
  glow:      0xffe9a8,
  standby:   0xe63946
};

EE.CSS = {
  ink: '#2b3a42',
  inkSoft: '#5c6f78',
  panel: '#fdf6e3',
  teal: '#2a9d8f',
  coral: '#e76f51',
  gold: '#ffd166',
  white: '#ffffff',
  sky: '#8fd6c7'
};

EE.FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

// Minimum interactive target (design px). Generous for kids + touch.
EE.MIN_HIT = 64;

// Report-card estimate assumptions (labeled as estimates in-game).
EE.EST = {
  hoursPerDay: 4,        // assume the waste would run ~4 h/day
  daysPerYear: 365,
  co2PerKwh: 0.4,        // kg CO2 per kWh, rough grid average
  phoneChargeWh: 15,     // Wh per full smartphone charge
  ledTvW: 60             // W for an LED TV, for "hours of TV" equivalents
};

EE.SAVE_KEY = 'watt-watchers-save-v1';

// URL params: ?seed=42 (deterministic runs), ?hitboxes=1 (debug overlay),
// ?room=living (jump straight to a room), ?mute=1, ?panel=report (debug).
EE.params = new URLSearchParams(location.search);
EE.seedParam = EE.params.get('seed');
EE.hitboxes = EE.params.get('hitboxes') === '1';
EE.roomParam = EE.params.get('room');