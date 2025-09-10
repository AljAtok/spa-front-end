// src/types/HeaderTypes.ts
import React from "react";

export interface HeaderProps {
  title: string;
  subtitle: string;
  selectComponent?: React.ReactNode; // Optional React node for a select input
  actionButton?: React.ReactNode; // Optional React node for an action button
}
