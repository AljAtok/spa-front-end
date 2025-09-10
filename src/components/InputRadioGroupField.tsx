// src/components/InputRadioGroupField.tsx
import { useField, FieldHookConfig } from "formik";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from "@mui/material";

// 1. Define an interface for each option in the radio group
interface RadioOption<T extends string | number | boolean> {
  label: string;
  value: T;
}

// 2. Define the props for the InputRadioGroupField component
interface InputRadioGroupFieldProps<T extends string | number | boolean> {
  required: boolean;
  name: string;
  label: string;
  options: RadioOption<T>[];
  sx?: object;
  // add other RadioGroupProps here if need to pass them down
}

// 3. Convert the component to a functional component with proper TypeScript generics
const InputRadioGroupField = <T extends string | number | boolean>({
  label,
  options,
  sx,
  ...props
}: InputRadioGroupFieldProps<T> & FieldHookConfig<T>) => {
  // useField hook correctly infers the type T for the field's value
  const [field, meta] = useField<T>({ ...props });
  const hasError = meta.touched && Boolean(meta.error);

  return (
    <FormControl
      component="fieldset"
      fullWidth
      margin="normal"
      error={hasError}
      sx={sx}
    >
      {/* use FormLabel here instead of Typography if prefer MUI's dedicated form label */}
      <FormLabel component="legend">{label}</FormLabel>
      <RadioGroup {...field} value={field.value || ""} row>
        {options.map((option) => (
          <FormControlLabel
            key={String(option.value)} // Ensure key is a string for React
            value={option.value}
            control={<Radio />}
            label={option.label}
          />
        ))}
      </RadioGroup>
      {hasError && <FormHelperText>{meta.error}</FormHelperText>}
    </FormControl>
  );
};

export default InputRadioGroupField;
