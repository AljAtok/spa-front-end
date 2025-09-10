// src/pages/Auth/LoginPage.tsx
import React, { useState, FormEvent } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import api from "../../api/axiosConfig"; // Import configured axios instance
import { useTheme } from "@mui/material";
import { tokens } from "../../styles/theme"; // theme tokens

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    setLoading(true);
    setError(null);

    try {
      // login endpoint
      const response = await api.post("/login", { email, password });

      const { token, user } = response.data; // backend response

      localStorage.setItem("authToken", token); // Store the token
      // Optionally store user info
      localStorage.setItem("user", JSON.stringify(user));

      console.log("Login successful:", user);
      navigate("/dashboard"); // Redirect to dashboard or home page
    } catch (err: unknown) {
      console.error("Login failed:", err);
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: unknown }).response === "object" &&
        (err as { response?: unknown }).response !== null
      ) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        setError(
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message || "Invalid credentials"
        );
      } else if (typeof err === "object" && err !== null && "request" in err) {
        // The request was made but no response was received
        setError("No response from server. Please try again later.");
      } else {
        // Something else happened in setting up the request that triggered an Error
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: colors.primary[500], // Use theme colors
      }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          maxWidth: 400,
          width: "90%",
          backgroundColor: colors.primary[400],
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          color={colors.grey[100]}
        >
          Login
        </Typography>
        <Box
          component="form"
          onSubmit={handleLogin}
          sx={{ width: "100%", mt: 1 }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            variant="filled" // Matches theme style
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[600], // Adjust input background
                "&:hover": {
                  backgroundColor: colors.primary[700],
                },
                "&.Mui-focused": {
                  backgroundColor: colors.primary[700],
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[200], // Label color
              },
            }}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            variant="filled" // Matches theme style
            sx={{
              "& .MuiFilledInput-root": {
                backgroundColor: colors.primary[600],
                "&:hover": {
                  backgroundColor: colors.primary[700],
                },
                "&.Mui-focused": {
                  backgroundColor: colors.primary[700],
                },
              },
              "& .MuiInputLabel-root": {
                color: colors.grey[200],
              },
            }}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
              backgroundColor: colors.greenAccent[600], // Use accent color
              "&:hover": {
                backgroundColor: colors.greenAccent[700],
              },
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Sign In"
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
