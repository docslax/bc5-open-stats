const express = require('express');
const { TournamentYear, Location, TournamentBowler, LaneDrawSlot } = require('../database');

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

function normalizeRosterTeam(value) {
  return normalizeDivision(value);
}

function serializeRosterEntry(entry) {
  if (!entry) {
    return entry;
  }

  const payload = typeof entry.get === 'function' ? entry.get({ plain: true }) : entry;
  return {
    ...payload,
    team: payload.team || payload.division,
    teamId: null,
    c5Number: payload.c5Number || null,
    name: payload.name || '',
    isCoach: Boolean(payload.isCoach),
  };
}

function createRosterLookup(roster) {
  const lookup = new Map();
  for (const entry of roster) {
    const serialized = serializeRosterEntry(entry);
    lookup.set(serialized.bowlerId, {
      bowlerId: serialized.bowlerId,
      name: serialized.name || `Bowler #${serialized.bowlerId}`,
    });
  }
  return lookup;
}

function serializeDrawSlotEntry(entry, rosterLookup) {
  const payload = typeof entry.get === 'function' ? entry.get({ plain: true }) : entry;
  return {
    ...payload,
    sideABowler: payload.sideABowlerId ? rosterLookup.get(payload.sideABowlerId) || null : null,
    sideBBowler: payload.sideBBowlerId ? rosterLookup.get(payload.sideBBowlerId) || null : null,
  };
}

async function loadRosterEntries(tournamentYearId, where = { tournamentYearId }) {
  const roster = await TournamentBowler.findAll({
    where,
    order: [
      ['division', 'ASC'],
      ['zone', 'ASC'],
      ['role', 'ASC'],
      ['bowlerId', 'ASC'],
    ],
  });

  return roster.map(serializeRosterEntry);
}

async function loadDrawSlotEntries(tournamentYearId, where = { tournamentYearId }) {
  const [drawSlots, roster] = await Promise.all([
    LaneDrawSlot.findAll({
      where,
      order: [
        ['division', 'ASC'],
        ['blockCode', 'ASC'],
        ['lane', 'ASC'],
      ],
    }),
    TournamentBowler.findAll({
      where: { tournamentYearId },
      attributes: ['bowlerId', 'name', 'division', 'c5Number', 'isCoach'],
    }),
  ]);

  const rosterLookup = createRosterLookup(roster);
  return drawSlots.map((slot) => serializeDrawSlotEntry(slot, rosterLookup));
}

function normalizeLocationInput(payload) {
  return {
    name: String(payload?.name || '').trim(),
    address: payload?.address ? String(payload.address).trim() : null,
    laneCount: Number.isInteger(Number(payload?.laneCount)) ? Number(payload.laneCount) : null,
    notes: payload?.notes ? String(payload.notes).trim() : null,
  };
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
      include: [
        Location,
        { model: TournamentBowler, attributes: ['id', 'zone'] },
        { model: LaneDrawSlot, attributes: ['id'] },
      ],
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
    const { name, startDate, endDate, status = 'draft', locations = [] } = req.body;
    if (!String(name || '').trim()) {
      return res.status(400).json({ error: 'Tournament name is required.' });
    }

    const tournament = await TournamentYear.create({
      name,
      startDate,
      endDate,
      status: String(status || 'draft').trim() || 'draft',
    });

    if (Array.isArray(locations) && locations.length) {
      const normalizedLocations = locations
        .map((item) => normalizeLocationInput(item))
        .filter((item) => item.name)
        .map((item) => ({
          ...item,
          tournamentYearId: tournament.id,
        }));

      if (normalizedLocations.length) {
        await Location.bulkCreate(normalizedLocations);
      }
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

    const [roster, drawSlots] = await Promise.all([
      loadRosterEntries(tournamentYearId),
      loadDrawSlotEntries(tournamentYearId),
    ]);

    res.json({ tournament, roster, drawSlots });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tournaments/:id/locations', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const input = normalizeLocationInput(req.body || {});
    if (!input.name) {
      return res.status(400).json({ error: 'Location name is required.' });
    }

    const location = await Location.create({
      tournamentYearId,
      ...input,
    });

    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/api/tournaments/:id/locations/:locationId', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    const locationId = Number(req.params.locationId);
    if (!tournamentYearId || !Number.isInteger(locationId) || locationId <= 0) {
      return res.status(400).json({ error: 'Invalid tournament or location id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const location = await Location.findOne({ where: { id: locationId, tournamentYearId } });
    if (!location) {
      return res.status(404).json({ error: 'Location not found.' });
    }

    const input = normalizeLocationInput(req.body || {});
    if (!input.name) {
      return res.status(400).json({ error: 'Location name is required.' });
    }

    await location.update(input);
    res.json(location);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/api/tournaments/:id/locations/:locationId', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    const locationId = Number(req.params.locationId);
    if (!tournamentYearId || !Number.isInteger(locationId) || locationId <= 0) {
      return res.status(400).json({ error: 'Invalid tournament or location id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const location = await Location.findOne({ where: { id: locationId, tournamentYearId } });
    if (!location) {
      return res.status(404).json({ error: 'Location not found.' });
    }

    await location.destroy();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
    const division = normalizeRosterTeam(req.query.team ?? req.query.division);
    const where = { tournamentYearId };
    if (division) where.division = division;

    res.json(await loadRosterEntries(tournamentYearId, where));
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

    const {
      bowlerId,
      zone,
      team: rosterTeam,
      division,
      c5Number = null,
      name,
      isCoach = false,
      role = 'player',
      isSinglesEligible = false,
    } = req.body;

    const normalizedDivision = normalizeRosterTeam(rosterTeam ?? division);
    const normalizedName = String(name || '').trim();
    const normalizedRole = Boolean(isCoach) ? 'coach' : String(role || 'player').trim() || 'player';

    if (!Number.isInteger(Number(bowlerId))) {
      return res.status(400).json({ error: 'bowlerId is required and must be numeric.' });
    }

    if (!Number.isInteger(Number(zone))) {
      return res.status(400).json({ error: 'zone is required and must be numeric.' });
    }

    if (!normalizedDivision) {
      return res.status(400).json({ error: 'team is required.' });
    }

    if (!normalizedName) {
      return res.status(400).json({ error: 'name is required.' });
    }

    const normalizedBowlerId = Number(bowlerId);
    const existingMembership = await TournamentBowler.findOne({
      where: {
        tournamentYearId,
        bowlerId: normalizedBowlerId,
      },
    });

    if (existingMembership) {
      return res.status(409).json({
        error: `Bowler Id ${normalizedBowlerId} already exists in this tournament.`,
      });
    }

    const membership = await TournamentBowler.create({
      tournamentYearId,
      teamId: null,
      bowlerId: normalizedBowlerId,
      c5Number: c5Number ? String(c5Number).trim() : null,
      name: normalizedName,
      zone: Number(zone),
      division: normalizedDivision,
      isCoach: Boolean(isCoach),
      role: normalizedRole,
      isSinglesEligible: Boolean(isSinglesEligible),
    });

    const hydrated = await TournamentBowler.findByPk(membership.id);

    res.status(201).json(serializeRosterEntry(hydrated));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/api/tournaments/:id/roster/:rosterId', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    const rosterId = Number(req.params.rosterId);
    if (!tournamentYearId || !Number.isInteger(rosterId) || rosterId <= 0) {
      return res.status(400).json({ error: 'Invalid tournament or roster id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const rosterEntry = await TournamentBowler.findOne({
      where: {
        id: rosterId,
        tournamentYearId,
      },
    });

    if (!rosterEntry) {
      return res.status(404).json({ error: 'Roster entry not found.' });
    }

    await rosterEntry.destroy();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/api/tournaments/:id/roster/:rosterId', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    const rosterId = Number(req.params.rosterId);
    if (!tournamentYearId || !Number.isInteger(rosterId) || rosterId <= 0) {
      return res.status(400).json({ error: 'Invalid tournament or roster id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const rosterEntry = await TournamentBowler.findOne({
      where: {
        id: rosterId,
        tournamentYearId,
      },
    });

    if (!rosterEntry) {
      return res.status(404).json({ error: 'Roster entry not found.' });
    }

    const {
      bowlerId,
      zone,
      team: rosterTeam,
      division,
      c5Number = null,
      name,
      isCoach = false,
      role = 'player',
      isSinglesEligible = false,
    } = req.body;
    const normalizedDivision = normalizeRosterTeam(rosterTeam ?? division);
    const normalizedName = String(name || '').trim();
    const normalizedRole = Boolean(isCoach) ? 'coach' : String(role || 'player').trim() || 'player';

    if (!Number.isInteger(Number(bowlerId))) {
      return res.status(400).json({ error: 'bowlerId is required and must be numeric.' });
    }

    if (!Number.isInteger(Number(zone))) {
      return res.status(400).json({ error: 'zone is required and must be numeric.' });
    }

    if (!normalizedDivision) {
      return res.status(400).json({ error: 'team is required.' });
    }

    if (!normalizedName) {
      return res.status(400).json({ error: 'name is required.' });
    }

    const duplicateMembership = await TournamentBowler.findOne({
      where: {
        tournamentYearId,
        bowlerId: Number(bowlerId),
      },
    });

    if (duplicateMembership && duplicateMembership.id !== rosterEntry.id) {
      return res.status(409).json({
        error: `Bowler Id ${Number(bowlerId)} already exists in this tournament.`,
      });
    }

    await rosterEntry.update({
      teamId: null,
      bowlerId: Number(bowlerId),
      c5Number: c5Number ? String(c5Number).trim() : null,
      name: normalizedName,
      zone: Number(zone),
      division: normalizedDivision,
      isCoach: Boolean(isCoach),
      role: normalizedRole,
      isSinglesEligible: Boolean(isSinglesEligible),
    });

    const hydrated = await TournamentBowler.findByPk(rosterEntry.id);

    res.json(serializeRosterEntry(hydrated));
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

    res.json(await loadDrawSlotEntries(tournamentYearId, where));
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
    sideATeamId: null,
    sideABowlerId: payload.sideABowlerId ? Number(payload.sideABowlerId) : null,
    sideBTeamId: null,
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
    const [hydrated] = await loadDrawSlotEntries(tournamentYearId, { id: slot.id, tournamentYearId });
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

router.patch('/api/tournaments/:id/draw-slots/:slotId', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    const slotId = Number(req.params.slotId);
    if (!tournamentYearId || !Number.isInteger(slotId) || slotId <= 0) {
      return res.status(400).json({ error: 'Invalid tournament or slot id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const slot = await LaneDrawSlot.findOne({ where: { id: slotId, tournamentYearId } });
    if (!slot) {
      return res.status(404).json({ error: 'Draw slot not found.' });
    }

    const division = normalizeDivision(req.body?.division ?? slot.division);
    const blockCode = String(req.body?.blockCode ?? slot.blockCode).trim();
    const lane = Number(req.body?.lane ?? slot.lane);

    if (!division || !blockCode || !Number.isInteger(lane) || lane <= 0) {
      return res.status(400).json({ error: 'division, blockCode and lane are required.' });
    }

    const eventType = String(req.body?.eventType ?? slot.eventType)
      .trim()
      .toLowerCase();
    if (!['team', 'singles'].includes(eventType)) {
      return res.status(400).json({ error: "eventType must be either 'team' or 'singles'." });
    }

    const duplicate = await LaneDrawSlot.findOne({
      where: {
        tournamentYearId,
        division,
        blockCode,
        lane,
      },
    });

    if (duplicate && duplicate.id !== slot.id) {
      return res.status(409).json({ error: 'A slot already exists for this division/block/lane.' });
    }

    await slot.update({
      division,
      eventType,
      blockCode,
      slotCode: req.body?.slotCode ? String(req.body.slotCode).trim() : null,
      lane,
      sideATeamId: null,
      sideABowlerId: req.body?.sideABowlerId ? Number(req.body.sideABowlerId) : null,
      sideBTeamId: null,
      sideBBowlerId: req.body?.sideBBowlerId ? Number(req.body.sideBBowlerId) : null,
      scheduledAt: req.body?.scheduledAt || null,
      status: String(req.body?.status || slot.status).trim() || slot.status,
    });

    const [hydrated] = await loadDrawSlotEntries(tournamentYearId, { id: slot.id, tournamentYearId });
    res.json(hydrated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/api/tournaments/:id/draw-slots/:slotId', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    const slotId = Number(req.params.slotId);
    if (!tournamentYearId || !Number.isInteger(slotId) || slotId <= 0) {
      return res.status(400).json({ error: 'Invalid tournament or slot id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    const slot = await LaneDrawSlot.findOne({ where: { id: slotId, tournamentYearId } });
    if (!slot) {
      return res.status(404).json({ error: 'Draw slot not found.' });
    }

    await slot.destroy();
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function computePublishValidation(tournament, roster, drawSlots, locations) {
  const allBowlersHaveZones = roster.length > 0 && roster.every((item) => Number.isInteger(item.zone));

  const checks = {
    detailsComplete: Boolean(String(tournament.name || '').trim() && tournament.startDate && tournament.endDate),
    locationsConfigured: locations.length > 0,
    bowlersConfigured: roster.length > 0,
    allBowlersHaveZones,
    scheduleComplete: drawSlots.length > 0,
  };

  return {
    checks,
    canPublish: Object.values(checks).every(Boolean),
  };
}

router.get('/api/tournaments/:id/publish-validation', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await TournamentYear.findByPk(tournamentYearId, { include: [Location] });
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const [roster, drawSlots] = await Promise.all([
      TournamentBowler.findAll({ where: { tournamentYearId } }),
      LaneDrawSlot.findAll({ where: { tournamentYearId } }),
    ]);

    res.json(computePublishValidation(tournament, roster, drawSlots, tournament.Locations || []));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/tournaments/:id/publish', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await TournamentYear.findByPk(tournamentYearId, { include: [Location] });
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    if (!requireUnlockedTournament(tournament, res)) return;

    const [roster, drawSlots] = await Promise.all([
      TournamentBowler.findAll({ where: { tournamentYearId } }),
      LaneDrawSlot.findAll({ where: { tournamentYearId } }),
    ]);

    const validation = computePublishValidation(tournament, roster, drawSlots, tournament.Locations || []);
    if (!validation.canPublish) {
      return res.status(409).json({
        error: 'Tournament does not meet publish requirements.',
        validation,
      });
    }

    await tournament.update({ status: 'published' });
    res.json({ tournament, validation });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/api/tournaments/:id/unpublish', async (req, res) => {
  try {
    const tournamentYearId = parseTournamentYearId(req.params.id);
    if (!tournamentYearId) {
      return res.status(400).json({ error: 'Invalid tournament id.' });
    }

    const tournament = await getTournamentOr404(tournamentYearId, res);
    if (!tournament) return;
    if (!requireUnlockedTournament(tournament, res)) return;

    await tournament.update({ status: 'ready_to_publish' });
    res.json(tournament);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
