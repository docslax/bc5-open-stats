import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { useState, type SyntheticEvent } from 'react';

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ open, onClose, onSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Unable to sign in.');
        return;
      }

      onSuccess();
      onClose();
      setUsername('');
      setPassword('');
    } catch (caughtError) {
      setError('Unable to reach the login service.');
      console.error(caughtError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Admin sign in</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 1, pb: 1 }}>
          <Stack spacing={1.5}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
            />
            <DialogActions sx={{ px: 0, pb: 0, pt: 0.5, justifyContent: 'flex-end' }}>
              <Button onClick={onClose} color="inherit" size="small">
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={loading} size="small">
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>
            </DialogActions>
          </Stack>
        </DialogContent>
      </form>
    </Dialog>
  );
}
