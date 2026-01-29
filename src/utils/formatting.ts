/**
 * Formatting Utilities
 *
 * Provides string templating, date validation, and other formatting utilities.
 */

import dayjs from 'dayjs';

// =============================================================================
// String Templating
// =============================================================================

/**
 * Replaces $key placeholders in a template string with values from data object.
 *
 * @param template - Template string with $key placeholders
 * @param data - Object with key-value pairs to substitute
 * @returns The templated string
 *
 * @example
 * ```typescript
 * templating('Hello $name, you have $count messages', { name: 'John', count: 5 })
 * // Returns: 'Hello John, you have 5 messages'
 *
 * templating('Allowed values are $values', { values: '1,2,3' })
 * // Returns: 'Allowed values are 1,2,3'
 * ```
 */
export function templating(
  template: string,
  data: Record<string, unknown>
): string {
  return template.replace(/\$(\w*)/g, (match, key) => {
    return Object.prototype.hasOwnProperty.call(data, key)
      ? String(data[key])
      : '';
  });
}

// =============================================================================
// Date Utilities
// =============================================================================

/**
 * Validates if a string can be parsed as a valid date.
 *
 * @param date - Date string to validate
 * @returns Whether the date string is valid
 *
 * @example
 * ```typescript
 * validateDateString('2024-01-15') // true
 * validateDateString('not a date') // false
 * validateDateString('') // false
 * ```
 */
export function validateDateString(date: string): boolean {
  if (!date || date.trim() === '') {
    return false;
  }

  const dateObject = new Date(date);
  return dateObject.toString() !== 'Invalid Date' && !isNaN(dateObject.getTime());
}

/**
 * Formats a date using dayjs.
 *
 * @param date - Date string or Date object
 * @param format - Format string (default: 'DD/MM/YYYY')
 * @returns Formatted date string
 *
 * @example
 * ```typescript
 * formatDate('2024-01-15') // '15/01/2024'
 * formatDate('2024-01-15', 'YYYY-MM-DD') // '2024-01-15'
 * formatDate(new Date()) // Today's date
 * ```
 */
export function formatDate(
  date: string | Date,
  format = 'DD/MM/YYYY'
): string {
  return dayjs(date).format(format);
}

/**
 * Formats a date with time.
 *
 * @param date - Date string or Date object
 * @param format - Format string (default: 'DD/MM/YYYY HH:mm')
 * @returns Formatted date-time string
 */
export function formatDateTime(
  date: string | Date,
  format = 'DD/MM/YYYY HH:mm'
): string {
  return dayjs(date).format(format);
}

/**
 * Gets today's date in ISO format (YYYY-MM-DD).
 *
 * @returns Today's date string
 */
export function getToday(): string {
  return dayjs().format('YYYY-MM-DD');
}

/**
 * Compares two dates.
 *
 * @param date1 - First date
 * @param date2 - Second date
 * @returns -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDates(
  date1: string | Date,
  date2: string | Date
): -1 | 0 | 1 {
  const d1 = dayjs(date1);
  const d2 = dayjs(date2);

  if (d1.isBefore(d2)) return -1;
  if (d1.isAfter(d2)) return 1;
  return 0;
}

// =============================================================================
// Checkbox Utilities
// =============================================================================

/**
 * Decodes a checkbox value into selected indices.
 *
 * @param value - Encoded checkbox value
 * @param optionCount - Number of options
 * @returns Array of selected indices (0-based)
 *
 * @example
 * ```typescript
 * decodeCheckboxValue(5, 3) // [0, 2] (1 + 4 = options 0 and 2 selected)
 * decodeCheckboxValue(7, 3) // [0, 1, 2] (all selected)
 * ```
 */
export function decodeCheckboxValue(
  value: number,
  optionCount: number
): number[] {
  const selected: number[] = [];
  for (let i = 0; i < optionCount; i++) {
    if ((value & Math.pow(2, i)) !== 0) {
      selected.push(i);
    }
  }
  return selected;
}

/**
 * Encodes selected checkbox indices into a single value.
 *
 * @param indices - Array of selected indices (0-based)
 * @returns Encoded checkbox value
 *
 * @example
 * ```typescript
 * encodeCheckboxValue([0, 2]) // 5 (1 + 4)
 * encodeCheckboxValue([0, 1, 2]) // 7 (1 + 2 + 4)
 * ```
 */
export function encodeCheckboxValue(indices: number[]): number {
  return indices.reduce((acc, idx) => acc + Math.pow(2, idx), 0);
}

// =============================================================================
// Label Processing
// =============================================================================

/**
 * Processes a label by replacing variable placeholders.
 *
 * @param label - Original label with placeholders
 * @param replacements - Map of placeholder to replacement value
 * @returns Processed label
 */
export function processLabel(
  label: string,
  replacements: Record<string, string>
): string {
  let result = label;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(placeholder, value);
  }
  return result;
}

/**
 * Extracts the base dataKey without row indicators.
 *
 * @param dataKey - Full dataKey with potential row indicators
 * @returns Base dataKey
 *
 * @example
 * ```typescript
 * getBaseDataKey('Q1#1@$ROW$') // 'Q1'
 * getBaseDataKey('Section#2#Q3') // 'Section'
 * ```
 */
export function getBaseDataKey(dataKey: string): string {
  const parts = dataKey.split('@')[0].split('#');
  return parts[0];
}

/**
 * Parses a dataKey to extract row information.
 *
 * @param dataKey - Full dataKey
 * @returns Object with base key and row indices
 */
export function parseDataKey(dataKey: string): {
  base: string;
  rows: number[];
  rowIndicator?: string;
} {
  const [keyPart, rowIndicator] = dataKey.split('@');
  const parts = keyPart.split('#');
  const base = parts[0];
  const rows = parts.slice(1).map(Number).filter((n) => !isNaN(n));

  return {
    base,
    rows,
    rowIndicator,
  };
}
