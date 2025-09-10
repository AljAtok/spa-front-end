import React, { useRef, useState } from "react";
import { Box, Typography, LinearProgress } from "@mui/material";

interface InputFileFieldProps {
  label: string;
  file: File | null;
  onFileChange: (file: File) => void;
  progress?: number;
  error?: string;
}

const InputFileField: React.FC<InputFileFieldProps> = ({
  label,
  file,
  onFileChange,
  progress = 0,
  error,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  return (
    <Box
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      sx={{
        border: dragActive ? "2px solid #1976d2" : "2px dashed #ccc",
        borderRadius: 2,
        p: 2,
        textAlign: "center",
        cursor: "pointer",
        bgcolor: dragActive ? "#e3f2fd" : "inherit",
        mb: 2,
      }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <Typography variant="body1" color={error ? "error" : "textPrimary"}>
        {label}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Drag & drop a file here, or click to select
      </Typography>
      {file && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Selected: {file.name}
        </Typography>
      )}
      {progress > 0 && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption">{progress}%</Typography>
        </Box>
      )}
      {error && (
        <Typography variant="caption" color="error">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default InputFileField;
