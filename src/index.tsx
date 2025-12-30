/**
 * FormGear - Dynamic Form Engine
 *
 * A powerful form rendering library built with SolidJS for creating
 * dynamic questionnaires and data collection forms.
 *
 * @example Basic usage with new API
 * ```typescript
 * import { createFormGear, ClientMode, FormMode } from 'form-gear';
 *
 * const form = createFormGear({
 *   data: {
 *     template: templateJson,
 *     validation: validationJson,
 *   },
 *   config: {
 *     clientMode: ClientMode.CAWI,
 *     formMode: FormMode.OPEN,
 *   },
 *   callbacks: {
 *     onSave: (response) => console.log('Saved:', response),
 *   },
 * });
 * ```
 *
 * @example Legacy usage (deprecated)
 * ```typescript
 * import { FormGear } from 'form-gear';
 *
 * new FormGear(ref, template, preset, response, validation, media, remark,
 *              config, upload, gps, offline, online, exit, save, submit, map);
 * ```
 */

import "./index.css";
import "toastify-js/src/toastify.css";

// =============================================================================
// New Modern API (Recommended)
// =============================================================================

export { createFormGear, gearVersion } from "./createFormGear";

// =============================================================================
// Legacy API (Deprecated - for backward compatibility)
// =============================================================================

/**
 * @deprecated Use `createFormGear` instead
 */
export { FormGear } from "./FormGear";

// =============================================================================
// Enums
// =============================================================================

export {
  ClientMode,
  FormMode,
  InitialMode,
  LookupMode,
  OptionType,
  ValidationType,
  ControlType,
  DEFAULT_CONFIG,
} from "./types";

// =============================================================================
// Type Exports
// =============================================================================

export type {
  // Configuration
  FormGearConfig,
  FormGearOptions,
  FormGearInstance,
  FormGearData,
  FormGearResponse,
  FormGearCallbacks,
  MobileHandlers,

  // Callbacks/Handlers
  ResponseCallback,
  UploadHandler,
  GpsHandler,
  OfflineSearchHandler,
  OnlineSearchHandler,
  ExitHandler,
  OpenMapHandler,

  // Component types
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

  // Store types
  Language,
  Locale,
  LocaleState,
  Summary,
  Counter,
  ValidationRule,
  TestFunction,
  ValidationDetail,
  ValidationState,
  Answer,
  Auxiliary,
  ResponseDetail,
  ResponseState,
  Predata,
  PresetDetail,
  PresetState,
  MediaDetail,
  MediaState,
  Comment,
  Note,
  RemarkDetail,
  RemarkState,
  TemplateComponent,
  TemplateDetail,
  TemplateState,
  ReferenceDetail,
  ReferenceState,
  SidebarDetail,
  SidebarState,
  ComponentMaps,
  HistoryState,
  FormState,

  // Platform bridge
  PlatformBridge,
} from "./types";
