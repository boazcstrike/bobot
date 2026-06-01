import type { ComponentType, HTMLAttributes } from "react";

export const Card: ComponentType<HTMLAttributes<HTMLDivElement> & { size?: string }>;
export const CardHeader: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const CardFooter: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const CardTitle: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const CardAction: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const CardDescription: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const CardContent: ComponentType<HTMLAttributes<HTMLDivElement>>;
