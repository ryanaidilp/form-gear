/**
 * Client mode determines the data collection method
 */
export enum ClientMode {
  /** Computer-Assisted Web Interviewing */
  CAWI = 1,
  /** Computer-Assisted Personal Interviewing */
  CAPI = 2,
}

/**
 * Form mode determines the current state of the form
 */
export enum FormMode {
  /** Form is open for data entry */
  OPEN = 1,
  /** Form is in review mode (read-only with comments) */
  REVIEW = 2,
  /** Form is closed/submitted (read-only) */
  CLOSE = 3,
}

/**
 * Initial mode determines how the form was initialized
 */
export enum InitialMode {
  /** Fresh form initialization */
  INITIAL = 1,
  /** Form assigned from existing data */
  ASSIGN = 2,
}

/**
 * Lookup mode determines how reference data is fetched
 */
export enum LookupMode {
  /** Fetch from remote API */
  ONLINE = 1,
  /** Use local/cached data */
  OFFLINE = 2,
}

/**
 * Option type determines the source of select/radio options
 */
export enum OptionType {
  /** Options defined in template */
  TEMPLATE = 1,
  /** Options fetched from API */
  API = 2,
  /** Options from another component */
  COMPONENT = 3,
  /** Options from offline/Android storage */
  OFFLINE = 4,
}

/**
 * Validation type determines severity of validation failure
 */
export enum ValidationType {
  /** Soft warning - can proceed */
  WARNING = 1,
  /** Hard error - must fix before proceeding */
  ERROR = 2,
}

/**
 * Control type defines the type of form input component
 */
export enum ControlType {
  /** Section divider */
  Section = 1,
  /** Nested/repeating input group */
  NestedInput = 2,
  /** Raw HTML content */
  InnerHTML = 3,
  /** Computed variable */
  VariableInput = 4,
  /** Date picker */
  DateInput = 11,
  /** Date and time picker (no timezone) */
  DateTimeLocalInput = 12,
  /** Time picker */
  TimeInput = 13,
  /** Month picker */
  MonthInput = 14,
  /** Week picker */
  WeekInput = 15,
  /** Single checkbox */
  SingleCheckInput = 16,
  /** Toggle switch */
  ToggleInput = 17,
  /** Range slider */
  RangeSliderInput = 18,
  /** URL input */
  UrlInput = 19,
  /** Currency input (IDR, USD) */
  CurrencyInput = 20,
  /** Repeating text list */
  ListTextInputRepeat = 21,
  /** Repeating select list */
  ListSelectInputRepeat = 22,
  /** Multi-select dropdown */
  MultipleSelectInput = 23,
  /** Masked input (phone, ID numbers) */
  MaskingInput = 24,
  /** Single-line text input */
  TextInput = 25,
  /** Radio button group */
  RadioInput = 26,
  /** Single-select dropdown */
  SelectInput = 27,
  /** Numeric input */
  NumberInput = 28,
  /** Checkbox group */
  CheckboxInput = 29,
  /** Multi-line text area */
  TextAreaInput = 30,
  /** Email input */
  EmailInput = 31,
  /** Photo/image upload */
  PhotoInput = 32,
  /** GPS coordinates input */
  GpsInput = 33,
  /** CSV file upload */
  CsvInput = 34,
  /** Current timestamp */
  NowInput = 35,
  /** Signature pad */
  SignatureInput = 36,
  /** Number with unit */
  UnitInput = 37,
  /** Decimal number input */
  DecimalInput = 38,
}
