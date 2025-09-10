import React from "react";
import { Tabs, Tab, Box } from "@mui/material";

export interface TabConfig {
  label: string;
  icon?: React.ReactElement;
  content: React.ReactNode;
  value?: string | number;
}

interface ReusableTabsProps {
  tabs: TabConfig[];
  value?: number;
  onChange?: (event: React.SyntheticEvent, newValue: number) => void;
  tabProps?: object;
  tabPanelProps?: object;
  sx?: object;
  innserSX?: object;
}

const ReusableTabs: React.FC<ReusableTabsProps> = ({
  tabs,
  value: controlledValue,
  onChange,
  tabProps = {},
  tabPanelProps = {},
  sx = {},
  innserSX = { pl: 1, pt: 0, pr: 1, pb: 0.5 },
}) => {
  const [internalValue, setInternalValue] = React.useState(0);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setInternalValue(newValue);
    if (onChange) onChange(event, newValue);
  };

  return (
    <Box sx={{ width: "100%", ...sx }}>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="reusable tabs"
        variant="standard"
        {...tabProps}
      >
        {tabs.map((tab, idx) => (
          <Tab
            key={tab.label}
            label={tab.label}
            icon={tab.icon || undefined}
            iconPosition={tab.icon ? "start" : undefined}
            id={`reusable-tab-${idx}`}
            aria-controls={`reusable-tabpanel-${idx}`}
          />
        ))}
      </Tabs>
      {tabs.map((tab, idx) => (
        <div
          key={tab.label}
          role="tabpanel"
          hidden={value !== idx}
          id={`reusable-tabpanel-${idx}`}
          aria-labelledby={`reusable-tab-${idx}`}
          {...tabPanelProps}
        >
          {value === idx && <Box sx={innserSX}>{tab.content}</Box>}
        </div>
      ))}
    </Box>
  );
};

export default ReusableTabs;
