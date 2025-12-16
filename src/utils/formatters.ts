
/**
 * Formats a currency amount
 * @param amount Amount to format
 * @param currency Currency code (e.g., 'NGN', 'USD')
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'NGN'): string {
  // Normalize USDC to USD for display purposes (USDC is not a valid ISO 4217 currency code)
  const normalizedCurrency = currency === 'USDC' ? 'USD' : currency;

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normalizedCurrency,
    minimumFractionDigits: normalizedCurrency === 'USD' ? 2 : 0,
    maximumFractionDigits: normalizedCurrency === 'USD' ? 2 : 0,
  });

  return formatter.format(amount);
}

/**
 * Gets the initials from a name
 * @param name Full name
 * @returns Initials (e.g., "John Doe" => "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';

  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Truncates text to a specified length
 * @param text Text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  return text.slice(0, maxLength) + '...';
}

/**
 * Formats a number with comma separators
 * @param num Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num);
}

/**
 * Formats a date in a readable format
 * @param date Date to format
 * @param includeTime Whether to include time
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, includeTime = false): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };

  return new Date(date).toLocaleDateString('en-US', options);
}

/**
 * Formats seconds to mm:ss format
 * @param seconds Total seconds
 * @returns Formatted time string (mm:ss)
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}
