import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { AdminBodyPlaceholder } from "./components/domain/admin/AdminBodyPlaceholder";
import { AdminLoginModal } from "./components/domain/admin/AdminLoginModal";
import { PageLayout } from "./components/shared/layout/PageLayout";
import { APP_TITLE, ADMIN_LAYOUT_BREADCRUMBS } from "./constants/ui";
import { appTheme } from "./styles/theme";
function App() {
    const [loginOpen, setLoginOpen] = useState(false);
    const menuItems = [
        {
            label: "Admin",
            onClick: () => {
                setLoginOpen(true);
            },
        },
    ];
    return (_jsxs(ThemeProvider, { theme: appTheme, children: [_jsx(CssBaseline, {}), _jsx(PageLayout, { siteName: APP_TITLE, logoLabel: "BC5", menuItems: menuItems, breadcrumbs: ADMIN_LAYOUT_BREADCRUMBS, children: _jsx(AdminBodyPlaceholder, {}) }), _jsx(AdminLoginModal, { open: loginOpen, onClose: () => setLoginOpen(false), onSuccess: () => {
                    setLoginOpen(false);
                    window.location.href = "/admin/";
                } })] }));
}
createRoot(document.getElementById("root")).render(_jsx(App, {}));
//# sourceMappingURL=app.js.map