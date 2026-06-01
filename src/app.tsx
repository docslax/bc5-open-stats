import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { createRoot } from 'react-dom/client';
import { Alert, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { AdminBodyPlaceholder } from './components/domain/admin/AdminBodyPlaceholder';
import { AdminLoginModal } from './components/domain/admin/AdminLoginModal';
import { TournamentAdminConsole } from './components/domain/admin/TournamentAdminConsole';
import { HeaderMenuItem } from './components/shared/layout/PageHeader';
import { PageLayout } from './components/shared/layout/PageLayout';
import { APP_TITLE, ADMIN_LAYOUT_BREADCRUMBS } from './constants/ui';
import { appTheme } from './styles/theme';

function App() {
  const isAdminRoute = useMemo(() => window.location.pathname.startsWith('/admin'), []);
  const [loginOpen, setLoginOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(isAdminRoute);
  const [authenticated, setAuthenticated] = useState(!isAdminRoute);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!isAdminRoute) {
      return;
    }

    async function checkAdminSession() {
      setCheckingSession(true);
      try {
        const response = await fetch('/api/admin/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          setAuthenticated(false);
          setLoginOpen(true);
          setAuthError('Admin sign-in is required to access this page.');
          return;
        }

        setAuthenticated(true);
      } catch (caughtError) {
        console.error(caughtError);
        setAuthenticated(false);
        setLoginOpen(true);
        setAuthError('Unable to verify admin session.');
      } finally {
        setCheckingSession(false);
      }
    }

    void checkAdminSession();
  }, [isAdminRoute]);

  async function signOut() {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      window.location.href = '/';
    }
  }

  const menuItems: HeaderMenuItem[] = [
    {
      label: isAdminRoute ? 'Sign out' : 'Admin',
      onClick: isAdminRoute
        ? signOut
        : () => {
            setLoginOpen(true);
          },
    },
  ];

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <PageLayout siteName={APP_TITLE} logoLabel="BC5" menuItems={menuItems} breadcrumbs={ADMIN_LAYOUT_BREADCRUMBS}>
        {isAdminRoute ? (
          checkingSession ? (
            <Stack spacing={1.25}>
              <Typography variant="h2">Checking admin session…</Typography>
              <Typography color="text.secondary">Please wait while access is verified.</Typography>
            </Stack>
          ) : authenticated ? (
            <TournamentAdminConsole />
          ) : (
            <Alert severity="warning">Admin sign-in is required.</Alert>
          )
        ) : (
          <AdminBodyPlaceholder />
        )}
      </PageLayout>
      <AdminLoginModal
        open={loginOpen}
        onClose={() => {
          setLoginOpen(false);
          if (isAdminRoute && !authenticated) {
            window.location.href = '/';
          }
        }}
        onSuccess={() => {
          setAuthenticated(true);
          setCheckingSession(false);
          setAuthError('');
          setLoginOpen(false);
          if (!isAdminRoute) {
            window.location.href = '/admin';
          }
        }}
      />
      {authError && loginOpen ? <Alert severity="info">{authError}</Alert> : null}
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(<App />);
