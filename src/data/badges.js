// Badge definitions. `check(run, save)` returns true when earned.
// Room badges are awarded for clearing each room; special badges for feats.
EE.BADGES = [
  { id: 'living',  name: 'Lounge Legend',    icon: 'sofa',  desc: 'Inspect the whole living room.' },
  { id: 'kitchen', name: 'Kitchen Keeper',   icon: 'pot',   desc: 'Inspect the whole kitchen.' },
  { id: 'bedroom', name: 'Bedroom Boss',     icon: 'bed',   desc: 'Inspect the whole bedroom.' },
  { id: 'bathroom',name: 'Bathroom Buddy',   icon: 'drop',  desc: 'Inspect the whole bathroom.' },
  { id: 'laundry', name: 'Laundry Leader',   icon: 'shirt', desc: 'Inspect the whole laundry room.' },
  { id: 'vampire', name: 'Vampire Hunter',   icon: 'plug',
    desc: 'Unplug every standby device you found.',
    check(run) {
      let total = 0;
      EE.ROOM_ORDER.forEach(rid => {
        const rs = run.rooms[rid];
        rs.activeIds.forEach(id => {
          const def = EE.GameState.objectDef(rid, id);
          if (def && def.tags && def.tags.includes('standby')) total++;
        });
      });
      return total > 0 && run.standbyFixed >= total;
    } },
  { id: 'wizard',  name: 'Watt Wizard',      icon: 'bolt',
    desc: 'Save 1,000+ watts in one inspection.',
    check(run) { return run.watts >= 1000; } },
  { id: 'perfect', name: 'Perfect Inspector',icon: 'star',
    desc: 'Earn 3 stars in every room.',
    check(run) { return EE.ROOM_ORDER.every(rid => run.rooms[rid].stars === 3); } },
  { id: 'safety',  name: 'Safety Star',      icon: 'shield',
    desc: 'Investigate every "keep it on" object.',
    check(run) {
      let total = 0, found = 0;
      EE.ROOM_ORDER.forEach(rid => {
        EE.ROOMS[rid].candidates.forEach(c => {
          if (c.kind === 'donttouch') {
            total++;
            if (run.rooms[rid].learningIds.includes(c.id)) found++;
          }
        });
      });
      return total > 0 && found >= total;
    } },
  { id: 'streak',  name: 'Hot Streak',       icon: 'flame',
    desc: 'Fix 5 things in a row without a hint.',
    check(run) { return run.maxStreak >= 5; } }
];

EE.badgeById = function (id) { return EE.BADGES.find(b => b.id === id); };