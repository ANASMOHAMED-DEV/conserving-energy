// Pure scoring functions — unit-testable via browser_evaluate.
(function () {
  const ScoreSystem = {
    // Base points + watt bonus; streak >= 3 gets the 1.5x Hot Streak multiplier.
    fixPoints(watts, streak) {
      const base = 50 + Math.round(Math.min(watts, 1000) / 10);
      const mult = streak >= 3 ? 1.5 : 1;
      return Math.round(base * mult);
    },

    // 1 star: cleared. 2: no hints. 3: no hints + at most 1 learning moment.
    stars(hintsUsed, learningCount) {
      if (hintsUsed > 0) return 1;
      return learningCount <= 1 ? 3 : 2;
    },

    // Report-card estimates (clearly labeled in the UI).
    report(run) {
      const E = EE.EST;
      const kwhYear = run.watts * E.hoursPerDay * E.daysPerYear / 1000;
      const co2Kg = kwhYear * E.co2PerKwh;
      return {
        watts: run.watts,
        score: run.score,
        kwhYear: Math.round(kwhYear),
        co2Kg: Math.round(co2Kg),
        phoneCharges: Math.round(kwhYear * 1000 / E.phoneChargeWh),
        tvHours: Math.round(kwhYear * 1000 / E.ledTvW),
        seedlings: Math.max(1, Math.round(co2Kg / 10)) // ~10 kg CO2 per seedling grown, rough
      };
    },

    evaluateBadges(run, save) {
      const earned = [];
      // Room badges for cleared rooms.
      EE.ROOM_ORDER.forEach(rid => {
        if (run.rooms[rid].cleared) earned.push(rid);
      });
      EE.BADGES.forEach(b => {
        if (b.check && b.check(run)) earned.push(b.id);
      });
      // Return only ones not already in the profile.
      const have = (save && save.badges) || [];
      return earned.filter(id => !have.includes(id));
    }
  };

  EE.ScoreSystem = ScoreSystem;
})();