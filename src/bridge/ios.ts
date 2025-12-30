/**
 * iOS WKWebView Bridge
 *
 * Implementation of NativeBridge for iOS WKWebView.
 * Communicates with the iOS app via webkit.messageHandlers.
 *
 * iOS uses an async callback pattern since WKWebView messageHandlers
 * don't return values directly. Results are passed back via JavaScript
 * callback injection.
 *
 * iOS Setup (Swift):
 * ```swift
 * class FormGearMessageHandler: NSObject, WKScriptMessageHandler {
 *     func userContentController(_ controller: WKUserContentController,
 *                               didReceive message: WKScriptMessage) {
 *         guard let body = message.body as? [String: Any],
 *               let action = body["action"] as? String,
 *               let callbackId = body["callbackId"] as? String else { return }
 *
 *         switch action {
 *         case "openCamera":
 *             // Handle camera, then call back
 *             let result = capturePhoto()
 *             webView.evaluateJavaScript(
 *                 "window.__formgear_callbacks__['\(callbackId)']('\(result)')"
 *             )
 *         // ... other cases
 *         }
 *     }
 * }
 *
 * let config = WKWebViewConfiguration()
 * config.userContentController.add(handler, name: "FormGearHandler")
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
  IOSMessage,
} from './types';

// Initialize callback registry
if (typeof window !== 'undefined' && !window.__formgear_callbacks__) {
  window.__formgear_callbacks__ = {};
}

/**
 * Generates a unique callback ID.
 */
let callbackCounter = 0;
function generateCallbackId(): string {
  return `cb_${Date.now()}_${++callbackCounter}`;
}

/**
 * Creates an iOS WKWebView bridge.
 *
 * @param config - Optional bridge configuration
 * @returns NativeBridge implementation for iOS
 */
export function createIOSBridge(config: BridgeConfig = {}): NativeBridge {
  const { timeout = 30000, debug = false } = config;

  const log = (message: string, data?: unknown) => {
    if (debug) {
      console.log(`[iOS Bridge] ${message}`, data ?? '');
    }
  };

  /**
   * Gets the main FormGear message handler.
   */
  const getHandler = () => {
    return window.webkit?.messageHandlers?.FormGearHandler;
  };

  /**
   * Sends a message to iOS and waits for callback.
   */
  const sendMessage = <T>(action: string, data?: unknown): Promise<T> => {
    return new Promise((resolve, reject) => {
      const handler = getHandler();
      if (!handler) {
        log(`iOS handler not available for ${action}`);
        reject(new Error('iOS handler not available'));
        return;
      }

      const callbackId = generateCallbackId();
      log(`Sending message: ${action}`, { callbackId, data });

      // Set up timeout
      const timeoutId = setTimeout(() => {
        delete window.__formgear_callbacks__?.[callbackId];
        reject(new Error(`Timeout waiting for ${action} response`));
      }, timeout);

      // Register callback
      if (window.__formgear_callbacks__) {
        window.__formgear_callbacks__[callbackId] = (result: unknown) => {
          clearTimeout(timeoutId);
          delete window.__formgear_callbacks__?.[callbackId];
          log(`Received callback for ${action}`, result);
          resolve(result as T);
        };
      }

      // Send message to iOS
      const message: IOSMessage = {
        action,
        callbackId,
        data,
      };

      try {
        handler.postMessage(message);
      } catch (error) {
        clearTimeout(timeoutId);
        delete window.__formgear_callbacks__?.[callbackId];
        reject(error);
      }
    });
  };

  /**
   * Sends a fire-and-forget message (no response expected).
   */
  const sendMessageNoResponse = (action: string, data?: unknown): void => {
    const handler = getHandler();
    if (!handler) {
      log(`iOS handler not available for ${action}`);
      return;
    }

    const message: IOSMessage = {
      action,
      callbackId: '', // Empty for no-response messages
      data,
    };

    try {
      handler.postMessage(message);
      log(`Sent no-response message: ${action}`, data);
    } catch (error) {
      console.error(`[iOS Bridge] Error sending ${action}:`, error);
    }
  };

  const bridge: NativeBridge = {
    platform: 'ios',

    get isAvailable(): boolean {
      return typeof window.webkit?.messageHandlers?.FormGearHandler !== 'undefined';
    },

    // =========================================================================
    // Camera & Media
    // =========================================================================

    async openCamera(): Promise<string> {
      log('openCamera called');
      try {
        return await sendMessage<string>('openCamera');
      } catch (error) {
        console.error('[iOS Bridge] openCamera error:', error);
        return '';
      }
    },

    async openCameraWithGps(needPhoto: boolean): Promise<GpsPhotoResult> {
      log('openCameraWithGps called', { needPhoto });
      try {
        return await sendMessage<GpsPhotoResult>('openCameraWithGps', { needPhoto });
      } catch (error) {
        console.error('[iOS Bridge] openCameraWithGps error:', error);
        return { latitude: 0, longitude: 0, accuracy: 0 };
      }
    },

    async uploadFile(accept: string): Promise<UploadResult> {
      log('uploadFile called', { accept });
      try {
        return await sendMessage<UploadResult>('uploadFile', { accept });
      } catch (error) {
        console.error('[iOS Bridge] uploadFile error:', error);
        return { path: '', name: '', mimeType: '', size: 0 };
      }
    },

    async scanBarcode(): Promise<ScanResult> {
      log('scanBarcode called');
      try {
        return await sendMessage<ScanResult>('scanBarcode');
      } catch (error) {
        console.error('[iOS Bridge] scanBarcode error:', error);
        return { value: '', format: '' };
      }
    },

    // =========================================================================
    // Location
    // =========================================================================

    async getCurrentLocation(): Promise<Coordinates> {
      log('getCurrentLocation called');
      try {
        return await sendMessage<Coordinates>('getCurrentLocation');
      } catch (error) {
        console.error('[iOS Bridge] getCurrentLocation error:', error);
        return { latitude: 0, longitude: 0 };
      }
    },

    openMap(coordinates: Coordinates): void {
      log('openMap called', coordinates);
      sendMessageNoResponse('openMap', coordinates);
    },

    // =========================================================================
    // Data Persistence
    // =========================================================================

    async saveResponse(data: FormGearOutput): Promise<void> {
      log('saveResponse called', data);
      try {
        await sendMessage<void>('saveResponse', data);
      } catch (error) {
        console.error('[iOS Bridge] saveResponse error:', error);
      }
    },

    async submitResponse(data: FormGearOutput): Promise<void> {
      log('submitResponse called', data);
      try {
        await sendMessage<void>('submitResponse', data);
      } catch (error) {
        console.error('[iOS Bridge] submitResponse error:', error);
      }
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
      try {
        return await sendMessage<unknown[]>('searchOffline', {
          lookupId,
          version,
          conditions,
        });
      } catch (error) {
        console.error('[iOS Bridge] searchOffline error:', error);
        return [];
      }
    },

    // =========================================================================
    // Lifecycle
    // =========================================================================

    exit(callback?: () => void): void {
      log('exit called');
      if (callback) {
        callback();
      }
      sendMessageNoResponse('exit');
    },

    showToast(message: string, duration = 3000): void {
      log('showToast called', { message, duration });
      sendMessageNoResponse('showToast', { message, duration });
    },

    async showConfirmDialog(title: string, message: string): Promise<boolean> {
      log('showConfirmDialog called', { title, message });
      try {
        return await sendMessage<boolean>('showConfirmDialog', { title, message });
      } catch (error) {
        console.error('[iOS Bridge] showConfirmDialog error:', error);
        return false;
      }
    },

    // =========================================================================
    // Logging
    // =========================================================================

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
 * Checks if the iOS bridge is available.
 */
export function isIOSAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.webkit?.messageHandlers?.FormGearHandler !== 'undefined'
  );
}

/**
 * Helper function to be called from iOS to resolve callbacks.
 * This is exposed globally for iOS to call via evaluateJavaScript.
 *
 * @example
 * ```swift
 * // In iOS Swift code:
 * webView.evaluateJavaScript(
 *     "window.__formgear_resolve_callback__('\(callbackId)', \(jsonResult))"
 * )
 * ```
 */
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__formgear_resolve_callback__ = (
    callbackId: string,
    result: unknown
  ) => {
    const callback = window.__formgear_callbacks__?.[callbackId];
    if (callback) {
      callback(result);
    }
  };
}
