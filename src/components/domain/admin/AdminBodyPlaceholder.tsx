import { Box, Typography } from "@mui/material";

export function AdminBodyPlaceholder() {
  return (
    <Box
      sx={{
        minHeight: { xs: 280, md: 420 },
        border: "1px dashed",
        borderColor: "divider",
        borderRadius: 3,
        backgroundColor: "background.paper",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        px: 3,
      }}
    >
      <Box>
        <Typography variant="h2" sx={{ mb: 1 }}>
          BODY CONTENT AREA
        </Typography>
        <Typography color="text.secondary">
          Admin workspace modules will be mounted here.
        </Typography>
      </Box>
    </Box>
  );
}
