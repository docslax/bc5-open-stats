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
  laneCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  notes: {
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
  c5Number: {
    type: DataTypes.STRING,
    allowNull: true,
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
  c5Number: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  zone: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  division: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isCoach: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
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

async function safeDescribeTable(queryInterface, tableName) {
  try {
    return await queryInterface.describeTable(tableName);
  } catch (error) {
    if (String(error.message || '').includes('No description found for')) {
      return null;
    }
    throw error;
  }
}

async function rebuildTournamentBowlersTableWithoutLegacyFks() {
  await sequelize.query('PRAGMA foreign_keys = OFF');
  try {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `
          CREATE TABLE TournamentBowlers_new (
            id INTEGER PRIMARY KEY,
            tournamentYearId INTEGER NOT NULL REFERENCES TournamentYears(id),
            teamId INTEGER,
            bowlerId INTEGER NOT NULL,
            c5Number VARCHAR(255),
            name VARCHAR(255),
            zone INTEGER NOT NULL DEFAULT 0,
            division VARCHAR(255) NOT NULL DEFAULT 'Open',
            isCoach TINYINT(1) NOT NULL DEFAULT 0,
            role VARCHAR(255) NOT NULL DEFAULT 'player',
            isSinglesEligible TINYINT(1) NOT NULL DEFAULT 0,
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL
          )
        `,
        { transaction },
      );

      await sequelize.query(
        `
          INSERT INTO TournamentBowlers_new
          (
            id,
            tournamentYearId,
            teamId,
            bowlerId,
            c5Number,
            name,
            zone,
            division,
            isCoach,
            role,
            isSinglesEligible,
            createdAt,
            updatedAt
          )
          SELECT
            id,
            tournamentYearId,
            NULL,
            bowlerId,
            c5Number,
            name,
            COALESCE(zone, 0),
            COALESCE(division, 'Open'),
            COALESCE(isCoach, 0),
            COALESCE(role, 'player'),
            COALESCE(isSinglesEligible, 0),
            createdAt,
            updatedAt
          FROM TournamentBowlers
        `,
        { transaction },
      );

      await sequelize.query('DROP TABLE TournamentBowlers', { transaction });
      await sequelize.query('ALTER TABLE TournamentBowlers_new RENAME TO TournamentBowlers', { transaction });
    });
  } finally {
    await sequelize.query('PRAGMA foreign_keys = ON');
  }
}

async function rebuildLaneDrawSlotsTableWithoutLegacyFks() {
  await sequelize.query('PRAGMA foreign_keys = OFF');
  try {
    await sequelize.transaction(async (transaction) => {
      await sequelize.query(
        `
          CREATE TABLE LaneDrawSlots_new (
            id INTEGER PRIMARY KEY,
            tournamentYearId INTEGER NOT NULL REFERENCES TournamentYears(id),
            division VARCHAR(255) NOT NULL,
            eventType VARCHAR(255) NOT NULL DEFAULT 'team',
            blockCode VARCHAR(255) NOT NULL,
            slotCode VARCHAR(255),
            lane INTEGER NOT NULL,
            sideATeamId INTEGER,
            sideABowlerId INTEGER,
            sideBTeamId INTEGER,
            sideBBowlerId INTEGER,
            scheduledAt DATETIME,
            status VARCHAR(255) NOT NULL DEFAULT 'draft',
            createdAt DATETIME NOT NULL,
            updatedAt DATETIME NOT NULL
          )
        `,
        { transaction },
      );

      await sequelize.query(
        `
          INSERT INTO LaneDrawSlots_new
          (
            id,
            tournamentYearId,
            division,
            eventType,
            blockCode,
            slotCode,
            lane,
            sideATeamId,
            sideABowlerId,
            sideBTeamId,
            sideBBowlerId,
            scheduledAt,
            status,
            createdAt,
            updatedAt
          )
          SELECT
            id,
            tournamentYearId,
            division,
            COALESCE(eventType, 'team'),
            blockCode,
            slotCode,
            lane,
            NULL,
            sideABowlerId,
            NULL,
            sideBBowlerId,
            scheduledAt,
            COALESCE(status, 'draft'),
            createdAt,
            updatedAt
          FROM LaneDrawSlots
        `,
        { transaction },
      );

      await sequelize.query('DROP TABLE LaneDrawSlots', { transaction });
      await sequelize.query('ALTER TABLE LaneDrawSlots_new RENAME TO LaneDrawSlots', { transaction });
    });
  } finally {
    await sequelize.query('PRAGMA foreign_keys = ON');
  }
}

async function ensureLegacySchema() {
  const queryInterface = sequelize.getQueryInterface();
  const tournamentYearsTable = await safeDescribeTable(queryInterface, 'TournamentYears');
  const locationsTable = await safeDescribeTable(queryInterface, 'Locations');
  const bowlersTable = await safeDescribeTable(queryInterface, 'Bowlers');
  const teamsTable = await safeDescribeTable(queryInterface, 'Teams');

  if (tournamentYearsTable && !tournamentYearsTable.isLocked) {
    await queryInterface.addColumn('TournamentYears', 'isLocked', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  if (locationsTable && !locationsTable.laneCount) {
    await queryInterface.addColumn('Locations', 'laneCount', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  if (locationsTable && !locationsTable.notes) {
    await queryInterface.addColumn('Locations', 'notes', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (bowlersTable && !bowlersTable.c5Number) {
    await queryInterface.addColumn('Bowlers', 'c5Number', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  const tournamentBowlerTable = await queryInterface.describeTable('TournamentBowlers');

  if (!tournamentBowlerTable.teamId) {
    await queryInterface.addColumn('TournamentBowlers', 'teamId', {
      type: DataTypes.INTEGER,
      allowNull: true,
    });
  }

  if (!tournamentBowlerTable.c5Number) {
    await queryInterface.addColumn('TournamentBowlers', 'c5Number', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  }

  if (!tournamentBowlerTable.name) {
    await queryInterface.addColumn('TournamentBowlers', 'name', {
      type: DataTypes.STRING,
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

  if (!tournamentBowlerTable.isCoach) {
    await queryInterface.addColumn('TournamentBowlers', 'isCoach', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
  }

  const tournamentBowlerFks = await sequelize.query("PRAGMA foreign_key_list('TournamentBowlers')", {
    type: Sequelize.QueryTypes.SELECT,
  });
  if (tournamentBowlerFks.some((fk) => fk.table === 'Bowlers' || fk.table === 'Teams')) {
    await rebuildTournamentBowlersTableWithoutLegacyFks();
  }

  const laneDrawSlotFks = await sequelize.query("PRAGMA foreign_key_list('LaneDrawSlots')", {
    type: Sequelize.QueryTypes.SELECT,
  });
  if (laneDrawSlotFks.some((fk) => fk.table === 'Bowlers' || fk.table === 'Teams')) {
    await rebuildLaneDrawSlotsTableWithoutLegacyFks();
  }

  // Backfill legacy rows so follow-on writes can enforce current constraints.
  await sequelize.query("UPDATE TournamentBowlers SET zone = COALESCE(zone, 0), division = COALESCE(division, 'Open')");

  if (bowlersTable) {
    await sequelize.query(`
      UPDATE TournamentBowlers
      SET
        c5Number = COALESCE(c5Number, (SELECT Bowlers.c5Number FROM Bowlers WHERE Bowlers.bowlerId = TournamentBowlers.bowlerId)),
        name = COALESCE(name, (SELECT Bowlers.name FROM Bowlers WHERE Bowlers.bowlerId = TournamentBowlers.bowlerId)),
        isCoach = COALESCE(isCoach, (SELECT Bowlers.isCoach FROM Bowlers WHERE Bowlers.bowlerId = TournamentBowlers.bowlerId), 0)
    `);
  }

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

  if (teamsTable) {
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
