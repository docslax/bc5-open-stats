import { renderTournamentList } from "./components/tournamentList.js";
import { listTournaments } from "./services/api.js";

const messageEl = document.getElementById("message");
const tournamentListEl = document.getElementById("tournamentList");
const createTournamentBtn = document.getElementById("createTournamentBtn");

function setMessage(text, tone = "info") {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.style.color = tone === "error" ? "#fca5a5" : "#86efac";
}

async function loadDashboard() {
  try {
    const tournaments = await listTournaments();
    renderTournamentList(tournamentListEl, tournaments);
    setMessage("Loaded tournaments.");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

createTournamentBtn?.addEventListener("click", () => {
  window.location.href = "/admin/tournament.html";
});

void loadDashboard();
