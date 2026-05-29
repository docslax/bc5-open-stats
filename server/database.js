const path = require("path");
const crypto = require("crypto");
const { Sequelize, DataTypes } = require("sequelize");

const dbPath = path.join(__dirname, "../data/bc5-stats.sqlite");
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: dbPath,
  logging: false,
});

const TournamentYear = sequelize.define("TournamentYear", {
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
    defaultValue: "draft",
  },
});

const Location = sequelize.define("Location", {
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

const Bowler = sequelize.define("Bowler", {
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

const TournamentBowler = sequelize.define("TournamentBowler", {
  tournamentYearId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  bowlerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "player",
  },
  isSinglesEligible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

const User = sequelize.define("User", {
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
    defaultValue: "admin",
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
});

const Team = sequelize.define("Team", {
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

const Standing = sequelize.define("Standing", {
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
    defaultValue: "manual",
  },
});

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, expectedHash] = String(storedHash || "").split(":");
  if (!salt || !expectedHash) return false;

  const candidateHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidateHash, "hex"), Buffer.from(expectedHash, "hex"));
}

async function ensureDefaultAdminUser() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASS || "ChangeMeSoon!";

  const existing = await User.findOne({ where: { username } });
  if (!existing) {
    await User.create({
      username,
      passwordHash: hashPassword(password),
      role: "admin",
      email,
    });
  }
}

async function initializeDatabase() {
  await sequelize.authenticate();
  await sequelize.sync();
  await ensureDefaultAdminUser();
}

TournamentYear.hasMany(Location, { foreignKey: "tournamentYearId" });
Location.belongsTo(TournamentYear, { foreignKey: "tournamentYearId" });

TournamentYear.hasMany(Team, { foreignKey: "tournamentYearId" });
Team.belongsTo(TournamentYear, { foreignKey: "tournamentYearId" });

TournamentYear.hasMany(TournamentBowler, { foreignKey: "tournamentYearId" });
TournamentBowler.belongsTo(TournamentYear, { foreignKey: "tournamentYearId" });

Bowler.hasMany(TournamentBowler, {
  foreignKey: "bowlerId",
  sourceKey: "bowlerId",
});
TournamentBowler.belongsTo(Bowler, {
  foreignKey: "bowlerId",
  targetKey: "bowlerId",
});

Bowler.hasMany(Team, {
  foreignKey: "coachBowlerId",
  sourceKey: "bowlerId",
});
Team.belongsTo(Bowler, {
  foreignKey: "coachBowlerId",
  targetKey: "bowlerId",
});

module.exports = {
  sequelize,
  initializeDatabase,
  TournamentYear,
  Location,
  Bowler,
  TournamentBowler,
  Team,
  User,
  Standing,
  hashPassword,
  verifyPassword,
};
