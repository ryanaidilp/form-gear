/**
 * FormGear Core Types
 *
 * TypeScript interfaces and types for the FormGear form engine.
 * These types provide type safety across all services and components.
 */

import type { SetStoreFunction, Store } from 'solid-js/store';
import type { Accessor, Setter } from 'solid-js';
import {
  ComponentType,
  ClientMode,
  FormMode,
  InitialMode,
  LookupMode,
  ValidationState,
  ValidationType,
  OptionType,
} from './constants';

// =============================================================================
// Store Tuple Types
// =============================================================================

export type StoreInstance<T> = [Store<T>, SetStoreFunction<T>];
export type SignalInstance<T> = [Accessor<T>, Setter<T>];

// =============================================================================
// Component & Reference Types
// =============================================================================

/**
 * Option for select, radio, checkbox components
 */
export interface Option {
  label: string;
  value: string | number;
  /** For checkbox bit-masking */
  checkboxValue?: number;
}

/**
 * Range input configuration
 */
export interface RangeInput {
  min?: number | string;
  max?: number | string;
  step?: number;
}

/**
 * Length input configuration
 */
export interface LengthInput {
  min?: number;
  max?: number;
}

/**
 * Size input configuration (for file uploads)
 */
export interface SizeInput {
  min?: number;
  max?: number;
}

/**
 * API source configuration for dynamic options
 */
export interface SourceAPI {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: unknown;
  keys?: string;
  values?: string;
}

/**
 * Validation rule from validation JSON
 */
export interface ValidationRule {
  test: string;
  message: string;
  type: ValidationType;
}

/**
 * Component reference detail (stored in reference.details)
 */
export interface ReferenceDetail {
  dataKey: string;
  name: string;
  label: string;
  hint?: string;
  description?: string;
  type: ComponentType;
  answer?: unknown;
  index: number[];
  level: number;
  options?: Option[];
  sourceQuestion?: string;
  urlValidation?: string;
  currency?: string;
  source?: string;
  urlPath?: string;
  parent?: string;
  separatorFormat?: string;
  isDecimal?: boolean;
  maskingFormat?: string;
  expression?: string;
  componentVar?: string[];
  render?: boolean;
  renderType?: number;
  enable?: boolean;
  enableCondition?: string;
  componentEnable?: string[];
  enableRemark?: boolean;
  client?: ClientMode;
  titleModalDelete?: string;
  sourceOption?: string;
  sourceAPI?: SourceAPI;
  typeOption?: OptionType;
  contentModalDelete?: string;
  validationState?: ValidationState;
  validationMessage?: string[];
  validations?: ValidationRule[];
  componentValidation?: string[];
  hasRemark?: boolean;
  rows?: number;
  cols?: number;
  rangeInput?: RangeInput;
  lengthInput?: LengthInput;
  principal?: number;
  columnName?: string;
  titleModalConfirmation?: string;
  contentModalConfirmation?: string;
  required?: boolean;
  presetMaster?: string;
  disableInput?: boolean;
  decimalLength?: number;
  disableInitial?: boolean;
  sizeInput?: SizeInput[];
  components?: unknown; // Template components for nested forms
}

/**
 * Sidebar detail (stored in sidebar.details)
 */
export interface SidebarDetail {
  dataKey: string;
  name: string;
  label: string;
  description?: string;
  level: number;
  index: number[];
  components?: unknown[][];
  sourceQuestion?: string;
  enable: boolean;
  enableCondition?: string;
  componentEnable?: string[];
}

// =============================================================================
// Store State Types
// =============================================================================

/**
 * Reference store state
 */
export interface ReferenceState {
  details: ReferenceDetail[];
  sidebar?: SidebarDetail[];
}

/**
 * Sidebar store state
 */
export interface SidebarState {
  details: SidebarDetail[];
}

/**
 * Template component definition
 */
export interface TemplateComponent {
  dataKey: string;
  name?: string;
  label: string;
  description?: string;
  hint?: string;
  type: ComponentType;
  answer?: unknown;
  options?: Option[];
  components?: TemplateComponent[][];
  enableCondition?: string;
  componentEnable?: string[];
  expression?: string;
  componentVar?: string[];
  validations?: ValidationRule[];
  componentValidation?: string[];
  sourceQuestion?: string;
  sourceOption?: string;
  sourceAPI?: SourceAPI;
  typeOption?: OptionType;
  rangeInput?: RangeInput;
  lengthInput?: LengthInput;
  sizeInput?: SizeInput[];
  required?: boolean;
  rows?: number;
  cols?: number;
  principal?: number;
  columnName?: string;
  enableRemark?: boolean;
  client?: ClientMode;
  [key: string]: unknown;
}

/**
 * Template store state
 */
export interface TemplateState {
  status: number;
  details: {
    description: string;
    dataKey: string;
    acronym?: string;
    title: string;
    version: string;
    components: TemplateComponent[][];
    language?: Array<Record<string, string>>;
  };
}

/**
 * Test function from validation JSON
 */
export interface TestFunction {
  dataKey: string;
  componentValidation: string[];
  validations: ValidationRule[];
}

/**
 * Validation store state
 */
export interface ValidationStoreState {
  status: number;
  details: {
    description?: string;
    dataKey: string;
    version?: string;
    testFunctions: TestFunction[];
  };
}

/**
 * Predata item from preset JSON
 */
export interface Predata {
  dataKey: string;
  answer: unknown;
}

/**
 * Preset store state
 */
export interface PresetState {
  status: number;
  details: {
    description?: string;
    dataKey: string;
    predata: Predata[];
  };
}

/**
 * Answer entry in response
 */
export interface Answer {
  dataKey: string;
  answer: unknown;
  updatedBy?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Auxiliary data in response
 */
export interface Auxiliary {
  dataKey: string;
  value: unknown;
}

/**
 * Response store state
 */
export interface ResponseState {
  status: number;
  details: {
    dataKey: string;
    answers: Answer[];
    summary?: unknown[];
    counter?: unknown[];
    auxiliaries?: Auxiliary[];
    templateDataKey?: string;
    gearVersion?: string;
    templateVersion?: string;
    validationVersion?: string;
    docState?: number | string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    createdAtTimezone?: string;
    createdAtGMT?: number | string;
    updatedAtTimezone?: string;
    updatedAtGMT?: number | string;
  };
}

/**
 * Media entry
 */
export interface MediaEntry {
  dataKey: string;
  media: unknown;
}

/**
 * Media store state
 */
export interface MediaState {
  status: number;
  details: {
    dataKey: string;
    media: MediaEntry[];
    templateDataKey?: string;
    gearVersion?: string;
    templateVersion?: string;
    validationVersion?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    createdAtTimezone?: string;
    createdAtGMT?: number | string;
    updatedAtTimezone?: string;
    updatedAtGMT?: number | string;
  };
}

/**
 * Comment on a component
 */
export interface Comment {
  dataKey: string;
  name: string;
  comment: string;
  createdAt?: string;
}

/**
 * Note (remark) entry
 */
export interface Note {
  dataKey: string;
  name: string;
  comments: Comment[];
}

/**
 * Remark store state
 */
export interface RemarkState {
  status: number;
  details: {
    dataKey: string;
    notes: Note[];
    templateDataKey?: string;
    gearVersion?: string;
    templateVersion?: string;
    validationVersion?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    createdAtTimezone?: string;
    createdAtGMT?: number | string;
    updatedAtTimezone?: string;
    updatedAtGMT?: number | string;
  };
}

/**
 * Language strings
 */
export interface Language {
  componentAdded: string;
  componentDeleted: string;
  componentEdited: string;
  componentEmpty: string;
  componentNotAllowed: string;
  componentRendered: string;
  componentSelected: string;
  fetchFailed: string;
  fileInvalidFormat: string;
  fileInvalidMaxSize: string;
  fileInvalidMinSize: string;
  fileUploaded: string;
  locationAcquired: string;
  remarkAdded: string;
  remarkEmpty: string;
  submitEmpty: string;
  submitInvalid: string;
  submitWarning: string;
  summaryAnswer: string;
  summaryBlank: string;
  summaryError: string;
  summaryRemark: string;
  uploadCsv: string;
  uploadImage: string;
  validationDate: string;
  validationInclude: string;
  validationMax: string;
  validationMaxLength: string;
  validationMin: string;
  validationMinLength: string;
  validationRequired: string;
  validationStep: string;
  verificationInvalid: string;
  verificationSubmitted: string;
  validationUrl: string;
  validationEmail: string;
  validationApi: string;
  errorSaving: string;
  errorExpression: string;
  errorEnableExpression: string;
  errorValidationExpression: string;
}

/**
 * Locale store state
 */
export interface LocaleState {
  status: number;
  details: {
    language: Language[];
  };
}

/**
 * Summary statistics
 */
export interface Summary {
  answer: number;
  blank: number;
  error: number;
  remark: number;
  clean: number;
}

/**
 * Counter statistics
 */
export interface Counter {
  render: number;
  validate: number;
}

// =============================================================================
// History Types
// =============================================================================

/**
 * History entry for undo/redo
 */
export interface HistoryEntry {
  type: string;
  dataKey: string | null;
  position: number | null;
  attribute: string | null;
  value: unknown;
  timestamp: number;
}

/**
 * History state for undo/redo operations
 */
export interface HistoryState {
  /** Whether history tracking is enabled */
  referenceHistoryEnable: boolean;
  /** History of reference states */
  referenceHistory: ReferenceDetail[][];
  /** History of sidebar states */
  sidebarHistory: SidebarDetail[][];
  /** Components that are currently disabled */
  referenceEnableFalse: Array<{ parentIndex: number[] }>;
}

// =============================================================================
// Configuration Types
// =============================================================================

/**
 * FormGear configuration options
 */
export interface FormGearConfig {
  clientMode: ClientMode;
  formMode: FormMode;
  initialMode: InitialMode;
  lookupMode: LookupMode;
  username?: string;
  token?: string;
  baseUrl?: string;
  lookupKey?: string;
  lookupValue?: string;
}

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: FormGearConfig = {
  clientMode: ClientMode.CAWI,
  formMode: FormMode.OPEN,
  initialMode: InitialMode.INITIAL,
  lookupMode: LookupMode.ONLINE,
  lookupKey: 'keys',
  lookupValue: 'values',
};

// =============================================================================
// Expression Context Types
// =============================================================================

/**
 * Context for expression evaluation
 */
export interface ExpressionContext {
  /** Get value of a component by dataKey */
  getValue: (dataKey: string) => unknown;
  /** Get row index for nested components */
  getRowIndex: (level?: number) => number;
  /** Get configuration property */
  getProp: (prop: string) => unknown;
  /** Current component's dataKey */
  dataKey: string;
  /** Current component's answer (for validation) */
  answer?: unknown;
}

/**
 * Result of expression evaluation
 */
export interface ExpressionResult<T = unknown> {
  success: boolean;
  value: T;
  error?: string;
}

// =============================================================================
// Service Types
// =============================================================================

/**
 * Handler callbacks for mobile/native integrations
 */
export interface MobileHandlers {
  uploadHandler?: (setValue: (value: string) => void) => void;
  gpsHandler?: (setter: (result: unknown, remark: string) => void, needPhoto?: boolean) => void;
  offlineSearch?: (id: string, version: string, dataJson: unknown, setter: (data: unknown) => void) => void;
  onlineSearch?: (url: string) => Promise<unknown>;
  exitHandler?: (callback?: () => void) => void;
  openMap?: (koordinat: { lat?: number; long?: number; latitude?: number; longitude?: number }) => void;
}

/**
 * Response callbacks
 */
export interface FormGearCallbacks {
  onSave?: (response: unknown, media: unknown, remark: unknown, principal: unknown, reference: unknown) => void;
  onSubmit?: (response: unknown, media: unknown, remark: unknown, principal: unknown, reference: unknown) => void;
}

/**
 * Principal item for key data export
 */
export interface PrincipalItem {
  dataKey: string;
  name: string;
  answer: unknown;
  principal: number;
  columnName: string;
}

// =============================================================================
// FormStores Interface
// =============================================================================

/**
 * Input store state
 */
export interface InputState {
  currentDataKey: string;
}

/**
 * Nested store state
 */
export interface NestedState {
  details: unknown[];
}

/**
 * Note store state
 */
export interface NoteState {
  status: number;
  details: {
    dataKey: string;
    notes: Note[];
  };
}

/**
 * Principal store state
 */
export interface PrincipalState {
  status: number;
  details: {
    principals: PrincipalItem[];
    templateDataKey?: string;
    gearVersion?: string;
    templateVersion?: string;
    validationVersion?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    createdAtTimezone?: string;
    createdAtGMT?: number | string;
    updatedAtTimezone?: string;
    updatedAtGMT?: number | string;
  };
}


// =============================================================================
// FormGear Instance Types
// =============================================================================

/**
 * Data inputs for createFormGear
 */
export interface FormGearData {
  reference?: unknown;
  template: unknown;
  preset?: unknown;
  response?: unknown;
  validation?: unknown;
  media?: unknown;
  remark?: unknown;
  locale?: LocaleState;
}

/**
 * Options for createFormGear
 */
export interface FormGearOptions {
  data: FormGearData;
  config?: Partial<FormGearConfig>;
  mobileHandlers?: MobileHandlers;
  callbacks?: FormGearCallbacks;
}

/**
 * FormGear instance returned by createFormGear
 */
export interface FormGearInstance {
  /** Get current response data */
  getResponse(): unknown;
  /** Get current media data */
  getMedia(): unknown;
  /** Get current remarks */
  getRemarks(): unknown;
  /** Get principal items */
  getPrincipal(): PrincipalItem[];
  /** Get reference data */
  getReference(): unknown;
  /** Get summary statistics */
  getSummary(): Summary;
  /** Validate all components */
  validate(): boolean;
  /** Set value for a component */
  setValue(dataKey: string, value: unknown): void;
  /** Get value of a component */
  getValue(dataKey: string): unknown;
  /** Trigger save callback */
  save(): void;
  /** Trigger submit callback */
  submit(): void;
  /** Destroy the form instance */
  destroy(): void;
}
