import { Box, Container, Typography } from "@mui/material";

interface PageFooterProps {
  siteName: string;
}

export function PageFooter({ siteName }: PageFooterProps) {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        borderTop: "1px solid",
        borderColor: "divider",
        backgroundColor: "background.paper",
        mt: "auto",
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          © {year} {siteName}. All Rights Reserved.
        </Typography>
      </Container>
    </Box>
  );
}
