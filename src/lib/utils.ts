import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Sanitize user input before injecting into AI prompts */
export function sanitizeForPrompt(input: string): string {
  if (!input) return "";
  return input
    .replace(/ignore\s+(all\s+|any\s+|previous\s+|above\s+)?instructions?/gi, "")
    .replace(/instead[,:]?\s*(do|generate|create|make|output|write|respond)/gi, "")
    .replace(/system\s*prompt/gi, "")
    .replace(/\bNSFW\b/gi, "")
    .replace(/\bjailbreak\b/gi, "")
    .replace(/do\s+not\s+follow/gi, "")
    .replace(/disregard/gi, "")
    .replace(/you\s+are\s+now/gi, "")
    .replace(/pretend\s+(to\s+be|you\s+are)/gi, "")
    .replace(/new\s+instructions?/gi, "")
    .slice(0, 800);
}
