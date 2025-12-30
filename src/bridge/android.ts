/**
 * Android WebView Bridge
 *
 * Implementation of NativeBridge for Android WebView.
 * Communicates with the Android app via window.Android JavaScript interface.
 *
 * Android Setup (Kotlin):
 * ```kotlin
 * class FormGearJSInterface(private val context: Context) {
 *     @JavascriptInterface
 *     fun openCamera(): String { ... }
 *
 *     @JavascriptInterface
 *     fun saveResponse(data: String) { ... }
 * }
 *
 * webView.addJavascriptInterface(FormGearJSInterface(this), "Android")
 * ```
 */

import type {
  NativeBridge,
  GpsPhotoResult,
  Coordinates,
  UploadResult,
  ScanResult,
  FormGearOutput,
  BridgeConfig,
} from './types';

/**
 * Creates an Android WebView bridge.
 *
 * @param config - Optional bridge configuration
 * @returns NativeBridge implementation for Android
 */
export function createAndroidBridge(config: BridgeConfig = {}): NativeBridge {
  const { debug = false } = config;

  const log = (message: string, data?: unknown) => {
    if (debug) {
      console.log(`[Android Bridge] ${message}`, data ?? '');
    }
  };

  /**
   * Safely calls an Android method with error handling.
   */
  const callAndroid = <T>(
    methodName: string,
    fallback: T,
    ...args: unknown[]
  ): T => {
    try {
      const android = window.Android;
      if (!android) {
        log(`Android interface not available for ${methodName}`);
        return fallback;
      }

      const method = android[methodName as keyof typeof android];
      if (typeof method !== 'function') {
        log(`Method ${methodName} not found on Android interface`);
        return fallback;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = (method as (...args: any[]) => any).apply(android, args);
      log(`${methodName} called`, { args, result });
      return result;
    } catch (error) {
      console.error(`[Android Bridge] Error calling ${methodName}:`, error);
      return fallback;
    }
  };

  /**
   * Parses JSON result from Android, handling errors.
   */
  const parseResult = <T>(json: string | undefined, fallback: T): T => {
    if (!json) return fallback;
    try {
      return JSON.parse(json) as T;
    } catch {
      log('Failed to parse Android result', json);
      return fallback;
    }
  };

  const bridge: NativeBridge = {
    platform: 'android',

    get isAvailable(): boolean {
      return typeof window.Android !== 'undefined';
    },

    // =========================================================================
    // Camera & Media
    // =========================================================================

    async openCamera(): Promise<string> {
      log('openCamera called');
      const result = callAndroid<string>('openCamera', '');
      return result;
    },

    async openCameraWithGps(needPhoto: boolean): Promise<GpsPhotoResult> {
      log('openCameraWithGps called', { needPhoto });
      const json = callAndroid<string>('openCameraWithGps', '', needPhoto);
      return parseResult<GpsPhotoResult>(json, {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
      });
    },

    async uploadFile(accept: string): Promise<UploadResult> {
      log('uploadFile called', { accept });
      const json = callAndroid<string>('uploadFile', '', accept);
      return parseResult<UploadResult>(json, {
        path: '',
        name: '',
        mimeType: '',
        size: 0,
      });
    },

    async scanBarcode(): Promise<ScanResult> {
      log('scanBarcode called');
      const json = callAndroid<string>('scanBarcode', '');
      return parseResult<ScanResult>(json, {
        value: '',
        format: '',
      });
    },

    // =========================================================================
    // Location
    // =========================================================================

    async getCurrentLocation(): Promise<Coordinates> {
      log('getCurrentLocation called');
      const json = callAndroid<string>('getCurrentLocation', '');
      return parseResult<Coordinates>(json, {
        latitude: 0,
        longitude: 0,
      });
    },

    openMap(coordinates: Coordinates): void {
      log('openMap called', coordinates);
      callAndroid<void>(
        'openMap',
        undefined,
        coordinates.latitude,
        coordinates.longitude
      );
    },

    // =========================================================================
    // Data Persistence
    // =========================================================================

    async saveResponse(data: FormGearOutput): Promise<void> {
      log('saveResponse called', data);
      const json = JSON.stringify(data);
      callAndroid<void>('saveResponse', undefined, json);
    },

    async submitResponse(data: FormGearOutput): Promise<void> {
      log('submitResponse called', data);
      const json = JSON.stringify(data);
      callAndroid<void>('submitResponse', undefined, json);
    },

    // =========================================================================
    // Offline Data
    // =========================================================================

    async searchOffline(
      lookupId: string,
      version: string,
      conditions: unknown[]
    ): Promise<unknown[]> {
      log('searchOffline called', { lookupId, version, conditions });
      const json = callAndroid<string>(
        'searchOffline',
        '[]',
        lookupId,
        version,
        JSON.stringify(conditions)
      );
      return parseResult<unknown[]>(json, []);
    },

    // =========================================================================
    // Lifecycle
    // =========================================================================

    exit(callback?: () => void): void {
      log('exit called');
      if (callback) {
        callback();
      }
      callAndroid<void>('exit', undefined);
    },

    showToast(message: string, duration = 3000): void {
      log('showToast called', { message, duration });
      callAndroid<void>('showToast', undefined, message, duration);
    },

    async showConfirmDialog(title: string, message: string): Promise<boolean> {
      log('showConfirmDialog called', { title, message });
      const result = callAndroid<boolean>('showConfirmDialog', false, title, message);
      return result;
    },

    // =========================================================================
    // Logging
    // =========================================================================

    log(
      level: 'debug' | 'info' | 'warn' | 'error',
      message: string,
      data?: unknown
    ): void {
      const dataJson = data ? JSON.stringify(data) : '';
      callAndroid<void>('log', undefined, level, message, dataJson);
    },
  };

  return bridge;
}

/**
 * Checks if the Android bridge is available.
 */
export function isAndroidAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.Android !== 'undefined';
}
