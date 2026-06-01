import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { type SyntheticEvent, useEffect, useMemo } from 'react';
import { AppToast } from '@components/shared/AppToast';
import { TournamentAdminStore, WorkspaceTab } from '@stores/admin/TournamentAdminStore';
import { BowlersTab } from './workspace/BowlersTab';
import { LocationsTab } from './workspace/LocationsTab';
import { OverviewTab } from './workspace/OverviewTab';
import { PublishTab } from './workspace/PublishTab';
import { ScheduleTab } from './workspace/ScheduleTab';

function statusChipColor(status: string): 'default' | 'primary' | 'success' | 'warning' {
  if (status === 'published') return 'success';
  if (status === 'ready_to_publish') return 'primary';
  if (status === 'in_progress') return 'primary';
  if (status === 'archived') return 'default';
  return 'warning';
}

function renderWorkspaceTab(store: TournamentAdminStore, tab: WorkspaceTab) {
  if (tab === 'overview') return <OverviewTab store={store} />;
  if (tab === 'locations') return <LocationsTab store={store} />;
  if (tab === 'bowlers') return <BowlersTab store={store} />;
  if (tab === 'schedule') return <ScheduleTab store={store} />;
  return <PublishTab store={store} />;
}

function renderCreateForm(
  store: TournamentAdminStore,
  onSubmit: (event: SyntheticEvent<HTMLFormElement, SubmitEvent>) => void,
) {
  return (
    <Box component="form" onSubmit={onSubmit}>
      <Stack spacing={2}>
        <TextField
          label="Tournament name"
          value={store.tournamentForm.name}
          required
          onChange={(event) => store.setTournamentField('name', event.target.value)}
          disabled={store.submitting}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Start date"
            type="date"
            value={store.tournamentForm.startDate}
            onChange={(event) => store.setTournamentField('startDate', event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
            disabled={store.submitting}
          />

          <TextField
            label="End date"
            type="date"
            value={store.tournamentForm.endDate}
            onChange={(event) => store.setTournamentField('endDate', event.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
            disabled={store.submitting}
          />
        </Stack>

        <Typography variant="h4">Optional first location</Typography>
        <TextField
          label="Location name"
          value={store.locationForm.name}
          onChange={(event) => store.setLocationField('name', event.target.value)}
          disabled={store.submitting}
        />
        <TextField
          label="Address"
          value={store.locationForm.address}
          onChange={(event) => store.setLocationField('address', event.target.value)}
          disabled={store.submitting}
        />

        <Stack direction="row" spacing={1.25}>
          <Button type="submit" variant="contained" disabled={store.submitting}>
            Create tournament
          </Button>
          <Button type="button" variant="outlined" onClick={store.openList} disabled={store.submitting}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export const TournamentAdminConsole = observer(function TournamentAdminConsole() {
  const store = useMemo(() => new TournamentAdminStore(), []);

  useEffect(() => {
    const handlePopState = () => {
      store.syncFromUrl();
    };

    void store.loadInitialData();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [store]);

  if (store.loading) {
    return (
      <Paper elevation={0} sx={{ p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={22} />
          <Typography>Loading tournament administration workspace…</Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.5 }}
        >
          <Box>
            <Typography variant="h2">Tournament Administration Workspace</Typography>
            <Typography color="text.secondary" variant="body2">
              Workspace-first administration with modular setup tabs.
            </Typography>
          </Box>
          {store.mode === 'list' ? (
            <Button variant="contained" onClick={store.openCreate}>
              Create tournament
            </Button>
          ) : (
            <Button variant="outlined" onClick={store.openList}>
              Switch tournament
            </Button>
          )}
        </Stack>
      </Paper>

      <AppToast
        open={store.toastOpen}
        message={store.message}
        tone={store.tone}
        sticky={store.toastSticky}
        autoHideDuration={store.toastAutoHideDuration}
        onClose={store.dismissToast}
      />

      {store.mode === 'list' ? (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Stack spacing={1.5}>
            {store.tournaments.length === 0 ? (
              <Typography color="text.secondary">No tournaments yet. Click Create tournament to start.</Typography>
            ) : (
              store.tournaments.map((tournament) => {
                const stats = store.tournamentCardStats[tournament.id] || {
                  zoneCount: new Set((tournament.TournamentBowlers || []).map((entry) => entry.zone)).size,
                  bowlerCount: tournament.TournamentBowlers?.length || 0,
                  scheduleLabel: tournament.LaneDrawSlots?.length ? 'Complete' : 'Incomplete',
                };

                return (
                  <Paper
                    key={tournament.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: 'background.default',
                    }}
                  >
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 1.5 }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{tournament.name}</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5, alignItems: 'center' }}>
                          <Chip
                            label={store.getStatusLabel(tournament.status)}
                            size="small"
                            color={statusChipColor(String(tournament.status || 'draft'))}
                          />
                          {tournament.isLocked ? <Chip label="Locked" size="small" color="error" /> : null}
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          {tournament.startDate || 'TBD'} to {tournament.endDate || 'TBD'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          Zones: {stats.zoneCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Bowlers: {stats.bowlerCount}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Schedule: {stats.scheduleLabel}
                        </Typography>
                      </Box>
                      <Button variant="outlined" onClick={() => store.openWorkspace(tournament.id)}>
                        Open
                      </Button>
                    </Stack>
                  </Paper>
                );
              })
            )}
          </Stack>
        </Paper>
      ) : null}

      {store.mode === 'create' ? (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h2" sx={{ mb: 0.5 }}>
            Create tournament
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
            Start a new tournament workspace.
          </Typography>
          {renderCreateForm(store, (event) => {
            event.preventDefault();
            void store.saveTournamentDetails();
          })}
        </Paper>
      ) : null}

      {store.mode === 'workspace' && store.currentTournament ? (
        <>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <Stack spacing={1.5}>
              <Typography color="text.secondary" variant="body2">
                Admin / Tournaments / {store.currentTournament.name}
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}
              >
                <Typography variant="h2">{store.currentTournament.name}</Typography>
                <Chip
                  label={store.getStatusLabel(store.currentTournament.status)}
                  color={statusChipColor(String(store.currentTournament.status || 'draft'))}
                />
              </Stack>
            </Stack>
          </Paper>

          {store.workspaceLoading ? (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <CircularProgress size={20} />
                <Typography>Loading workspace data…</Typography>
              </Stack>
            </Paper>
          ) : null}

          <Paper
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
          >
            <Tabs
              value={store.activeTab}
              onChange={(_, nextTab: WorkspaceTab) => store.setActiveTab(nextTab)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab value="overview" label="Overview" />
              <Tab value="bowlers" label="Bowlers" />
              <Tab value="schedule" label="Schedule" />
              <Tab value="locations" label="Locations" />
              <Tab value="publish" label="Publish" />
            </Tabs>
          </Paper>

          {renderWorkspaceTab(store, store.activeTab)}
        </>
      ) : null}

      {store.mode !== 'list' && store.isLocked ? (
        <Alert severity="info">This tournament is locked and read-only.</Alert>
      ) : null}
    </Stack>
  );
});
