import { ValidationType } from './enums';
import { Option } from './controls';

// =============================================================================
// LOCALE / LANGUAGE
// =============================================================================

/**
 * Localized strings for UI messages
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
  uploadImage: string;
  uploadCsv: string;
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
 * Locale configuration
 */
export interface Locale {
  language: Language[];
}

/**
 * Locale store state
 */
export interface LocaleState {
  status: number;
  details: Locale;
}

// =============================================================================
// SUMMARY / COUNTER
// =============================================================================

/**
 * Form completion summary statistics
 */
export interface Summary {
  /** Number of answered questions */
  answer: number;
  /** Number of blank questions */
  blank: number;
  /** Number of questions with errors */
  error: number;
  /** Number of questions with remarks */
  remark: number;
  /** Number of clean questions (valid) */
  clean: number;
}

/**
 * Render and validation counters
 */
export interface Counter {
  /** Number of rendered components */
  render: number;
  /** Number of validated components */
  validate: number;
}

// =============================================================================
// VALIDATION RULES
// =============================================================================

/**
 * Single validation rule definition
 */
export interface ValidationRule {
  /** JavaScript expression to test (evaluates to boolean) */
  test: string;
  /** Error message to display when validation fails */
  message: string;
  /** Validation type: WARNING=1, ERROR=2 */
  type: ValidationType;
}

/**
 * Validation function attached to a component
 */
export interface TestFunction {
  dataKey: string;
  name: string;
  validations?: ValidationRule[];
  componentValidation?: string[];
}

/**
 * Validation configuration details
 */
export interface ValidationDetail {
  description: string;
  dataKey: string;
  version: string;
  testFunctions: TestFunction[];
}

/**
 * Validation store state
 */
export interface ValidationState {
  status: number;
  details: ValidationDetail;
}

// =============================================================================
// RESPONSE / ANSWER
// =============================================================================

/**
 * Single answer entry
 */
export interface Answer {
  dataKey: string;
  name: string;
  answer: unknown;
}

/**
 * Metadata for responses (timestamps, versions, user info)
 */
export interface Auxiliary {
  templateDataKey?: string;
  gearVersion?: string;
  templateVersion?: string;
  validationVersion?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  createdAtTimezone?: string;
  createdAtGMT?: number;
  updatedAtTimezone?: string;
  updatedAtGMT?: number;
}

/**
 * Response details including answers, summary, and counters
 */
export interface ResponseDetail {
  dataKey: string;
  description?: string;
  docState?: string;
  answers: Answer[];
  summary: Summary[];
  counter: Counter[];
}

/**
 * Response store state
 */
export interface ResponseState {
  status: number;
  details: ResponseDetail & Auxiliary;
}

// =============================================================================
// PRESET
// =============================================================================

/**
 * Preset data entry (pre-filled values)
 */
export interface Predata {
  dataKey: string;
  name: string;
  answer: unknown;
}

/**
 * Preset configuration details
 */
export interface PresetDetail {
  description: string;
  dataKey: string;
  predata: Predata[];
}

/**
 * Preset store state
 */
export interface PresetState {
  status: number;
  details: PresetDetail;
}

// =============================================================================
// MEDIA
// =============================================================================

/**
 * Media details (files, images, etc.)
 */
export interface MediaDetail {
  dataKey: string;
  description?: string;
  media: Answer[];
}

/**
 * Media store state
 */
export interface MediaState {
  status: number;
  details: MediaDetail & Auxiliary;
}

// =============================================================================
// REMARK
// =============================================================================

/**
 * Single comment entry
 */
export interface Comment {
  sender: unknown;
  datetime: unknown;
  comment: unknown;
}

/**
 * Note containing comments for a component
 */
export interface Note {
  dataKey: string;
  name: string;
  comments: Comment[];
}

/**
 * Remark details
 */
export interface RemarkDetail {
  dataKey: string;
  notes: Note[];
}

/**
 * Remark store state
 */
export interface RemarkState {
  status: number;
  details: RemarkDetail & Auxiliary;
}

// =============================================================================
// TEMPLATE
// =============================================================================

/**
 * Template component metadata
 */
export interface TemplateComponent {
  label: string;
  dataKey: string;
  name: string;
  type: string;
  currency?: string;
  source?: string;
  path?: string;
  parent?: string;
  separatorFormat?: string;
  isDecimal?: boolean;
  maskingFormat?: string;
  client?: string;
  validationState?: number;
  validationMessage?: string[];
  validations?: ValidationRule[];
  componentValidation?: string[];
  lengthInput?: Array<{ maxlength?: number; minlength?: number }>;
  principal?: number;
  columnName?: string;
  titleModalConfirmation?: string;
  contentModalConfirmation?: string;
  presetMaster?: boolean;
  disableInitial?: boolean;
}

/**
 * Template (questionnaire) details
 */
export interface TemplateDetail {
  description: string;
  dataKey: string;
  acronym: string;
  title: string;
  version: string;
  components: TemplateComponent[][];
  language?: Language[];
}

/**
 * Template store state
 */
export interface TemplateState {
  status: number;
  details: TemplateDetail;
}

// =============================================================================
// REFERENCE (Computed state from template)
// =============================================================================

/**
 * Reference detail for a single component (computed from template)
 */
export interface ReferenceDetail {
  dataKey: string;
  name: string;
  label: string;
  hint: string;
  description: string;
  type: number;
  answer?: Option[] | string | number | boolean | null;
  index: number[];
  level: number;
  options?: Option[];
  components?: TemplateComponent;
  rows?: number;
  cols?: number;
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
  client?: string;
  titleModalDelete?: string;
  contentModalDelete?: string;
  validationState?: number;
  validationMessage?: string[];
  validations?: ValidationRule[];
  componentValidation?: string[];
  hasRemark?: boolean;
  lengthInput?: Array<{ maxlength?: number; minlength?: number }>;
  principal?: number;
  columnName?: string;
  titleModalConfirmation?: string;
  contentModalConfirmation?: string;
  required?: boolean;
  rangeInput?: unknown;
  presetMaster?: boolean;
  sourceOption?: unknown;
  disableInitial?: boolean;
}

/**
 * Reference store state
 */
export interface ReferenceState {
  details: ReferenceDetail[];
  sidebar?: SidebarDetail[];
}

// =============================================================================
// SIDEBAR
// =============================================================================

/**
 * Sidebar navigation item
 */
export interface SidebarDetail {
  dataKey: string;
  name: string;
  label: string;
  description: string;
  level: number;
  index: number[];
  components: TemplateComponent;
  sourceQuestion?: string;
  enable: boolean;
  enableCondition: string;
  componentEnable: string[];
}

/**
 * Sidebar store state
 */
export interface SidebarState {
  details: SidebarDetail[];
}

// =============================================================================
// INTERNAL MAPS (for lookup optimization)
// =============================================================================

/**
 * Component lookup maps for efficient access
 */
export interface ComponentMaps {
  /** dataKey -> index mapping */
  referenceMap: Record<string, number>;
  /** dataKey -> sidebar index mapping */
  sidebarIndexMap: Record<string, number>;
  /** dataKey -> components that depend on enable condition */
  compEnableMap: Record<string, string[]>;
  /** dataKey -> components that depend on validation */
  compValidMap: Record<string, string[]>;
  /** dataKey -> components that depend on source option */
  compSourceOptionMap: Record<string, string[]>;
  /** dataKey -> components that use in expressions */
  compVarMap: Record<string, string[]>;
  /** dataKey -> components that depend on source question */
  compSourceQuestionMap: Record<string, string[]>;
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
  referenceEnableFalse: string[];
}

// =============================================================================
// COMBINED FORM STATE (for context/store factory)
// =============================================================================

/**
 * Combined form state containing all stores
 * Used for store factory pattern to avoid global state pollution
 */
export interface FormState {
  locale: LocaleState;
  summary: Summary;
  counter: Counter;
  validation: ValidationState;
  response: ResponseState;
  preset: PresetState;
  media: MediaState;
  remark: RemarkState;
  template: TemplateState;
  reference: ReferenceState;
  sidebar: SidebarState;
  maps: ComponentMaps;
  history: HistoryState;
}
