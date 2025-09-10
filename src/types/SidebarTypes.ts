// src/types/SidebarTypes.ts

export interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isNonMobile: boolean;
}

export interface SidebarContentProps extends SidebarProps {
  isCollapsed: boolean;
  currentPath: string;
  colors: ReturnType<typeof import("../styles/theme").tokens>;
}

export interface SidebarItemProps {
  title: string;
  to: string;
  icon: React.ReactNode;
  selectedPath: string;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isNonMobile: boolean;
}
