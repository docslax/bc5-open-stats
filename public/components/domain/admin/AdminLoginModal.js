import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, } from "@mui/material";
import { useState } from "react";
export function AdminLoginModal({ open, onClose, onSuccess, }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ username, password }),
            });
            const result = await response.json();
            if (!response.ok) {
                setError(result.error || "Unable to sign in.");
                return;
            }
            onSuccess();
            onClose();
            setUsername("");
            setPassword("");
        }
        catch (caughtError) {
            setError("Unable to reach the login service.");
            console.error(caughtError);
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "xs", fullWidth: true, children: [_jsx(DialogTitle, { children: "Admin sign in" }), _jsx("form", { onSubmit: handleSubmit, children: _jsx(DialogContent, { sx: { pt: 1, pb: 1 }, children: _jsxs(Stack, { spacing: 1.5, children: [error ? _jsx(Alert, { severity: "error", children: error }) : null, _jsx(TextField, { label: "Username", value: username, onChange: (event) => setUsername(event.target.value), required: true, fullWidth: true }), _jsx(TextField, { label: "Password", type: "password", value: password, onChange: (event) => setPassword(event.target.value), required: true, fullWidth: true }), _jsxs(DialogActions, { sx: { px: 0, pb: 0, pt: 0.5, justifyContent: "flex-end" }, children: [_jsx(Button, { onClick: onClose, color: "inherit", size: "small", children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", disabled: loading, size: "small", children: loading ? "Signing in…" : "Sign in" })] })] }) }) })] }));
}
//# sourceMappingURL=AdminLoginModal.js.map