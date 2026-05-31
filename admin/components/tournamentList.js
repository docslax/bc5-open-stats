function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderTournamentList(container, tournaments) {
  if (!container) return;

  if (!Array.isArray(tournaments) || tournaments.length === 0) {
    container.innerHTML =
      '<p class="muted">No tournaments yet. Click Create Tournament to start.</p>';
    return;
  }

  container.innerHTML = tournaments
    .map(
      (item) => `
      <div class="row-item">
        <a href="/admin/tournament.html?id=${Number(item.id)}">${escapeHtml(item.name)}</a>
        <span class="badge">${escapeHtml(item.status || "draft")}</span>
        <div class="muted">${escapeHtml(item.startDate || "TBD")} -> ${escapeHtml(item.endDate || "TBD")}</div>
      </div>
    `,
    )
    .join("");
}
