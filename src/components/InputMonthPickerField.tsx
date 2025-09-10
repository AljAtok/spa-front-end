import React from "react";
import { useField, FieldHookConfig } from "formik";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

interface InputMonthPickerFieldProps {
  label: string;
  name: string;
  required?: boolean;
  sx?: object;
  views?: Array<"year" | "month" | "day">; // Add views prop
  onChange?: (value: string) => void; // Add custom onChange handler
}

// Use intersection (&) for prop types
const InputMonthPickerField: React.FC<
  InputMonthPickerFieldProps & FieldHookConfig<string>
> = ({
  label,
  name,
  required,
  sx,
  views = ["month", "year"], // Default to ["year", "month"]
  onChange,
}) => {
  const [field, , helpers] = useField<string>({ name });
  const value = field.value ? dayjs(field.value) : null;

  return (
    <DatePicker
      views={views} // Use dynamic views prop
      label={label}
      value={value}
      onChange={(date) => {
        if (date) {
          const formattedDate = dayjs(date)
            .startOf("month")
            .format("YYYY-MM-01");
          helpers.setValue(formattedDate);
          if (onChange) {
            onChange(formattedDate);
          }
        } else {
          helpers.setValue("");
          if (onChange) {
            onChange("");
          }
        }
      }}
      slotProps={{
        textField: {
          fullWidth: true,
          variant: "filled",
          required,
          sx,
        },
      }}
    />
  );
};

export default InputMonthPickerField;
