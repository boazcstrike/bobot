import type { ComponentType, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";

export const Table: ComponentType<HTMLAttributes<HTMLTableElement>>;
export const TableHeader: ComponentType<HTMLAttributes<HTMLTableSectionElement>>;
export const TableBody: ComponentType<HTMLAttributes<HTMLTableSectionElement>>;
export const TableFooter: ComponentType<HTMLAttributes<HTMLTableSectionElement>>;
export const TableHead: ComponentType<ThHTMLAttributes<HTMLTableCellElement>>;
export const TableRow: ComponentType<HTMLAttributes<HTMLTableRowElement>>;
export const TableCell: ComponentType<TdHTMLAttributes<HTMLTableCellElement>>;
export const TableCaption: ComponentType<HTMLAttributes<HTMLTableCaptionElement>>;
