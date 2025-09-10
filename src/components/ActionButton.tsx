// src/components/ActionButton.tsx
import React, { ElementType } from "react"; // Import ElementType for component type
import { Button, ButtonProps } from "@mui/material"; // Import ButtonProps

// Define the specific props for ActionButton,
// then extend ButtonProps to get all standard Material-UI Button props.
interface ActionButtonProps extends ButtonProps {
  onClick?: () => void; // onClick is optional as it might be handled by 'type="submit"' for forms
  text?: string; // Text is optional if children are provided
  icon?: ElementType; // The icon component itself, e.g., LoginIcon, AddIcon
  variant?: ButtonProps["variant"]; // Reuse ButtonProps's variant type
  color?: ButtonProps["color"]; // Reuse ButtonProps's color type
  // children is already part of ButtonProps (React.ReactNode)
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  text,
  icon: IconComponent, // Renaming 'icon' prop to 'IconComponent' for clarity in JSX
  variant = "contained", // Default variant
  color = "secondary", // Default color
  children, // Already typed as React.ReactNode from ButtonProps
  ...rest // Capture any other standard Button props like disabled, size, sx, type etc.
}) => {
  return (
    <Button
      variant={variant}
      color={color}
      // Conditionally render the icon. The icon prop expects a component, so <IconComponent />
      startIcon={IconComponent ? <IconComponent /> : null}
      onClick={onClick}
      {...rest} // Spread any additional props (like 'type="submit"', 'disabled', 'sx')
    >
      {/* If children are provided, render them; otherwise, render the 'text' prop */}
      {children ? children : text}
    </Button>
  );
};

export default ActionButton;
