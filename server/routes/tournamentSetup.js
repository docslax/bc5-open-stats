const express = require('express');
const { TournamentYear, Location, Team, TournamentBowler, Bowler, LaneDrawSlot } = require('../database');

const router = express.Router();

async function getTournamentOr404(tournamentYearId, res) {
  const tournament = await TournamentYear.findByPk(tournamentYearId);
  if (!tournament) {
    res.status(404).json({ error: 'Tournament not found' });
    return null;
  }

  return tournament;
}

function parseTournamentYearId(rawValue) {
  const tournamentYearId = Number(rawValue);
  if (!Number.isInteger(tournamentYearId) || tournamentYearId <= 0) {
    return null;
  }

  return tournamentYearId;
}

function normalizeDivision(value) {
  return String(value || '').trim();
}

function requireUnlockedTournament(tournament, res) {
  if (!tournament.isLocked) {
    return true;
  }

  res.status(423).json({ error: 'Tournament is locked and read-only.' });
  return false;
}

router.get('/api/tournaments', async (req, res) => {
  try {
    const tournaments = await TournamentYear.findAll({
      include: [Location, Team],
      order: [
        ['startDate', 'DESC'],
        ['name', 'ASC'],
      ],
    });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tournaments', async (req, res) => {
  try {
    const { name, startDate, endDate, locations = [] } = req.body;
    if (!String(name || '').trim()) {
      return res.status(400).json({ error: 'Tournament name is required.' });
    }

    const tournament = await TournamentYear.create({
      name,
      startDate,
      endDate,
      status: 'draft',
    });

    if (Array.isArray(locations) && locations.length) {
      await Location.bulkCreate(locations.map((item) => ({ ...item, tournamentYearId: tournament.id })));
    }

    res.status(201).json({ tournament, locations: await tournament.getLocations() });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/api/tournaments/:id', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const { name, startDate, endDate, status } = req.body;
    await tournament.update({
      name: name === undefined ? tournament.name : name,
      startDate: startDate === undefined ? tournament.startDate : startDate,
      endDate: endDate === undefined ? tournament.endDate : endDate,
      status: status === undefined ? tournament.status : status,
    });

    res.json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/api/tournaments/:id/lock', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;

    if (tournament.isLocked) {
      return res.status(409).json({ error: 'Tournament is already locked.' });
    }

    await tournament.update({ isLocked: true });
    res.json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/api/tournaments/:id/setup', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await TournamentYear.findByPk(tournamentYearId, {
      include: [Location],
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const teams = await Team.findAll({
      where: { tournamentYearId },
      order: [
        ['division', 'ASC'],
        ['zone', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    const roster = await TournamentBowler.findAll({
      where: { tournamentYearId },
      include: [
        {
          model: Bowler,
          attributes: ['bowlerId', 'name', 'category', 'categoryCode', 'qualifier', 'isCoach'],
        },
        {
          model: Team,
          attributes: ['id', 'name', 'division', 'zone'],
        },
      ],
      order: [
        ['division', 'ASC'],
        ['zone', 'ASC'],
        ['role', 'ASC'],
        ['bowlerId', 'ASC'],
      ],
    });

    const drawSlots = await LaneDrawSlot.findAll({
      where: { tournamentYearId },
      include: [
        {
          model: Team,
          as: 'sideATeam',
          attributes: ['id', 'name', 'division', 'zone'],
        },
        {
          model: Team,
          as: 'sideBTeam',
          attributes: ['id', 'name', 'division', 'zone'],
        },
        { model: Bowler, as: 'sideABowler', attributes: ['bowlerId', 'name'] },
        { model: Bowler, as: 'sideBBowler', attributes: ['bowlerId', 'name'] },
      ],
      order: [
        ['division', 'ASC'],
        ['blockCode', 'ASC'],
        ['lane', 'ASC'],
      ],
    });

    res.json({ tournament, teams, roster, drawSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/bowlers', async (req, res) => {
  try {
    const bowlers = await Bowler.findAll({
      attributes: [
        'id',
        'bowlerId',
        'name',
        'zone',
        'categoryCode',
        'category',
        'qualifier',
        'isCoach',
        'createdAt',
        'updatedAt',
      ],
      order: [['name', 'ASC']],
      limit: 500,
    });
    res.json(bowlers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/bowlers', async (req, res) => {
  try {
    const {
      bowlerId,
      name,
      zone = 0,
      categoryCode = 0,
      category = 'Unknown',
      qualifier = 0,
      isCoach = false,
    } = req.body;

    if (!Number.isInteger(Number(bowlerId))) {
      return res.status(400).json({ error: 'bowlerId is required and must be numeric.' });
    }

    if (!String(name || '').trim()) {
      return res.status(400).json({ error: 'Bowler name is required.' });
    }

    const [bowler, created] = await Bowler.findOrCreate({
      where: { bowlerId: Number(bowlerId) },
      defaults: {
        bowlerId: Number(bowlerId),
        name: String(name).trim(),
        zone: Number(zone) || 0,
        categoryCode: Number(categoryCode) || 0,
        category: String(category || 'Unknown').trim() || 'Unknown',
        qualifier: Number(qualifier) || 0,
        isCoach: Boolean(isCoach),
      },
    });

    if (!created) {
      await bowler.update({
        name: String(name).trim() || bowler.name,
        zone: Number(zone) || bowler.zone,
        categoryCode: Number(categoryCode) || bowler.categoryCode,
        category: String(category || '').trim() || bowler.category,
        qualifier: Number(qualifier),
        isCoach: Boolean(isCoach),
      });
    }

    res.status(created ? 201 : 200).json(bowler);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/api/tournaments/:id/teams', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    const division = normalizeDivision(req.query.division);
    const where = { tournamentYearId };
    if (division) where.division = division;

    const teams = await Team.findAll({
      where,
      order: [
        ['division', 'ASC'],
        ['zone', 'ASC'],
        ['name', 'ASC'],
      ],
    });

    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tournaments/:id/teams', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const { zone, division, name, coachBowlerId } = req.body;
    if (!String(name || '').trim() || !normalizeDivision(division) || !Number.isInteger(Number(zone))) {
      return res.status(400).json({ error: 'zone, division, and name are required.' });
    }

    if (coachBowlerId) {
      const coach = await Bowler.findOne({
        where: { bowlerId: Number(coachBowlerId) },
      });
      if (!coach) {
        return res.status(400).json({
          error: 'coachBowlerId does not reference an existing bowler.',
        });
      }
    }

    const [team, created] = await Team.findOrCreate({
      where: {
        tournamentYearId,
        zone: Number(zone),
        division: normalizeDivision(division),
        name: String(name).trim(),
      },
      defaults: {
        tournamentYearId,
        zone: Number(zone),
        division: normalizeDivision(division),
        name: String(name).trim(),
        coachBowlerId: coachBowlerId ? Number(coachBowlerId) : null,
      },
    });

    if (!created) {
      await team.update({
        coachBowlerId: coachBowlerId ? Number(coachBowlerId) : null,
      });
    }

    res.status(created ? 201 : 200).json(team);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/api/tournaments/:id/roster', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    const division = normalizeDivision(req.query.division);
    const where = { tournamentYearId };
    if (division) where.division = division;

    const roster = await TournamentBowler.findAll({
      where,
      include: [
        {
          model: Bowler,
          attributes: ['bowlerId', 'name', 'category', 'categoryCode', 'qualifier', 'isCoach'],
        },
        {
          model: Team,
          attributes: ['id', 'name', 'division', 'zone'],
        },
      ],
      order: [
        ['division', 'ASC'],
        ['zone', 'ASC'],
        ['role', 'ASC'],
        ['bowlerId', 'ASC'],
      ],
    });

    res.json(roster);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tournaments/:id/roster', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const { bowlerId, teamId = null, zone, division, role = 'player', isSinglesEligible = false } = req.body;

    const normalizedDivision = normalizeDivision(division);

    if (!Number.isInteger(Number(bowlerId))) {
      return res.status(400).json({ error: 'bowlerId is required and must be numeric.' });
    }

    if (!Number.isInteger(Number(zone))) {
      return res.status(400).json({ error: 'zone is required and must be numeric.' });
    }

    if (!normalizedDivision) {
      return res.status(400).json({ error: 'division is required.' });
    }

    const bowler = await Bowler.findOne({
      where: { bowlerId: Number(bowlerId) },
    });
    if (!bowler) {
      return res.status(404).json({ error: 'Bowler not found' });
    }

    let team = null;
    if (teamId !== null && teamId !== undefined) {
      team = await Team.findOne({
        where: { id: Number(teamId), tournamentYearId },
      });
      if (!team) {
        return res.status(400).json({ error: 'teamId must reference a team in this tournament.' });
      }

      if (normalizeDivision(team.division) !== normalizedDivision) {
        return res.status(400).json({ error: 'division must match the selected team division.' });
      }
    }

    const existingMembership = await TournamentBowler.findOne({
      where: {
        tournamentYearId,
        bowlerId: Number(bowlerId),
        division: normalizedDivision,
      },
    });

    let membership;
    if (existingMembership) {
      membership = await existingMembership.update({
        teamId: team ? team.id : null,
        zone: Number(zone),
        role: String(role || 'player').trim() || 'player',
        isSinglesEligible: Boolean(isSinglesEligible),
      });
    } else {
      membership = await TournamentBowler.create({
        tournamentYearId,
        teamId: team ? team.id : null,
        bowlerId: Number(bowlerId),
        zone: Number(zone),
        division: normalizedDivision,
        role: String(role || 'player').trim() || 'player',
        isSinglesEligible: Boolean(isSinglesEligible),
      });
    }

    const hydrated = await TournamentBowler.findByPk(membership.id, {
      include: [
        { model: Bowler, attributes: ['bowlerId', 'name'] },
        { model: Team, attributes: ['id', 'name', 'division', 'zone'] },
      ],
    });

    res.status(existingMembership ? 200 : 201).json(hydrated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/api/tournaments/:id/draw-slots', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    const division = normalizeDivision(req.query.division);
    const where = { tournamentYearId };
    if (division) where.division = division;

    const drawSlots = await LaneDrawSlot.findAll({
      where,
      include: [
        {
          model: Team,
          as: 'sideATeam',
          attributes: ['id', 'name', 'division', 'zone'],
        },
        {
          model: Team,
          as: 'sideBTeam',
          attributes: ['id', 'name', 'division', 'zone'],
        },
        { model: Bowler, as: 'sideABowler', attributes: ['bowlerId', 'name'] },
        { model: Bowler, as: 'sideBBowler', attributes: ['bowlerId', 'name'] },
      ],
      order: [
        ['division', 'ASC'],
        ['blockCode', 'ASC'],
        ['lane', 'ASC'],
      ],
    });

    res.json(drawSlots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function upsertDrawSlot(tournamentYearId, payload) {
  const division = normalizeDivision(payload.division);
  if (!division) {
    throw new Error('division is required.');
  }

  const blockCode = String(payload.blockCode || '').trim();
  if (!blockCode) {
    throw new Error('blockCode is required.');
  }

  const lane = Number(payload.lane);
  if (!Number.isInteger(lane) || lane <= 0) {
    throw new Error('lane is required and must be a positive integer.');
  }

  const eventType = String(payload.eventType || 'team')
    .trim()
    .toLowerCase();
  if (!['team', 'singles'].includes(eventType)) {
    throw new Error("eventType must be either 'team' or 'singles'.");
  }

  const existing = await LaneDrawSlot.findOne({
    where: { tournamentYearId, division, blockCode, lane },
  });

  const shape = {
    tournamentYearId,
    division,
    eventType,
    blockCode,
    slotCode: payload.slotCode ? String(payload.slotCode).trim() : null,
    lane,
    sideATeamId: payload.sideATeamId ? Number(payload.sideATeamId) : null,
    sideABowlerId: payload.sideABowlerId ? Number(payload.sideABowlerId) : null,
    sideBTeamId: payload.sideBTeamId ? Number(payload.sideBTeamId) : null,
    sideBBowlerId: payload.sideBBowlerId ? Number(payload.sideBBowlerId) : null,
    scheduledAt: payload.scheduledAt || null,
    status: String(payload.status || 'draft').trim() || 'draft',
  };

  if (existing) {
    return existing.update(shape);
  }

  return LaneDrawSlot.create(shape);
}

router.post('/api/tournaments/:id/draw-slots', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const slot = await upsertDrawSlot(tournamentYearId, req.body || {});
    const hydrated = await LaneDrawSlot.findByPk(slot.id, {
      include: [
        {
          model: Team,
          as: 'sideATeam',
          attributes: ['id', 'name', 'division', 'zone'],
        },
        {
          model: Team,
          as: 'sideBTeam',
          attributes: ['id', 'name', 'division', 'zone'],
        },
        { model: Bowler, as: 'sideABowler', attributes: ['bowlerId', 'name'] },
        { model: Bowler, as: 'sideBBowler', attributes: ['bowlerId', 'name'] },
      ],
    });
    res.status(201).json(hydrated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/api/tournaments/:id/draw-slots/bulk', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];
    if (!slots.length) {
      return res.status(400).json({ error: 'slots array is required.' });
    }

    const results = [];
    for (const slotPayload of slots) {
      const slot = await upsertDrawSlot(tournamentYearId, slotPayload);
      results.push(slot);
    }

    res.status(201).json({ count: results.length, slots: results });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
