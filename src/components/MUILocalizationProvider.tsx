import * as React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

const MUILocalizationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    {children}
  </LocalizationProvider>
);

export default MUILocalizationProvider;
