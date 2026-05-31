import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Container, Typography } from "@mui/material";
export function PageFooter({ siteName }) {
    const year = new Date().getFullYear();
    return (_jsx(Box, { component: "footer", sx: {
            borderTop: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.paper",
            mt: "auto",
        }, children: _jsx(Container, { maxWidth: "lg", sx: { py: 2 }, children: _jsxs(Typography, { variant: "body2", color: "text.secondary", children: ["\u00A9 ", year, " ", siteName, ". All Rights Reserved."] }) }) }));
}
//# sourceMappingURL=PageFooter.js.map