import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { observer } from 'mobx-react-lite';
import { type SyntheticEvent } from 'react';
import { TournamentAdminStore } from '@stores/admin/TournamentAdminStore';

interface ScheduleTabProps {
  store: TournamentAdminStore;
}

export const ScheduleTab = observer(function ScheduleTab({ store }: ScheduleTabProps) {
  const grouped = store.drawSlots.reduce<Record<string, typeof store.drawSlots>>((accumulator, slot) => {
    const key = slot.scheduledAt ? new Date(slot.scheduledAt).toISOString().slice(0, 10) : 'Unscheduled';
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(slot);
    return accumulator;
  }, {});

  function onSaveMatch(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    void store.saveDrawSlot();
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          {store.editingDrawSlotId ? 'Edit Match' : 'Add Match'}
        </Typography>

        <Box component="form" onSubmit={onSaveMatch}>
          <Stack spacing={1.5}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Division"
                value={store.drawSlotForm.division}
                onChange={(event) => store.setDrawSlotField('division', event.target.value)}
                disabled={store.submitting || store.isLocked}
                fullWidth
              />
              <FormControl fullWidth disabled={store.submitting || store.isLocked}>
                <InputLabel id="event-type-label">Tournament Format</InputLabel>
                <Select
                  labelId="event-type-label"
                  label="Tournament Format"
                  value={store.drawSlotForm.eventType}
                  onChange={(event) => store.setDrawSlotField('eventType', event.target.value as 'team' | 'singles')}
                >
                  <MenuItem value="team">Round Robin / Match Play</MenuItem>
                  <MenuItem value="singles">Singles / Elimination</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Block"
                value={store.drawSlotForm.blockCode}
                onChange={(event) => store.setDrawSlotField('blockCode', event.target.value)}
                disabled={store.submitting || store.isLocked}
                fullWidth
              />
              <TextField
                label="Lane"
                type="number"
                value={store.drawSlotForm.lane}
                onChange={(event) => store.setDrawSlotField('lane', event.target.value)}
                disabled={store.submitting || store.isLocked}
                fullWidth
              />
              <TextField
                label="Slot Code"
                value={store.drawSlotForm.slotCode}
                onChange={(event) => store.setDrawSlotField('slotCode', event.target.value)}
                disabled={store.submitting || store.isLocked}
                fullWidth
              />
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <FormControl fullWidth disabled={store.submitting || store.isLocked}>
                <InputLabel id="schedule-bowler-a-label">Bowler A</InputLabel>
                <Select
                  labelId="schedule-bowler-a-label"
                  label="Bowler A"
                  value={store.drawSlotForm.sideABowlerId}
                  onChange={(event) => store.setDrawSlotField('sideABowlerId', String(event.target.value))}
                >
                  <MenuItem value="">None</MenuItem>
                  {store.roster.map((entry) => (
                    <MenuItem key={`a-${entry.id}`} value={String(entry.bowlerId)}>
                      {entry.name || `Bowler #${entry.bowlerId}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={store.submitting || store.isLocked}>
                <InputLabel id="schedule-bowler-b-label">Bowler B</InputLabel>
                <Select
                  labelId="schedule-bowler-b-label"
                  label="Bowler B"
                  value={store.drawSlotForm.sideBBowlerId}
                  onChange={(event) => store.setDrawSlotField('sideBBowlerId', String(event.target.value))}
                >
                  <MenuItem value="">None</MenuItem>
                  {store.roster.map((entry) => (
                    <MenuItem key={`b-${entry.id}`} value={String(entry.bowlerId)}>
                      {entry.name || `Bowler #${entry.bowlerId}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <TextField
              label="Date and Time"
              type="datetime-local"
              value={store.drawSlotForm.scheduledAt}
              onChange={(event) => store.setDrawSlotField('scheduledAt', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              disabled={store.submitting || store.isLocked}
            />

            <Stack direction="row" spacing={1.25}>
              <Button type="submit" variant="contained" disabled={store.submitting || store.isLocked}>
                {store.editingDrawSlotId ? 'Save match' : 'Add match'}
              </Button>
              {store.editingDrawSlotId ? (
                <Button type="button" variant="outlined" onClick={store.cancelDrawSlotEdit} disabled={store.submitting}>
                  Cancel
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Stack spacing={2}>
        {Object.keys(grouped).length === 0 ? (
          <Typography color="text.secondary">No scheduled matches yet.</Typography>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([day, slots]) => (
              <Paper
                key={day}
                elevation={0}
                sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}
              >
                <Typography variant="h3" sx={{ mb: 1.25 }}>
                  {day}
                </Typography>
                <Stack spacing={1.25}>
                  {slots.map((slot) => (
                    <Paper
                      key={slot.id}
                      elevation={0}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        backgroundColor: 'background.default',
                      }}
                    >
                      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', gap: 1.5 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700 }}>
                            {slot.blockCode} | Lane {slot.lane}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {slot.scheduledAt ? new Date(slot.scheduledAt).toLocaleString() : 'Time not set'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {slot.sideABowler?.name || 'TBD'} vs {slot.sideBBowler?.name || 'TBD'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            variant="outlined"
                            onClick={() => store.startDrawSlotEdit(slot)}
                            disabled={store.isLocked}
                          >
                            Edit
                          </Button>
                          <Button
                            color="error"
                            variant="outlined"
                            onClick={() => void store.removeDrawSlotById(slot.id)}
                            disabled={store.isLocked}
                          >
                            Remove
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            ))
        )}
      </Stack>
    </Stack>
  );
});
