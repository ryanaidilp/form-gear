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
 */
export enum ComponentType {
  // Layout & Structure (1-3)
  SECTION = 1,
  NESTED = 2,
  LABEL = 3,

  // Computed (4)
  VARIABLE = 4,

  // Text Inputs (5-8)
  TEXT = 5,
  NUMBER = 6,
  DATE = 7,
  TIME = 8,

  // Selection - Single (9-13)
  RADIO = 9,
  SELECT = 10,
  RADIO_HORIZONTAL = 11,
  SELECT_SEARCH = 12,
  SELECT_CREATABLE = 13,

  // Selection - Multiple (14-15)
  CHECKBOX = 14,
  CHECKBOX_HORIZONTAL = 15,

  // Boolean (16-17)
  CHECKBOX_SINGLE = 16,
  TOGGLE = 17,

  // Range & Slider (18-19)
  RANGE = 18,
  RANGE_SLIDER = 19,

  // Currency (20)
  CURRENCY = 20,

  // Photo/Camera (21-23)
  PHOTO = 21,
  MULTI_PHOTO = 22,
  GPS_PHOTO = 23,

  // Buttons (24-25)
  BUTTON = 24,
  URL_BUTTON = 25,

  // Rating (26)
  RATING = 26,

  // Date/Time Combined (27-28)
  DATETIME = 27,
  DATE_RANGE = 28,

  // Masks & Formatting (29)
  MASKED_INPUT = 29,

  // Long Text (30)
  TEXTAREA = 30,

  // URL & Email (31-32)
  URL = 31,
  EMAIL = 32,

  // Location (33)
  GPS = 33,

  // File Uploads (34-35)
  CSV = 34,
  FILE = 35,

  // Drawing (36)
  SIGNATURE = 36,

  // Advanced Inputs (37-38)
  SCAN = 37,
  UNIT_INPUT = 38,

  // Photo with GPS (39)
  GPS_MULTI_PHOTO = 39,
}

/**
 * Component types that accept options (dropdown, radio, checkbox)
 */
export const OPTION_TYPES = [
  ComponentType.RADIO,
  ComponentType.SELECT,
  ComponentType.RADIO_HORIZONTAL,
  ComponentType.SELECT_SEARCH,
  ComponentType.SELECT_CREATABLE,
  ComponentType.CHECKBOX,
  ComponentType.CHECKBOX_HORIZONTAL,
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
  ComponentType.MASKED_INPUT,
] as const;

/**
 * Component types that handle photos
 */
export const PHOTO_TYPES = [
  ComponentType.PHOTO,
  ComponentType.MULTI_PHOTO,
  ComponentType.GPS_PHOTO,
  ComponentType.GPS_MULTI_PHOTO,
] as const;

/**
 * Component types that don't accept user input
 */
export const NON_INPUT_TYPES = [
  ComponentType.SECTION,
  ComponentType.LABEL,
  ComponentType.VARIABLE,
  ComponentType.BUTTON,
  ComponentType.URL_BUTTON,
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
  ComponentType.CHECKBOX_HORIZONTAL,
  ComponentType.MULTI_PHOTO,
  ComponentType.GPS_MULTI_PHOTO,
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
