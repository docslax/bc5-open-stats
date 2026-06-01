import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { FormEvent } from 'react';
import {
  TOURNAMENT_POSITION_OPTIONS,
  TOURNAMENT_TEAM_OPTIONS,
  TOURNAMENT_ZONE_OPTIONS,
} from '../../../../constants/tournamentAdmin';
import { TournamentAdminStore } from '../../../../stores/admin/TournamentAdminStore';

interface BowlersTabProps {
  store: TournamentAdminStore;
}

export const BowlersTab = observer(function BowlersTab({ store }: BowlersTabProps) {
  function onSaveBowler(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void store.saveBowlerAndRoster();
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          {store.editingRosterId ? 'Edit Bowler' : 'Add Bowler'}
        </Typography>

        <Box component="form" onSubmit={onSaveBowler}>
          <Stack spacing={1.5}>
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

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Name"
                value={store.bowlerForm.name}
                required
                onChange={(event) => store.setBowlerField('name', event.target.value)}
                disabled={store.submitting || store.isLocked}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth disabled={store.submitting || store.isLocked}>
                <InputLabel id="bowler-zone-label">Zone</InputLabel>
                <Select
                  labelId="bowler-zone-label"
                  label="Zone"
                  value={store.bowlerForm.zone}
                  onChange={(event) => store.setBowlerField('zone', String(event.target.value))}
                >
                  {TOURNAMENT_ZONE_OPTIONS.map((zone) => (
                    <MenuItem key={zone} value={String(zone)}>
                      Zone {zone}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth disabled={store.submitting || store.isLocked}>
                <InputLabel id="bowler-team-label">Team</InputLabel>
                <Select
                  labelId="bowler-team-label"
                  label="Team"
                  value={store.bowlerForm.team}
                  onChange={(event) => store.setBowlerField('team', String(event.target.value))}
                >
                  {TOURNAMENT_TEAM_OPTIONS.map((team) => (
                    <MenuItem key={team.value} value={team.value}>
                      {team.value}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth disabled={store.submitting || store.isLocked || store.bowlerForm.isCoach}>
                <InputLabel id="bowler-position-label">Position</InputLabel>
                <Select
                  labelId="bowler-position-label"
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
            </Stack>

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

            <Stack direction="row" spacing={1.25}>
              <Button type="submit" variant="contained" disabled={store.submitting || store.isLocked}>
                {store.editingRosterId ? 'Save bowler' : 'Add bowler'}
              </Button>
              {store.editingRosterId ? (
                <Button type="button" variant="outlined" onClick={store.cancelRosterEdit} disabled={store.submitting}>
                  Cancel
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <TextField
          label="Search Bowlers"
          value={store.bowlerSearch}
          onChange={(event) => store.setBowlerSearch(event.target.value)}
          fullWidth
        />
      </Paper>

      <Stack spacing={1.5}>
        {store.filteredRoster.length === 0 ? (
          <Typography color="text.secondary">No bowlers found for this tournament.</Typography>
        ) : (
          store.filteredRoster.map((entry) => (
            <Paper
              key={entry.id}
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'background.default',
              }}
            >
              <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{entry.name || `Bowler #${entry.bowlerId}`}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Bowler Id: {entry.bowlerId}
                  </Typography>
                  {entry.c5Number ? (
                    <Typography variant="body2" color="text.secondary">
                      C5 Number: {entry.c5Number}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    Zone: {entry.zone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Team: {entry.team}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.isCoach ? 'Coach' : 'Player'}
                  </Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button variant="outlined" onClick={() => store.startRosterEdit(entry)} disabled={store.isLocked}>
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
          ))
        )}
      </Stack>
    </Stack>
  );
});
