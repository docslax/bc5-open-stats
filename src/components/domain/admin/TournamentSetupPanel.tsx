import { Button, Stack, Typography } from '@mui/material';
import { SectionCard } from '../../shared/SectionCard';

export function TournamentSetupPanel() {
  return (
    <SectionCard
      title="Tournament setup"
      subtitle="This panel is now isolated so the admin console can grow without pulling the whole page into one script."
    >
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">
          The next step is to wire this area into the real tournament/year/location/team APIs.
        </Typography>
        <Button variant="contained" href="/admin/">Open admin console</Button>
      </Stack>
    </SectionCard>
  );
}
