import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const isToday = date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
    
  const isTomorrow = date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear();
  
  if (isToday) {
    return `Today, ${formatTime(date)}`;
  } else if (isTomorrow) {
    return `Tomorrow, ${formatTime(date)}`;
  } else {
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${formatTime(date)}`;
  }
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName || !lastName) return "?";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`;
}
