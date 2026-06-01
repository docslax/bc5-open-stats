import { Alert, Snackbar } from '@mui/material';
import type { AlertColor, SnackbarOrigin } from '@mui/material';
import type { SyntheticEvent } from 'react';

interface AppToastProps {
  open: boolean;
  message: string;
  tone: AlertColor;
  sticky?: boolean;
  autoHideDuration?: number;
  onClose: () => void;
  anchorOrigin?: SnackbarOrigin;
}

export function AppToast({
  open,
  message,
  tone,
  sticky = false,
  autoHideDuration = 5000,
  onClose,
  anchorOrigin = { vertical: 'top', horizontal: 'right' },
}: AppToastProps) {
  const handleClose = (_event: Event | SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') return;
    onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={sticky ? null : autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
    >
      <Alert onClose={onClose} severity={tone} variant="filled" sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
