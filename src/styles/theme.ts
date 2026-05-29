import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#38bdf8' },
    background: { default: '#020617', paper: '#111827' },
    text: { primary: '#e5eefb', secondary: '#cbd5e1' },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Inter, Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.2rem', fontWeight: 700 },
  },
});
