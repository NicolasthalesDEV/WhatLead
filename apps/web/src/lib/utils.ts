import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format phone number to display format
 * Example: 5511999887766 -> +55 11 99988-7766
 */
export function formatPhoneNumber(phone: string): string {
  // Remove non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Check if it's a valid Brazilian number (13 digits with country code)
  if (cleaned.length === 13 && cleaned.startsWith('55')) {
    const countryCode = cleaned.slice(0, 2);
    const areaCode = cleaned.slice(2, 4);
    const firstPart = cleaned.slice(4, 9);
    const secondPart = cleaned.slice(9);
    return `+${countryCode} ${areaCode} ${firstPart}-${secondPart}`;
  }
  
  // Return original if not valid
  return phone;
}

/**
 * Normalize phone number to E.164 format
 * Example: (11) 99988-7766 -> +5511999887766
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // If starts with country code, add +
  if (cleaned.startsWith('55')) {
    return `+${cleaned}`;
  }
  
  // If Brazilian number without country code, add it
  if (cleaned.length === 11 || cleaned.length === 10) {
    return `+55${cleaned}`;
  }
  
  // Return with + if not already present
  return phone.startsWith('+') ? phone : `+${cleaned}`;
}