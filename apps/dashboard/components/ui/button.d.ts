import type { ComponentType, ButtonHTMLAttributes } from "react";

export const Button: ComponentType<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string; render?: unknown }>;
