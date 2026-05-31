const path = require('path');
const crypto = require('crypto');
const { Sequelize, DataTypes } = require('sequelize');

const dbPath = path.join(__dirname, '../data/bc5-stats.sqlite');
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

const TournamentYear = sequelize.define('TournamentYear', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft',
  },
  isLocked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

const Location = sequelize.define('Location', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tournamentYearId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

const Bowler = sequelize.define('Bowler', {
  bowlerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zone: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  categoryCode: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qualifier: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  isCoach: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

const TournamentBowler = sequelize.define('TournamentBowler', {
  tournamentYearId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  bowlerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  zone: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  division: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'player',
  },
  isSinglesEligible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'admin',
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

const Team = sequelize.define('Team', {
  tournamentYearId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  zone: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  division: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  coachBowlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

const LaneDrawSlot = sequelize.define('LaneDrawSlot', {
  tournamentYearId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  division: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'team',
  },
  blockCode: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slotCode: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lane: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  sideATeamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sideABowlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sideBTeamId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  sideBBowlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  scheduledAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'draft',
  },
});

const Standing = sequelize.define('Standing', {
  bowlerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  zone: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  totalPinfall: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  average: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  pointsWon: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  rank: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'manual',
  },
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || '').split(':');
  if (!salt || !expectedHash) return false;

  const candidateHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(candidateHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

async function ensureDefaultAdminUser() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const email = process.env.ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.ADMIN_PASS || 'ChangeMeSoon!';
  const hasConfiguredPassword = Object.prototype.hasOwnProperty.call(process.env, 'ADMIN_PASS');

  const existing = await User.findOne({ where: { username } });
  if (!existing) {
    await User.create({
      username,
      passwordHash: hashPassword(password),
      role: 'admin',
      email,
    });
    return;
  }

  // When ADMIN_PASS is explicitly provided, keep the seeded admin account in sync.
  if (hasConfiguredPassword && !verifyPassword(password, existing.passwordHash)) {
    await existing.update({
      passwordHash: hashPassword(password),
      email,
    });
  }
}

async function ensureLegacySchema() {
  const queryInterface = sequelize.getQueryInterface();
  const tournamentYearsTable = await queryInterface.describeTable('TournamentYears');

  if (!tournamentYearsTable.isLocked) {
    await queryInterface.addColumn('TournamentYears', 'isLocked', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  const tournamentBowlerTable = await queryInterface.describeTable('TournamentBowlers');

  if (!tournamentBowlerTable.teamId) {
    await queryInterface.addColumn('TournamentBowlers', 'teamId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  if (!tournamentBowlerTable.zone) {
    await queryInterface.addColumn('TournamentBowlers', 'zone', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  if (!tournamentBowlerTable.division) {
    await queryInterface.addColumn('TournamentBowlers', 'division', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  // Backfill legacy rows so follow-on writes can enforce current constraints.
  await sequelize.query("UPDATE TournamentBowlers SET zone = COALESCE(zone, 0), division = COALESCE(division, 'Open')");

  try {
    await queryInterface.addIndex('TournamentBowlers', ['tournamentYearId', 'bowlerId', 'division'], {
      name: 'tournament_roster_unique_assignment',
      unique: true,
    });
  } catch (error) {
    if (!String(error.message || '').includes('already exists')) {
      throw error;
    }
  }

  try {
    await queryInterface.addIndex('Teams', ['tournamentYearId', 'zone', 'division', 'name'], {
      name: 'teams_unique_name_by_division_zone',
      unique: true,
    });
  } catch (error) {
    if (!String(error.message || '').includes('already exists')) {
      throw error;
    }
  }

  try {
    await queryInterface.addIndex('LaneDrawSlots', ['tournamentYearId', 'division', 'blockCode', 'lane'], {
      name: 'lane_draw_unique_slot',
      unique: true,
    });
  } catch (error) {
    if (!String(error.message || '').includes('already exists')) {
      throw error;
    }
  }
}

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureLegacySchema();
  await ensureDefaultAdminUser();
}

TournamentYear.hasMany(Location, { foreignKey: 'tournamentYearId' });
Location.belongsTo(TournamentYear, { foreignKey: 'tournamentYearId' });

TournamentYear.hasMany(Team, { foreignKey: 'tournamentYearId' });
Team.belongsTo(TournamentYear, { foreignKey: 'tournamentYearId' });

TournamentYear.hasMany(TournamentBowler, { foreignKey: 'tournamentYearId' });
TournamentBowler.belongsTo(TournamentYear, { foreignKey: 'tournamentYearId' });

TournamentYear.hasMany(LaneDrawSlot, { foreignKey: 'tournamentYearId' });
LaneDrawSlot.belongsTo(TournamentYear, { foreignKey: 'tournamentYearId' });

Bowler.hasMany(TournamentBowler, {
  foreignKey: 'bowlerId',
  sourceKey: 'bowlerId',
});
TournamentBowler.belongsTo(Bowler, {
  foreignKey: 'bowlerId',
  targetKey: 'bowlerId',
});

Bowler.hasMany(Team, {
  foreignKey: 'coachBowlerId',
  sourceKey: 'bowlerId',
});
Team.belongsTo(Bowler, {
  foreignKey: 'coachBowlerId',
  targetKey: 'bowlerId',
});

Team.hasMany(TournamentBowler, { foreignKey: 'teamId' });
TournamentBowler.belongsTo(Team, { foreignKey: 'teamId' });

Team.hasMany(LaneDrawSlot, { foreignKey: 'sideATeamId', as: 'sideATeamSlots' });
Team.hasMany(LaneDrawSlot, { foreignKey: 'sideBTeamId', as: 'sideBTeamSlots' });
LaneDrawSlot.belongsTo(Team, { foreignKey: 'sideATeamId', as: 'sideATeam' });
LaneDrawSlot.belongsTo(Team, { foreignKey: 'sideBTeamId', as: 'sideBTeam' });

Bowler.hasMany(LaneDrawSlot, {
  foreignKey: 'sideABowlerId',
  sourceKey: 'bowlerId',
  as: 'sideABowlerSlots',
});
Bowler.hasMany(LaneDrawSlot, {
  foreignKey: 'sideBBowlerId',
  sourceKey: 'bowlerId',
  as: 'sideBBowlerSlots',
});
LaneDrawSlot.belongsTo(Bowler, {
  foreignKey: 'sideABowlerId',
  targetKey: 'bowlerId',
  as: 'sideABowler',
});
LaneDrawSlot.belongsTo(Bowler, {
  foreignKey: 'sideBBowlerId',
  targetKey: 'bowlerId',
  as: 'sideBBowler',
});

module.exports = {
  sequelize,
  initializeDatabase,
  TournamentYear,
  Location,
  Bowler,
  TournamentBowler,
  Team,
  LaneDrawSlot,
  User,
  Standing,
  hashPassword,
  verifyPassword,
};
