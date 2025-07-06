
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return formatter.format(amount);
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

export function sumArrayValues(array: number[]): number {
  return array.reduce((sum, value) => sum + (value || 0), 0);
}

export function groupByMonth(data: any[], dateField: string, valueField: string): { name: string; value: number }[] {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result = new Array(12).fill(0).map((_, i) => ({ name: monthNames[i], value: 0 }));
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    const month = date.getMonth();
    result[month].value += Number(item[valueField] || 0);
  });
  
  return result;
}

export function groupByGenre(beats: any[]): { name: string; value: number }[] {
  const genreCounts: Record<string, number> = {};
  
  beats.forEach(beat => {
    if (beat.genre) {
      genreCounts[beat.genre] = (genreCounts[beat.genre] || 0) + 1;
    }
  });
  
  return Object.entries(genreCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 genres
}
