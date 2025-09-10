import { useField } from "formik";
import {
  Autocomplete,
  TextField,
  FormControl,
  // FormHelperText,
  AutocompleteProps,
  Checkbox,
  ListItemText,
} from "@mui/material";
import { useMemo } from "react";

interface Option {
  value: string | number;
  label: string;
}

interface InputMultiSelectFieldProps
  extends Omit<
    AutocompleteProps<Option, true, false, false>,
    "name" | "options" | "renderInput"
  > {
  name: string;
  label: string;
  options: Option[];
  searchable?: boolean; // for API compatibility, but always searchable
  required?: boolean;
  sx?: import("@mui/material").SxProps<import("@mui/material").Theme>; // allow sx prop
}

const InputMultiSelectField = ({
  name,
  label,
  options,
  required = false,
  sx,
  // searchable = true, // not needed, always searchable with Autocomplete
  ...props
}: InputMultiSelectFieldProps) => {
  const [field, meta, helpers] = useField(name);
  const hasError = meta.touched && Boolean(meta.error);
  const value = options.filter((opt) =>
    (field.value || []).includes(opt.value)
  );

  // Select All/Unselect All logic
  const allSelected = value.length === options.length && options.length > 0;
  // Memoize select all option and filtered options for performance
  const selectAllOption = useMemo(
    () => ({ value: "__select_all__", label: "" }),
    []
  );
  const allOptions = useMemo(
    () => [selectAllOption, ...options],
    [selectAllOption, options]
  );

  return (
    <FormControl fullWidth error={hasError} sx={sx}>
      <Autocomplete
        multiple
        options={allOptions}
        getOptionLabel={(option) =>
          option.value === "__select_all__"
            ? allSelected
              ? "Unselect All"
              : "Select All"
            : option.label
        }
        value={value}
        onChange={(_, newValue, _reason, details) => {
          if (
            details &&
            details.option &&
            details.option.value === "__select_all__"
          ) {
            if (allSelected) {
              helpers.setValue([]);
            } else {
              helpers.setValue(options.map((opt) => opt.value));
            }
          } else {
            helpers.setValue(
              newValue
                .filter((v) => v.value !== "__select_all__")
                .map((v) => v.value)
            );
          }
        }}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        renderOption={(props, option, { selected }) => {
          if (option.value === "__select_all__") {
            return (
              <li {...props} style={{ fontWeight: 600, color: "#1976d2" }}>
                <Checkbox
                  style={{ marginRight: 8 }}
                  checked={allSelected}
                  indeterminate={
                    value.length > 0 && value.length < options.length
                  }
                />
                {allSelected ? "Unselect All" : "Select All"}
              </li>
            );
          }
          return (
            <li {...props}>
              <Checkbox style={{ marginRight: 8 }} checked={selected} />
              <ListItemText primary={option.label} />
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            error={hasError}
            helperText={hasError ? meta.error : undefined}
            variant="filled"
            required={required}
            inputProps={{ ...params.inputProps, required: false }} // disables browser validation
          />
        )}
        disableCloseOnSelect
        ListboxProps={{
          style: { maxHeight: 320, overflowY: "auto" },
        }}
        {...props}
      />
    </FormControl>
  );
};

export default InputMultiSelectField;
