import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { FormEvent } from 'react';
import { LocationRecord } from '../../../../services/adminApi';
import { TournamentAdminStore } from '../../../../stores/admin/TournamentAdminStore';

interface LocationsTabProps {
  store: TournamentAdminStore;
}

export const LocationsTab = observer(function LocationsTab({ store }: LocationsTabProps) {
  function onSaveLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void store.saveLocation();
  }

  return (
    <Stack spacing={2}>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', borderRadius: 2.5 }}>
        <Typography variant="h3" sx={{ mb: 1.25 }}>
          {store.editingLocationId ? 'Edit Location' : 'Add Location'}
        </Typography>

        <Box component="form" onSubmit={onSaveLocation}>
          <Stack spacing={1.5}>
            <TextField
              label="Location name"
              value={store.locationForm.name}
              required
              onChange={(event) => store.setLocationField('name', event.target.value)}
              disabled={store.submitting || store.isLocked}
            />
            <TextField
              label="Address"
              value={store.locationForm.address}
              onChange={(event) => store.setLocationField('address', event.target.value)}
              disabled={store.submitting || store.isLocked}
            />
            <TextField
              label="Lane count"
              type="number"
              value={store.locationForm.laneCount}
              onChange={(event) => store.setLocationField('laneCount', event.target.value)}
              disabled={store.submitting || store.isLocked}
            />
            <TextField
              label="Notes"
              value={store.locationForm.notes}
              onChange={(event) => store.setLocationField('notes', event.target.value)}
              disabled={store.submitting || store.isLocked}
            />
            <Stack direction="row" spacing={1.25}>
              <Button type="submit" variant="contained" disabled={store.submitting || store.isLocked}>
                {store.editingLocationId ? 'Save location' : 'Add location'}
              </Button>
              {store.editingLocationId ? (
                <Button type="button" variant="outlined" onClick={store.cancelLocationEdit} disabled={store.submitting}>
                  Cancel
                </Button>
              ) : null}
            </Stack>
          </Stack>
        </Box>
      </Paper>

      <Stack spacing={1.5}>
        {store.currentLocations.length === 0 ? (
          <Typography color="text.secondary">No locations yet.</Typography>
        ) : (
          store.currentLocations.map((location: LocationRecord) => (
            <Paper
              key={location.id}
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'background.default',
              }}
            >
              <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>{location.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {location.address || 'No address provided'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Lane Count: {location.laneCount ?? 'N/A'}
                  </Typography>
                  {location.notes ? (
                    <Typography variant="body2" color="text.secondary">
                      Notes: {location.notes}
                    </Typography>
                  ) : null}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => store.startLocationEdit(location)}
                    disabled={store.isLocked}
                  >
                    Edit
                  </Button>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => void store.removeLocationById(location.id)}
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
