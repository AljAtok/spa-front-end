import React, { useState } from "react";
import { useField } from "formik";
import {
  TextField,
  TextFieldProps,
  IconButton,
  InputAdornment,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

// Define our component props
interface InputTextFieldProps {
  name: string; // Required for Formik
  label: string;
  type?: string;
  sx?: object;
  InputProps?: TextFieldProps["InputProps"];
  [key: string]: unknown; // Allow other props to be passed with unknown type
}

const InputTextField: React.FC<InputTextFieldProps> = ({
  name,
  label,
  type,
  sx,
  InputProps,
  ...props
}) => {
  const [field, meta] = useField(name);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <TextField
      fullWidth
      variant="filled"
      label={label}
      type={isPassword ? (showPassword ? "text" : "password") : type}
      {...field}
      {...props}
      sx={sx}
      error={!!meta.touched && !!meta.error}
      helperText={meta.touched && meta.error ? meta.error : undefined}
      margin="normal"
      InputProps={{
        ...(InputProps || {}),
        ...(isPassword
          ? {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    onClick={() => setShowPassword((show) => !show)}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }
          : {}),
      }}
    />
  );
};

export default InputTextField;
