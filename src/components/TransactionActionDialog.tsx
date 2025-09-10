// src/components/TransactionActionDialog.tsx
import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Box,
  ButtonPropsColorOverrides,
  CircularProgress,
} from "@mui/material";
import { OverridableStringUnion } from "@mui/types";

interface TransactionActionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  title: string;
  message: React.ReactNode;
  reasonLabel: string;
  reasonPlaceholder?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: OverridableStringUnion<
    | "inherit"
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "info"
    | "warning",
    ButtonPropsColorOverrides
  >;
  required?: boolean;
  loading?: boolean; // Added loading prop
}

const TransactionActionDialog: React.FC<TransactionActionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  reasonLabel,
  reasonPlaceholder = "Enter reason...",
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "secondary",
  required = false,
  loading = false,
}) => {
  const [reason, setReason] = useState("");

  const handleClose = () => {
    setReason("");
    onClose();
  };

  const handleConfirm = () => {
    if (required && !reason.trim()) {
      return; // Don't proceed if reason is required but empty
    }
    onConfirm(reason.trim());
    setReason("");
  };

  const canConfirm = !required || reason.trim().length > 0;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="transaction-action-dialog-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="transaction-action-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{message}</DialogContentText>
        <Box sx={{ mt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label={reasonLabel}
            placeholder={reasonPlaceholder}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            variant="outlined"
            required={required}
            error={required && reason.trim().length === 0 && open}
            helperText={
              required && reason.trim().length === 0 && open
                ? "This field is required"
                : ""
            }
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={loading}>
          {cancelButtonText}
        </Button>
        <Button
          onClick={handleConfirm}
          color={confirmButtonColor}
          variant="contained"
          disabled={!canConfirm || loading}
          startIcon={
            loading ? <CircularProgress size={20} color="inherit" /> : undefined
          }
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionActionDialog;
