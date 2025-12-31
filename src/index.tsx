/**
 * FormGear - Dynamic Form Engine
 *
 * A powerful form rendering library built with SolidJS for creating
 * dynamic questionnaires and data collection forms.
 *
 * @example
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
 */

import "./index.css";
import "toastify-js/src/toastify.css";

// =============================================================================
// Modern API
// =============================================================================

export { createFormGear, gearVersion } from "./createFormGear";

// =============================================================================
// Services (Advanced Usage)
// =============================================================================

export {
  // Service factory
  createFormServices,
  ServiceProvider,

  // Service hooks
  useServices,
  useReferenceService,
  useExpressionService,
  useValidationService,
  useEnableService,
  useNestedService,
  useAnswerService,
  useHistoryService,
} from "./services";

export type { FormServices } from "./services";

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

// =============================================================================
// Native Bridge (Platform Communication)
// =============================================================================

export {
  // Factory functions
  createBridge,
  getBridge,
  resetBridge,
  detectPlatform,

  // Platform-specific bridges
  createAndroidBridge,
  createIOSBridge,
  createFlutterInAppWebViewBridge,
  createFlutterChannelBridge,
  createWebBridge,

  // Detection helpers
  isAndroidAvailable,
  isIOSAvailable,
  isFlutterAvailable,
  isFlutterInAppWebViewAvailable,
  isFlutterChannelAvailable,
  isWebAvailable,

  // Utility functions
  isNativeApp,
  isMobile,
  getPlatformName,
} from "./bridge";

export type {
  // Bridge types
  NativeBridge,
  Platform,
  BridgeConfig,
  PlatformDetection,
  GpsPhotoResult,
  Coordinates,
  UploadResult,
  ScanResult,
  FormGearOutput,
  IOSMessage,
  FlutterMessage,
} from "./bridge";
