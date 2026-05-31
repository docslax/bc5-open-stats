import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { AdminBodyPlaceholder } from "./components/domain/admin/AdminBodyPlaceholder";
import { AdminLoginModal } from "./components/domain/admin/AdminLoginModal";
import { HeaderMenuItem } from "./components/shared/layout/PageHeader";
import { PageLayout } from "./components/shared/layout/PageLayout";
import { APP_TITLE, ADMIN_LAYOUT_BREADCRUMBS } from "./constants/ui";
import { appTheme } from "./styles/theme";

function App() {
  const [loginOpen, setLoginOpen] = useState(false);

  const menuItems: HeaderMenuItem[] = [
    {
      label: "Admin",
      onClick: () => {
        setLoginOpen(true);
      },
    },
  ];

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <PageLayout
        siteName={APP_TITLE}
        logoLabel="BC5"
        menuItems={menuItems}
        breadcrumbs={ADMIN_LAYOUT_BREADCRUMBS}
      >
        <AdminBodyPlaceholder />
      </PageLayout>
      <AdminLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          window.location.href = "/admin/";
        }}
      />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />);
