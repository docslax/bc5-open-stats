import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Container } from "@mui/material";
import { BreadcrumbNavbar } from "./BreadcrumbNavbar";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";
export function PageLayout({ siteName, logoLabel, menuItems, breadcrumbs, children, }) {
    return (_jsxs(Box, { sx: {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "background.default",
        }, children: [_jsx(PageHeader, { siteName: siteName, logoLabel: logoLabel, menuItems: menuItems }), _jsx(BreadcrumbNavbar, { items: breadcrumbs }), _jsx(Box, { component: "main", sx: { py: 4 }, children: _jsx(Container, { maxWidth: "lg", children: children }) }), _jsx(PageFooter, { siteName: siteName })] }));
}
//# sourceMappingURL=PageLayout.js.map