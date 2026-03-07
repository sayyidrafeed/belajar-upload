import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

export function isAllowedImageType(mimeType: string): boolean {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/heic"];
  return allowedTypes.includes(mimeType.toLowerCase());
}

export function isAllowedExtension(filename: string): boolean {
  const allowedExtensions = ["png", "jpeg", "jpg", "heic"];
  const ext = getFileExtension(filename);
  return allowedExtensions.includes(ext.toLowerCase());
}
