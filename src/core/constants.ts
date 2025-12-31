/**
 * FormGear Constants
 *
 * Central location for all enums, constants, and patterns used throughout FormGear.
 * This eliminates magic numbers and provides type-safe component identification.
 */

// =============================================================================
// Component Types
// =============================================================================

/**
 * All supported form component types.
 * Each type corresponds to a specific input control or layout element.
 * Values MUST match ControlType enum in FormType.tsx
 */
export enum ComponentType {
  // Layout & Structure (1-4)
  SECTION = 1,
  NESTED = 2,
  INNER_HTML = 3,
  VARIABLE = 4,

  // Date/Time Inputs (11-15)
  DATE = 11,
  DATETIME = 12,
  TIME = 13,
  MONTH = 14,
  WEEK = 15,

  // Boolean (16-17)
  SINGLE_CHECK = 16,
  TOGGLE = 17,

  // Range & Slider (18)
  RANGE_SLIDER = 18,

  // URL (19)
  URL = 19,

  // Currency (20)
  CURRENCY = 20,

  // List Repeats (21-22)
  LIST_TEXT_REPEAT = 21,
  LIST_SELECT_REPEAT = 22,

  // Selection - Multiple (23)
  MULTIPLE_SELECT = 23,

  // Masking (24)
  MASKING = 24,

  // Text Inputs (25)
  TEXT = 25,

  // Selection - Single (26-27)
  RADIO = 26,
  SELECT = 27,

  // Number (28)
  NUMBER = 28,

  // Checkbox (29)
  CHECKBOX = 29,

  // Long Text (30)
  TEXTAREA = 30,

  // Email (31)
  EMAIL = 31,

  // Photo (32)
  PHOTO = 32,

  // Location (33)
  GPS = 33,

  // File Uploads (34)
  CSV = 34,

  // Now (35)
  NOW = 35,

  // Drawing (36)
  SIGNATURE = 36,

  // Unit Input (37)
  UNIT = 37,

  // Decimal (38)
  DECIMAL = 38,
}

/**
 * Component types that accept options (dropdown, radio, checkbox)
 */
export const OPTION_TYPES = [
  ComponentType.RADIO,
  ComponentType.SELECT,
  ComponentType.CHECKBOX,
  ComponentType.MULTIPLE_SELECT,
  ComponentType.LIST_SELECT_REPEAT,
] as const;

/**
 * Component types that are single-value inputs
 */
export const SINGLE_VALUE_TYPES = [
  ComponentType.TEXT,
  ComponentType.NUMBER,
  ComponentType.DATE,
  ComponentType.TIME,
  ComponentType.CURRENCY,
  ComponentType.TEXTAREA,
  ComponentType.URL,
  ComponentType.EMAIL,
  ComponentType.MASKING,
  ComponentType.DECIMAL,
] as const;

/**
 * Component types that handle photos
 */
export const PHOTO_TYPES = [
  ComponentType.PHOTO,
] as const;

/**
 * Component types that don't accept user input
 */
export const NON_INPUT_TYPES = [
  ComponentType.SECTION,
  ComponentType.INNER_HTML,
  ComponentType.VARIABLE,
  ComponentType.NOW,
] as const;

// =============================================================================
// Validation Types
// =============================================================================

/**
 * Validation severity levels
 */
export enum ValidationState {
  VALID = 0,
  WARNING = 1,
  ERROR = 2,
}

/**
 * Types of validation rules
 */
export enum ValidationType {
  REQUIRED = 1,
  ERROR = 2,
  WARNING = 3,
}

// =============================================================================
// Client & Form Modes
// =============================================================================

/**
 * Client modes for different deployment scenarios
 */
export enum ClientMode {
  /** Computer-Assisted Web Interviewing */
  CAWI = 1,
  /** Computer-Assisted Personal Interviewing */
  CAPI = 2,
  /** Paper and Pencil Interviewing (digital) */
  PAPI = 3,
}

/**
 * Form modes for different operational states
 */
export enum FormMode {
  /** Open form - can be edited */
  OPEN = 1,
  /** Form is in review mode (read-only with comments) */
  REVIEW = 2,
  /** Closed form - readonly */
  CLOSE = 3,
}

/**
 * Initial data loading modes
 */
export enum InitialMode {
  /** Fresh form initialization */
  INITIAL = 1,
  /** Form assigned from existing data */
  ASSIGN = 2,
}

/**
 * Lookup modes for external data
 */
export enum LookupMode {
  /** Online lookup via API */
  ONLINE = 1,
  /** Offline lookup from local data */
  OFFLINE = 2,
}

// =============================================================================
// Option Types
// =============================================================================

/**
 * Types of option sources
 */
export enum OptionType {
  /** Static options defined in template */
  STATIC = 1,
  /** Dynamic options from API */
  API = 2,
  /** Options from another component's answer */
  REFERENCE = 3,
}

// =============================================================================
// Regex Patterns
// =============================================================================

/**
 * Validation patterns used throughout the application
 */
export const PATTERNS = {
  /**
   * Email validation pattern
   * Supports standard email format with TLD
   */
  EMAIL: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

  /**
   * URL validation pattern
   * Requires https:// prefix
   */
  URL: /^https:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/,

  /**
   * ISO date string pattern (YYYY-MM-DD)
   */
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,

  /**
   * Time pattern (HH:MM or HH:MM:SS)
   */
  TIME: /^\d{2}:\d{2}(?::\d{2})?$/,

  /**
   * DataKey with row index pattern (@$ROW$, @$ROW1$, @$ROW2$)
   */
  ROW_INDEX: /@\$ROW\d*\$/g,

  /**
   * Nested dataKey separator
   */
  NESTED_SEPARATOR: '#',
} as const;

// =============================================================================
// Special DataKey Markers
// =============================================================================

/**
 * Markers used in dataKeys for nested component resolution
 */
export const DATA_KEY_MARKERS = {
  /** Current row marker */
  ROW: '@$ROW$',
  /** Parent row marker (level 1) */
  ROW1: '@$ROW1$',
  /** Parent row marker (level 2) */
  ROW2: '@$ROW2$',
} as const;

// =============================================================================
// Default Values
// =============================================================================

/**
 * Default configuration values
 */
export const DEFAULTS = {
  /** Default enable condition result */
  ENABLE_CONDITION: true,

  /** Default validation result (no error) */
  VALIDATION: false,

  /** Default toast duration in ms */
  TOAST_DURATION: 3000,

  /** Long toast duration in ms */
  TOAST_LONG_DURATION: 5000,

  /** Maximum file upload size in bytes (5MB) */
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  /** Default lookup key for API responses */
  LOOKUP_KEY: 'keys',

  /** Default lookup value for API responses */
  LOOKUP_VALUE: 'values',
} as const;

// =============================================================================
// Control Type Sets
// =============================================================================

/**
 * Component types that support PAPI-specific rendering
 */
export const PAPI_TYPES = new Set([
  ComponentType.RADIO,
  ComponentType.SELECT,
  ComponentType.CHECKBOX,
  ComponentType.DATE,
  ComponentType.RANGE_SLIDER,
]);

/**
 * Component types that need special answer handling (arrays)
 */
export const ARRAY_ANSWER_TYPES = new Set([
  ComponentType.CHECKBOX,
  ComponentType.MULTIPLE_SELECT,
  ComponentType.CSV,
]);

/**
 * Component types that can have sourceOption
 */
export const SOURCE_OPTION_TYPES = new Set([
  ...OPTION_TYPES,
]);

/**
 * Component types that count toward form completion
 */
export const COUNTABLE_TYPES = new Set(
  Object.values(ComponentType).filter(
    (type) => typeof type === 'number' && type > 4
  )
);
