import { createTheme } from '@mui/material';
const themeOptions = {
    palette: {
        primary: {
            main: '#1878dd',
            light: '#4491e1',
            dark: '#10559c',
            contrastText: '#fffff0',
        },
        secondary: {
            main: '#9e29b3',
            light: '#b355c4',
            dark: '#6f1d7e',
            contrastText: '#fffff0',
        },
        mode: 'light',
        background: {
            default: '#fffff0',
            paper: '#fffff0',
        },
        text: {
            primary: '#000000db',
            secondary: '#00000093',
            disabled: '#00000065',
        },
        error: {
            main: '#d53030',
            light: '#dd5959',
            dark: '#942020',
            contrastText: '#fffff0',
        },
        warning: {
            main: '#eb6b01',
            light: '#ef8832',
            dark: '#a34900',
            contrastText: '#fffff0',
        },
        info: {
            main: '#0287cf',
            light: '#34a0d9',
            dark: '#015e90',
            contrastText: '#fffff0',
        },
        success: {
            main: '#2e7d32',
            light: '#57975b',
            dark: '#205823',
            contrastText: '#fffff0',
        },
        divider: '#0000001d',
    },
    typography: {
        htmlFontSize: 16,
        fontSize: 14,
        fontWeightLight: 300,
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 700,
        fontFamily: '"Roboto", "Helvetica", "Arial"',
        h1: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3 },
        h2: { fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3 },
        h3: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
        h4: { fontSize: '0.9375rem', fontWeight: 600, lineHeight: 1.4 },
        body1: { fontSize: '0.875rem', lineHeight: 1.5 },
        body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
        caption: { fontSize: '0.75rem', lineHeight: 1.4 },
    },
};
export const appTheme = createTheme(themeOptions);
// export const appTheme = createTheme({
//   palette: {
//     mode: 'dark',
//     primary: { main: '#38bdf8' },
//     background: { default: '#020617', paper: '#111827' },
//     text: { primary: '#e5eefb', secondary: '#cbd5e1' },
//   },
//   shape: { borderRadius: 16 },
//   typography: {
//     fontFamily: 'Inter, Arial, sans-serif',
//     h1: { fontSize: '2rem', fontWeight: 700 },
//     h2: { fontSize: '1.2rem', fontWeight: 700 },
//   },
// });
//# sourceMappingURL=theme.js.map