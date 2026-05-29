import { Alert, AppBar, Box, Button, Container, CssBaseline, Grid, Stack, TextField, Toolbar, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { AdminLoginModal } from './components/domain/admin/AdminLoginModal';
import { TournamentSetupPanel } from './components/domain/admin/TournamentSetupPanel';
import { SectionCard } from './components/shared/SectionCard';
import { APP_TITLE, ADMIN_HELP_TEXT } from './constants/ui';
import { appTheme } from './styles/theme';

function ScoreEntryCard() {
  const [message, setMessage] = useState('');
  const [player, setPlayer] = useState('');
  const [team, setTeam] = useState('');
  const [division, setDivision] = useState('Open');
  const [week, setWeek] = useState('1');
  const [game1, setGame1] = useState('0');
  const [game2, setGame2] = useState('0');
  const [game3, setGame3] = useState('0');
  const [standings, setStandings] = useState<any[]>([]);

  async function refreshStandings() {
    const response = await fetch('/api/standings');
    const data = await response.json();
    setStandings(data.standings || []);
  }

  useEffect(() => {
    void refreshStandings();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Saving score…');

    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player, team, division, week, game1, game2, game3 }),
    });
    const result = await response.json();

    if (response.ok && result.success) {
      setMessage('Score saved. Standings refreshed.');
      setPlayer('');
      setTeam('');
      setDivision('Open');
      setWeek('1');
      setGame1('0');
      setGame2('0');
      setGame3('0');
      await refreshStandings();
    } else {
      setMessage(result.error || 'Unable to save score.');
    }
  }

  return (
    <SectionCard title="Score entry" subtitle="Enter the latest scores here and the standings list updates immediately.">
      <Stack component="form" onSubmit={handleSubmit} spacing={2}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Player" value={player} onChange={(event) => setPlayer(event.target.value)} required fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Team" value={team} onChange={(event) => setTeam(event.target.value)} required fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Division" value={division} onChange={(event) => setDivision(event.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Week" value={week} onChange={(event) => setWeek(event.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Game 1" type="number" value={game1} onChange={(event) => setGame1(event.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Game 2" type="number" value={game2} onChange={(event) => setGame2(event.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Game 3" type="number" value={game3} onChange={(event) => setGame3(event.target.value)} fullWidth />
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" variant="contained">Save score</Button>
        </Box>
      </Stack>
      {message ? <Alert severity="info" sx={{ mt: 2 }}>{message}</Alert> : null}
      <Box sx={{ mt: 3 }}>
        <Typography variant="h2" sx={{ mb: 1 }}>Live standings</Typography>
        {standings.length ? (
          <Box component="pre" sx={{ backgroundColor: 'background.default', p: 2, borderRadius: 2, overflowX: 'auto' }}>
            {JSON.stringify(standings, null, 2)}
          </Box>
        ) : (
          <Typography color="text.secondary">No scores yet. Add the first game entry to seed the standings list.</Typography>
        )}
      </Box>
    </SectionCard>
  );
}

function App() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [adminLabel, setAdminLabel] = useState('Admin login');
  const [adminStatus, setAdminStatus] = useState(ADMIN_HELP_TEXT);

  async function refreshSession() {
    try {
      const response = await fetch('/api/admin/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setAdminLabel('Open admin');
        setAdminStatus(`Signed in as ${data.user.username}`);
        return;
      }
    } catch (error) {
      console.debug('Admin session unavailable', error);
    }

    setAdminLabel('Admin login');
    setAdminStatus(ADMIN_HELP_TEXT);
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Typography variant="h1" sx={{ fontSize: '1.25rem' }}>{APP_TITLE}</Typography>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <Button variant="contained" color="primary" onClick={() => setLoginOpen(true)}>{adminLabel}</Button>
            <Typography variant="body2" color="text.secondary">{adminStatus}</Typography>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ScoreEntryCard />
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <TournamentSetupPanel />
          </Grid>
        </Grid>
      </Container>
      <AdminLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} onSuccess={() => { setLoginOpen(false); void refreshSession(); }} />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
