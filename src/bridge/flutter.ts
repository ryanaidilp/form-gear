/**
 * Flutter WebView Bridge
 *
 * Implementation of NativeBridge for Flutter WebView plugins.
 * Supports both flutter_inappwebview and webview_flutter packages.
 *
 * Flutter InAppWebView Setup (Dart):
 * ```dart
 * InAppWebView(
 *   onWebViewCreated: (controller) {
 *     controller.addJavaScriptHandler(
 *       handlerName: 'openCamera',
 *       callback: (args) async {
 *         final result = await openCamera();
 *         return result; // Automatically returned to JS
 *       },
 *     );
 *   },
 * )
 * ```
 *
 * Flutter webview_flutter Setup (Dart):
 * ```dart
 * WebView(
 *   javascriptChannels: {
 *     JavascriptChannel(
 *       name: 'FormGearChannel',
 *       onMessageReceived: (message) {
 *         final data = jsonDecode(message.message);
 *         handleMessage(data);
 *       },
 *     ),
 *   },
 * )
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
  FlutterMessage,
} from './types';

// Initialize callback registry for webview_flutter
if (typeof window !== 'undefined' && !window.__formgear_callbacks__) {
  window.__formgear_callbacks__ = {};
}

/**
 * Generates a unique callback ID.
 */
let callbackCounter = 0;
function generateCallbackId(): string {
  return `flutter_cb_${Date.now()}_${++callbackCounter}`;
}

/**
 * Creates a Flutter InAppWebView bridge.
 * Uses the callHandler API which returns promises directly.
 *
 * @param config - Optional bridge configuration
 * @returns NativeBridge implementation for Flutter InAppWebView
 */
export function createFlutterInAppWebViewBridge(
  config: BridgeConfig = {}
): NativeBridge {
  const { timeout = 30000, debug = false } = config;

  const log = (message: string, data?: unknown) => {
    if (debug) {
      console.log(`[Flutter InAppWebView Bridge] ${message}`, data ?? '');
    }
  };

  /**
   * Calls a Flutter handler with timeout.
   */
  const callHandler = async <T>(
    handlerName: string,
    args?: unknown
  ): Promise<T> => {
    const inAppWebView = window.flutter_inappwebview;
    if (!inAppWebView) {
      throw new Error('Flutter InAppWebView not available');
    }

    log(`Calling handler: ${handlerName}`, args);

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(`Timeout calling ${handlerName}`)),
        timeout
      );
    });

    const handlerPromise = inAppWebView.callHandler(
      handlerName,
      args
    ) as Promise<T>;

    return Promise.race([handlerPromise, timeoutPromise]);
  };

  /**
   * Safely calls a handler with error handling.
   */
  const safeCall = async <T>(
    handlerName: string,
    fallback: T,
    args?: unknown
  ): Promise<T> => {
    try {
      return await callHandler<T>(handlerName, args);
    } catch (error) {
      console.error(
        `[Flutter InAppWebView Bridge] Error calling ${handlerName}:`,
        error
      );
      return fallback;
    }
  };

  const bridge: NativeBridge = {
    platform: 'flutter',

    get isAvailable(): boolean {
      return typeof window.flutter_inappwebview !== 'undefined';
    },

    // Camera & Media
    async openCamera(): Promise<string> {
      log('openCamera called');
      return safeCall('openCamera', '');
    },

    async openCameraWithGps(needPhoto: boolean): Promise<GpsPhotoResult> {
      log('openCameraWithGps called', { needPhoto });
      return safeCall('openCameraWithGps', { latitude: 0, longitude: 0, accuracy: 0 }, needPhoto);
    },

    async uploadFile(accept: string): Promise<UploadResult> {
      log('uploadFile called', { accept });
      return safeCall('uploadFile', { path: '', name: '', mimeType: '', size: 0 }, accept);
    },

    async scanBarcode(): Promise<ScanResult> {
      log('scanBarcode called');
      return safeCall('scanBarcode', { value: '', format: '' });
    },

    // Location
    async getCurrentLocation(): Promise<Coordinates> {
      log('getCurrentLocation called');
      return safeCall('getCurrentLocation', { latitude: 0, longitude: 0 });
    },

    openMap(coordinates: Coordinates): void {
      log('openMap called', coordinates);
      safeCall('openMap', undefined, coordinates);
    },

    // Data Persistence
    async saveResponse(data: FormGearOutput): Promise<void> {
      log('saveResponse called', data);
      await safeCall('saveResponse', undefined, data);
    },

    async submitResponse(data: FormGearOutput): Promise<void> {
      log('submitResponse called', data);
      await safeCall('submitResponse', undefined, data);
    },

    // Offline Data
    async searchOffline(
      lookupId: string,
      version: string,
      conditions: unknown[]
    ): Promise<unknown[]> {
      log('searchOffline called', { lookupId, version, conditions });
      return safeCall('searchOffline', [], { lookupId, version, conditions });
    },

    // Lifecycle
    exit(callback?: () => void): void {
      log('exit called');
      if (callback) callback();
      safeCall('exit', undefined);
    },

    showToast(message: string, duration = 3000): void {
      log('showToast called', { message, duration });
      safeCall('showToast', undefined, { message, duration });
    },

    async showConfirmDialog(title: string, message: string): Promise<boolean> {
      log('showConfirmDialog called', { title, message });
      return safeCall('showConfirmDialog', false, { title, message });
    },

    // Logging
    log(
      level: 'debug' | 'info' | 'warn' | 'error',
      message: string,
      data?: unknown
    ): void {
      safeCall('log', undefined, { level, message, data });
    },
  };

  return bridge;
}

/**
 * Creates a Flutter webview_flutter channel bridge.
 * Uses message passing with callback pattern.
 *
 * @param config - Optional bridge configuration
 * @returns NativeBridge implementation for Flutter webview_flutter
 */
export function createFlutterChannelBridge(
  config: BridgeConfig = {}
): NativeBridge {
  const { timeout = 30000, debug = false } = config;

  const log = (message: string, data?: unknown) => {
    if (debug) {
      console.log(`[Flutter Channel Bridge] ${message}`, data ?? '');
    }
  };

  /**
   * Sends a message through the Flutter channel.
   */
  const sendMessage = <T>(method: string, args?: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      const channel = window.FormGearChannel;
      if (!channel) {
        reject(new Error('Flutter channel not available'));
        return;
      }

      const callbackId = generateCallbackId();
      log(`Sending message: ${method}`, { callbackId, args });

      // Set up timeout
      const timeoutId = setTimeout(() => {
        delete window.__formgear_callbacks__?.[callbackId];
        reject(new Error(`Timeout waiting for ${method} response`));
      }, timeout);

      // Register callback
      if (window.__formgear_callbacks__) {
        window.__formgear_callbacks__[callbackId] = (result: unknown) => {
          clearTimeout(timeoutId);
          delete window.__formgear_callbacks__?.[callbackId];
          log(`Received callback for ${method}`, result);
          resolve(result as T);
        };
      }

      // Send message
      const message: FlutterMessage = {
        method,
        args,
        callbackId,
      };

      try {
        channel.postMessage(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timeoutId);
        delete window.__formgear_callbacks__?.[callbackId];
        reject(error);
      }
    });
  };

  /**
   * Sends a fire-and-forget message.
   */
  const sendMessageNoResponse = (method: string, args?: unknown): void => {
    const channel = window.FormGearChannel;
    if (!channel) {
      log(`Flutter channel not available for ${method}`);
      return;
    }

    const message: FlutterMessage = { method, args };

    try {
      channel.postMessage(JSON.stringify(message));
      log(`Sent no-response message: ${method}`, args);
    } catch (error) {
      console.error(`[Flutter Channel Bridge] Error sending ${method}:`, error);
    }
  };

  /**
   * Safely sends a message with error handling.
   */
  const safeCall = async <T>(
    method: string,
    fallback: T,
    args?: unknown
  ): Promise<T> => {
    try {
      return await sendMessage<T>(method, args);
    } catch (error) {
      console.error(`[Flutter Channel Bridge] Error calling ${method}:`, error);
      return fallback;
    }
  };

  const bridge: NativeBridge = {
    platform: 'flutter',

    get isAvailable(): boolean {
      return typeof window.FormGearChannel !== 'undefined';
    },

    // Camera & Media
    async openCamera(): Promise<string> {
      log('openCamera called');
      return safeCall('openCamera', '');
    },

    async openCameraWithGps(needPhoto: boolean): Promise<GpsPhotoResult> {
      log('openCameraWithGps called', { needPhoto });
      return safeCall('openCameraWithGps', { latitude: 0, longitude: 0, accuracy: 0 }, { needPhoto });
    },

    async uploadFile(accept: string): Promise<UploadResult> {
      log('uploadFile called', { accept });
      return safeCall('uploadFile', { path: '', name: '', mimeType: '', size: 0 }, { accept });
    },

    async scanBarcode(): Promise<ScanResult> {
      log('scanBarcode called');
      return safeCall('scanBarcode', { value: '', format: '' });
    },

    // Location
    async getCurrentLocation(): Promise<Coordinates> {
      log('getCurrentLocation called');
      return safeCall('getCurrentLocation', { latitude: 0, longitude: 0 });
    },

    openMap(coordinates: Coordinates): void {
      log('openMap called', coordinates);
      sendMessageNoResponse('openMap', coordinates);
    },

    // Data Persistence
    async saveResponse(data: FormGearOutput): Promise<void> {
      log('saveResponse called', data);
      await safeCall('saveResponse', undefined, data);
    },

    async submitResponse(data: FormGearOutput): Promise<void> {
      log('submitResponse called', data);
      await safeCall('submitResponse', undefined, data);
    },

    // Offline Data
    async searchOffline(
      lookupId: string,
      version: string,
      conditions: unknown[]
    ): Promise<unknown[]> {
      log('searchOffline called', { lookupId, version, conditions });
      return safeCall('searchOffline', [], { lookupId, version, conditions });
    },

    // Lifecycle
    exit(callback?: () => void): void {
      log('exit called');
      if (callback) callback();
      sendMessageNoResponse('exit');
    },

    showToast(message: string, duration = 3000): void {
      log('showToast called', { message, duration });
      sendMessageNoResponse('showToast', { message, duration });
    },

    async showConfirmDialog(title: string, message: string): Promise<boolean> {
      log('showConfirmDialog called', { title, message });
      return safeCall('showConfirmDialog', false, { title, message });
    },

    // Logging
    log(
      level: 'debug' | 'info' | 'warn' | 'error',
      message: string,
      data?: unknown
    ): void {
      sendMessageNoResponse('log', { level, message, data });
    },
  };

  return bridge;
}

/**
 * Checks if Flutter InAppWebView is available.
 */
export function isFlutterInAppWebViewAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.flutter_inappwebview !== 'undefined'
  );
}

/**
 * Checks if Flutter webview_flutter channel is available.
 */
export function isFlutterChannelAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.FormGearChannel !== 'undefined'
  );
}

/**
 * Checks if any Flutter bridge is available.
 */
export function isFlutterAvailable(): boolean {
  return isFlutterInAppWebViewAvailable() || isFlutterChannelAvailable();
}

/**
 * Helper function to be called from Flutter to resolve callbacks.
 * This is exposed globally for Flutter to call.
 *
 * @example
 * ```dart
 * // In Flutter Dart code:
 * webViewController.runJavaScript(
 *   "window.__formgear_flutter_callback__('$callbackId', $jsonResult)"
 * );
 * ```
 */
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__formgear_flutter_callback__ = (
    callbackId: string,
    result: unknown
  ) => {
    const callback = window.__formgear_callbacks__?.[callbackId];
    if (callback) {
      callback(result);
    }
  };
}
