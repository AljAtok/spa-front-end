import React, { useMemo, useCallback } from "react";
import {
  Autocomplete,
  Checkbox,
  TextField,
  Popper,
  AutocompleteRenderOptionState,
  AutocompleteRenderInputParams,
} from "@mui/material";
import { FixedSizeList, ListChildComponentProps } from "react-window";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";

export type OptionType = {
  label: string;
  value: string | number;
  [key: string]: unknown;
};

interface InputVirtualizedMultiSelectFieldProps {
  label: string;
  options: OptionType[];
  value: OptionType[];
  onChange: (value: OptionType[]) => void;
  getOptionLabel?: (option: OptionType) => string;
  getOptionValue?: (option: OptionType) => string | number;
  disabled?: boolean;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  limitTags?: number;
  renderInput?: (params: AutocompleteRenderInputParams) => React.ReactNode;
  // ...other MUI Autocomplete props as needed
}

const LISTBOX_PADDING = 8; // px

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  return React.cloneElement(data[index], {
    style: {
      ...style,
      top: (style.top as number) + LISTBOX_PADDING,
    },
  });
}

const VirtualizedListboxComponent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLElement>
>(function ListboxComponent(props, ref) {
  const { children, ...other } = props;
  const itemCount = Array.isArray(children) ? children.length : 0;
  const itemSize = 48;
  const height = Math.min(8, itemCount) * itemSize + 2 * LISTBOX_PADDING;
  return (
    <div ref={ref} {...other}>
      <FixedSizeList
        height={height}
        width="100%"
        itemSize={itemSize}
        itemCount={itemCount}
        overscanCount={5}
        itemData={children}
      >
        {renderRow}
      </FixedSizeList>
    </div>
  );
});

const InputVirtualizedMultiSelectField: React.FC<
  InputVirtualizedMultiSelectFieldProps
> = ({
  label,
  options,
  value,
  onChange,
  getOptionLabel = (option) => option.label,
  getOptionValue = (option) => option.value,
  disabled,
  placeholder,
  error,
  helperText,
  limitTags = 2,
  renderInput,
  ...rest
}) => {
  // Memoize options for performance
  const memoizedOptions = useMemo(() => options, [options]);

  // Select All/Unselect All logic
  const isAllSelected = value.length === options.length && options.length > 0;
  const optionsWithSelectAll = useMemo(() => {
    const selectAllOption: OptionType = {
      label: isAllSelected ? "Unselect All" : "Select All",
      value: "__select_all__",
    };
    return [selectAllOption, ...memoizedOptions];
  }, [isAllSelected, memoizedOptions]);

  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: OptionType[]) => {
      if (newValue.length > 0 && newValue[0].value === "__select_all__") {
        if (isAllSelected) {
          onChange([]);
        } else {
          onChange([...options]);
        }
      } else {
        onChange(newValue.filter((opt) => opt.value !== "__select_all__"));
      }
    },
    [isAllSelected, onChange, options]
  );

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={optionsWithSelectAll}
      value={value}
      onChange={handleChange}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={(option, val) =>
        getOptionValue(option) === getOptionValue(val)
      }
      disabled={disabled}
      limitTags={limitTags}
      PopperComponent={Popper}
      ListboxComponent={
        VirtualizedListboxComponent as React.ComponentType<
          React.HTMLAttributes<HTMLElement>
        >
      }
      renderOption={(
        props,
        option,
        { selected }: AutocompleteRenderOptionState
      ) => (
        <li {...props} key={getOptionValue(option)}>
          <Checkbox
            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
            checkedIcon={<CheckBoxIcon fontSize="small" />}
            style={{ marginRight: 8 }}
            checked={
              selected || (option.value === "__select_all__" && isAllSelected)
            }
          />
          {getOptionLabel(option)}
        </li>
      )}
      renderInput={(props) =>
        renderInput ? (
          renderInput(props)
        ) : (
          <TextField
            {...props}
            label={label}
            variant="filled"
            placeholder={placeholder}
            error={error}
            helperText={helperText}
          />
        )
      }
      {...rest}
    />
  );
};

export default InputVirtualizedMultiSelectField;
