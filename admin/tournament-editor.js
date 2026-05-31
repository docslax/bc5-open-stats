import { createTournament, getTournamentById, lockTournament, updateTournament } from './services/api.js';

const messageEl = document.getElementById('message');
const pageTitleEl = document.getElementById('pageTitle');
const pageSubtitleEl = document.getElementById('pageSubtitle');
const formHeaderEl = document.getElementById('formHeader');
const submitBtnEl = document.getElementById('submitBtn');
const cancelBtnEl = document.getElementById('cancelBtn');
const locationInputEl = document.getElementById('locationInput');
const formEl = document.getElementById('tournamentForm');
const lockActionsEl = document.getElementById('lockActions');
const lockBtnEl = document.getElementById('lockBtn');

const query = new URLSearchParams(window.location.search);
const tournamentId = Number(query.get('id') || 0);
const isEdit = Number.isInteger(tournamentId) && tournamentId > 0;
let isLocked = false;

function setMessage(text, tone = 'info') {
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.style.color = tone === 'error' ? '#fca5a5' : '#86efac';
}

function setPageMode() {
  if (!isEdit) {
    return;
  }

  if (pageTitleEl) pageTitleEl.textContent = 'Edit tournament year';
  if (pageSubtitleEl) pageSubtitleEl.textContent = 'Update an existing tournament year.';
  if (formHeaderEl) formHeaderEl.textContent = 'Edit tournament year';
  if (submitBtnEl) submitBtnEl.textContent = 'Save tournament';

  if (locationInputEl) {
    locationInputEl.disabled = true;
    locationInputEl.placeholder = 'Primary location is create-only for now';
  }
}

function setFormReadOnly(readOnly) {
  if (!formEl) return;
  isLocked = Boolean(readOnly);

  const controls = formEl.querySelectorAll('input, select, textarea');
  controls.forEach((control) => {
    control.disabled = isLocked;
  });

  if (submitBtnEl) {
    submitBtnEl.disabled = isLocked;
    submitBtnEl.textContent = isLocked ? 'Tournament locked' : 'Save tournament';
  }

  if (lockActionsEl) {
    lockActionsEl.hidden = !isEdit;
  }

  if (lockBtnEl) {
    lockBtnEl.disabled = isLocked;
    lockBtnEl.textContent = isLocked ? 'Tournament locked' : 'Lock tournament';
  }

  if (locationInputEl && isEdit) {
    locationInputEl.disabled = true;
    locationInputEl.placeholder = 'Primary location is create-only for now';
  }
}

async function loadTournament() {
  if (!isEdit || !formEl) return;

  const tournament = await getTournamentById(tournamentId);
  if (!tournament) {
    setMessage('Tournament not found.', 'error');
    return;
  }

  formEl.elements.name.value = tournament.name || '';
  formEl.elements.startDate.value = tournament.startDate || '';
  formEl.elements.endDate.value = tournament.endDate || '';
  formEl.elements.status.value = tournament.status || 'draft';
  formEl.elements.locations.value = tournament.Locations?.[0]?.name || '';
  setFormReadOnly(Boolean(tournament.isLocked));

  if (tournament.isLocked) {
    setMessage('This tournament is locked and read-only.');
  }
}

formEl?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (isLocked) {
    setMessage('This tournament is locked and cannot be edited.', 'error');
    return;
  }

  const formData = new FormData(formEl);

  try {
    if (isEdit) {
      await updateTournament(tournamentId, {
        name: formData.get('name'),
        startDate: formData.get('startDate') || null,
        endDate: formData.get('endDate') || null,
        status: formData.get('status') || 'draft',
      });

      setMessage('Tournament saved.');
      return;
    }

    const payload = {
      name: formData.get('name'),
      startDate: formData.get('startDate') || null,
      endDate: formData.get('endDate') || null,
      status: formData.get('status') || 'draft',
      locations: formData.get('locations') ? [{ name: formData.get('locations') }] : [],
    };

    const created = await createTournament(payload);
    setMessage('Tournament created. Redirecting to editor...');
    window.location.href = `/admin/tournament.html?id=${created.tournament.id}`;
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

lockBtnEl?.addEventListener('click', async () => {
  if (!isEdit || isLocked) {
    return;
  }

  const confirmed = window.confirm(
    'Locking this tournament is irreversible. After locking, this tournament will be read-only. Continue?',
  );
  if (!confirmed) {
    return;
  }

  try {
    await lockTournament(tournamentId);
    setFormReadOnly(true);
    setMessage('Tournament locked. This tournament is now read-only.');
  } catch (error) {
    setMessage(error.message, 'error');
  }
});

cancelBtnEl?.addEventListener('click', () => {
  window.location.href = '/admin/';
});

setPageMode();
void loadTournament();
