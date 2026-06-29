// Utility function used by shadcn/ui.
// It combines Tailwind CSS class names into one string.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}