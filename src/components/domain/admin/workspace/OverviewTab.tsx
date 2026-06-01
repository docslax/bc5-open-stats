import { Box, Button, Chip, Paper, Stack, TextField, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { type SyntheticEvent } from 'react';
import { TournamentAdminStore } from '@stores/admin/TournamentAdminStore';

function checklistMarker(state: 'ok' | 'warn' | 'error'): string {
  if (state === 'ok') return '✔';
  if (state === 'warn') return '⚠';
  return '✖';
}

interface OverviewTabProps {
  store: TournamentAdminStore;
}

export const OverviewTab = observer(function OverviewTab({ store }: OverviewTabProps) {
  function onSaveTournamentDetails(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    void store.saveTournamentDetails();
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          Tournament Summary
        </Typography>
        <Stack spacing={0.8}>
          <Typography>
            <strong>Name:</strong> {store.currentTournament?.name || '-'}
          </Typography>
          <Typography>
            <strong>Date Range:</strong> {store.currentTournament?.startDate || 'TBD'} to{' '}
            {store.currentTournament?.endDate || 'TBD'}
          </Typography>
          <Typography>
            <strong>Primary Location:</strong> {store.currentLocations[0]?.name || 'Not set'}
          </Typography>
          <Typography>
            <strong>Status:</strong> {store.getStatusLabel(store.currentTournament?.status)}
          </Typography>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          Setup Checklist
        </Typography>
        <Stack spacing={0.75}>
          {store.setupChecklist.map((item) => (
            <Typography key={item.label}>
              {checklistMarker(item.state)} {item.label}
            </Typography>
          ))}
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          Statistics
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Chip label={`Zones: ${store.uniqueZoneCount}`} />
          <Chip label={`Bowlers: ${store.totalBowlers}`} />
          <Chip label={`Locations: ${store.currentLocations.length}`} />
          <Chip label={`Scheduled Matches: ${store.drawSlots.length}`} />
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          Tournament Details
        </Typography>
        <Box component="form" onSubmit={onSaveTournamentDetails}>
          <Stack spacing={2}>
            <TextField
              label="Tournament name"
              value={store.tournamentForm.name}
              required
              onChange={(event) => store.setTournamentField('name', event.target.value)}
              disabled={store.submitting || store.isLocked}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Start date"
                type="date"
                value={store.tournamentForm.startDate}
                onChange={(event) => store.setTournamentField('startDate', event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                disabled={store.submitting || store.isLocked}
              />

              <TextField
                label="End date"
                type="date"
                value={store.tournamentForm.endDate}
                onChange={(event) => store.setTournamentField('endDate', event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                disabled={store.submitting || store.isLocked}
              />
            </Stack>

            <Button type="submit" variant="contained" disabled={store.submitting || store.isLocked}>
              Save details
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Stack>
  );
});
