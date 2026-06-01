export interface LocationRecord {
  id: number;
  name: string;
  address: string | null;
  laneCount: number | null;
  notes: string | null;
}

export interface TournamentRecord {
  id: number;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  isLocked: boolean;
  Locations?: LocationRecord[];
  TournamentBowlers?: Array<{ id: number; zone: number }>;
  LaneDrawSlots?: Array<{ id: number }>;
}

export interface TournamentPayload {
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  locations?: Array<{
    name: string;
    address?: string | null;
    laneCount?: number | null;
    notes?: string | null;
  }>;
}

export interface TournamentRosterRecord {
  id: number;
  tournamentYearId: number;
  teamId: number | null;
  bowlerId: number;
  zone: number;
  team: string;
  c5Number: string | null;
  name: string;
  isCoach: boolean;
  role: string;
  isSinglesEligible: boolean;
}

export interface DrawSlotRecord {
  id: number;
  tournamentYearId: number;
  division: string;
  eventType: 'team' | 'singles';
  blockCode: string;
  slotCode: string | null;
  lane: number;
  sideATeamId: number | null;
  sideABowlerId: number | null;
  sideBTeamId: number | null;
  sideBBowlerId: number | null;
  scheduledAt: string | null;
  status: string;
  sideABowler?: Pick<TournamentRosterRecord, 'bowlerId' | 'name'>;
  sideBBowler?: Pick<TournamentRosterRecord, 'bowlerId' | 'name'>;
}

export interface TournamentSetupResponse {
  tournament: TournamentRecord;
  roster: TournamentRosterRecord[];
  drawSlots: DrawSlotRecord[];
}

export interface PublishValidationResponse {
  checks: {
    detailsComplete: boolean;
    locationsConfigured: boolean;
    bowlersConfigured: boolean;
    allBowlersHaveZones: boolean;
    scheduleComplete: boolean;
  };
  canPublish: boolean;
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as {
    error?: string;
  } & T;

  if (!response.ok) {
    throw new Error(payload.error || `Request failed (${response.status})`);
  }

  return payload;
}

export async function listTournaments(): Promise<TournamentRecord[]> {
  return requestJson<TournamentRecord[]>('/api/tournaments', { method: 'GET' });
}

export async function createTournament(payload: TournamentPayload): Promise<{ tournament: TournamentRecord }> {
  return requestJson<{ tournament: TournamentRecord }>('/api/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateTournament(
  tournamentId: number,
  payload: Omit<TournamentPayload, 'locations'>,
): Promise<TournamentRecord> {
  return requestJson<TournamentRecord>(`/api/tournaments/${tournamentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function lockTournament(tournamentId: number): Promise<TournamentRecord> {
  return requestJson<TournamentRecord>(`/api/tournaments/${tournamentId}/lock`, {
    method: 'POST',
  });
}

export async function getTournamentSetup(tournamentId: number): Promise<TournamentSetupResponse> {
  return requestJson<TournamentSetupResponse>(`/api/tournaments/${tournamentId}/setup`, {
    method: 'GET',
  });
}

export async function createLocation(
  tournamentId: number,
  payload: Pick<LocationRecord, 'name' | 'address' | 'laneCount' | 'notes'>,
): Promise<LocationRecord> {
  return requestJson<LocationRecord>(`/api/tournaments/${tournamentId}/locations`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLocation(
  tournamentId: number,
  locationId: number,
  payload: Pick<LocationRecord, 'name' | 'address' | 'laneCount' | 'notes'>,
): Promise<LocationRecord> {
  return requestJson<LocationRecord>(`/api/tournaments/${tournamentId}/locations/${locationId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteLocation(tournamentId: number, locationId: number): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(`/api/tournaments/${tournamentId}/locations/${locationId}`, {
    method: 'DELETE',
  });
}

export async function addOrUpdateRosterEntry(
  tournamentId: number,
  payload: Pick<
    TournamentRosterRecord,
    'bowlerId' | 'zone' | 'team' | 'c5Number' | 'name' | 'isCoach' | 'role' | 'isSinglesEligible'
  >,
): Promise<TournamentRosterRecord> {
  return requestJson<TournamentRosterRecord>(`/api/tournaments/${tournamentId}/roster`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function removeRosterEntry(tournamentId: number, rosterId: number): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(`/api/tournaments/${tournamentId}/roster/${rosterId}`, {
    method: 'DELETE',
  });
}

export async function updateRosterEntry(
  tournamentId: number,
  rosterId: number,
  payload: Pick<
    TournamentRosterRecord,
    'bowlerId' | 'zone' | 'team' | 'c5Number' | 'name' | 'isCoach' | 'role' | 'isSinglesEligible'
  >,
): Promise<TournamentRosterRecord> {
  return requestJson<TournamentRosterRecord>(`/api/tournaments/${tournamentId}/roster/${rosterId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createDrawSlot(
  tournamentId: number,
  payload: Omit<DrawSlotRecord, 'id' | 'tournamentYearId' | 'sideATeam' | 'sideBTeam' | 'sideABowler' | 'sideBBowler'>,
): Promise<DrawSlotRecord> {
  return requestJson<DrawSlotRecord>(`/api/tournaments/${tournamentId}/draw-slots`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateDrawSlot(
  tournamentId: number,
  slotId: number,
  payload: Omit<DrawSlotRecord, 'id' | 'tournamentYearId' | 'sideATeam' | 'sideBTeam' | 'sideABowler' | 'sideBBowler'>,
): Promise<DrawSlotRecord> {
  return requestJson<DrawSlotRecord>(`/api/tournaments/${tournamentId}/draw-slots/${slotId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function removeDrawSlot(tournamentId: number, slotId: number): Promise<{ ok: true }> {
  return requestJson<{ ok: true }>(`/api/tournaments/${tournamentId}/draw-slots/${slotId}`, {
    method: 'DELETE',
  });
}

export async function getPublishValidation(tournamentId: number): Promise<PublishValidationResponse> {
  return requestJson<PublishValidationResponse>(`/api/tournaments/${tournamentId}/publish-validation`, {
    method: 'GET',
  });
}

export async function publishTournament(
  tournamentId: number,
): Promise<{ tournament: TournamentRecord; validation: PublishValidationResponse }> {
  return requestJson<{ tournament: TournamentRecord; validation: PublishValidationResponse }>(
    `/api/tournaments/${tournamentId}/publish`,
    {
      method: 'POST',
    },
  );
}

export async function unpublishTournament(tournamentId: number): Promise<TournamentRecord> {
  return requestJson<TournamentRecord>(`/api/tournaments/${tournamentId}/unpublish`, {
    method: 'POST',
  });
}
