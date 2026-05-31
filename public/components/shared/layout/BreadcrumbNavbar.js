import { jsx as _jsx } from "react/jsx-runtime";
import { Box, Breadcrumbs, Container, Link, Typography } from "@mui/material";
export function BreadcrumbNavbar({ items }) {
    return (_jsx(Box, { component: "nav", sx: {
            borderBottom: "1px solid",
            borderColor: "divider",
            backgroundColor: "background.default",
        }, children: _jsx(Container, { maxWidth: "lg", sx: { py: 1.25 }, children: _jsx(Breadcrumbs, { separator: ">", "aria-label": "breadcrumb", children: items.map((item, index) => {
                    const isLast = index === items.length - 1;
                    if (isLast) {
                        return (_jsx(Typography, { color: "text.primary", sx: { fontWeight: 600 }, children: item }, item));
                    }
                    return (_jsx(Link, { underline: "hover", color: "text.secondary", href: "#", children: item }, item));
                }) }) }) }));
}
//# sourceMappingURL=BreadcrumbNavbar.js.map