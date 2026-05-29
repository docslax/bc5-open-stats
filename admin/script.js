const messageEl = document.getElementById('message');
const tournamentListEl = document.getElementById('tournamentList');
const form = document.getElementById('tournamentForm');

function setMessage(text, tone = 'info') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.style.color = tone === 'error' ? '#fca5a5' : '#86efac';
}

async function loadTournaments() {
  try {
    const response = await fetch('/api/tournaments', { credentials: 'include' });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to load tournaments.');
    }

    tournamentListEl.innerHTML = data.length
      ? data
          .map(
            (item) => `
              <article class="mini-card">
                <h3>${item.name}</h3>
                <p>${item.startDate || 'TBD'} → ${item.endDate || 'TBD'} · ${item.status}</p>
                <p>${item.Locations?.length || 0} locations · ${item.Teams?.length || 0} teams</p>
              </article>
            `,
          )
          .join('')
      : '<p class="muted">No tournaments yet. Create your first season setup above.</p>';
  } catch (error) {
    tournamentListEl.innerHTML = '<p class="muted">Unable to load tournaments right now.</p>';
    setMessage(error.message, 'error');
  }
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(form);

  try {
    const response = await fetch('/api/tournaments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        name: formData.get('name'),
        startDate: formData.get('startDate') || null,
        endDate: formData.get('endDate') || null,
        locations: formData.get('locations')
          ? [{ name: formData.get('locations') }]
          : [],
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to create tournament.');
    }

    setMessage(`Tournament created: ${data.tournament.name}`);
    form.reset();
    await loadTournaments();
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

loadTournaments();
