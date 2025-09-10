import { NestedUserModule } from "../types/UserTypes";

export interface SidebarModule {
  id: number;
  title: string;
  to: string;
  module_alias: string;
  parent_title: string;
  link_name: string;
  menu_title: string;
  order_level: number;
}

export interface GroupedModules {
  [parentTitle: string]: {
    [menuTitle: string]: SidebarModule[];
  };
}

export interface UserPermissionsContextType {
  userModules: NestedUserModule[];
  authorizedModules: SidebarModule[];
  groupedModules: GroupedModules;
  loading: boolean;
  error: string | null;
  refetchUserPermission: () => void;
  fullUserData: object | null;
  // New permission checking functions
  hasModulePermission: (moduleAlias: string, actionName: string) => boolean;
  canViewModule: (moduleAlias: string) => boolean;
  canAddToModule: (moduleAlias: string) => boolean;
  canEditInModule: (moduleAlias: string) => boolean;
  canActivateInModule: (moduleAlias: string) => boolean;
  canDeactivateInModule: (moduleAlias: string) => boolean;
  canPostInModule: (moduleAlias: string) => boolean;
  canCancelInModule: (moduleAlias: string) => boolean;
  canApproveInModule: (moduleAlias: string) => boolean;
  canRevertInModule: (moduleAlias: string) => boolean;
}
