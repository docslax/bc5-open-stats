import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button, Stack, Typography } from '@mui/material';
import { SectionCard } from '../../shared/SectionCard';
export function TournamentSetupPanel() {
    return (_jsx(SectionCard, { title: "Tournament setup", subtitle: "This panel is now isolated so the admin console can grow without pulling the whole page into one script.", children: _jsxs(Stack, { spacing: 2, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", children: "The next step is to wire this area into the real tournament/year/location/team APIs." }), _jsx(Button, { variant: "contained", href: "/admin/", children: "Open admin console" })] }) }));
}
//# sourceMappingURL=TournamentSetupPanel.js.map