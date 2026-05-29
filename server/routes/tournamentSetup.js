const express = require("express");
const { TournamentYear, Location, Team, TournamentBowler, Bowler } = require("../database");

const router = express.Router();

router.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await TournamentYear.findAll({ include: [Location, Team] });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/api/tournaments", async (req, res) => {
  try {
    const { name, startDate, endDate, locations = [] } = req.body;
    const tournament = await TournamentYear.create({ name, startDate, endDate, status: "draft" });

    if (Array.isArray(locations) && locations.length) {
      await Location.bulkCreate(locations.map((item) => ({ ...item, tournamentYearId: tournament.id })));
    }

    res.status(201).json({ tournament, locations: await tournament.getLocations() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/tournaments/:id/teams", async (req, res) => {
  try {
    const tournamentYearId = Number(req.params.id);
    const { zone, division, name, coachBowlerId } = req.body;

    const team = await Team.create({ tournamentYearId, zone, division, name, coachBowlerId });
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/api/tournaments/:id/roster", async (req, res) => {
  try {
    const tournamentYearId = Number(req.params.id);
    const { bowlerId, role = "player", isSinglesEligible = false } = req.body;

    const bowler = await Bowler.findOne({ where: { bowlerId } });
    if (!bowler) {
      return res.status(404).json({ error: "Bowler not found" });
    }

    const membership = await TournamentBowler.create({ tournamentYearId, bowlerId, role, isSinglesEligible });
    res.status(201).json({ membership, bowler });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
