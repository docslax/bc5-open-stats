import { Box, Button, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';

export interface HeaderMenuItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  siteName: string;
  logoLabel: string;
  menuItems: HeaderMenuItem[];
}

export function PageHeader({ siteName, logoLabel, menuItems }: PageHeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  function handleOpenMenu(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }

  function handleCloseMenu() {
    setAnchorEl(null);
  }

  return (
    <Box
      component="header"
      sx={{
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Toolbar sx={{ minHeight: '4.5rem', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: '2.375rem',
              height: '2.375rem',
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.contrastText',
              fontWeight: 700,
              fontSize: '0.8125rem',
            }}
          >
            {logoLabel}
          </Box>
          <Typography variant="h1" sx={{ fontSize: { xs: '1.05rem', sm: '1.2rem' } }}>
            {siteName}
          </Typography>
        </Box>

        <Box>
          <Button variant="contained" onClick={handleOpenMenu} sx={{ minWidth: 116 }}>
            Menu
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {menuItems.map((item) => (
              <MenuItem
                key={item.label}
                onClick={() => {
                  handleCloseMenu();
                  item.onClick?.();
                }}
              >
                {item.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </Box>
  );
}
