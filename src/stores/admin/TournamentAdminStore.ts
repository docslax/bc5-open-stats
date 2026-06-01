import { makeAutoObservable, runInAction } from 'mobx';
import {
  addOrUpdateRosterEntry,
  createDrawSlot,
  createLocation,
  createTournament,
  deleteLocation,
  DrawSlotRecord,
  getPublishValidation,
  getTournamentSetup,
  listTournaments,
  LocationRecord,
  lockTournament,
  publishTournament,
  PublishValidationResponse,
  removeDrawSlot,
  removeRosterEntry,
  TournamentPayload,
  TournamentRecord,
  TournamentRosterRecord,
  unpublishTournament,
  updateRosterEntry,
  updateDrawSlot,
  updateLocation,
  updateTournament,
} from '../../services/adminApi';
import {
  TOURNAMENT_POSITION_OPTIONS,
  TOURNAMENT_TEAM_OPTIONS,
  TOURNAMENT_ZONE_OPTIONS,
} from '../../constants/tournamentAdmin';

export type AdminViewMode = 'list' | 'create' | 'workspace';
export type WorkspaceTab = 'overview' | 'bowlers' | 'schedule' | 'locations' | 'publish';
export type MessageTone = 'success' | 'info' | 'warning' | 'error';

export interface ToastOptions {
  sticky?: boolean;
  autoHideDuration?: number;
}

export interface TournamentFormState {
  name: string;
  startDate: string;
  endDate: string;
}

export interface LocationFormState {
  name: string;
  address: string;
  laneCount: string;
  notes: string;
}

export interface BowlerFormState {
  bowlerId: string;
  c5Number: string;
  name: string;
  zone: string;
  isCoach: boolean;
  team: string;
  position: string;
  isSinglesEligible: boolean;
}

export interface DrawSlotFormState {
  division: string;
  eventType: 'team' | 'singles';
  blockCode: string;
  slotCode: string;
  lane: string;
  sideABowlerId: string;
  sideBBowlerId: string;
  scheduledAt: string;
  status: string;
}

const defaultTournamentForm: TournamentFormState = {
  name: '',
  startDate: '',
  endDate: '',
};

const defaultLocationForm: LocationFormState = {
  name: '',
  address: '',
  laneCount: '',
  notes: '',
};

const defaultBowlerForm: BowlerFormState = {
  bowlerId: '',
  c5Number: '',
  name: '',
  zone: String(TOURNAMENT_ZONE_OPTIONS[0]),
  isCoach: false,
  team: TOURNAMENT_TEAM_OPTIONS[0].value,
  position: String(TOURNAMENT_POSITION_OPTIONS[0]),
  isSinglesEligible: false,
};

const defaultDrawSlotForm: DrawSlotFormState = {
  division: 'Open',
  eventType: 'team',
  blockCode: '',
  slotCode: '',
  lane: '',
  sideABowlerId: '',
  sideBBowlerId: '',
  scheduledAt: '',
  status: 'draft',
};

interface ParsedAdminRoute {
  mode: AdminViewMode;
  tournamentId: number | null;
  tab: WorkspaceTab;
}

function parseRouteFromUrl(): ParsedAdminRoute {
  const params = new URLSearchParams(window.location.search);
  const legacyCreate = params.get('create') === '1';
  const legacyEditId = Number(params.get('id') || 0);
  const path = window.location.pathname.replace(/\/+$/, '');
  const segments = path.split('/').filter(Boolean);

  const tabParam = String(params.get('tab') || '')
    .trim()
    .toLowerCase();
  const isTab = ['overview', 'bowlers', 'schedule', 'locations', 'publish'].includes(tabParam);
  const tab: WorkspaceTab = isTab ? (tabParam as WorkspaceTab) : 'overview';

  if (legacyCreate || path === '/admin/tournaments/new') {
    return { mode: 'create', tournamentId: null, tab: 'overview' };
  }

  if (Number.isInteger(legacyEditId) && legacyEditId > 0) {
    return { mode: 'workspace', tournamentId: legacyEditId, tab };
  }

  if (segments[0] === 'admin' && segments[1] === 'tournaments') {
    const tournamentId = Number(segments[2]);
    if (Number.isInteger(tournamentId) && tournamentId > 0) {
      return { mode: 'workspace', tournamentId, tab };
    }
  }

  return { mode: 'workspace', tournamentId: null, tab: 'overview' };
}

function pushRoute(mode: AdminViewMode, tournamentId: number | null, tab: WorkspaceTab) {
  let nextPath = '/admin';
  const params = new URLSearchParams();

  if (mode === 'create') {
    nextPath = '/admin/tournaments/new';
  }

  if (mode === 'workspace' && tournamentId) {
    nextPath = `/admin/tournaments/${tournamentId}`;
    if (tab !== 'overview') {
      params.set('tab', tab);
    }
  }

  const query = params.toString();
  const nextUrl = query ? `${nextPath}?${query}` : nextPath;
  window.history.pushState({}, '', nextUrl);
}

function mapStatus(value: string | null | undefined): string {
  const normalized = String(value || 'draft')
    .trim()
    .toLowerCase();
  if (normalized === 'draft') return 'Draft';
  if (normalized === 'in_progress') return 'In Progress';
  if (normalized === 'ready_to_publish') return 'Ready to Publish';
  if (normalized === 'published') return 'Published';
  if (normalized === 'archived') return 'Archived';
  return normalized || 'Draft';
}

function getTeamCode(team: string): number | null {
  const option = TOURNAMENT_TEAM_OPTIONS.find((item) => item.value === team);
  return option?.code ?? null;
}

function getRosterTeam(team: string | null | undefined): string {
  const normalized = String(team || '').trim();
  if (TOURNAMENT_TEAM_OPTIONS.some((item) => item.value === normalized)) {
    return normalized;
  }

  const fallbackByLowercase = TOURNAMENT_TEAM_OPTIONS.find(
    (item) => item.value.toLowerCase() === normalized.toLowerCase(),
  );
  return fallbackByLowercase?.value || TOURNAMENT_TEAM_OPTIONS[0].value;
}

function getPositionFromBowlerId(bowlerId: number, isCoach: boolean): string {
  if (isCoach) return '0';
  const lastDigit = String(bowlerId || '').slice(-1);
  return TOURNAMENT_POSITION_OPTIONS.map(String).includes(lastDigit)
    ? lastDigit
    : String(TOURNAMENT_POSITION_OPTIONS[0]);
}

export class TournamentAdminStore {
  mode: AdminViewMode;
  activeTab: WorkspaceTab;
  currentTournamentId: number | null;

  tournaments: TournamentRecord[] = [];
  roster: TournamentRosterRecord[] = [];
  drawSlots: DrawSlotRecord[] = [];

  loading = true;
  workspaceLoading = false;
  submitting = false;
  message = '';
  tone: MessageTone = 'success';
  toastOpen = false;
  toastSticky = false;
  toastAutoHideDuration = 5000;

  tournamentForm: TournamentFormState = { ...defaultTournamentForm };
  locationForm: LocationFormState = { ...defaultLocationForm };
  bowlerForm: BowlerFormState = { ...defaultBowlerForm };
  drawSlotForm: DrawSlotFormState = { ...defaultDrawSlotForm };

  editingLocationId: number | null = null;
  editingRosterId: number | null = null;
  editingDrawSlotId: number | null = null;

  bowlerSearch = '';
  publishValidation: PublishValidationResponse | null = null;

  constructor() {
    const route = parseRouteFromUrl();
    this.mode = route.mode;
    this.activeTab = route.tab;
    this.currentTournamentId = route.tournamentId;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get currentTournament(): TournamentRecord | null {
    return this.tournaments.find((tournament) => tournament.id === this.currentTournamentId) || null;
  }

  get currentLocations(): LocationRecord[] {
    return this.currentTournament?.Locations || [];
  }

  get isLocked(): boolean {
    return Boolean(this.currentTournament?.isLocked);
  }

  get totalBowlers(): number {
    return this.roster.length;
  }

  get uniqueZoneCount(): number {
    return new Set(this.roster.map((entry) => entry.zone)).size;
  }

  get computedBowlerId(): string {
    const zone = Number(this.bowlerForm.zone);
    const teamCode = getTeamCode(this.bowlerForm.team);
    const position = this.bowlerForm.isCoach ? 0 : Number(this.bowlerForm.position);

    if (
      !Number.isInteger(zone) ||
      !TOURNAMENT_ZONE_OPTIONS.includes(zone as (typeof TOURNAMENT_ZONE_OPTIONS)[number])
    ) {
      return '';
    }

    if (!teamCode) {
      return '';
    }

    if (!this.bowlerForm.isCoach) {
      if (
        !Number.isInteger(position) ||
        !TOURNAMENT_POSITION_OPTIONS.includes(position as (typeof TOURNAMENT_POSITION_OPTIONS)[number])
      ) {
        return '';
      }
    }

    return `${zone}${teamCode}${position}`;
  }

  get setupChecklist(): Array<{ label: string; state: 'ok' | 'warn' | 'error' }> {
    const hasDetails = Boolean(
      this.currentTournament?.name && this.currentTournament?.startDate && this.currentTournament?.endDate,
    );
    const hasLocations = this.currentLocations.length > 0;
    const hasBowlers = this.roster.length > 0;
    const allBowlersHaveZone = this.roster.length > 0 && this.roster.every((entry) => Number.isInteger(entry.zone));
    const hasSchedule = this.drawSlots.length > 0;
    const isPublished = this.currentTournament?.status === 'published';

    return [
      { label: 'Tournament Information', state: hasDetails ? 'ok' : 'warn' },
      { label: 'Locations', state: hasLocations ? 'ok' : 'warn' },
      { label: 'Bowlers Configured', state: hasBowlers ? 'ok' : 'warn' },
      { label: 'All Bowlers Have Zones', state: allBowlersHaveZone ? 'ok' : 'warn' },
      { label: 'Schedule Complete', state: hasSchedule ? 'ok' : 'warn' },
      { label: 'Published', state: isPublished ? 'ok' : 'error' },
    ];
  }

  get filteredRoster(): TournamentRosterRecord[] {
    const search = this.bowlerSearch.trim().toLowerCase();
    if (!search) return this.roster;

    return this.roster.filter((entry) => {
      const name = String(entry.name || '').toLowerCase();
      const team = String(entry.team || '').toLowerCase();
      const c5Number = String(entry.c5Number || '').toLowerCase();
      return (
        name.includes(search) ||
        team.includes(search) ||
        c5Number.includes(search) ||
        String(entry.zone).includes(search) ||
        String(entry.bowlerId).includes(search)
      );
    });
  }

  get tournamentCardStats(): Record<number, { zoneCount: number; bowlerCount: number; scheduleLabel: string }> {
    const stats: Record<number, { zoneCount: number; bowlerCount: number; scheduleLabel: string }> = {};

    for (const tournament of this.tournaments) {
      const zoneCount = new Set((tournament.TournamentBowlers || []).map((entry) => entry.zone)).size;
      const bowlerCount = tournament.TournamentBowlers?.length || 0;
      const hasSchedule = Boolean(tournament.LaneDrawSlots?.length);
      stats[tournament.id] = {
        zoneCount,
        bowlerCount,
        scheduleLabel: hasSchedule ? 'Complete' : 'Incomplete',
      };
    }

    if (this.currentTournamentId && this.currentTournament) {
      stats[this.currentTournamentId] = {
        zoneCount: this.uniqueZoneCount,
        bowlerCount: this.roster.length,
        scheduleLabel: this.drawSlots.length ? 'Complete' : 'Incomplete',
      };
    }

    return stats;
  }

  private showToast(message: string, tone: MessageTone, options: ToastOptions = {}) {
    this.tone = tone;
    this.message = message;
    this.toastSticky = Boolean(options.sticky);
    this.toastAutoHideDuration = options.autoHideDuration ?? 5000;
    this.toastOpen = Boolean(message);
  }

  setInfo(message: string, options: ToastOptions = {}) {
    this.showToast(message, 'success', options);
  }

  setWarning(message: string, options: ToastOptions = {}) {
    this.showToast(message, 'warning', { sticky: true, ...options });
  }

  setError(message: string, options: ToastOptions = {}) {
    this.showToast(message, 'error', { sticky: true, ...options });
  }

  dismissToast() {
    this.toastOpen = false;
  }

  clearMessage() {
    this.message = '';
    this.toastOpen = false;
    this.toastSticky = false;
    this.toastAutoHideDuration = 5000;
  }

  setBowlerSearch(value: string) {
    this.bowlerSearch = value;
  }

  setActiveTab(tab: WorkspaceTab) {
    this.activeTab = tab;
    if (this.mode === 'workspace' && this.currentTournamentId) {
      pushRoute(this.mode, this.currentTournamentId, tab);
    }
  }

  setTournamentField<K extends keyof TournamentFormState>(field: K, value: TournamentFormState[K]) {
    this.tournamentForm[field] = value;
  }

  setLocationField<K extends keyof LocationFormState>(field: K, value: LocationFormState[K]) {
    this.locationForm[field] = value;
  }

  setBowlerField<K extends keyof BowlerFormState>(field: K, value: BowlerFormState[K]) {
    this.bowlerForm[field] = value;

    if (field === 'isCoach') {
      this.bowlerForm.position = (value ? '0' : String(TOURNAMENT_POSITION_OPTIONS[0])) as BowlerFormState['position'];
    }

    if (field === 'position' && this.bowlerForm.isCoach) {
      this.bowlerForm.position = '0';
    }

    this.bowlerForm.bowlerId = this.computedBowlerId;
  }

  setDrawSlotField<K extends keyof DrawSlotFormState>(field: K, value: DrawSlotFormState[K]) {
    this.drawSlotForm[field] = value;
  }

  hydrateTournamentForm() {
    if (this.mode === 'create') {
      this.tournamentForm = { ...defaultTournamentForm };
      return;
    }

    if (this.currentTournament) {
      this.tournamentForm = {
        name: this.currentTournament.name || '',
        startDate: this.currentTournament.startDate || '',
        endDate: this.currentTournament.endDate || '',
      };
    }
  }

  syncFromUrl() {
    const route = parseRouteFromUrl();
    this.mode = route.mode;
    this.currentTournamentId = route.tournamentId;
    this.activeTab = route.tab;
    this.clearMessage();

    this.hydrateTournamentForm();
    void this.loadWorkspaceDataIfNeeded();
  }

  openList() {
    this.mode = 'list';
    this.currentTournamentId = null;
    this.activeTab = 'overview';
    this.clearMessage();
    this.resetEditors();
    pushRoute('list', null, 'overview');
  }

  openCreate() {
    this.mode = 'create';
    this.currentTournamentId = null;
    this.activeTab = 'overview';
    this.clearMessage();
    this.tournamentForm = { ...defaultTournamentForm };
    this.locationForm = { ...defaultLocationForm };
    this.resetEditors();
    pushRoute('create', null, 'overview');
  }

  openWorkspace(tournamentId: number, tab: WorkspaceTab = 'overview') {
    this.mode = 'workspace';
    this.currentTournamentId = tournamentId;
    this.activeTab = tab;
    this.clearMessage();
    this.resetEditors();
    pushRoute('workspace', tournamentId, tab);
    this.hydrateTournamentForm();
    void this.loadWorkspaceData();
  }

  resetEditors() {
    this.editingLocationId = null;
    this.editingRosterId = null;
    this.editingDrawSlotId = null;
  }

  async loadInitialData() {
    runInAction(() => {
      this.loading = true;
    });

    try {
      const tournaments = await listTournaments();
      runInAction(() => {
        this.tournaments = tournaments;
        this.hydrateTournamentForm();
      });

      if (this.mode === 'workspace' && !this.currentTournamentId) {
        if (tournaments.length > 0) {
          this.openWorkspace(tournaments[0].id);
        } else {
          this.openCreate();
        }
        return;
      }

      await this.loadWorkspaceDataIfNeeded();
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  async loadWorkspaceDataIfNeeded() {
    if (!this.currentTournamentId || this.mode !== 'workspace') return;
    await this.loadWorkspaceData();
  }

  async loadWorkspaceData() {
    if (!this.currentTournamentId) return;

    runInAction(() => {
      this.workspaceLoading = true;
    });

    try {
      const [setup, validation] = await Promise.all([
        getTournamentSetup(this.currentTournamentId),
        getPublishValidation(this.currentTournamentId),
      ]);

      runInAction(() => {
        this.roster = setup.roster;
        this.drawSlots = setup.drawSlots;
        this.publishValidation = validation;

        this.tournaments = this.tournaments.map((item) =>
          item.id === setup.tournament.id
            ? {
                ...item,
                ...setup.tournament,
              }
            : item,
        );

        if (!this.tournaments.some((item) => item.id === setup.tournament.id)) {
          this.tournaments.unshift(setup.tournament);
        }

        this.hydrateTournamentForm();
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.workspaceLoading = false;
      });
    }
  }

  async refreshTournaments() {
    const data = await listTournaments();
    runInAction(() => {
      this.tournaments = data;
      this.hydrateTournamentForm();
    });
  }

  startLocationEdit(location: LocationRecord) {
    this.editingLocationId = location.id;
    this.locationForm = {
      name: location.name,
      address: location.address || '',
      laneCount: location.laneCount === null ? '' : String(location.laneCount),
      notes: location.notes || '',
    };
  }

  cancelLocationEdit() {
    this.editingLocationId = null;
    this.locationForm = { ...defaultLocationForm };
  }

  startRosterEdit(entry: TournamentRosterRecord) {
    this.editingRosterId = entry.id;
    this.bowlerForm = {
      bowlerId: String(entry.bowlerId),
      c5Number: entry.c5Number || '',
      name: entry.name || '',
      zone: String(entry.zone),
      isCoach: Boolean(entry.isCoach),
      team: getRosterTeam(entry.team),
      position: getPositionFromBowlerId(entry.bowlerId, Boolean(entry.isCoach)),
      isSinglesEligible: Boolean(entry.isSinglesEligible),
    };
  }

  cancelRosterEdit() {
    this.editingRosterId = null;
    this.bowlerForm = { ...defaultBowlerForm };
    this.bowlerForm.bowlerId = this.computedBowlerId;
  }

  startDrawSlotEdit(slot: DrawSlotRecord) {
    this.editingDrawSlotId = slot.id;
    this.drawSlotForm = {
      division: slot.division,
      eventType: slot.eventType,
      blockCode: slot.blockCode,
      slotCode: slot.slotCode || '',
      lane: String(slot.lane),
      sideABowlerId: slot.sideABowlerId === null ? '' : String(slot.sideABowlerId),
      sideBBowlerId: slot.sideBBowlerId === null ? '' : String(slot.sideBBowlerId),
      scheduledAt: slot.scheduledAt ? String(slot.scheduledAt).slice(0, 16) : '',
      status: slot.status,
    };
  }

  cancelDrawSlotEdit() {
    this.editingDrawSlotId = null;
    this.drawSlotForm = { ...defaultDrawSlotForm };
  }

  async saveTournamentDetails() {
    if (this.mode === 'workspace' && this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    runInAction(() => {
      this.submitting = true;
    });

    try {
      if (this.mode === 'create') {
        const payload: TournamentPayload = {
          name: this.tournamentForm.name,
          startDate: this.tournamentForm.startDate || null,
          endDate: this.tournamentForm.endDate || null,
          status: 'draft',
          locations: this.locationForm.name
            ? [
                {
                  name: this.locationForm.name,
                  address: this.locationForm.address || null,
                  laneCount: Number.isInteger(Number(this.locationForm.laneCount))
                    ? Number(this.locationForm.laneCount)
                    : null,
                  notes: this.locationForm.notes || null,
                },
              ]
            : [],
        };

        const result = await createTournament(payload);
        await this.refreshTournaments();
        runInAction(() => {
          this.setInfo('Tournament created.');
          this.locationForm = { ...defaultLocationForm };
          this.openWorkspace(result.tournament.id);
        });
        return;
      }

      if (this.currentTournamentId) {
        await updateTournament(this.currentTournamentId, {
          name: this.tournamentForm.name,
          startDate: this.tournamentForm.startDate || null,
          endDate: this.tournamentForm.endDate || null,
          status: this.currentTournament?.status || 'draft',
        });
        await this.refreshTournaments();
        await this.loadWorkspaceData();
        runInAction(() => {
          this.setInfo('Tournament details saved.');
        });
      }
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async saveLocation() {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    runInAction(() => {
      this.submitting = true;
    });

    try {
      const payload = {
        name: this.locationForm.name,
        address: this.locationForm.address || null,
        laneCount: Number.isInteger(Number(this.locationForm.laneCount)) ? Number(this.locationForm.laneCount) : null,
        notes: this.locationForm.notes || null,
      };

      if (this.editingLocationId) {
        await updateLocation(this.currentTournamentId, this.editingLocationId, payload);
        this.setInfo('Location updated.');
      } else {
        await createLocation(this.currentTournamentId, payload);
        this.setInfo('Location created.');
      }

      await this.refreshTournaments();
      await this.loadWorkspaceData();
      runInAction(() => {
        this.cancelLocationEdit();
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async removeLocationById(locationId: number) {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    const confirmed = window.confirm('Remove this location from the tournament?');
    if (!confirmed) return;

    runInAction(() => {
      this.submitting = true;
    });

    try {
      await deleteLocation(this.currentTournamentId, locationId);
      await this.refreshTournaments();
      await this.loadWorkspaceData();
      runInAction(() => {
        this.setInfo('Location removed.');
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async saveBowlerAndRoster() {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    runInAction(() => {
      this.submitting = true;
    });

    try {
      if (!this.computedBowlerId) {
        this.setError('Zone, team, and position are required to determine the Bowler Id.');
        return;
      }

      const normalizedBowlerId = Number(this.computedBowlerId);
      const hasDuplicateBowlerId = this.roster.some(
        (entry) => entry.bowlerId === normalizedBowlerId && entry.id !== this.editingRosterId,
      );
      if (hasDuplicateBowlerId) {
        this.setError(`Bowler Id ${normalizedBowlerId} already exists in this tournament.`);
        return;
      }

      const rosterPayload = {
        bowlerId: normalizedBowlerId,
        zone: Number(this.bowlerForm.zone),
        team: this.bowlerForm.team,
        c5Number: this.bowlerForm.c5Number || null,
        name: this.bowlerForm.name,
        isCoach: this.bowlerForm.isCoach,
        role: this.bowlerForm.isCoach ? 'coach' : 'player',
        isSinglesEligible: this.bowlerForm.isSinglesEligible,
      };

      if (this.editingRosterId) {
        await updateRosterEntry(this.currentTournamentId, this.editingRosterId, rosterPayload);
      } else {
        await addOrUpdateRosterEntry(this.currentTournamentId, rosterPayload);
      }

      await this.loadWorkspaceData();
      runInAction(() => {
        this.cancelRosterEdit();
        this.setInfo('Bowler assignment saved.');
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async removeRosterEntryById(rosterId: number) {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    const confirmed = window.confirm('Remove this bowler from the tournament roster?');
    if (!confirmed) return;

    runInAction(() => {
      this.submitting = true;
    });

    try {
      await removeRosterEntry(this.currentTournamentId, rosterId);
      await this.loadWorkspaceData();
      runInAction(() => {
        this.setInfo('Bowler removed from roster.');
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async saveDrawSlot() {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    runInAction(() => {
      this.submitting = true;
    });

    try {
      const payload = {
        division: this.drawSlotForm.division,
        eventType: this.drawSlotForm.eventType,
        blockCode: this.drawSlotForm.blockCode,
        slotCode: this.drawSlotForm.slotCode || null,
        lane: Number(this.drawSlotForm.lane),
        sideATeamId: null,
        sideABowlerId: this.drawSlotForm.sideABowlerId ? Number(this.drawSlotForm.sideABowlerId) : null,
        sideBTeamId: null,
        sideBBowlerId: this.drawSlotForm.sideBBowlerId ? Number(this.drawSlotForm.sideBBowlerId) : null,
        scheduledAt: this.drawSlotForm.scheduledAt ? new Date(this.drawSlotForm.scheduledAt).toISOString() : null,
        status: this.drawSlotForm.status,
      };

      if (this.editingDrawSlotId) {
        await updateDrawSlot(this.currentTournamentId, this.editingDrawSlotId, payload);
        this.setInfo('Match updated.');
      } else {
        await createDrawSlot(this.currentTournamentId, payload);
        this.setInfo('Match added.');
      }

      await this.loadWorkspaceData();
      runInAction(() => {
        this.cancelDrawSlotEdit();
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async removeDrawSlotById(slotId: number) {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    const confirmed = window.confirm('Delete this match from the schedule?');
    if (!confirmed) return;

    runInAction(() => {
      this.submitting = true;
    });

    try {
      await removeDrawSlot(this.currentTournamentId, slotId);
      await this.loadWorkspaceData();
      runInAction(() => {
        this.setInfo('Match removed.');
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async lockCurrentTournament() {
    if (!this.currentTournamentId || this.isLocked) return;

    const confirmed = window.confirm(
      'Locking this tournament is irreversible. After locking, this tournament will be read-only. Continue?',
    );
    if (!confirmed) return;

    runInAction(() => {
      this.submitting = true;
    });

    try {
      await lockTournament(this.currentTournamentId);
      await this.refreshTournaments();
      await this.loadWorkspaceData();
      runInAction(() => {
        this.setInfo('Tournament locked. This tournament is now read-only.');
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async publishCurrentTournament() {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    runInAction(() => {
      this.submitting = true;
    });

    try {
      await publishTournament(this.currentTournamentId);
      await this.refreshTournaments();
      await this.loadWorkspaceData();
      runInAction(() => {
        this.setInfo('Tournament published.');
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  async unpublishCurrentTournament() {
    if (!this.currentTournamentId) return;
    if (this.isLocked) {
      this.setError('This tournament is locked and read-only.');
      return;
    }

    runInAction(() => {
      this.submitting = true;
    });

    try {
      await unpublishTournament(this.currentTournamentId);
      await this.refreshTournaments();
      await this.loadWorkspaceData();
      runInAction(() => {
        this.setInfo('Tournament moved back to Ready to Publish.');
      });
    } catch (error) {
      runInAction(() => {
        this.setError((error as Error).message);
      });
    } finally {
      runInAction(() => {
        this.submitting = false;
      });
    }
  }

  getStatusLabel(rawStatus: string | null | undefined) {
    return mapStatus(rawStatus);
  }
}
