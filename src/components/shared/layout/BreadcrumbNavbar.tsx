import { Box, Breadcrumbs, Container, Link, Typography } from "@mui/material";

interface BreadcrumbNavbarProps {
  items: string[];
}

export function BreadcrumbNavbar({ items }: BreadcrumbNavbarProps) {
  return (
    <Box
      component="nav"
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.default",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 1.25 }}>
        <Breadcrumbs separator=">" aria-label="breadcrumb">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            if (isLast) {
              return (
                <Typography
                  key={item}
                  color="text.primary"
                  sx={{ fontWeight: 600 }}
                >
                  {item}
                </Typography>
              );
            }

            return (
              <Link
                key={item}
                underline="hover"
                color="text.secondary"
                href="#"
              >
                {item}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Container>
    </Box>
  );
}
