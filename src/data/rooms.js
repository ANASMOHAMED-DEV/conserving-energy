// Room definitions — the game's content backbone.
// Each candidate: fixed position (tuned against background art), watts (estimate),
// action type, fact key, and optional choice/twostep puzzle data.
//
// actionType:
//   'toggle'  — one click fixes (lights, fans)
//   'unplug'  — one click fixes (standby devices, chargers)
//   'close'   — one click fixes (doors, windows)
//   'choice'  — dialog with options; correct one fixes, wrong ones teach
//   'twostep' — two dialog-driven steps before the fix lands
//   kind: 'donttouch' — investigating it is a positive "learning moment"

EE.ROOM_ORDER = ['living', 'kitchen', 'bedroom', 'bathroom', 'laundry'];

EE.ROOMS = {
  // ------------------------------------------------------------------
  living: {
    name: 'Living Room',
    bg: 'bg-living',
    activeCount: 4,
    mapPos: { x: 330, y: 400 },
    candidates: [
      { id: 'liv-light', kind: 'waste', visual: 'light', variant: 'ceiling',
        x: 900, y: 120, w: 120, h: 100, watts: 60, actionType: 'toggle',
        name: 'Ceiling light in daylight', fact: 'daylight', tags: ['light'] },
      { id: 'liv-tv', kind: 'waste', visual: 'screen', variant: 'tv',
        x: 1010, y: 330, w: 190, h: 130, watts: 10, actionType: 'unplug',
        name: 'TV on standby', fact: 'vampire', tags: ['standby'] },
      { id: 'liv-console', kind: 'waste', visual: 'console',
        x: 1020, y: 465, w: 120, h: 70, watts: 15, actionType: 'unplug',
        name: 'Game console on standby', fact: 'powerStrip', tags: ['standby'] },
      { id: 'liv-ac', kind: 'waste', visual: 'ac',
        x: 1090, y: 120, w: 180, h: 110, watts: 1000, actionType: 'twostep',
        name: 'AC with an open window', fact: 'acWindow', tags: ['big'],
        steps: [
          { prompt: 'Brrr! The AC is running but that window is wide open — you\'re cooling the whole outdoors!',
            button: 'Close the window first', state: 'windowClosed' },
          { prompt: 'Window closed! Now the AC doesn\'t have to work so hard. Let\'s switch it to eco mode.',
            button: 'Set AC to eco mode', state: 'fixed' }
        ] },
      { id: 'liv-lamp', kind: 'waste', visual: 'light', variant: 'lamp',
        x: 430, y: 420, w: 100, h: 150, watts: 40, actionType: 'toggle',
        name: 'Lamp on with sunny curtains', fact: 'led', tags: ['light'] },
      { id: 'liv-charger', kind: 'waste', visual: 'plug',
        x: 860, y: 445, w: 80, h: 80, watts: 1, actionType: 'unplug',
        name: 'Charger with no phone', fact: 'charger', tags: ['standby'] },
      { id: 'liv-router', kind: 'donttouch', visual: 'router',
        x: 1190, y: 527, w: 90, h: 80, watts: 0,
        name: 'Wi-Fi router',
        dialog: 'Good instinct, Inspector! But the Wi-Fi router sips very little power and the whole family needs it. Leave it be!',
        fact: 'router' }
    ]
  },

  // ------------------------------------------------------------------
  kitchen: {
    name: 'Kitchen',
    bg: 'bg-kitchen',
    activeCount: 4,
    mapPos: { x: 800, y: 400 },
    candidates: [
      { id: 'kit-fridge', kind: 'waste', visual: 'fridge',
        x: 185, y: 350, w: 180, h: 300, watts: 50, actionType: 'close',
        name: 'Fridge door left ajar', fact: 'fridgeDoor', tags: [] },
      { id: 'kit-light', kind: 'waste', visual: 'light', variant: 'ceiling',
        x: 250, y: 130, w: 120, h: 100, watts: 40, actionType: 'toggle',
        name: 'Lights in an empty kitchen', fact: 'daylight', tags: ['light'] },
      { id: 'kit-dishwasher', kind: 'waste', visual: 'dishwasher',
        x: 830, y: 460, w: 150, h: 140, watts: 200, actionType: 'choice',
        name: 'Half-empty dishwasher', fact: 'dishwasher', tags: [],
        prompt: 'The dishwasher is only half full. What\'s the smart move?',
        options: [
          { label: 'Run it half-empty now', correct: false,
            explain: 'A dishwasher uses about the same power and water whether full or half. Half loads waste energy per dish!' },
          { label: 'Wait until it\'s full', correct: true,
            explain: 'Exactly! Full loads mean fewer washes — big savings over time.' },
          { label: 'Hand-wash everything instead', correct: false,
            explain: 'Surprise: a full dishwasher usually uses LESS hot water than washing by hand. Full loads win!' }
        ] },
      { id: 'kit-kettle', kind: 'waste', visual: 'kettle',
        x: 472, y: 335, w: 100, h: 110, watts: 150, actionType: 'choice',
        name: 'Overfilled kettle', fact: 'kettle', tags: [],
        prompt: 'Someone filled the kettle to the top… for one cup of tea. What now?',
        options: [
          { label: 'Boil it all anyway', correct: false,
            explain: 'That heats 5 cups of water you won\'t use. The extra heat just drifts away — wasted!' },
          { label: 'Empty it, boil one cup\'s worth', correct: true,
            explain: 'Perfect! Boiling only what you need saves energy every single tea time.' }
        ] },
      { id: 'kit-oven', kind: 'waste', visual: 'oven',
        x: 620, y: 440, w: 170, h: 160, watts: 2000, actionType: 'toggle',
        name: 'Oven left on after cooking', fact: 'oven', tags: ['big'] },
      { id: 'kit-fridgeplug', kind: 'donttouch', visual: 'plug', variant: 'fridge',
        x: 90, y: 580, w: 80, h: 80, watts: 0,
        name: 'Fridge power plug',
        dialog: 'Whoa, careful! The fridge MUST stay plugged in or the food spoils. To save energy here, just keep its door closed.',
        fact: 'fridgePlug' }
    ]
  },

  // ------------------------------------------------------------------
  bedroom: {
    name: 'Bedroom',
    bg: 'bg-bedroom',
    activeCount: 4,
    mapPos: { x: 330, y: 200 },
    candidates: [
      { id: 'bed-light', kind: 'waste', visual: 'light', variant: 'ceiling',
        x: 450, y: 120, w: 120, h: 100, watts: 40, actionType: 'toggle',
        name: 'Bedroom light on', fact: 'daylight', tags: ['light'] },
      { id: 'bed-computer', kind: 'waste', visual: 'screen', variant: 'monitor',
        x: 1010, y: 370, w: 170, h: 140, watts: 80, actionType: 'twostep',
        name: 'Computer left running', fact: 'shutdown', tags: ['standby'],
        steps: [
          { prompt: 'This computer is still running with a game paused. If you switch it off now, the progress is lost!',
            button: 'Save the game first', state: 'saved' },
          { prompt: 'Progress saved! Sleep mode still sips power, so let\'s shut it down all the way.',
            button: 'Shut down fully', state: 'fixed' }
        ] },
      { id: 'bed-charger', kind: 'waste', visual: 'plug',
        x: 855, y: 465, w: 80, h: 80, watts: 1, actionType: 'unplug',
        name: 'Charger with no phone', fact: 'charger', tags: ['standby'] },
      { id: 'bed-tv', kind: 'waste', visual: 'screen', variant: 'tv',
        x: 220, y: 310, w: 180, h: 130, watts: 60, actionType: 'toggle',
        name: 'TV on, nobody watching', fact: 'bigWins', tags: [] },
      { id: 'bed-sconce', kind: 'waste', visual: 'light', variant: 'wall',
        x: 630, y: 280, w: 90, h: 90, watts: 25, actionType: 'toggle',
        name: 'Reading light left on', fact: 'led', tags: ['light'] },
      { id: 'bed-fishtank', kind: 'donttouch', visual: 'fishTank',
        x: 430, y: 450, w: 140, h: 110, watts: 0,
        name: 'Fish tank pump',
        dialog: 'Great question! The pump bubbles oxygen into the water — the fish need it to breathe. This one stays on!',
        fact: 'fishTank' }
    ]
  },

  // ------------------------------------------------------------------
  bathroom: {
    name: 'Bathroom',
    bg: 'bg-bathroom',
    activeCount: 4,
    mapPos: { x: 800, y: 200 },
    candidates: [
      { id: 'bath-light', kind: 'waste', visual: 'light', variant: 'ceiling',
        x: 350, y: 120, w: 120, h: 100, watts: 30, actionType: 'toggle',
        name: 'Bathroom light on', fact: 'daylight', tags: ['light'] },
      { id: 'bath-fan', kind: 'waste', visual: 'fan',
        x: 1050, y: 110, w: 110, h: 110, watts: 30, actionType: 'toggle',
        name: 'Exhaust fan still running', fact: 'fan', tags: [] },
      { id: 'bath-shower', kind: 'waste', visual: 'shower',
        x: 250, y: 340, w: 190, h: 300, watts: 500, actionType: 'choice',
        name: 'Shower running and running', fact: 'shower', tags: ['big'],
        prompt: 'The shower has been running for 20 minutes — heating all that water takes lots of energy!',
        options: [
          { label: 'Turn it off + set a 5-minute timer next time', correct: true,
            explain: 'Champion move! Shorter showers save the energy used to heat water. 5 minutes is plenty.' },
          { label: 'Leave it — hot water is free, right?', correct: false,
            explain: 'Not quite! Heating water is one of the biggest energy costs in a home. Every extra minute counts.' }
        ] },
      { id: 'bath-radiator', kind: 'waste', visual: 'radiator',
        x: 1050, y: 460, w: 160, h: 130, watts: 150, actionType: 'toggle',
        name: 'Towel radiator on in summer', fact: 'radiator', tags: [] },
      { id: 'bath-straightener', kind: 'waste', visual: 'straightener',
        x: 780, y: 405, w: 110, h: 80, watts: 60, actionType: 'unplug',
        name: 'Hair straightener left hot', fact: 'straightener', tags: [] },
      { id: 'bath-nightlight', kind: 'donttouch', visual: 'nightLight',
        x: 1160, y: 610, w: 80, h: 80, watts: 0,
        name: 'Hallway night-light',
        dialog: 'Smart thinking! But this night-light uses tiny power and keeps the hallway safe at night. Safe beats saved!',
        fact: 'nightLight' }
    ]
  },

  // ------------------------------------------------------------------
  laundry: {
    name: 'Laundry Room',
    bg: 'bg-laundry',
    activeCount: 4,
    mapPos: { x: 1060, y: 400 },
    candidates: [
      { id: 'lau-washer', kind: 'waste', visual: 'washer',
        x: 350, y: 440, w: 160, h: 170, watts: 150, actionType: 'choice',
        name: 'Half load on hot wash', fact: 'coldWash', tags: [],
        prompt: 'The washer is half full of lightly-dirty clothes, set to HOT. Double waste! Pick the fix:',
        options: [
          { label: 'Wait for a full load + cold wash', correct: true,
            explain: 'Double win! Full loads mean fewer washes, and cold water cleans everyday clothes fine — heating water is the expensive part.' },
          { label: 'Run it now, hot is more hygienic', correct: false,
            explain: 'For lightly-dirty clothes, cold washes work great. Hot water uses most of the washer\'s energy!' },
          { label: 'Add more detergent and run half', correct: false,
            explain: 'Extra soap doesn\'t save energy — and half loads still use nearly full power. Wait for full + cold!' }
        ] },
      { id: 'lau-dryer', kind: 'waste', visual: 'dryer',
        x: 610, y: 440, w: 160, h: 170, watts: 300, actionType: 'choice',
        name: 'Dryer running on a sunny day', fact: 'clothesline', tags: [],
        prompt: 'The dryer is tumbling away… and look outside — bright sunshine and a breeze!',
        options: [
          { label: 'Hang clothes on the line instead', correct: true,
            explain: 'Sun and wind dry clothes for FREE! Dryers are one of the hungriest appliances in the house.' },
          { label: 'Keep the dryer — sun is slow', correct: false,
            explain: 'The line is slower but costs zero electricity. On sunny days, it\'s the easy win!' }
        ] },
      { id: 'lau-freezer', kind: 'waste', visual: 'freezer',
        x: 1010, y: 410, w: 180, h: 210, watts: 150, actionType: 'unplug',
        name: 'Empty spare freezer running', fact: 'freezer', tags: ['standby'] },
      { id: 'lau-light', kind: 'waste', visual: 'light', variant: 'ceiling',
        x: 450, y: 120, w: 120, h: 100, watts: 60, actionType: 'toggle',
        name: 'Laundry light on', fact: 'daylight', tags: ['light'] },
      { id: 'lau-radio', kind: 'waste', visual: 'radio',
        x: 180, y: 300, w: 110, h: 80, watts: 10, actionType: 'toggle',
        name: 'Radio playing to an empty room', fact: 'bigWins', tags: [] }
    ]
  }
};