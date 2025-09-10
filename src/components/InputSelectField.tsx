import { useField } from "formik";
import {
  Autocomplete,
  TextField,
  FormControl,
  // FormHelperText,
  AutocompleteProps,
} from "@mui/material";
// import React from "react";

interface Option {
  value: string | number;
  label: string;
}

interface InputSelectFieldProps
  extends Omit<
    AutocompleteProps<Option, false, false, false>,
    "name" | "options" | "renderInput"
  > {
  name: string;
  label: string;
  options: Option[];
  searchable?: boolean; // for API compatibility, but always searchable
  required?: boolean;
  variant?: "filled" | "outlined" | "standard";
  sx?: import("@mui/material").SxProps<import("@mui/material").Theme>; // allow sx prop
}

const InputSelectField = ({
  name,
  label,
  options,
  required = false,
  variant = "filled",
  sx,
  // searchable = true, // not needed, always searchable with Autocomplete
  ...props
}: InputSelectFieldProps) => {
  const [field, meta, helpers] = useField(name);
  const hasError = meta.touched && Boolean(meta.error);
  const value = options.find((opt) => opt.value === field.value) || null;

  return (
    <FormControl fullWidth margin="normal" error={hasError} sx={sx}>
      <Autocomplete
        options={options}
        getOptionLabel={(option) => option.label}
        value={value}
        onChange={(_, newValue) => {
          helpers.setValue(newValue ? newValue.value : "");
        }}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={hasError}
            helperText={hasError ? meta.error : undefined}
            variant={variant}
            required={required}
            inputProps={{ ...params.inputProps, required: false }} // disables browser validation
          />
        )}
        // disableClearable
        {...props}
      />
      {/* {hasError && <FormHelperText>{meta.error}</FormHelperText>} */}
    </FormControl>
  );
};

export default InputSelectField;
