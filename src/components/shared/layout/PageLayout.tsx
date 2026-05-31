import { Box, Container } from "@mui/material";
import { ReactNode } from "react";
import { BreadcrumbNavbar } from "./BreadcrumbNavbar";
import { HeaderMenuItem, PageHeader } from "./PageHeader";
import { PageFooter } from "./PageFooter";

interface PageLayoutProps {
  siteName: string;
  logoLabel: string;
  menuItems: HeaderMenuItem[];
  breadcrumbs: string[];
  children: ReactNode;
}

export function PageLayout({
  siteName,
  logoLabel,
  menuItems,
  breadcrumbs,
  children,
}: PageLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "background.default",
      }}
    >
      <PageHeader
        siteName={siteName}
        logoLabel={logoLabel}
        menuItems={menuItems}
      />
      <BreadcrumbNavbar items={breadcrumbs} />
      <Box component="main" sx={{ py: 4 }}>
        <Container maxWidth="lg">{children}</Container>
      </Box>
      <PageFooter siteName={siteName} />
    </Box>
  );
}
