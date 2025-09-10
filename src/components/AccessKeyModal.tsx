// src/components/AccessKeyModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { tokens } from "../styles/theme";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import { useUserPermissions } from "../hooks/useUserPermissions";
import { useApi } from "../hooks/useApi";
import { UserAccessKeyData } from "@/types/UserTypes";
import {
  migrateToSecureTokens,
  secureGetCurrentStorageType,
  // secureStoreAuthTokens,
} from "@/utils/secureAuth";
import { useNavigate } from "react-router-dom";

// interface AccessKey {
//   id: number;
//   access_key_name: string;
//   status_id: number;
//   user_access_key_status_id: number;
// }

interface AccessKeyModalProps {
  open: boolean;
  onClose: () => void;
  userAccessKeyData: UserAccessKeyData | null;
  onAccessKeyChange: (accessKeyId: number) => void;
  loading?: boolean;
  currentAccessKeyId: number;
}

const AccessKeyModal: React.FC<AccessKeyModalProps> = ({
  open,
  onClose,
  userAccessKeyData,
  onAccessKeyChange,
  loading = false,
  currentAccessKeyId,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { refetchUserPermission } = useUserPermissions();
  const { put } = useApi();
  const navigate = useNavigate();

  // Extract available access keys and current access key from the data
  const availableAccessKeys = useMemo(
    () => userAccessKeyData?.available_access_keys || [],
    [userAccessKeyData?.available_access_keys]
  );
  // const currentAccessKeyId = userAccessKeyData?.current_access_key;
  // Find the current access key or default to first available
  const defaultAccessKeyId = useMemo(() => {
    if (
      currentAccessKeyId &&
      availableAccessKeys.some(
        (key) => key.id === currentAccessKeyId && key.status_id === 1
      )
    ) {
      return currentAccessKeyId;
    }
    const firstActive = availableAccessKeys.find((key) => key.status_id === 1);
    return firstActive ? firstActive.id : 0;
  }, [currentAccessKeyId, availableAccessKeys]);

  const [selectedAccessKeyId, setSelectedAccessKeyId] =
    useState<number>(defaultAccessKeyId);
  const [isLoading, setIsLoading] = useState(false); // Reset selected access key when modal opens with current access key
  useEffect(() => {
    if (open) {
      if (
        currentAccessKeyId &&
        availableAccessKeys.some(
          (key) => key.id === currentAccessKeyId && key.status_id === 1
        )
      ) {
        setSelectedAccessKeyId(currentAccessKeyId);
      } else {
        // If no current access key or it's not active, default to first available active key
        const firstActive = availableAccessKeys.find(
          (key) => key.status_id === 1
        );
        if (firstActive) {
          setSelectedAccessKeyId(firstActive.id);
        }
      }
    }
  }, [open, currentAccessKeyId, availableAccessKeys]);

  // Filter active access keys (status_id === 1)
  const activeAccessKeys = availableAccessKeys.filter(
    (key) => key.status_id === 1
  );
  const handleConfirm = async () => {
    if (!selectedAccessKeyId || !userAccessKeyData) return;

    try {
      setIsLoading(true);
      const userId = userAccessKeyData.user_id;

      // Make API call to update user's current access key
      const response = await put(`/users/${userId}/change-access-key`, {
        access_key_id: selectedAccessKeyId,
      });

      const currentStorageType = secureGetCurrentStorageType();
      // console.log("Storage :", currentStorageType);
      // Assert the type of response to avoid 'unknown' error
      const { new_access_token, refresh_token, user } = response as {
        new_access_token: string;
        refresh_token: string;
        user: object;
      };
      if (currentStorageType === "localStorage") {
        localStorage.setItem("authToken", new_access_token);
        localStorage.setItem("refreshToken", refresh_token);
        localStorage.setItem("user", JSON.stringify(user));
      }
      if (currentStorageType === "sessionStorage") {
        sessionStorage.setItem("authToken", new_access_token);
        sessionStorage.setItem("refreshToken", refresh_token);
        sessionStorage.setItem("user", JSON.stringify(user));
      }
      migrateToSecureTokens();
      navigate(".", { replace: true });
      // navigate(currentPath, { replace: true });
      // navigate(0);

      // Refresh the UserPermissionsContext to get updated data
      refetchUserPermission();

      // Call the parent callback for any additional handling
      onAccessKeyChange(selectedAccessKeyId);

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Failed to change access key:", error);
      // The useApi hook will handle showing error notifications
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    const validCurrentKey =
      currentAccessKeyId &&
      availableAccessKeys.some(
        (key) => key.id === currentAccessKeyId && key.status_id === 1
      );
    const fallbackKey =
      availableAccessKeys.find((key) => key.status_id === 1)?.id || 0;
    setSelectedAccessKeyId(validCurrentKey ? currentAccessKeyId : fallbackKey);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.primary[400],
          border: `1px solid ${colors.grey[700]}`,
        },
      }}
    >
      {" "}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          color: colors.grey[100],
          borderBottom: `1px solid ${colors.grey[700]}`,
        }}
      >
        <VpnKeyOutlinedIcon />
        Change Access Key
      </DialogTitle>{" "}
      <DialogContent sx={{ pt: 3 }}>
        {!userAccessKeyData ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            Loading access key information...
          </Alert>
        ) : activeAccessKeys.length === 0 ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            No active access keys available for your account.
          </Alert>
        ) : (
          <Box>
            <Typography
              variant="body1"
              sx={{ mt: 2, mb: 3, color: colors.primary[100] }}
            >
              Select the access key you want to use as your default. This will
              determine which permissions and data you have access to.
            </Typography>

            <FormControl fullWidth>
              <InputLabel
                id="access-key-select-label"
                sx={{ color: colors.grey[300] }}
              >
                Access Key
              </InputLabel>{" "}
              <Select
                labelId="access-key-select-label"
                value={
                  activeAccessKeys.length > 0 &&
                  activeAccessKeys.some((key) => key.id === selectedAccessKeyId)
                    ? selectedAccessKeyId
                    : activeAccessKeys[0]?.id || ""
                }
                label="Access Key"
                onChange={(e) => setSelectedAccessKeyId(Number(e.target.value))}
                disabled={loading || isLoading}
                sx={{
                  color: colors.primary[100],
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.greenAccent[500],
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.grey[500],
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: colors.greenAccent[500],
                  },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      backgroundColor: colors.primary[400],
                      border: `1px solid ${colors.grey[700]}`,
                    },
                  },
                }}
              >
                {" "}
                {activeAccessKeys.map((accessKey) => (
                  <MenuItem
                    key={accessKey.id}
                    value={accessKey.id}
                    sx={{
                      color: colors.grey[100],
                      "&:hover": {
                        backgroundColor: colors.greenAccent[500],
                      },
                      "&.Mui-selected": {
                        backgroundColor: colors.blueAccent[500],
                        "&:hover": {
                          backgroundColor: colors.greenAccent[500],
                        },
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <VpnKeyOutlinedIcon fontSize="small" />
                      <Box sx={{ flexGrow: 1 }}>
                        {accessKey.access_key_name}
                      </Box>
                      {accessKey.id == currentAccessKeyId && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.primary[100],
                            fontWeight: "bold",
                            fontSize: "0.75rem",
                          }}
                        >
                          (Current)
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {currentAccessKeyId && (
              <Typography
                variant="body2"
                sx={{ mt: 2, color: colors.primary[100] }}
              >
                Current Access Key:{" "}
                {
                  activeAccessKeys.find((key) => key.id === currentAccessKeyId)
                    ?.access_key_name
                }
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          borderTop: `1px solid ${colors.grey[700]}`,
          p: 2,
        }}
      >
        {" "}
        <Button
          onClick={handleCancel}
          disabled={loading || isLoading}
          sx={{
            color: colors.grey[300],
            "&:hover": {
              backgroundColor: colors.grey[800],
            },
          }}
        >
          Close
        </Button>{" "}
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={
            loading ||
            isLoading ||
            !userAccessKeyData ||
            activeAccessKeys.length === 0
          }
          sx={{
            backgroundColor: colors.greenAccent[600],
            color: colors.grey[100],
            "&:hover": {
              backgroundColor: colors.greenAccent[500],
            },
            "&:disabled": {
              backgroundColor: colors.grey[700],
              color: colors.grey[500],
            },
          }}
          startIcon={
            loading || isLoading ? (
              <CircularProgress size={16} />
            ) : (
              <VpnKeyOutlinedIcon />
            )
          }
        >
          {loading || isLoading ? "Changing..." : "Change Access Key"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessKeyModal;
