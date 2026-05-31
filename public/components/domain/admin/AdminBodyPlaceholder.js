import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography } from "@mui/material";
export function AdminBodyPlaceholder() {
    return (_jsx(Box, { sx: {
            minHeight: { xs: 280, md: 420 },
            border: "1px dashed",
            borderColor: "divider",
            borderRadius: 3,
            backgroundColor: "background.paper",
            display: "grid",
            placeItems: "center",
            textAlign: "center",
            px: 3,
        }, children: _jsxs(Box, { children: [_jsx(Typography, { variant: "h2", sx: { mb: 1 }, children: "BODY CONTENT AREA" }), _jsx(Typography, { color: "text.secondary", children: "Admin workspace modules will be mounted here." })] }) }));
}
//# sourceMappingURL=AdminBodyPlaceholder.js.map