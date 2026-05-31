export async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload;
}

export async function listTournaments() {
  return requestJson('/api/tournaments', { method: 'GET' });
}

export async function createTournament(payload) {
  return requestJson('/api/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTournament(tournamentId, payload) {
  return requestJson(`/api/tournaments/${tournamentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function lockTournament(tournamentId) {
  return requestJson(`/api/tournaments/${tournamentId}/lock`, {
    method: 'POST',
  });
}

export async function getTournamentById(tournamentId) {
  const tournaments = await listTournaments();
  return tournaments.find((item) => Number(item.id) === Number(tournamentId)) || null;
}
