import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Button, Menu, MenuItem, Toolbar, Typography } from '@mui/material';
import { useState } from 'react';
export function PageHeader({ siteName, logoLabel, menuItems }) {
    const [anchorEl, setAnchorEl] = useState(null);
    function handleOpenMenu(event) {
        setAnchorEl(event.currentTarget);
    }
    function handleCloseMenu() {
        setAnchorEl(null);
    }
    return (_jsx(Box, { component: "header", sx: {
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
        }, children: _jsxs(Toolbar, { sx: { minHeight: '4.5rem', justifyContent: 'space-between', gap: 2 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1.5 }, children: [_jsx(Box, { sx: {
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
                            }, children: logoLabel }), _jsx(Typography, { variant: "h1", sx: { fontSize: { xs: '1.05rem', sm: '1.2rem' } }, children: siteName })] }), _jsxs(Box, { children: [_jsx(Button, { variant: "contained", onClick: handleOpenMenu, sx: { minWidth: 116 }, children: "Menu" }), _jsx(Menu, { anchorEl: anchorEl, open: Boolean(anchorEl), onClose: handleCloseMenu, anchorOrigin: { vertical: 'bottom', horizontal: 'right' }, transformOrigin: { vertical: 'top', horizontal: 'right' }, children: menuItems.map((item) => (_jsx(MenuItem, { onClick: () => {
                                    handleCloseMenu();
                                    item.onClick?.();
                                }, children: item.label }, item.label))) })] })] }) }));
}
//# sourceMappingURL=PageHeader.js.map