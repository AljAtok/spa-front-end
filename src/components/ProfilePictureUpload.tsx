// src/components/ProfilePictureUpload.tsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Avatar,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { PhotoCamera } from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { BACKEND_BASE_URL } from "@/config";

interface ProfilePictureUploadProps {
  currentImageUrl?: string;
  onImageUpload: (file: File) => Promise<void>;
  loading?: boolean;
  error?: string;
  onError?: (error: string) => void;
}

const Input = styled("input")({
  display: "none",
});

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onImageUpload,
  loading = false,
  error,
  onError,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setPreviewUrl(null);
  }, [currentImageUrl]);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      onError?.("Please select a valid image file (JPG, PNG, or GIF)");
      return;
    }

    // Validate file size (4MB limit to match backend)
    if (file.size > 4 * 1024 * 1024) {
      onError?.("File size must be less than 4MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      await onImageUpload(file);
    } catch (error) {
      console.error("Upload failed:", error);
      // Error will be handled by parent component
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Helper to get full image URL
  const getFullImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `${BACKEND_BASE_URL}${url}`;
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          position: "relative",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        <Avatar
          src={getFullImageUrl(previewUrl || currentImageUrl)}
          sx={{
            width: 120,
            height: 120,
            border: (theme) => `4px solid ${theme.palette.divider}`,
            ...(dragActive && {
              borderColor: "primary.main",
              borderStyle: "dashed",
            }),
          }}
        />
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-12px",
              marginLeft: "-12px",
            }}
          />
        )}
      </Box>

      <Box sx={{ textAlign: "center" }}>
        <label htmlFor="profile-picture-upload">
          <Input
            accept="image/*"
            id="profile-picture-upload"
            type="file"
            onChange={handleFileChange}
            disabled={loading}
          />
          <Button
            variant="outlined"
            component="span"
            startIcon={<PhotoCamera />}
            disabled={loading}
          >
            {currentImageUrl ? "Change Photo" : "Upload Photo"}
          </Button>
        </label>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          JPG, PNG, or GIF (max 4MB)
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default ProfilePictureUpload;
