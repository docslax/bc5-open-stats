import { Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { TournamentAdminStore } from '@stores/admin/TournamentAdminStore';

interface PublishTabProps {
  store: TournamentAdminStore;
}

export const PublishTab = observer(function PublishTab({ store }: PublishTabProps) {
  const checks = store.publishValidation?.checks as Record<string, boolean> | undefined;

  const detailsComplete = checks?.detailsComplete ?? false;
  const locationsConfigured = checks?.locationsConfigured ?? false;
  const bowlersConfigured = checks?.bowlersConfigured ?? checks?.teamsConfigured ?? false;
  const allBowlersHaveZones = checks?.allBowlersHaveZones ?? checks?.allTeamsHaveBowlers ?? false;
  const scheduleComplete = checks?.scheduleComplete ?? false;

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          Validation Panel
        </Typography>
        <Stack spacing={0.75}>
          <Typography>{detailsComplete ? '✔' : '✖'} Tournament Details Complete</Typography>
          <Typography>{locationsConfigured ? '✔' : '✖'} Locations Configured</Typography>
          <Typography>{bowlersConfigured ? '✔' : '✖'} Bowlers Configured</Typography>
          <Typography>{allBowlersHaveZones ? '✔' : '✖'} All Bowlers Have Zones</Typography>
          <Typography>{scheduleComplete ? '✔' : '✖'} Schedule Complete</Typography>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          Status Workflow
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
          <Chip label="Draft" variant="outlined" />
          <Chip label="Ready To Publish" variant="outlined" />
          <Chip label="Published" variant="outlined" />
        </Stack>

        <Stack direction="row" spacing={1.25}>
          <Button
            variant="contained"
            disabled={store.submitting || !store.publishValidation?.canPublish || store.isLocked}
            onClick={() => void store.publishCurrentTournament()}
          >
            Publish Tournament
          </Button>
          <Button
            variant="outlined"
            disabled={store.submitting || store.isLocked}
            onClick={() => void store.unpublishCurrentTournament()}
          >
            Unpublish Tournament
          </Button>
        </Stack>
      </Paper>

      {store.currentTournament && !store.isLocked ? (
        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
          <Typography variant="h3" sx={{ mb: 1.25 }}>
            Finalization
          </Typography>
          <Button
            color="error"
            variant="contained"
            onClick={() => void store.lockCurrentTournament()}
            disabled={store.submitting}
          >
            Lock tournament
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Locking is irreversible and turns the tournament read-only.
          </Typography>
        </Paper>
      ) : null}
    </Stack>
  );
});
