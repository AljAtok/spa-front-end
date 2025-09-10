// src/components/ActionButtonsGuard.tsx
import {
  useActionButtonsGuard,
  ActionButtonsConfig,
} from "../hooks/useActionButtonsGuard";

interface ActionButtonsGuardProps<T extends { status_id: number }> {
  config: ActionButtonsConfig<T>;
}

/**
 * Higher-order component version of ActionButtonsGuard for class components or when
 * a component is needed instead of a hook.
 */
const ActionButtonsGuard = <T extends { status_id: number }>(
  props: ActionButtonsGuardProps<T>
) => {
  // This component doesn't render anything, it's just for the hook
  useActionButtonsGuard(props.config);
  return null;
};

export default ActionButtonsGuard;
