import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Paper, Stack, Typography } from '@mui/material';
export function SectionCard({ title, subtitle, children }) {
    return (_jsxs(Paper, { elevation: 0, sx: { p: 3, border: '1px solid', borderColor: 'divider', backgroundColor: 'background.paper' }, children: [_jsxs(Stack, { spacing: 1, sx: { mb: 2 }, children: [_jsx(Typography, { variant: "h2", children: title }), subtitle ? _jsx(Typography, { variant: "body2", color: "text.secondary", children: subtitle }) : null] }), children] }));
}
//# sourceMappingURL=SectionCard.js.map