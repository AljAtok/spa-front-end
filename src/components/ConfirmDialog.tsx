// src/components/ConfirmationDialog.tsx
import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ButtonPropsColorOverrides,
  CircularProgress,
} from "@mui/material";
import { OverridableStringUnion } from "@mui/types";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode; // Allows for bolding, etc.
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
  autoFocusConfirm?: boolean;
  loading?: boolean; // Added loading prop
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
  confirmButtonColor = "secondary",
  autoFocusConfirm = false,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="confirmation-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={loading}>
          {cancelButtonText}
        </Button>
        <Button
          onClick={onConfirm}
          color={confirmButtonColor}
          variant="contained"
          autoFocus={autoFocusConfirm}
          disabled={loading}
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

export default ConfirmationDialog;
