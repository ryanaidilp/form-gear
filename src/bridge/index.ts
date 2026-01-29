/**
 * Native Bridge Module
 *
 * Auto-detects the platform and provides the appropriate bridge implementation.
 * Supports Android WebView, iOS WKWebView, Flutter WebView, and web browsers.
 *
 * @example
 * ```typescript
 * import { createBridge, detectPlatform } from 'form-gear/bridge';
 *
 * // Auto-detect platform and create bridge
 * const bridge = createBridge();
 *
 * // Use bridge methods
 * const photo = await bridge.openCamera();
 * const location = await bridge.getCurrentLocation();
 * await bridge.saveResponse(formData);
 * ```
 *
 * @example
 * ```typescript
 * // Force a specific platform
 * const bridge = createBridge({ forcePlatform: 'ios' });
 * ```
 */

import type { NativeBridge, Platform, BridgeConfig } from './types';
import { createAndroidBridge, isAndroidAvailable } from './android';
import { createIOSBridge, isIOSAvailable } from './ios';
import {
  createFlutterInAppWebViewBridge,
  createFlutterChannelBridge,
  isFlutterInAppWebViewAvailable,
  isFlutterChannelAvailable,
} from './flutter';
import { createWebBridge } from './web';

// =============================================================================
// Re-exports
// =============================================================================

export type {
  NativeBridge,
  Platform,
  BridgeConfig,
  GpsPhotoResult,
  Coordinates,
  UploadResult,
  ScanResult,
  FormGearOutput,
  IOSMessage,
  FlutterMessage,
} from './types';

export { createAndroidBridge, isAndroidAvailable } from './android';
export { createIOSBridge, isIOSAvailable } from './ios';
export {
  createFlutterInAppWebViewBridge,
  createFlutterChannelBridge,
  isFlutterInAppWebViewAvailable,
  isFlutterChannelAvailable,
  isFlutterAvailable,
} from './flutter';

// Flutter adapter for MobileHandlers integration
export {
  createFlutterMobileHandlers,
  detectFlutterHandlers,
  createFlutterCallbacks,
  initFlutterIntegration,
  FLUTTER_HANDLER_NAMES,
} from './flutter-adapter';

export type { FlutterAdapterConfig } from './flutter-adapter';
export { createWebBridge, isWebAvailable } from './web';

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Detection result with platform and confidence
 */
export interface PlatformDetection {
  platform: Platform;
  /** Confidence level: 'definite' | 'likely' | 'fallback' */
  confidence: 'definite' | 'likely' | 'fallback';
  /** Additional platform details */
  details: string;
}

/**
 * Detects the current platform.
 *
 * Detection order (first match wins):
 * 1. Flutter InAppWebView (window.flutter_inappwebview)
 * 2. Flutter webview_flutter (window.FormGearChannel)
 * 3. Android WebView (window.Android)
 * 4. iOS WKWebView (window.webkit.messageHandlers.FormGearHandler)
 * 5. Web browser (fallback)
 *
 * @returns Platform detection result
 */
export function detectPlatform(): PlatformDetection {
  // SSR guard
  if (typeof window === 'undefined') {
    return {
      platform: 'web',
      confidence: 'fallback',
      details: 'Server-side rendering detected',
    };
  }

  // Flutter InAppWebView (highest priority - most feature-rich)
  if (isFlutterInAppWebViewAvailable()) {
    return {
      platform: 'flutter',
      confidence: 'definite',
      details: 'Flutter InAppWebView detected (flutter_inappwebview)',
    };
  }

  // Flutter webview_flutter channel
  if (isFlutterChannelAvailable()) {
    return {
      platform: 'flutter',
      confidence: 'definite',
      details: 'Flutter channel detected (webview_flutter)',
    };
  }

  // Android WebView
  if (isAndroidAvailable()) {
    return {
      platform: 'android',
      confidence: 'definite',
      details: 'Android WebView detected (window.Android)',
    };
  }

  // iOS WKWebView
  if (isIOSAvailable()) {
    return {
      platform: 'ios',
      confidence: 'definite',
      details: 'iOS WKWebView detected (webkit.messageHandlers)',
    };
  }

  // Check user agent for additional hints
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes('android')) {
    return {
      platform: 'web',
      confidence: 'likely',
      details: 'Android browser detected (no native bridge)',
    };
  }

  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return {
      platform: 'web',
      confidence: 'likely',
      details: 'iOS browser detected (no native bridge)',
    };
  }

  // Web fallback
  return {
    platform: 'web',
    confidence: 'fallback',
    details: 'Standard web browser',
  };
}

// =============================================================================
// Bridge Factory
// =============================================================================

/**
 * Creates a native bridge with auto-detection.
 *
 * @param config - Optional bridge configuration
 * @returns NativeBridge implementation for the detected platform
 *
 * @example
 * ```typescript
 * // Auto-detect platform
 * const bridge = createBridge();
 * console.log(`Running on: ${bridge.platform}`);
 *
 * // Force specific platform (for testing)
 * const iosBridge = createBridge({ forcePlatform: 'ios' });
 * ```
 */
export function createBridge(config: BridgeConfig = {}): NativeBridge {
  const { forcePlatform, debug = false } = config;

  // Use forced platform if specified
  if (forcePlatform) {
    if (debug) {
      console.log(`[Bridge] Forced platform: ${forcePlatform}`);
    }
    return createBridgeForPlatform(forcePlatform, config);
  }

  // Auto-detect platform
  const detection = detectPlatform();

  if (debug) {
    console.log(`[Bridge] Detected: ${detection.platform} (${detection.confidence})`);
    console.log(`[Bridge] Details: ${detection.details}`);
  }

  return createBridgeForPlatform(detection.platform, config);
}

/**
 * Creates a bridge for a specific platform.
 */
function createBridgeForPlatform(
  platform: Platform,
  config: BridgeConfig
): NativeBridge {
  switch (platform) {
    case 'android':
      return createAndroidBridge(config);

    case 'ios':
      return createIOSBridge(config);

    case 'flutter':
      // Prefer InAppWebView over channel bridge
      if (isFlutterInAppWebViewAvailable()) {
        return createFlutterInAppWebViewBridge(config);
      }
      if (isFlutterChannelAvailable()) {
        return createFlutterChannelBridge(config);
      }
      // Fallback to web if Flutter bridges not actually available
      return createWebBridge(config);

    case 'web':
    default:
      return createWebBridge(config);
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let _defaultBridge: NativeBridge | null = null;

/**
 * Gets or creates the default bridge instance (singleton).
 *
 * Use this when you want a single shared bridge instance across
 * your application. For multiple instances, use createBridge().
 *
 * @param config - Optional configuration (only used on first call)
 * @returns The default bridge instance
 *
 * @example
 * ```typescript
 * // First call creates the bridge
 * const bridge = getBridge({ debug: true });
 *
 * // Subsequent calls return the same instance
 * const sameBridge = getBridge();
 * console.log(bridge === sameBridge); // true
 * ```
 */
export function getBridge(config?: BridgeConfig): NativeBridge {
  if (!_defaultBridge) {
    _defaultBridge = createBridge(config);
  }
  return _defaultBridge;
}

/**
 * Resets the default bridge instance.
 * Useful for testing or when platform changes (e.g., hot reload).
 */
export function resetBridge(): void {
  _defaultBridge = null;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Checks if running in a native app context.
 *
 * @returns true if running in Android, iOS, or Flutter WebView
 */
export function isNativeApp(): boolean {
  const detection = detectPlatform();
  return (
    detection.platform !== 'web' && detection.confidence === 'definite'
  );
}

/**
 * Checks if running in a mobile context (native or mobile browser).
 *
 * @returns true if running on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipad') ||
    ua.includes('ipod') ||
    ua.includes('mobile')
  );
}

/**
 * Gets the current platform name for display.
 *
 * @returns Human-readable platform name
 */
export function getPlatformName(): string {
  const detection = detectPlatform();

  switch (detection.platform) {
    case 'android':
      return 'Android';
    case 'ios':
      return 'iOS';
    case 'flutter':
      return 'Flutter';
    case 'web':
      return 'Web Browser';
    default:
      return 'Unknown';
  }
}
