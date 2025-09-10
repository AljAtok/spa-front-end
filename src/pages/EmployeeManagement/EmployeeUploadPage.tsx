import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  // LinearProgress,
} from "@mui/material";
import InputFileField from "@/components/InputFileField";
import { useNavigate } from "react-router-dom";
import FormHeader from "@/components/FormHeader";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
import { useApi } from "@/hooks/useApi";

interface UploadSuccessRow {
  LOCATION: string;
  "EMP. NO.": number;
  "FIRST NAME": string;
  "LAST NAME": string;
  EMAIL: string | null;
  POSITION: string;
  STATUS: string;
  __rowNum__: number;
}

interface UploadResult {
  inserted_count: number;
  updated_count: number;
  inserted_row_numbers: number[];
  updated_row_numbers: number[];
  errors: { row: number; error: string }[];
  success: UploadSuccessRow[];
}

const EmployeeUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingStarted, setProcessingStarted] = useState(false);
  const navigate = useNavigate();
  const { post } = useApi();

  // Simulate processing progress based on file size
  const simulateProcessingProgress = (fileSize: number) => {
    // Estimate processing time based on file size (roughly 1MB = 4000 seconds)
    const estimatedSeconds = Math.max(
      2,
      Math.min(30, (fileSize / (1024 * 1024)) * 4000)
    );
    const incrementInterval = 200; // Update every 200ms
    const totalIncrements = (estimatedSeconds * 1000) / incrementInterval;
    const progressPerIncrement = (95 - 25) / totalIncrements; // From 25% to 95%

    let currentProgress = 25;
    const interval = setInterval(() => {
      currentProgress += progressPerIncrement;
      if (currentProgress >= 95) {
        currentProgress = 95;
        clearInterval(interval);
      }
      setProgress(Math.round(currentProgress));
    }, incrementInterval);

    return interval;
  };

  const handleFileChange = (f: File) => {
    setFile(f);
    setResult(null);
    setError(null);
    setProgress(0);
    setProcessingStarted(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setResult(null);
    setProgress(0);
    setProcessingStarted(false);

    const formData = new FormData();
    formData.append("file", file);

    let processingInterval: NodeJS.Timeout | null = null;

    try {
      const response = await post<UploadResult>(
        "/employees/upload-excel",
        formData,
        undefined,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              ((progressEvent?.loaded ?? 0) * 100) / (progressEvent?.total ?? 1)
            );
            // Show upload progress up to 25% to indicate file transfer
            setProgress(Math.min(percent * 0.25, 25));

            // Start processing simulation when file upload is complete
            if (percent >= 100 && !processingStarted) {
              setProcessingStarted(true);
              processingInterval = simulateProcessingProgress(file.size);
            }
          },
        }
      );

      // Clear the simulation interval when server responds
      if (processingInterval) {
        clearInterval(processingInterval);
      }

      // Set progress to 100% when server processing is complete
      setProgress(100);
      setResult(response);
    } catch (err) {
      let message = "Upload failed";
      if (typeof err === "object" && err !== null) {
        if (
          "response" in err &&
          typeof (err as Record<string, unknown>).response === "object" &&
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message
        ) {
          message =
            (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message || message;
        } else if (err instanceof Error) {
          message = err.message;
        }
      }
      setError(message);
      // Clear the simulation interval on error
      if (processingInterval) {
        clearInterval(processingInterval);
      }
    } finally {
      setUploading(false);
      //   setFile(null);
    }
  };

  // Download template handler
  const handleDownloadTemplate = () => {
    const link = document.createElement("a");
    link.href = `${
      import.meta.env.VITE_API_BASE_URL
    }/uploads/UPLOAD-TEMPLATE/EMPLOYEE-UPLOAD-TEMPLATE.xlsx`;
    link.download = "EMPLOYEE-UPLOAD-TEMPLATE.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box maxWidth={900} mx="auto" mt={4}>
      <FormHeader
        title="Upload Employees"
        actionButton={
          <Button
            variant="outlined"
            color="success"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate("/employees")}
            sx={{ ml: 2 }}
          >
            Back to Employees
          </Button>
        }
      />
      <Box mt={4}>
        <Box
          mt={4}
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
          >
            Download Template
          </Button>
          <Box width="100%" maxWidth={800}>
            <InputFileField
              label="Select Excel File"
              file={file}
              onFileChange={handleFileChange}
              progress={progress}
              error={error ?? undefined}
            />
          </Box>
        </Box>
        <Box display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            color="secondary"
            onClick={handleUpload}
            disabled={!file || uploading}
            sx={{ mt: 2 }}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </Box>
        {/* {uploading && (
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              {progress < 25
                ? "Uploading file..."
                : progress < 95
                ? `Processing data... ${Math.round(progress)}%`
                : progress === 100
                ? "Processing complete!"
                : "Processing data..."}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )} */}
        {!uploading && progress === 100 && result && (
          <Box mt={2}>
            <Typography variant="body2" color="success.main" mb={1}>
              Upload completed successfully!
            </Typography>
          </Box>
        )}
        {error && (
          <Typography color="error" mt={2}>
            {error}
          </Typography>
        )}
        {result && (
          <Box mt={4}>
            <Typography variant="h6">Upload Result</Typography>
            <Typography>
              Inserted: {result.inserted_count} | Updated:{" "}
              {result.updated_count}
            </Typography>
            {(result.inserted_row_numbers.length > 0 ||
              result.updated_row_numbers.length > 0) && (
              <Typography>
                Inserted Rows: {result.inserted_row_numbers.join(", ")}
                <br />
                Updated Rows: {result.updated_row_numbers.join(", ")}
              </Typography>
            )}
            {result.errors.length > 0 && (
              <Box mt={2}>
                <Typography color="error">Errors:</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((err, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{err.row}</TableCell>
                          <TableCell>{err.error}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            {result.success.length > 0 && (
              <Box mt={2}>
                <Typography color="success.main">Success:</Typography>
                <TableContainer component={Paper}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Emp. No.</TableCell>
                        <TableCell>Name</TableCell>
                        <TableCell>Email</TableCell>
                        <TableCell>Position</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.success.map(
                        (row: UploadSuccessRow, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{row.__rowNum__}</TableCell>
                            <TableCell>{row.LOCATION}</TableCell>
                            <TableCell>{row["EMP. NO."]}</TableCell>
                            <TableCell>{`${row["FIRST NAME"]} ${row["LAST NAME"]}`}</TableCell>
                            <TableCell>{row.EMAIL}</TableCell>
                            <TableCell>{row.POSITION}</TableCell>
                            <TableCell>{row.STATUS}</TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default EmployeeUploadPage;
