/**
 * FormGear Type Definitions
 *
 * This module exports all types, interfaces, and enums used by FormGear.
 */

// Enums
export {
  ClientMode,
  FormMode,
  InitialMode,
  LookupMode,
  OptionType,
  ValidationType,
  ControlType,
} from './enums';

// Control/Component types
export type {
  Option,
  RangeInput,
  LengthInput,
  SizeInput,
  SourceAPI,
  ApiResponse,
  ComponentType,
  FormComponentProps,
  FormComponentConfig,
  FormComponentBase,
} from './controls';

// Store types
export type {
  // Locale
  Language,
  Locale,
  LocaleState,
  // Summary/Counter
  Summary,
  Counter,
  // Validation
  ValidationRule,
  TestFunction,
  ValidationDetail,
  ValidationState,
  // Response/Answer
  Answer,
  Auxiliary,
  ResponseDetail,
  ResponseState,
  // Preset
  Predata,
  PresetDetail,
  PresetState,
  // Media
  MediaDetail,
  MediaState,
  // Remark
  Comment,
  Note,
  RemarkDetail,
  RemarkState,
  // Template
  TemplateComponent,
  TemplateDetail,
  TemplateState,
  // Reference
  ReferenceDetail,
  ReferenceState,
  // Sidebar
  SidebarDetail,
  SidebarState,
  // Internal maps
  ComponentMaps,
  HistoryState,
  // Combined state
  FormState,
} from './stores';

// =============================================================================
// CONFIGURATION
// =============================================================================

import { ClientMode, FormMode, InitialMode, LookupMode } from './enums';

/**
 * FormGear configuration options
 */
export interface FormGearConfig {
  /**
   * Client mode: CAWI (web) or CAPI (mobile interviewer)
   * @default ClientMode.CAWI
   */
  clientMode: ClientMode;

  /**
   * Form mode: OPEN (editable), REVIEW (partial edit), CLOSE (read-only)
   * @default FormMode.OPEN
   */
  formMode: FormMode;

  /**
   * Initial mode: INITIAL (new form) or ASSIGN (assigned form)
   * @default InitialMode.INITIAL
   */
  initialMode: InitialMode;

  /**
   * Lookup mode: ONLINE (API) or OFFLINE (local)
   * @default LookupMode.ONLINE
   */
  lookupMode: LookupMode;

  /**
   * Username for form tracking
   */
  username?: string;

  /**
   * Authentication token for API requests
   */
  token?: string;

  /**
   * Base URL for API requests
   */
  baseUrl?: string;

  /**
   * Key field name in lookup response
   * @default 'keys'
   */
  lookupKey?: string;

  /**
   * Value field name in lookup response
   * @default 'values'
   */
  lookupValue?: string;
}

// =============================================================================
// CALLBACKS / HANDLERS
// =============================================================================

/**
 * Response callback data containing all form outputs
 */
export interface FormGearResponse {
  response: unknown;
  media: unknown;
  remark: unknown;
  principal: unknown;
  reference: unknown;
}

/**
 * Callback for form save/submit events
 */
export type ResponseCallback = (
  response: unknown,
  media: unknown,
  remark: unknown,
  principal: unknown,
  reference: unknown
) => void;

/**
 * Mobile upload handler (camera/file picker)
 */
export type UploadHandler = (setter: (value: unknown) => void) => void;

/**
 * GPS handler for location capture
 */
export type GpsHandler = (
  setter: (value: unknown, remark?: string) => void,
  needPhoto?: boolean
) => void;

/**
 * Offline search handler for local lookup
 */
export type OfflineSearchHandler = (
  id: string,
  version: string,
  conditions: unknown[],
  setter: (data: unknown) => void
) => void;

/**
 * Online search handler for API lookup
 */
export type OnlineSearchHandler = (url: string) => Promise<unknown>;

/**
 * Exit handler for mobile apps
 */
export type ExitHandler = (callback: () => void) => void;

/**
 * Map open handler for GPS visualization
 */
export type OpenMapHandler = (coordinates: unknown) => void;

// =============================================================================
// FORM GEAR OPTIONS (New API)
// =============================================================================

/**
 * Input data for FormGear initialization
 */
export interface FormGearData {
  /** Reference data (pre-computed component info) */
  reference?: unknown;
  /** Form template definition */
  template: unknown;
  /** Preset values */
  preset?: unknown;
  /** Existing response data */
  response?: unknown;
  /** Validation rules */
  validation?: unknown;
  /** Media attachments */
  media?: unknown;
  /** Remarks/comments */
  remark?: unknown;
}

/**
 * Mobile handlers for CAPI mode
 */
export interface MobileHandlers {
  /** Camera/file upload handler */
  uploadHandler?: UploadHandler;
  /** GPS location handler */
  gpsHandler?: GpsHandler;
  /** Offline lookup handler */
  offlineSearch?: OfflineSearchHandler;
  /** Online lookup handler */
  onlineSearch?: OnlineSearchHandler;
  /** App exit handler */
  exitHandler?: ExitHandler;
  /** Map visualization handler */
  openMap?: OpenMapHandler;
  /** Audio recording handler */
  audioHandler?: (setter: (value: any) => void) => void;
  /** Barcode/QR scan handler */
  barcodeHandler?: (setter: (value: any) => void) => void;
  /** Video recording handler */
  videoHandler?: (setter: (value: any) => void) => void;
  /** File picker handler */
  fileHandler?: (setter: (value: any) => void) => void;
}

/**
 * Event callbacks for form lifecycle
 */
export interface FormGearCallbacks {
  /** Called on form save */
  onSave?: ResponseCallback;
  /** Called on form submit */
  onSubmit?: ResponseCallback;
  /** Called on value change */
  onChange?: (dataKey: string, value: unknown) => void;
  /** Called on validation error */
  onValidationError?: (errors: Array<{ dataKey: string; message: string }>) => void;
}

/**
 * Complete options for createFormGear
 */
export interface FormGearOptions {
  /** Form data inputs */
  data: FormGearData;
  /** Configuration settings */
  config: FormGearConfig;
  /** Mobile handlers (optional for CAWI mode) */
  mobileHandlers?: MobileHandlers;
  /** Event callbacks */
  callbacks?: FormGearCallbacks;
  /** DOM element or selector to render into */
  target?: HTMLElement | string;
}

// =============================================================================
// FORM GEAR INSTANCE (Return type from createFormGear)
// =============================================================================

/**
 * FormGear instance methods
 */
export interface FormGearInstance {
  /** Get current response data */
  getResponse(): unknown;
  /** Get current media data */
  getMedia(): unknown;
  /** Get current remarks */
  getRemarks(): unknown;
  /** Get principal data */
  getPrincipal(): unknown;
  /** Get reference data */
  getReference(): unknown;
  /** Get form summary statistics */
  getSummary(): { answer: number; blank: number; error: number; remark: number };
  /** Validate entire form */
  validate(): boolean;
  /** Set value for a component */
  setValue(dataKey: string, value: unknown): void;
  /** Get value for a component */
  getValue(dataKey: string): unknown;
  /** Save form (triggers onSave callback) */
  save(): void;
  /** Submit form (triggers onSubmit callback) */
  submit(): void;
  /** Destroy instance and cleanup */
  destroy(): void;
}

// =============================================================================
// PLATFORM BRIDGE (For WebView integration)
// =============================================================================

/**
 * Platform-specific WebView bridge interface
 */
export interface PlatformBridge {
  /** Platform identifier */
  platform: 'android' | 'ios' | 'flutter' | 'web';
  /** Send action to native platform */
  sendAction(action: string, param1: string, param2: string, param3: string): void;
  /** Check if platform is available */
  isAvailable(): boolean;
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
