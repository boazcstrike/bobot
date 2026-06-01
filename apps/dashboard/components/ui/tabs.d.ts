import type { ComponentType, HTMLAttributes, ReactNode } from "react";

export const Tabs: ComponentType<HTMLAttributes<HTMLDivElement> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void; children?: ReactNode }>;
export const TabsList: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const TabsTrigger: ComponentType<HTMLAttributes<HTMLButtonElement> & { value: string }>;
export const TabsContent: ComponentType<HTMLAttributes<HTMLDivElement> & { value: string }>;
