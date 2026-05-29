require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const { initializeDatabase, Bowler, Standing, User, verifyPassword } = require("./database");
const tournamentSetupRoutes = require("./routes/tournamentSetup");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, "../data");
const DATA_FILE = path.join(DATA_DIR, "scores.json");

function ensureDataFile() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function loadEntries() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function saveEntries(entries) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
}

function normalizeGames(entry) {
  const rawGames = Array.isArray(entry.games)
    ? entry.games
    : [entry.game1, entry.game2, entry.game3].filter((value) => value !== undefined && value !== null);

  return rawGames.map((value) => Number(value) || 0);
}

function calculateStandings(entries) {
  const rows = entries.map((entry) => {
    const games = normalizeGames(entry);
    const total = games.reduce((sum, value) => sum + value, 0);
    const average = games.length ? total / games.length : 0;

    return {
      id: entry.id || `${entry.player}-${entry.team}-${entry.createdAt}`,
      player: entry.player || "Unknown bowler",
      team: entry.team || "Unassigned",
      division: entry.division || "Open",
      week: entry.week || "-",
      games,
      total,
      average: Number(average.toFixed(2)),
      submittedAt: entry.createdAt,
    };
  });

  return rows
    .sort((a, b) => b.total - a.total || b.average - a.average || a.player.localeCompare(b.player))
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Clean invisible or junk characters from redirect links
app.use((req, res, next) => {
  const invisibleCharPattern = /%E2%81%A0|[\u200B-\u200F\u202A-\u202E\u2060-\u206F]/i;
  const cleanRoutes = ['/'];

  for (const route of cleanRoutes) {
    // only redirect if the path matches that route AND contains invisible characters
    if (req.path.startsWith(route) && invisibleCharPattern.test(req.url)) {
      return res.redirect(301, route);
    }
  }

  next();
});

const sessions = new Map();

function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter(Boolean)
      .map((cookie) => {
        const [name, ...rest] = cookie.split("=");
        return [name, rest.join("=")];
      })
  );
}

function getSession(req) {
  const token = parseCookies(req.headers.cookie || "").bc5_admin_token;
  if (!token) return null;

  return sessions.get(token) || null;
}

function createSession(user) {
  const token = crypto.randomUUID();
  sessions.set(token, {
    userId: user.id,
    username: user.username,
    role: user.role,
    email: user.email,
    createdAt: new Date().toISOString(),
  });
  return token;
}

function requireAdmin(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.redirect("/?login=required");
  }

  req.adminSession = session;
  next();
}

app.use("/admin", requireAdmin, express.static(path.join(__dirname, "../admin")));

app.post("/api/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const user = await User.findOne({ where: { username } });
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = createSession(user);
    res.cookie("bc5_admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role, email: user.email } });
  } catch (error) {
    console.error("Admin login failed", error);
    res.status(500).json({ error: "Unable to log in." });
  }
});

app.post("/api/admin/logout", (req, res) => {
  const token = parseCookies(req.headers.cookie || "").bc5_admin_token;
  if (token) sessions.delete(token);

  res.clearCookie("bc5_admin_token");
  res.json({ ok: true });
});

app.get("/api/admin/me", (req, res) => {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: "Not logged in." });
  }

  res.json({ ok: true, user: session });
});

app.get("/api/health", async (req, res) => {
  try {
    await initializeDatabase();
    const bowlerCount = await Bowler.count();
    const standingCount = await Standing.count();
    res.json({ ok: true, entries: loadEntries().length, bowlerCount, standingCount });
  } catch (error) {
    console.error("Health check failed", error);
    res.status(500).json({ ok: false, error: "Database unavailable" });
  }
});

app.get("/api/entries", (req, res) => {
  res.json(loadEntries());
});

app.get("/api/standings", (req, res) => {
  res.json({ standings: calculateStandings(loadEntries()) });
});

app.post("/api/entries", (req, res) => {
  try {
    const { player, team, division = "Open", week = "1", games, game1, game2, game3 } = req.body;

    if (!player || !team) {
      return res.status(400).json({ error: "Player and team are required." });
    }

    const normalizedGames = Array.isArray(games)
      ? games.map((value) => Number(value) || 0)
      : [Number(game1) || 0, Number(game2) || 0, Number(game3) || 0];

    const entries = loadEntries();
    const entry = {
      id: `${Date.now()}`,
      player: player.trim(),
      team: team.trim(),
      division: division.trim() || "Open",
      week: `${week}`.trim() || "1",
      games: normalizedGames,
      createdAt: new Date().toISOString(),
    };

    entries.push(entry);
    saveEntries(entries);
    broadcastUpdate();

    res.json({ success: true, entry, standings: calculateStandings(entries) });
  } catch (error) {
    console.error("Error saving entry", error);
    res.status(500).json({ error: "Unable to save score entry." });
  }
});

const clients = [];

// SSE endpoint
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Content-Encoding", "identity"); // 👈 force no compression

  if (res.flushHeaders) res.flushHeaders();

  res.write("data: connected\n\n");

  clients.push(res);

  req.on("close", () => {
    const i = clients.indexOf(res);
    if (i !== -1) clients.splice(i, 1);
  });
});

// heartbeat
setInterval(() => {
  clients.forEach((res) => res.write(": keepalive\n\n"));
}, 15000);

function broadcastUpdate() {
  clients.forEach((res) => res.write("data: update\n\n"));
}

// Serve TypeScript-built static assets for the web app
app.use(express.static(path.join(__dirname, "../public")));
app.use(tournamentSetupRoutes);

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

start();
