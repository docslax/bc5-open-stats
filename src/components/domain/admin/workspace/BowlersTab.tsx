import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { CheckIcon, XIcon, WarningDiamondIcon } from '@phosphor-icons/react';
import { observer } from 'mobx-react-lite';
import { JSX, type SyntheticEvent, useEffect, useMemo, useState } from 'react';
import {
  TOURNAMENT_POSITION_OPTIONS,
  TOURNAMENT_TEAM_OPTIONS,
  TOURNAMENT_ZONE_OPTIONS,
} from '@constants/tournamentAdmin';
import { TournamentAdminStore } from '@stores/admin/TournamentAdminStore';
import { TournamentRosterRecord } from '@services/adminApi';

type SearchScope = 'team' | 'zone' | 'tournament';

interface TeamProgress {
  zone: number;
  team: string;
  coaches: TournamentRosterRecord[];
  players: TournamentRosterRecord[];
  filledPositions: number;
  isComplete: boolean;
  status: 'complete' | 'partial' | 'empty';
}

interface BowlersTabProps {
  store: TournamentAdminStore;
}

function statusMarker(status: TeamProgress['status']): JSX.Element {
  if (status === 'complete') return <CheckIcon color="green" />;
  if (status === 'partial') return <WarningDiamondIcon color="orange" />;
  return <XIcon color="red" />;
}

function getTeamLabel(team: string): string {
  return `${team} Team`;
}

function normalizeTeam(team: string): string {
  const normalized = String(team || '').trim();
  const exact = TOURNAMENT_TEAM_OPTIONS.find((option) => option.value === normalized);
  if (exact) return exact.value;

  const fallback = TOURNAMENT_TEAM_OPTIONS.find((option) => option.value.toLowerCase() === normalized.toLowerCase());

  return fallback?.value || TOURNAMENT_TEAM_OPTIONS[0].value;
}

function getPositionFromBowlerId(entry: TournamentRosterRecord): number {
  if (entry.isCoach) return 0;
  const digit = Number(String(entry.bowlerId || '').slice(-1));
  return Number.isInteger(digit) && digit >= 1 && digit <= 9 ? digit : Number.MAX_SAFE_INTEGER;
}

export const BowlersTab = observer(function BowlersTab({ store }: BowlersTabProps) {
  const [selectedZone, setSelectedZone] = useState<number>(TOURNAMENT_ZONE_OPTIONS[0]);
  const [selectedTeam, setSelectedTeam] = useState<string>(TOURNAMENT_TEAM_OPTIONS[0].value);
  const [expandedZones, setExpandedZones] = useState<number[]>([TOURNAMENT_ZONE_OPTIONS[0]]);

  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('team');

  const [dialogOpen, setDialogOpen] = useState(false);

  const zones = useMemo(() => {
    const set = new Set<number>(TOURNAMENT_ZONE_OPTIONS);

    for (const entry of store.roster) {
      if (Number.isInteger(entry.zone)) {
        set.add(entry.zone);
      }
    }

    return Array.from(set).sort((left, right) => left - right);
  }, [store.roster]);

  const progressByTeam = useMemo<TeamProgress[]>(() => {
    const rows: TeamProgress[] = [];

    for (const zone of zones) {
      for (const teamOption of TOURNAMENT_TEAM_OPTIONS) {
        const team = teamOption.value;
        const entries = store.roster.filter((entry) => entry.zone === zone && normalizeTeam(entry.team) === team);
        const coaches = entries
          .filter((entry) => entry.isCoach)
          .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')));
        const players = entries
          .filter((entry) => !entry.isCoach)
          .sort((left, right) => getPositionFromBowlerId(left) - getPositionFromBowlerId(right));

        const filledPositions = (coaches.length > 0 ? 1 : 0) + Math.min(players.length, 6);
        const isComplete = coaches.length > 0 && players.length >= 6;

        rows.push({
          zone,
          team,
          coaches,
          players,
          filledPositions,
          isComplete,
          status: isComplete ? 'complete' : filledPositions > 0 ? 'partial' : 'empty',
        });
      }
    }

    return rows;
  }, [store.roster, zones]);

  const defaultSelection = useMemo(() => {
    if (progressByTeam.length === 0) {
      return {
        zone: TOURNAMENT_ZONE_OPTIONS[0],
        team: TOURNAMENT_TEAM_OPTIONS[0].value,
      };
    }

    const firstPartial = progressByTeam.find((item) => item.status === 'partial');
    if (firstPartial) {
      return { zone: firstPartial.zone, team: firstPartial.team };
    }

    const firstEmpty = progressByTeam.find((item) => item.status === 'empty');
    if (firstEmpty) {
      return { zone: firstEmpty.zone, team: firstEmpty.team };
    }

    return { zone: progressByTeam[0].zone, team: progressByTeam[0].team };
  }, [progressByTeam]);

  useEffect(() => {
    setSelectedZone(defaultSelection.zone);
    setSelectedTeam(defaultSelection.team);
  }, [defaultSelection.zone, defaultSelection.team]);

  useEffect(() => {
    setExpandedZones((current) => {
      if (current.includes(selectedZone)) return current;
      return [...current, selectedZone];
    });
  }, [selectedZone]);

  const selectedTeamProgress =
    progressByTeam.find((item) => item.zone === selectedZone && item.team === selectedTeam) ||
    progressByTeam[0] ||
    null;

  const totalTeamCount = zones.length * TOURNAMENT_TEAM_OPTIONS.length;
  const completedTeamCount = progressByTeam.filter((item) => item.isComplete).length;
  const filledRosterPositions = progressByTeam.reduce((total, item) => total + item.filledPositions, 0);
  const requiredRosterPositions = totalTeamCount * 7;
  const completionPercent = requiredRosterPositions
    ? Math.min(100, Math.round((filledRosterPositions / requiredRosterPositions) * 100))
    : 0;

  const scopedRoster = useMemo(() => {
    if (searchScope === 'team') {
      return store.roster.filter((entry) => entry.zone === selectedZone && normalizeTeam(entry.team) === selectedTeam);
    }

    if (searchScope === 'zone') {
      return store.roster.filter((entry) => entry.zone === selectedZone);
    }

    return store.roster;
  }, [searchScope, selectedZone, selectedTeam, store.roster]);

  const filteredScopedRoster = useMemo(() => {
    const search = activeSearch.trim().toLowerCase();
    if (!search) {
      return scopedRoster;
    }

    return scopedRoster.filter((entry) => {
      const name = String(entry.name || '').toLowerCase();
      const c5Number = String(entry.c5Number || '').toLowerCase();
      const team = String(entry.team || '').toLowerCase();

      return (
        name.includes(search) ||
        c5Number.includes(search) ||
        team.includes(search) ||
        String(entry.zone).includes(search) ||
        String(entry.bowlerId).includes(search)
      );
    });
  }, [activeSearch, scopedRoster]);

  const coachRoster = useMemo(
    () =>
      filteredScopedRoster
        .filter((entry) => entry.zone === selectedZone && normalizeTeam(entry.team) === selectedTeam && entry.isCoach)
        .sort((left, right) => String(left.name || '').localeCompare(String(right.name || ''))),
    [filteredScopedRoster, selectedZone, selectedTeam],
  );

  const playerRoster = useMemo(
    () =>
      filteredScopedRoster
        .filter((entry) => entry.zone === selectedZone && normalizeTeam(entry.team) === selectedTeam && !entry.isCoach)
        .sort((left, right) => getPositionFromBowlerId(left) - getPositionFromBowlerId(right)),
    [filteredScopedRoster, selectedZone, selectedTeam],
  );

  const externalSearchResults =
    activeSearch && searchScope !== 'team'
      ? filteredScopedRoster
          .filter((entry) => !(entry.zone === selectedZone && normalizeTeam(entry.team) === selectedTeam))
          .sort(
            (left, right) =>
              left.zone - right.zone || normalizeTeam(left.team).localeCompare(normalizeTeam(right.team)),
          )
      : [];

  const dialogTitle = store.editingRosterId
    ? 'Edit Roster Member'
    : store.bowlerForm.isCoach
      ? 'Add Coach'
      : 'Add Player';

  function selectTeam(zone: number, team: string) {
    setSelectedZone(zone);
    setSelectedTeam(team);
  }

  function toggleZone(zone: number) {
    setExpandedZones((current) =>
      current.includes(zone) ? current.filter((value) => value !== zone) : [...current, zone],
    );
  }

  function primeFormForSelection(isCoach: boolean) {
    store.cancelRosterEdit();
    store.setBowlerField('zone', String(selectedZone));
    store.setBowlerField('team', selectedTeam);
    store.setBowlerField('name', '');
    store.setBowlerField('c5Number', '');
    store.setBowlerField('isSinglesEligible', false);
    store.setBowlerField('isCoach', isCoach);
    store.setBowlerField('position', isCoach ? '0' : String(TOURNAMENT_POSITION_OPTIONS[0]));
  }

  function openAddCoach() {
    primeFormForSelection(true);
    setDialogOpen(true);
  }

  function openAddPlayer() {
    primeFormForSelection(false);
    setDialogOpen(true);
  }

  function openEdit(entry: TournamentRosterRecord) {
    setSelectedZone(entry.zone);
    setSelectedTeam(normalizeTeam(entry.team));
    store.startRosterEdit(entry);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    store.cancelRosterEdit();
  }

  async function saveFromDialog(keepOpen: boolean) {
    const wasEditing = Boolean(store.editingRosterId);
    const previousCount = store.roster.length;
    await store.saveBowlerAndRoster();

    if (store.tone === 'error') {
      return;
    }

    if (wasEditing || !keepOpen) {
      closeDialog();
      return;
    }

    if (store.roster.length >= previousCount) {
      primeFormForSelection(false);
      return;
    }

    closeDialog();
  }

  function onSearch(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setActiveSearch(searchInput.trim());
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Stack spacing={1.25}>
          <Typography variant="h3">Tournament Bowlers</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Total Zones: {zones.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Teams Complete: {completedTeamCount} / {totalTeamCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Rostered Bowlers + Coaches: {filledRosterPositions} / {requiredRosterPositions}
            </Typography>
          </Stack>
          <Box>
            <LinearProgress variant="determinate" value={completionPercent} sx={{ height: 10, borderRadius: 999 }} />
            <Typography variant="caption" color="text.secondary">
              {completionPercent}% complete
            </Typography>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Box component="form" onSubmit={onSearch}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              label="Search Bowlers"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              fullWidth
            />
            <FormControl sx={{ minWidth: 220 }}>
              <InputLabel id="bowler-search-scope-label">Scope</InputLabel>
              <Select
                labelId="bowler-search-scope-label"
                label="Scope"
                value={searchScope}
                onChange={(event) => setSearchScope(event.target.value as SearchScope)}
              >
                <MenuItem value="team">Current Team</MenuItem>
                <MenuItem value="zone">Current Zone</MenuItem>
                <MenuItem value="tournament">Entire Tournament</MenuItem>
              </Select>
            </FormControl>
            <Button type="submit" variant="contained">
              Search
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                setSearchInput('');
                setActiveSearch('');
              }}
            >
              Clear
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ alignItems: 'stretch' }}>
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', lg: 360 },
            flexShrink: 0,
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2.5,
            maxHeight: 720,
            overflowY: 'auto',
          }}
        >
          {zones.map((zone) => {
            const teams = progressByTeam.filter((item) => item.zone === zone);
            const expanded = expandedZones.includes(zone);

            return (
              <Accordion key={zone} expanded={expanded} onChange={() => toggleZone(zone)} disableGutters elevation={0}>
                <AccordionSummary>
                  <Typography sx={{ fontWeight: 700 }}>Zone {zone}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 1 }}>
                  <Stack spacing={0.6}>
                    {teams.map((teamItem) => {
                      const selected = selectedZone === zone && selectedTeam === teamItem.team;
                      return (
                        <Button
                          key={`${zone}-${teamItem.team}`}
                          variant={selected ? 'contained' : 'text'}
                          color={selected ? 'primary' : 'inherit'}
                          onClick={() => selectTeam(zone, teamItem.team)}
                          sx={{
                            justifyContent: 'space-between',
                            textTransform: 'none',
                            px: 1.2,
                            py: 0.8,
                            borderRadius: 1.5,
                          }}
                        >
                          <span>
                            {statusMarker(teamItem.status)} {getTeamLabel(teamItem.team)}
                          </span>
                          <span>{teamItem.filledPositions}/7</span>
                        </Button>
                      );
                    })}
                  </Stack>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Paper>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            p: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2.5,
            minHeight: 540,
          }}
        >
          {!selectedTeamProgress ? (
            <Typography color="text.secondary">No teams available.</Typography>
          ) : (
            <Stack spacing={2}>
              <Box>
                <Typography variant="h3">
                  Zone {selectedTeamProgress.zone} {'>'} {getTeamLabel(selectedTeamProgress.team)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {selectedTeamProgress.filledPositions} positions filled
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={`${selectedTeamProgress.status.toUpperCase()}`}
                    color={
                      selectedTeamProgress.isComplete
                        ? 'success'
                        : selectedTeamProgress.status === 'partial'
                          ? 'warning'
                          : 'default'
                    }
                  />
                  <Chip size="small" label={`Players: ${selectedTeamProgress.players.length}/6`} />
                  <Chip
                    size="small"
                    label={`Coach: ${selectedTeamProgress.coaches.length > 0 ? 'Assigned' : 'Missing'}`}
                  />
                </Stack>
              </Box>

              <Divider />

              <Stack spacing={1}>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="h4">Coach</Typography>
                  <Button variant="outlined" onClick={openAddCoach} disabled={store.isLocked || store.submitting}>
                    {selectedTeamProgress.coaches.length > 0 ? 'Add Another Coach' : 'Add Coach'}
                  </Button>
                </Stack>

                {coachRoster.length === 0 ? (
                  <Typography color="text.secondary">No Coach Assigned</Typography>
                ) : (
                  <Stack spacing={1}>
                    {coachRoster.map((entry) => (
                      <Paper
                        key={entry.id}
                        elevation={0}
                        sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>
                              {entry.name || `Bowler #${entry.bowlerId}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              C5: {entry.c5Number || '-'}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" onClick={() => openEdit(entry)} disabled={store.isLocked}>
                              Edit
                            </Button>
                            <Button
                              color="error"
                              variant="outlined"
                              onClick={() => void store.removeRosterEntryById(entry.id)}
                              disabled={store.isLocked}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>

              <Divider />

              <Stack spacing={1}>
                <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
                  <Typography variant="h4">Players</Typography>
                  <Button variant="contained" onClick={openAddPlayer} disabled={store.isLocked || store.submitting}>
                    Add Player
                  </Button>
                </Stack>

                {playerRoster.length === 0 ? (
                  <Typography color="text.secondary">No players added yet.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {playerRoster.map((entry, index) => (
                      <Paper
                        key={entry.id}
                        elevation={0}
                        sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                      >
                        <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
                          <Box>
                            <Typography sx={{ fontWeight: 700 }}>
                              {index + 1}. {entry.name || `Bowler #${entry.bowlerId}`}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Position:{' '}
                              {getPositionFromBowlerId(entry) === Number.MAX_SAFE_INTEGER
                                ? '-'
                                : getPositionFromBowlerId(entry)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              C5: {entry.c5Number || '-'}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" onClick={() => openEdit(entry)} disabled={store.isLocked}>
                              Edit
                            </Button>
                            <Button
                              color="error"
                              variant="outlined"
                              onClick={() => void store.removeRosterEntryById(entry.id)}
                              disabled={store.isLocked}
                            >
                              Remove
                            </Button>
                          </Stack>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Stack>

              {externalSearchResults.length > 0 ? (
                <>
                  <Divider />
                  <Stack spacing={1}>
                    <Typography variant="h4">Search Results Outside Current Team</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {searchScope === 'zone'
                        ? 'Showing matches from other teams in this zone.'
                        : 'Showing matches from other zones and teams in this tournament.'}
                    </Typography>
                    <Stack spacing={1}>
                      {externalSearchResults.map((entry) => (
                        <Paper
                          key={`search-${entry.id}`}
                          elevation={0}
                          sx={{ p: 1.25, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
                        >
                          <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            sx={{ justifyContent: 'space-between', gap: 1 }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 700 }}>
                                {entry.name || `Bowler #${entry.bowlerId}`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Zone {entry.zone} {'>'} {getTeamLabel(normalizeTeam(entry.team))}
                              </Typography>
                            </Box>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                selectTeam(entry.zone, normalizeTeam(entry.team));
                                openEdit(entry);
                              }}
                            >
                              Open
                            </Button>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </>
              ) : null}
            </Stack>
          )}
        </Paper>
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>{dialogTitle}</DialogTitle>
        <Box component="form" onSubmit={(event) => event.preventDefault()}>
          <DialogContent>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Zone {selectedZone} {'>'} {getTeamLabel(selectedTeam)}
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="C5 Number"
                  type="number"
                  value={store.bowlerForm.c5Number}
                  onChange={(event) => store.setBowlerField('c5Number', event.target.value)}
                  disabled={store.submitting || store.isLocked}
                  fullWidth
                />
                <TextField
                  label="Bowler Id"
                  value={store.computedBowlerId}
                  slotProps={{ input: { readOnly: true } }}
                  disabled
                  fullWidth
                />
              </Stack>

              <TextField
                label="Name"
                value={store.bowlerForm.name}
                required
                onChange={(event) => store.setBowlerField('name', event.target.value)}
                disabled={store.submitting || store.isLocked}
                fullWidth
              />

              <FormControl fullWidth disabled={store.submitting || store.isLocked || store.bowlerForm.isCoach}>
                <InputLabel id="bowler-position-dialog-label">Position</InputLabel>
                <Select
                  labelId="bowler-position-dialog-label"
                  label="Position"
                  value={store.bowlerForm.isCoach ? '0' : store.bowlerForm.position}
                  onChange={(event) => store.setBowlerField('position', String(event.target.value))}
                >
                  {TOURNAMENT_POSITION_OPTIONS.map((position) => (
                    <MenuItem key={position} value={String(position)}>
                      {position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={store.bowlerForm.isCoach}
                      onChange={(event) => store.setBowlerField('isCoach', event.target.checked)}
                      disabled={store.submitting || store.isLocked}
                    />
                  }
                  label="Coach"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={store.bowlerForm.isSinglesEligible}
                      onChange={(event) => store.setBowlerField('isSinglesEligible', event.target.checked)}
                      disabled={store.submitting || store.isLocked}
                    />
                  }
                  label="Singles Eligible"
                />
              </Stack>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} variant="outlined" disabled={store.submitting}>
              Cancel
            </Button>
            {!store.editingRosterId && !store.bowlerForm.isCoach ? (
              <Button
                variant="outlined"
                onClick={() => void saveFromDialog(true)}
                disabled={store.submitting || store.isLocked}
              >
                Save and Add Another
              </Button>
            ) : null}
            <Button
              variant="contained"
              onClick={() => void saveFromDialog(false)}
              disabled={store.submitting || store.isLocked}
            >
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Stack>
  );
});
