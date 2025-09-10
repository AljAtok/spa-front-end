import { useField, FieldHookConfig } from "formik";
import {
  Checkbox,
  FormControlLabel,
  FormHelperText,
  SxProps,
  Theme,
} from "@mui/material";
import React from "react";

interface InputCheckBoxFieldProps {
  label: string;
  name: string;
  sx?: SxProps<Theme>;
}

const InputCheckBoxField: React.FC<
  InputCheckBoxFieldProps & FieldHookConfig<boolean>
> = ({ label, sx, ...props }) => {
  // Only pass Formik config to useField
  const [field, meta] = useField<boolean>({ ...props });

  return (
    <>
      <FormControlLabel
        control={<Checkbox {...field} checked={!!field.value} />}
        label={label}
        sx={sx}
      />
      {meta.touched && meta.error ? (
        <FormHelperText error>{meta.error}</FormHelperText>
      ) : null}
    </>
  );
};

export default InputCheckBoxField;
