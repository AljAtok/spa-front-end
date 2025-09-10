// src/components/HeaderActionButton.tsx
import React from "react";
import ActionButton from "./ActionButton";
import AddIcon from "@mui/icons-material/Add";
import { useUserPermissions } from "../hooks/useUserPermissions";

interface HeaderActionButtonProps {
  moduleAlias: string;
  onClick: () => void;
  text?: string;
  icon?: React.ComponentType;
}

/**
 * HeaderActionButton - A reusable component that handles permission-protected header action buttons
 * for management pages. This eliminates the repetitive permission checking logic for "New" buttons.
 *
 * Only renders the button if the user has "add" permission for the specified module.
 *
 * @param moduleAlias - The module alias to check permissions for (e.g., "users", "locations")
 * @param onClick - The click handler for the button
 * @param text - Optional button text (defaults to "New")
 * @param icon - Optional button icon (defaults to AddIcon)
 */
const HeaderActionButton: React.FC<HeaderActionButtonProps> = ({
  moduleAlias,
  onClick,
  text = "New",
  icon: IconComponent = AddIcon,
}) => {
  const { canAddToModule } = useUserPermissions();

  const hasAddPermission = canAddToModule(moduleAlias);

  // Only render the button if user has add permission
  if (!hasAddPermission) {
    return undefined;
  }

  return <ActionButton onClick={onClick} text={text} icon={IconComponent} />;
};

export default HeaderActionButton;
