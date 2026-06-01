import { makeAutoObservable, runInAction } from 'mobx';
import { createTournament, listTournaments, lockTournament, updateTournament, } from '../../services/adminApi';
const defaultForm = {
    name: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    location: '',
};
function readStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const create = params.get('create') === '1';
    const id = Number(params.get('id') || 0);
    if (create) {
        return { mode: 'create', tournamentId: null };
    }
    if (Number.isInteger(id) && id > 0) {
        return { mode: 'edit', tournamentId: id };
    }
    return { mode: 'list', tournamentId: null };
}
function pushState(mode, tournamentId) {
    let nextUrl = '/admin';
    if (mode === 'create') {
        nextUrl = '/admin?create=1';
    }
    if (mode === 'edit' && tournamentId) {
        nextUrl = `/admin?id=${tournamentId}`;
    }
    window.history.pushState({}, '', nextUrl);
}
export class TournamentAdminStore {
    constructor() {
        this.tournaments = [];
        this.loading = true;
        this.submitting = false;
        this.message = '';
        this.tone = 'info';
        this.form = { ...defaultForm };
        const state = readStateFromUrl();
        this.mode = state.mode;
        this.editingId = state.tournamentId;
        makeAutoObservable(this, {}, { autoBind: true });
    }
    get editingTournament() {
        return this.tournaments.find((item) => item.id === this.editingId) || null;
    }
    get isLocked() {
        return Boolean(this.editingTournament?.isLocked);
    }
    get showLockButton() {
        return this.mode === 'edit' && Boolean(this.editingTournament);
    }
    setInfo(text) {
        this.tone = 'info';
        this.message = text;
    }
    setError(text) {
        this.tone = 'error';
        this.message = text;
    }
    setFormField(field, value) {
        this.form[field] = value;
    }
    hydrateFormFromEditing() {
        if (this.mode === 'create') {
            this.form = { ...defaultForm };
            return;
        }
        if (this.mode === 'edit' && this.editingTournament) {
            this.form = {
                name: this.editingTournament.name || '',
                startDate: this.editingTournament.startDate || '',
                endDate: this.editingTournament.endDate || '',
                status: this.editingTournament.status || 'draft',
                location: this.editingTournament.Locations?.[0]?.name || '',
            };
        }
    }
    syncFromUrl() {
        const state = readStateFromUrl();
        this.mode = state.mode;
        this.editingId = state.tournamentId;
        this.message = '';
        this.hydrateFormFromEditing();
    }
    openList() {
        this.mode = 'list';
        this.editingId = null;
        this.message = '';
        pushState('list', null);
    }
    openCreate() {
        this.mode = 'create';
        this.editingId = null;
        this.message = '';
        this.form = { ...defaultForm };
        pushState('create', null);
    }
    openEdit(id) {
        this.mode = 'edit';
        this.editingId = id;
        this.message = '';
        pushState('edit', id);
        this.hydrateFormFromEditing();
    }
    async loadTournaments() {
        runInAction(() => {
            this.loading = true;
        });
        try {
            const data = await listTournaments();
            runInAction(() => {
                this.tournaments = data;
                this.hydrateFormFromEditing();
            });
        }
        catch (error) {
            runInAction(() => {
                this.setError(error.message);
            });
        }
        finally {
            runInAction(() => {
                this.loading = false;
            });
        }
    }
    async submit() {
        if (this.mode === 'edit' && this.isLocked) {
            this.setError('This tournament is locked and read-only.');
            return;
        }
        runInAction(() => {
            this.submitting = true;
        });
        try {
            if (this.mode === 'create') {
                const payload = {
                    name: this.form.name,
                    startDate: this.form.startDate || null,
                    endDate: this.form.endDate || null,
                    status: this.form.status || 'draft',
                    locations: this.form.location ? [{ name: this.form.location }] : [],
                };
                const result = await createTournament(payload);
                await this.loadTournaments();
                runInAction(() => {
                    this.setInfo('Tournament created.');
                    this.openEdit(result.tournament.id);
                });
                return;
            }
            if (this.mode === 'edit' && this.editingId) {
                await updateTournament(this.editingId, {
                    name: this.form.name,
                    startDate: this.form.startDate || null,
                    endDate: this.form.endDate || null,
                    status: this.form.status || 'draft',
                });
                await this.loadTournaments();
                runInAction(() => {
                    this.setInfo('Tournament saved.');
                });
            }
        }
        catch (error) {
            runInAction(() => {
                this.setError(error.message);
            });
        }
        finally {
            runInAction(() => {
                this.submitting = false;
            });
        }
    }
    async lockCurrentTournament() {
        if (!this.editingId || this.isLocked)
            return;
        const confirmed = window.confirm('Locking this tournament is irreversible. After locking, this tournament will be read-only. Continue?');
        if (!confirmed)
            return;
        runInAction(() => {
            this.submitting = true;
        });
        try {
            await lockTournament(this.editingId);
            await this.loadTournaments();
            runInAction(() => {
                this.setInfo('Tournament locked. This tournament is now read-only.');
            });
        }
        catch (error) {
            runInAction(() => {
                this.setError(error.message);
            });
        }
        finally {
            runInAction(() => {
                this.submitting = false;
            });
        }
    }
}
//# sourceMappingURL=TournamentAdminStore.js.map