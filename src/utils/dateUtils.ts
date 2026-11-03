import { ShiftType } from '../types';

/**
 * Checks if a reservation date and shift is blocked based on:
 * - Being a past day (relative to actual current calendar date)
 * - Being less than 48 hours in advance relative to the current actual time
 */
export function isReservationDateBlocked(dateStr: string, shift?: ShiftType): boolean {
  if (!dateStr) return true;

  const now = new Date();
  
  // Parse target reservation date components at noon
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetMidnight = new Date(year, month - 1, day, 12, 0, 0, 0);
  
  // Today's date at noon
  const todayNoon = new Date();
  todayNoon.setHours(12, 0, 0, 0);

  // If the target date is in the past (yesterday or earlier relative to today)
  if (targetMidnight.getTime() < todayNoon.getTime() - 4 * 60 * 60 * 1000) {
    const isSameDay = targetMidnight.getFullYear() === todayNoon.getFullYear() &&
                      targetMidnight.getMonth() === todayNoon.getMonth() &&
                      targetMidnight.getDate() === todayNoon.getDate();
    if (!isSameDay) {
      return true;
    }
  }

  // Calculate difference in hours to the selected shift start time
  let targetHour = 8; // morning shift
  if (shift === 'tarde') targetHour = 14; 
  if (shift === 'noite') targetHour = 19; 

  const targetDateTime = new Date(year, month - 1, day, targetHour, 0, 0, 0);
  const diffHours = (targetDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  // If the shift is less than 48 hours from now, it is blocked
  if (diffHours < 48) {
    return true;
  }

  return false;
}
