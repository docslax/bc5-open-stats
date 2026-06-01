import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert, Box, Button, Chip, CircularProgress, FormControl, InputLabel, MenuItem, Paper, Select, Stack, TextField, Typography, } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo } from 'react';
import { TournamentAdminStore } from '../../../stores/admin/TournamentAdminStore';
export const TournamentAdminConsole = observer(function TournamentAdminConsole() {
    const store = useMemo(() => new TournamentAdminStore(), []);
    useEffect(() => {
        const handlePopState = () => {
            store.syncFromUrl();
        };
        void store.loadTournaments();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [store]);
    async function handleSubmit(event) {
        event.preventDefault();
        await store.submit();
    }
    async function handleLock() {
        await store.lockCurrentTournament();
    }
    return (_jsxs(Stack, { spacing: 2.5, children: [_jsx(Paper, { elevation: 0, sx: { p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }, children: _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, sx: {
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        gap: 1.5,
                    }, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h2", children: "BC5 Admin Console" }), _jsx(Typography, { color: "text.secondary", variant: "body2", children: "Manage tournaments, players, and more. This console is for BC5 administrators only." })] }), store.mode === 'list' ? (_jsx(Button, { variant: "contained", onClick: store.openCreate, children: "Create tournament" })) : (_jsx(Button, { variant: "outlined", onClick: store.openList, children: "Back to tournaments" }))] }) }), store.message ? _jsx(Alert, { severity: store.tone === 'error' ? 'error' : 'success', children: store.message }) : null, store.loading ? (_jsx(Paper, { elevation: 0, sx: { p: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }, children: _jsxs(Stack, { direction: "row", spacing: 1.5, sx: { alignItems: 'center' }, children: [_jsx(CircularProgress, { size: 22 }), _jsx(Typography, { children: "Loading tournaments\u2026" })] }) })) : null, !store.loading && store.mode === 'list' ? (_jsx(Paper, { elevation: 0, sx: { p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }, children: _jsx(Stack, { spacing: 1.5, children: store.tournaments.length === 0 ? (_jsx(Typography, { color: "text.secondary", children: "No tournaments yet. Click Create tournament to start." })) : (store.tournaments.map((item) => (_jsx(Paper, { elevation: 0, sx: {
                            p: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            backgroundColor: 'background.default',
                        }, children: _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, sx: {
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                gap: 1.5,
                            }, children: [_jsxs(Box, { children: [_jsx(Typography, { sx: { fontWeight: 700 }, children: item.name }), _jsxs(Stack, { direction: "row", spacing: 1, sx: { mt: 0.5, alignItems: 'center' }, children: [_jsx(Chip, { label: item.status || 'draft', size: "small" }), item.isLocked ? _jsx(Chip, { label: "locked", size: "small", color: "warning" }) : null] }), _jsxs(Typography, { variant: "body2", color: "text.secondary", sx: { mt: 0.75 }, children: [item.startDate || 'TBD', " to ", item.endDate || 'TBD'] })] }), _jsx(Button, { variant: "outlined", onClick: () => store.openEdit(item.id), children: "Edit" })] }) }, item.id)))) }) })) : null, !store.loading && (store.mode === 'create' || store.mode === 'edit') ? (_jsxs(Paper, { elevation: 0, sx: { p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }, children: [_jsx(Typography, { variant: "h2", sx: { mb: 0.5 }, children: store.mode === 'create' ? 'Create tournament year' : 'Edit tournament year' }), _jsx(Typography, { color: "text.secondary", variant: "body2", sx: { mb: 2 }, children: store.mode === 'create' ? 'Create a new tournament year.' : 'Update an existing tournament year.' }), _jsx(Box, { component: "form", onSubmit: handleSubmit, children: _jsxs(Stack, { spacing: 2, children: [_jsx(TextField, { label: "Season name", placeholder: "2026 Summer Classic", value: store.form.name, required: true, onChange: (event) => store.setFormField('name', event.target.value), disabled: store.submitting || store.isLocked }), _jsxs(Stack, { direction: { xs: 'column', sm: 'row' }, spacing: 2, children: [_jsx(TextField, { label: "Start date", type: "date", value: store.form.startDate, onChange: (event) => store.setFormField('startDate', event.target.value), slotProps: { inputLabel: { shrink: true } }, fullWidth: true, disabled: store.submitting || store.isLocked }), _jsx(TextField, { label: "End date", type: "date", value: store.form.endDate, onChange: (event) => store.setFormField('endDate', event.target.value), slotProps: { inputLabel: { shrink: true } }, fullWidth: true, disabled: store.submitting || store.isLocked }), _jsxs(FormControl, { fullWidth: true, disabled: store.submitting || store.isLocked, children: [_jsx(InputLabel, { id: "tournament-status-label", children: "Status" }), _jsxs(Select, { labelId: "tournament-status-label", label: "Status", value: store.form.status, onChange: (event) => store.setFormField('status', String(event.target.value)), children: [_jsx(MenuItem, { value: "draft", children: "draft" }), _jsx(MenuItem, { value: "published", children: "published" })] })] })] }), _jsx(TextField, { label: "Primary location (create only for now)", placeholder: "Port Coquitlam", value: store.form.location, onChange: (event) => store.setFormField('location', event.target.value), disabled: store.mode !== 'create' || store.submitting || store.isLocked }), store.showLockButton ? (_jsxs(Stack, { spacing: 0.5, children: [_jsx(Button, { type: "button", color: "error", variant: "contained", onClick: handleLock, disabled: store.submitting || store.isLocked, sx: { alignSelf: 'flex-start' }, children: store.isLocked ? 'Tournament locked' : 'Lock tournament' }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "Locking is irreversible. A locked tournament becomes read-only." })] })) : null, _jsxs(Stack, { direction: "row", spacing: 1.25, children: [_jsx(Button, { type: "submit", variant: "contained", disabled: store.submitting || store.isLocked, children: store.mode === 'create'
                                                ? 'Create tournament'
                                                : store.isLocked
                                                    ? 'Tournament locked'
                                                    : 'Save tournament' }), _jsx(Button, { type: "button", variant: "outlined", onClick: store.openList, disabled: store.submitting, children: "Cancel" })] }), store.isLocked && store.mode === 'edit' ? (_jsx(Alert, { severity: "info", children: "This tournament is locked and read-only." })) : null] }) })] })) : null] }));
});
//# sourceMappingURL=TournamentAdminConsole.js.map