/**
 * Native Bridge Types
 *
 * Defines the interface for platform-specific bridges (Android, iOS, Flutter, Web).
 * Each platform implements this interface to communicate with the host application.
 */

// =============================================================================
// Result Types
// =============================================================================

/**
 * Result from GPS capture with optional photo
 */
export interface GpsPhotoResult {
  /** Latitude coordinate */
  latitude: number;
  /** Longitude coordinate */
  longitude: number;
  /** GPS accuracy in meters */
  accuracy: number;
  /** Base64 encoded photo data (if captured) */
  photo?: string;
  /** Optional remark from the user */
  remark?: string;
  /** Timestamp of capture */
  timestamp?: number;
}

/**
 * Geographic coordinates
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Result from file upload
 */
export interface UploadResult {
  /** File path or URL */
  path: string;
  /** File name */
  name: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Base64 encoded data (for images) */
  base64?: string;
}

/**
 * Result from barcode/QR scanning
 */
export interface ScanResult {
  /** Scanned value */
  value: string;
  /** Type of barcode (QR, EAN, etc.) */
  format: string;
}

/**
 * Form output data for save/submit
 */
export interface FormGearOutput {
  response: unknown;
  media: unknown;
  remark: unknown;
  principal: unknown;
  reference: unknown;
}

// =============================================================================
// Bridge Interface
// =============================================================================

/**
 * Platform types supported by FormGear
 */
export type Platform = 'android' | 'ios' | 'flutter' | 'web';

/**
 * Native bridge interface for platform communication.
 *
 * Each platform (Android, iOS, Flutter, Web) implements this interface
 * to provide native functionality to FormGear.
 *
 * @example
 * ```typescript
 * const bridge = createBridge();
 *
 * // Open camera
 * const photoUrl = await bridge.openCamera();
 *
 * // Get GPS with photo
 * const result = await bridge.openCameraWithGps(true);
 * console.log(result.latitude, result.longitude, result.photo);
 *
 * // Save form data
 * await bridge.saveResponse(formData);
 * ```
 */
export interface NativeBridge {
  /**
   * Platform identifier
   */
  readonly platform: Platform;

  /**
   * Whether the bridge is available and functional
   */
  readonly isAvailable: boolean;

  // ===========================================================================
  // Camera & Media
  // ===========================================================================

  /**
   * Opens the device camera to capture a photo.
   *
   * @returns Promise resolving to the photo URL/path or base64 data
   */
  openCamera(): Promise<string>;

  /**
   * Opens the camera and captures GPS coordinates.
   *
   * @param needPhoto - Whether to also capture a photo
   * @returns Promise resolving to GPS coordinates and optional photo
   */
  openCameraWithGps(needPhoto: boolean): Promise<GpsPhotoResult>;

  /**
   * Opens file picker for uploading files.
   *
   * @param accept - MIME types to accept (e.g., 'image/*', 'application/pdf')
   * @returns Promise resolving to upload result
   */
  uploadFile(accept: string): Promise<UploadResult>;

  /**
   * Opens barcode/QR scanner.
   *
   * @returns Promise resolving to scan result
   */
  scanBarcode(): Promise<ScanResult>;

  // ===========================================================================
  // Location
  // ===========================================================================

  /**
   * Gets current GPS coordinates.
   *
   * @returns Promise resolving to current coordinates
   */
  getCurrentLocation(): Promise<Coordinates>;

  /**
   * Opens external map application at specified coordinates.
   *
   * @param coordinates - Location to display
   */
  openMap(coordinates: Coordinates): void;

  // ===========================================================================
  // Data Persistence
  // ===========================================================================

  /**
   * Saves form response data (draft save).
   *
   * @param data - Form data to save
   * @returns Promise resolving when save is complete
   */
  saveResponse(data: FormGearOutput): Promise<void>;

  /**
   * Submits form response data (final submission).
   *
   * @param data - Form data to submit
   * @returns Promise resolving when submission is complete
   */
  submitResponse(data: FormGearOutput): Promise<void>;

  // ===========================================================================
  // Offline Data
  // ===========================================================================

  /**
   * Searches offline data store.
   *
   * @param lookupId - ID of the lookup table
   * @param version - Version of the lookup data
   * @param conditions - Search conditions
   * @returns Promise resolving to matching data
   */
  searchOffline(
    lookupId: string,
    version: string,
    conditions: unknown[]
  ): Promise<unknown[]>;

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Exits the form and returns to the host application.
   *
   * @param callback - Optional callback to run before exit
   */
  exit(callback?: () => void): void;

  /**
   * Shows a toast/snackbar message.
   *
   * @param message - Message to display
   * @param duration - Duration in milliseconds (default: 3000)
   */
  showToast(message: string, duration?: number): void;

  /**
   * Shows a confirmation dialog.
   *
   * @param title - Dialog title
   * @param message - Dialog message
   * @returns Promise resolving to true if confirmed
   */
  showConfirmDialog(title: string, message: string): Promise<boolean>;

  // ===========================================================================
  // Logging
  // ===========================================================================

  /**
   * Logs a message to the native console.
   *
   * @param level - Log level
   * @param message - Message to log
   * @param data - Optional data to include
   */
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void;
}

// =============================================================================
// Window Interface Extensions
// =============================================================================

/**
 * Extends the Window interface with native bridge globals.
 * These are set by the native host applications.
 */
declare global {
  interface Window {
    // Android WebView bridge
    Android?: {
      openCamera?: () => string;
      openCameraWithGps?: (needPhoto: boolean) => string;
      uploadFile?: (accept: string) => string;
      scanBarcode?: () => string;
      getCurrentLocation?: () => string;
      openMap?: (lat: number, lng: number) => void;
      saveResponse?: (data: string) => void;
      submitResponse?: (data: string) => void;
      searchOffline?: (lookupId: string, version: string, conditions: string) => string;
      exit?: () => void;
      showToast?: (message: string, duration: number) => void;
      showConfirmDialog?: (title: string, message: string) => boolean;
      log?: (level: string, message: string, data: string) => void;
    };

    // iOS WKWebView message handlers
    webkit?: {
      messageHandlers?: {
        FormGearHandler?: {
          postMessage: (message: unknown) => void;
        };
        // Individual handlers for specific actions
        openCamera?: { postMessage: (message: unknown) => void };
        openCameraWithGps?: { postMessage: (message: unknown) => void };
        uploadFile?: { postMessage: (message: unknown) => void };
        scanBarcode?: { postMessage: (message: unknown) => void };
        getCurrentLocation?: { postMessage: (message: unknown) => void };
        openMap?: { postMessage: (message: unknown) => void };
        saveResponse?: { postMessage: (message: unknown) => void };
        submitResponse?: { postMessage: (message: unknown) => void };
        searchOffline?: { postMessage: (message: unknown) => void };
        exit?: { postMessage: (message: unknown) => void };
        showToast?: { postMessage: (message: unknown) => void };
        showConfirmDialog?: { postMessage: (message: unknown) => void };
        log?: { postMessage: (message: unknown) => void };
      };
    };

    // Flutter InAppWebView JavaScript handler
    flutter_inappwebview?: {
      callHandler: (handlerName: string, ...args: unknown[]) => Promise<unknown>;
    };

    // Flutter webview_flutter JavaScript channel
    FormGearChannel?: {
      postMessage: (message: string) => void;
    };

    // Callback registry for async operations (used by iOS)
    __formgear_callbacks__?: Record<string, (result: unknown) => void>;
  }
}

// =============================================================================
// Utility Types
// =============================================================================

/**
 * Configuration for bridge initialization
 */
export interface BridgeConfig {
  /**
   * Timeout for async operations in milliseconds
   * @default 30000
   */
  timeout?: number;

  /**
   * Whether to log bridge operations
   * @default false
   */
  debug?: boolean;

  /**
   * Custom platform detection override
   */
  forcePlatform?: Platform;
}

/**
 * Message format for iOS WKWebView communication
 */
export interface IOSMessage {
  action: string;
  callbackId: string;
  data?: unknown;
}

/**
 * Message format for Flutter channel communication
 */
export interface FlutterMessage {
  method: string;
  args?: unknown;
  callbackId?: string;
}
