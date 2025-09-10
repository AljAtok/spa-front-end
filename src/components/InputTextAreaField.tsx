import { useField, FieldHookConfig } from "formik";
import { TextField } from "@mui/material";
import React from "react";

interface InputTextAreaFieldProps {
  label: string;
  name: string;
  multiline?: boolean;
  rows?: number;
}

const InputTextAreaField: React.FC<
  InputTextAreaFieldProps & FieldHookConfig<string>
> = ({ label, ...props }) => {
  // Only pass Formik config to useField
  const [field, meta] = useField<string>({ ...props });
  return (
    <TextField
      {...field}
      label={label}
      multiline
      rows={4}
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
      fullWidth
      variant="filled"
      margin="normal"
    />
  );
};

export default InputTextAreaField;
