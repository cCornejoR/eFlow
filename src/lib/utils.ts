import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as unknown as number;
  };
}

/**
 * Check if a string is a valid file path
 */
export function isValidPath(path: string): boolean {
  if (!path || typeof path !== "string") return false;

  // Basic path validation - can be extended based on requirements
  const invalidChars = /[<>:"|?*]/;
  return !invalidChars.test(path) && path.length > 0;
}

/**
 * Extract file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Check if file is an HDF file based on extension
 */
export function isHdfFile(filename: string): boolean {
  const ext = getFileExtension(filename).toLowerCase();
  return ext === "hdf" || ext === "hdf5" || ext === "h5";
}

/**
 * Check if file is a plan file (p*.hdf pattern)
 */
export function isPlanFile(filename: string): boolean {
  const name = filename.toLowerCase();
  return name.startsWith("p") && isHdfFile(filename);
}
