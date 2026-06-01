import type { ComponentType, HTMLAttributes, ReactNode } from "react";

type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
};

export const Select: ComponentType<SelectProps>;
export const SelectGroup: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const SelectValue: ComponentType<HTMLAttributes<HTMLSpanElement> & { placeholder?: string }>;
export const SelectTrigger: ComponentType<HTMLAttributes<HTMLButtonElement> & { size?: string }>;
export const SelectContent: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const SelectLabel: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const SelectItem: ComponentType<HTMLAttributes<HTMLDivElement> & { value: string }>;
export const SelectSeparator: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const SelectScrollUpButton: ComponentType<HTMLAttributes<HTMLDivElement>>;
export const SelectScrollDownButton: ComponentType<HTMLAttributes<HTMLDivElement>>;
