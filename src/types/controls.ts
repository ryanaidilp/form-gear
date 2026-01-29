import { Component } from 'solid-js';
import { ControlType, OptionType } from './enums';

/**
 * Option for select, radio, and checkbox inputs
 */
export interface Option {
  /** Display label */
  label: string;
  /** Stored value */
  value: string;
  /** Whether this option allows open-ended text input */
  open?: boolean;
}

/**
 * Range configuration for slider inputs
 */
export interface RangeInput {
  /** Minimum value */
  min: number | string;
  /** Maximum value */
  max: number | string;
  /** Step increment */
  step?: number;
}

/**
 * Length constraints for text inputs
 */
export interface LengthInput {
  /** Maximum character length */
  maxlength?: number;
  /** Minimum character length */
  minlength?: number;
}

/**
 * Size constraints for numeric inputs
 */
export interface SizeInput {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
}

/**
 * Configuration for API-based option sources
 */
export interface SourceAPI {
  /** Unique identifier for the lookup table */
  id?: string;
  /** Version of the lookup table */
  version?: string;
  /** Name of the lookup table */
  tableName?: string;
  /** Base URL for API requests */
  baseUrl: string;
  /** Custom headers for API requests */
  headers?: Record<string, string>;
  /** Data field path in response */
  data: string;
  /** Field to use as option value */
  value: string;
  /** Field to use as option label */
  label: string;
  /** Filter conditions based on other fields */
  filterDependencies?: Array<{ key: string; value: string }>;
  /** Sub-resource dependencies */
  subResourceDependencies?: Array<{ key: string; value: string }>;
  /** Parent lookup conditions */
  parentCondition?: Array<{ key: string; value: string }>;
}

/**
 * Standard API response format
 */
export interface ApiResponse {
  /** Whether the request was successful */
  success?: boolean;
  /** Response data */
  data?: unknown[];
  /** Error or status message */
  message?: string;
}

/**
 * Form component definition
 */
export interface ComponentType {
  /** Unique identifier for this component */
  dataKey?: string;
  /** Display label */
  label?: string;
  /** Help text/hint */
  hint?: string;
  /** Whether input is disabled */
  disableInput?: boolean;
  /** Type of control */
  type?: ControlType;
  /** Child components (for Section and NestedInput) */
  components?: ComponentType[];
  /** Number of rows (for TextAreaInput) */
  rows?: number;
  /** Number of columns for option layout */
  cols?: number;
  /** Options for select/radio/checkbox */
  options?: Option[];
  /** Range configuration for slider */
  rangeInput?: RangeInput[];
  /** Size constraints */
  sizeInput?: SizeInput[];
  /** Description text */
  description?: string;
  /** Current answer value */
  answer?: unknown;
  /** Source question for NestedInput */
  sourceQuestion?: string;
  /** Source component for options */
  sourceOption?: string;
  /** Type of option source */
  typeOption?: OptionType;
  /** Currency code (IDR, USD) */
  currency?: string;
  /** Locale for number formatting (e.g., 'id-ID') */
  separatorFormat?: string;
  /** Whether to allow decimal values */
  isDecimal?: boolean;
  /** Input mask format (9=digit, a=letter, *=any) */
  maskingFormat?: string;
  /** Expression for computed values */
  expression?: string;
  /** Components referenced in expression */
  componentVar?: string[];
  /** Whether to render the component */
  render?: boolean;
  /** Render type (0=label, 1=readonly input, 2=array) */
  renderType?: number;
  /** API configuration for options */
  sourceAPI?: SourceAPI[];
  /** Whether component is enabled */
  enable?: boolean;
  /** Condition expression for enabling */
  enableCondition?: string;
  /** Components referenced in enable condition */
  componentEnable?: string[];
  /** Whether remarks are enabled */
  enableRemark?: boolean;
  /** Client identifier */
  client?: string;
  /** Modal title for delete confirmation */
  titleModalDelete?: string;
  /** Modal content for delete confirmation */
  contentModalDelete?: string;
  /** Length constraints */
  lengthInput?: LengthInput[];
  /** Principal order (starting from 1) */
  principal?: number;
  /** Column name for data export */
  columnName?: string;
  /** Modal title for confirmation */
  titleModalConfirmation?: string;
  /** Modal content for confirmation */
  contentModalConfirmation?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether initial value is disabled */
  disableInitial?: boolean;
  /** URL for remote validation */
  urlValidation?: string;
  /** Number of decimal places */
  decimalLength?: number;
}

/**
 * Props for form component implementations
 */
export interface FormComponentProps {
  /** Whether running on mobile */
  onMobile: boolean;
  /** Component definition */
  component: ComponentType;
  /** Component index */
  index: number;
  /** Value change callback */
  onValueChange?: (value: unknown) => void;
  /** User click callback */
  onUserClick?: (dataKey: string) => void;
  /** Current value */
  value?: unknown;
  /** Form configuration */
  config: FormComponentConfig;
  /** Validation CSS class */
  classValidation?: string;
  /** Validation error messages */
  validationMessage?: string[];
  /** Number of comments/remarks */
  comments?: number;
  /** Mobile upload handler */
  MobileUploadHandler?: (value: unknown) => void;
  /** Mobile GPS handler */
  MobileGpsHandler?: (value: unknown) => void;
  /** Mobile offline search handler */
  MobileOfflineSearch?: (
    id: string,
    version: string,
    conditions: unknown[],
    setter: (data: unknown) => void
  ) => void;
  /** Mobile online search handler */
  MobileOnlineSearch?: (value: unknown) => void;
  /** Mobile map handler */
  MobileOpenMap?: (value: unknown) => void;
  /** Open remark modal */
  openRemark?: (dataKey: string) => void;
  /** Mobile response setter */
  setResponseMobile?: (response: unknown) => void;
}

/**
 * Form component configuration (passed to components)
 */
export interface FormComponentConfig {
  /** Client mode (CAWI/CAPI) */
  clientMode: number;
  /** Form mode (OPEN/REVIEW/CLOSE) */
  formMode: number;
  /** Username */
  username?: string;
  /** Auth token */
  token?: string;
  /** Base API URL */
  baseUrl?: string;
}

/**
 * Base type for form component implementations
 */
export type FormComponentBase = Component<FormComponentProps>;
