/**
 * Flutter Adapter
 *
 * Provides utilities to integrate FormGear with Flutter WebView.
 * This adapter bridges the gap between Flutter's InAppWebView JavaScript handlers
 * and FormGear's MobileHandlers interface.
 *
 * Usage in Flutter (Dart):
 * ```dart
 * InAppWebView(
 *   onWebViewCreated: (controller) {
 *     // Register data handlers
 *     controller.addJavaScriptHandler(
 *       handlerName: 'getTemplate',
 *       callback: (args) => jsonEncode(templateData),
 *     );
 *
 *     // Register action handlers
 *     controller.addJavaScriptHandler(
 *       handlerName: 'openCamera',
 *       callback: (args) async {
 *         final result = await openCamera();
 *         return result;
 *       },
 *     );
 *
 *     controller.addJavaScriptHandler(
 *       handlerName: 'saveResponse',
 *       callback: (args) async {
 *         final data = args[0];
 *         await saveToDatabase(data);
 *         return {'success': true};
 *       },
 *     );
 *   },
 * )
 * ```
 *
 * Usage in FormGear (JavaScript):
 * ```typescript
 * import { createFormGear, createFlutterMobileHandlers } from 'form-gear';
 *
 * // Auto-detect Flutter and create handlers
 * const mobileHandlers = createFlutterMobileHandlers();
 *
 * const form = createFormGear({
 *   data: { template, validation },
 *   mobileHandlers,
 * });
 * ```
 */

import type { MobileHandlers } from '../core/types';
import type { GpsPhotoResult } from './types';
import { isFlutterInAppWebViewAvailable } from './flutter';

/**
 * Handler names expected by FormGear for Flutter integration.
 * Flutter SDK should register these handlers.
 */
export const FLUTTER_HANDLER_NAMES = {
  // Data handlers (sync - return string/JSON)
  GET_TEMPLATE: 'getTemplate',
  GET_VALIDATION: 'getValidation',
  GET_PRESET: 'getPreset',
  GET_RESPONSE: 'getResponse',
  GET_MEDIA: 'getMedia',
  GET_REMARK: 'getRemark',
  GET_REFERENCE: 'getReference',
  GET_USER_NAME: 'getUserName',
  GET_FORM_MODE: 'getFormMode',
  GET_IS_NEW: 'getIsNew',
  GET_PRINCIPAL_COLLECTION: 'getPrincipalCollection',
  GET_USER_ROLE: 'getUserRole',

  // Action handlers (async - return Promise)
  OPEN_CAMERA: 'openCamera',
  OPEN_CAMERA_WITH_GPS: 'openCameraWithGps',
  UPLOAD_FILE: 'uploadFile',
  SCAN_BARCODE: 'scanBarcode',
  GET_CURRENT_LOCATION: 'getCurrentLocation',
  OPEN_MAP: 'openMap',
  SEARCH_OFFLINE: 'searchOffline',
  SAVE_RESPONSE: 'saveResponse',
  SUBMIT_RESPONSE: 'submitResponse',
  EXIT: 'mobileExit',
  SHOW_TOAST: 'showToast',
} as const;

/**
 * Configuration for Flutter adapter
 */
export interface FlutterAdapterConfig {
  /** Enable debug logging */
  debug?: boolean;
  /** Timeout for async operations in ms (default: 30000) */
  timeout?: number;
}

/**
 * Calls a Flutter handler safely with error handling.
 */
async function callFlutterHandler<T>(
  handlerName: string,
  args?: unknown,
  fallback?: T,
  config: FlutterAdapterConfig = {}
): Promise<T> {
  const { debug = false, timeout = 30000 } = config;

  if (!isFlutterInAppWebViewAvailable()) {
    if (debug) {
      console.warn(`[Flutter Adapter] flutter_inappwebview not available for ${handlerName}`);
    }
    return fallback as T;
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout calling ${handlerName}`)), timeout);
    });

    const handlerPromise = window.flutter_inappwebview!.callHandler(
      handlerName,
      args
    ) as Promise<T>;

    const result = await Promise.race([handlerPromise, timeoutPromise]);

    if (debug) {
      console.log(`[Flutter Adapter] ${handlerName} returned:`, result);
    }

    return result;
  } catch (error) {
    console.error(`[Flutter Adapter] Error calling ${handlerName}:`, error);
    return fallback as T;
  }
}

/**
 * Creates MobileHandlers that use Flutter InAppWebView handlers.
 *
 * This function creates handlers that call Flutter-side JavaScript handlers
 * registered via `InAppWebViewController.addJavaScriptHandler()`.
 *
 * @param config - Optional configuration
 * @returns MobileHandlers configured for Flutter
 *
 * @example
 * ```typescript
 * import { createFormGear, createFlutterMobileHandlers } from 'form-gear';
 *
 * const form = createFormGear({
 *   data: { template, validation },
 *   mobileHandlers: createFlutterMobileHandlers({ debug: true }),
 * });
 * ```
 */
export function createFlutterMobileHandlers(
  config: FlutterAdapterConfig = {}
): MobileHandlers {
  const { debug = false } = config;

  if (debug) {
    console.log('[Flutter Adapter] Creating Flutter mobile handlers');
  }

  return {
    /**
     * Upload handler - calls Flutter's openCamera or uploadFile handler
     */
    uploadHandler: (setValue: (value: string) => void) => {
      callFlutterHandler<string>(FLUTTER_HANDLER_NAMES.OPEN_CAMERA, undefined, '', config)
        .then((result) => {
          if (result) {
            setValue(result);
          }
        })
        .catch((error) => {
          console.error('[Flutter Adapter] uploadHandler error:', error);
        });
    },

    /**
     * GPS handler - calls Flutter's openCameraWithGps handler
     */
    gpsHandler: (
      setter: (result: unknown, remark: string) => void,
      needPhoto?: boolean
    ) => {
      callFlutterHandler<GpsPhotoResult>(
        FLUTTER_HANDLER_NAMES.OPEN_CAMERA_WITH_GPS,
        needPhoto ?? false,
        { latitude: 0, longitude: 0, accuracy: 0 },
        config
      )
        .then((result) => {
          setter(result, result.remark || '');
        })
        .catch((error) => {
          console.error('[Flutter Adapter] gpsHandler error:', error);
          setter({ latitude: 0, longitude: 0, accuracy: 0 }, '');
        });
    },

    /**
     * Offline search handler - calls Flutter's searchOffline handler
     */
    offlineSearch: (
      id: string,
      version: string,
      dataJson: unknown,
      setter: (data: unknown) => void
    ) => {
      callFlutterHandler<unknown[]>(
        FLUTTER_HANDLER_NAMES.SEARCH_OFFLINE,
        { lookupId: id, version, conditions: dataJson },
        [],
        config
      )
        .then((result) => {
          setter(result);
        })
        .catch((error) => {
          console.error('[Flutter Adapter] offlineSearch error:', error);
          setter([]);
        });
    },

    /**
     * Online search handler - not typically used in Flutter (offline-first)
     * But provided for compatibility
     */
    onlineSearch: async (url: string): Promise<unknown> => {
      try {
        const response = await fetch(url);
        return await response.json();
      } catch (error) {
        console.error('[Flutter Adapter] onlineSearch error:', error);
        return {};
      }
    },

    /**
     * Exit handler - calls Flutter's mobileExit handler
     */
    exitHandler: (callback?: () => void) => {
      if (callback) {
        callback();
      }
      callFlutterHandler<void>(FLUTTER_HANDLER_NAMES.EXIT, undefined, undefined, config)
        .catch((error) => {
          console.error('[Flutter Adapter] exitHandler error:', error);
        });
    },

    /**
     * Open map handler - calls Flutter's openMap handler
     */
    openMap: (koordinat: { lat?: number; long?: number; latitude?: number; longitude?: number }) => {
      const lat = koordinat.lat ?? koordinat.latitude ?? 0;
      const lng = koordinat.long ?? koordinat.longitude ?? 0;

      callFlutterHandler<void>(
        FLUTTER_HANDLER_NAMES.OPEN_MAP,
        { latitude: lat, longitude: lng },
        undefined,
        config
      ).catch((error) => {
        console.error('[Flutter Adapter] openMap error:', error);
      });
    },
  };
}

/**
 * Checks if running in Flutter WebView and returns appropriate handlers.
 * Returns undefined if not in Flutter context, allowing fallback to other handlers.
 *
 * @param config - Optional configuration
 * @returns MobileHandlers if in Flutter, undefined otherwise
 *
 * @example
 * ```typescript
 * import { createFormGear, detectFlutterHandlers } from 'form-gear';
 *
 * const form = createFormGear({
 *   data: { template, validation },
 *   // Will use Flutter handlers if available, otherwise undefined
 *   mobileHandlers: detectFlutterHandlers() ?? webHandlers,
 * });
 * ```
 */
export function detectFlutterHandlers(
  config: FlutterAdapterConfig = {}
): MobileHandlers | undefined {
  if (isFlutterInAppWebViewAvailable()) {
    if (config.debug) {
      console.log('[Flutter Adapter] Flutter InAppWebView detected, creating handlers');
    }
    return createFlutterMobileHandlers(config);
  }

  if (config.debug) {
    console.log('[Flutter Adapter] Not running in Flutter WebView');
  }
  return undefined;
}

/**
 * Creates save/submit callbacks that use Flutter handlers.
 *
 * @param config - Optional configuration
 * @returns Callbacks for save and submit
 */
export function createFlutterCallbacks(config: FlutterAdapterConfig = {}) {
  return {
    onSave: async (
      response: unknown,
      media: unknown,
      remark: unknown,
      principal: unknown,
      reference: unknown
    ) => {
      await callFlutterHandler(
        FLUTTER_HANDLER_NAMES.SAVE_RESPONSE,
        { response, media, remark, principal, reference },
        undefined,
        config
      );
    },

    onSubmit: async (
      response: unknown,
      media: unknown,
      remark: unknown,
      principal: unknown,
      reference: unknown
    ) => {
      await callFlutterHandler(
        FLUTTER_HANDLER_NAMES.SUBMIT_RESPONSE,
        { response, media, remark, principal, reference },
        undefined,
        config
      );
    },
  };
}

/**
 * Initializes FormGear for Flutter WebView.
 * This is a convenience function that sets up everything needed for Flutter integration.
 *
 * @param config - Optional configuration
 * @returns Object with mobileHandlers and callbacks ready for createFormGear
 *
 * @example
 * ```typescript
 * import { createFormGear, initFlutterIntegration } from 'form-gear';
 *
 * const flutter = initFlutterIntegration({ debug: true });
 *
 * const form = createFormGear({
 *   data: { template, validation },
 *   mobileHandlers: flutter.mobileHandlers,
 *   callbacks: flutter.callbacks,
 * });
 * ```
 */
export function initFlutterIntegration(config: FlutterAdapterConfig = {}) {
  const isFlutter = isFlutterInAppWebViewAvailable();

  if (config.debug) {
    console.log('[Flutter Adapter] Initializing Flutter integration:', { isFlutter });
  }

  if (!isFlutter) {
    return {
      isFlutter: false,
      mobileHandlers: undefined,
      callbacks: undefined,
    };
  }

  return {
    isFlutter: true,
    mobileHandlers: createFlutterMobileHandlers(config),
    callbacks: createFlutterCallbacks(config),
  };
}
