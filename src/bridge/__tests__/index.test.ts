import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  detectPlatform,
  createBridge,
  getBridge,
  resetBridge,
  isNativeApp,
  isMobile,
  getPlatformName,
} from '../index';

describe('Bridge Module', () => {
  // Store original window properties to restore after tests
  const originalAndroid = window.Android;
  const originalWebkit = window.webkit;
  const originalFlutterInAppWebView = window.flutter_inappwebview;
  const originalFormGearChannel = window.FormGearChannel;
  const originalUserAgent = navigator.userAgent;

  beforeEach(() => {
    // Clean up window properties before each test
    delete (window as unknown as Record<string, unknown>).Android;
    delete (window as unknown as Record<string, unknown>).webkit;
    delete (window as unknown as Record<string, unknown>).flutter_inappwebview;
    delete (window as unknown as Record<string, unknown>).FormGearChannel;

    // Reset singleton bridge
    resetBridge();
  });

  afterEach(() => {
    // Restore original window properties
    if (originalAndroid) {
      (window as unknown as Record<string, unknown>).Android = originalAndroid;
    }
    if (originalWebkit) {
      (window as unknown as Record<string, unknown>).webkit = originalWebkit;
    }
    if (originalFlutterInAppWebView) {
      (window as unknown as Record<string, unknown>).flutter_inappwebview =
        originalFlutterInAppWebView;
    }
    if (originalFormGearChannel) {
      (window as unknown as Record<string, unknown>).FormGearChannel =
        originalFormGearChannel;
    }

    // Restore user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
      configurable: true,
    });
  });

  describe('detectPlatform', () => {
    it('should detect Flutter InAppWebView as definite', () => {
      (window as unknown as Record<string, unknown>).flutter_inappwebview = {
        callHandler: vi.fn().mockResolvedValue({}),
      };

      const result = detectPlatform();

      expect(result.platform).toBe('flutter');
      expect(result.confidence).toBe('definite');
      expect(result.details).toContain('InAppWebView');
    });

    it('should detect Flutter channel as definite', () => {
      (window as unknown as Record<string, unknown>).FormGearChannel = {
        postMessage: vi.fn(),
      };

      const result = detectPlatform();

      expect(result.platform).toBe('flutter');
      expect(result.confidence).toBe('definite');
      expect(result.details).toContain('channel');
    });

    it('should detect Android WebView as definite', () => {
      (window as unknown as Record<string, unknown>).Android = {
        openCamera: vi.fn(),
      };

      const result = detectPlatform();

      expect(result.platform).toBe('android');
      expect(result.confidence).toBe('definite');
      expect(result.details).toContain('Android');
    });

    it('should detect iOS WKWebView as definite', () => {
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: vi.fn(),
          },
        },
      };

      const result = detectPlatform();

      expect(result.platform).toBe('ios');
      expect(result.confidence).toBe('definite');
      expect(result.details).toContain('iOS');
    });

    it('should detect Android browser from user agent as likely web', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        writable: true,
        configurable: true,
      });

      const result = detectPlatform();

      expect(result.platform).toBe('web');
      expect(result.confidence).toBe('likely');
      expect(result.details).toContain('Android browser');
    });

    it('should detect iOS browser from user agent as likely web', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        writable: true,
        configurable: true,
      });

      const result = detectPlatform();

      expect(result.platform).toBe('web');
      expect(result.confidence).toBe('likely');
      expect(result.details).toContain('iOS browser');
    });

    it('should detect iPad from user agent as likely web', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0)',
        writable: true,
        configurable: true,
      });

      const result = detectPlatform();

      expect(result.platform).toBe('web');
      expect(result.confidence).toBe('likely');
      expect(result.details).toContain('iOS browser');
    });

    it('should fallback to web for standard browsers', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        writable: true,
        configurable: true,
      });

      const result = detectPlatform();

      expect(result.platform).toBe('web');
      expect(result.confidence).toBe('fallback');
      expect(result.details).toContain('Standard web browser');
    });

    it('should prioritize Flutter over Android if both are present', () => {
      (window as unknown as Record<string, unknown>).flutter_inappwebview = {
        callHandler: vi.fn().mockResolvedValue({}),
      };
      (window as unknown as Record<string, unknown>).Android = {
        openCamera: vi.fn(),
      };

      const result = detectPlatform();

      expect(result.platform).toBe('flutter');
    });

    it('should prioritize Android over iOS if both are present', () => {
      (window as unknown as Record<string, unknown>).Android = {
        openCamera: vi.fn(),
      };
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: vi.fn(),
          },
        },
      };

      const result = detectPlatform();

      expect(result.platform).toBe('android');
    });
  });

  describe('createBridge', () => {
    it('should create a web bridge by default', () => {
      const bridge = createBridge();

      expect(bridge.platform).toBe('web');
      expect(bridge.isAvailable).toBe(true);
    });

    it('should create an Android bridge when Android is available', () => {
      (window as unknown as Record<string, unknown>).Android = {
        openCamera: vi.fn(),
      };

      const bridge = createBridge();

      expect(bridge.platform).toBe('android');
    });

    it('should create an iOS bridge when iOS is available', () => {
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: vi.fn(),
          },
        },
      };

      const bridge = createBridge();

      expect(bridge.platform).toBe('ios');
    });

    it('should create a Flutter bridge when Flutter InAppWebView is available', () => {
      (window as unknown as Record<string, unknown>).flutter_inappwebview = {
        callHandler: vi.fn().mockResolvedValue({}),
      };

      const bridge = createBridge();

      expect(bridge.platform).toBe('flutter');
    });

    it('should create a Flutter bridge when Flutter channel is available', () => {
      (window as unknown as Record<string, unknown>).FormGearChannel = {
        postMessage: vi.fn(),
      };

      const bridge = createBridge();

      expect(bridge.platform).toBe('flutter');
    });

    it('should force platform when specified', () => {
      const bridge = createBridge({ forcePlatform: 'android' });

      expect(bridge.platform).toBe('android');
    });

    it('should force iOS platform when specified', () => {
      const bridge = createBridge({ forcePlatform: 'ios' });

      expect(bridge.platform).toBe('ios');
    });

    it('should log detection when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      createBridge({ debug: true });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should log forced platform when debug is enabled', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      createBridge({ forcePlatform: 'android', debug: true });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Forced platform')
      );
      consoleSpy.mockRestore();
    });

    it('should fallback to web when forced Flutter but no Flutter bridge available', () => {
      // Force flutter but without any flutter bridge being available
      const bridge = createBridge({ forcePlatform: 'flutter' });

      // Should fallback to web since neither flutter_inappwebview nor FormGearChannel exists
      expect(bridge.platform).toBe('web');
    });
  });

  describe('getBridge (singleton)', () => {
    it('should return the same instance on subsequent calls', () => {
      const bridge1 = getBridge();
      const bridge2 = getBridge();

      expect(bridge1).toBe(bridge2);
    });

    it('should use config only on first call', () => {
      const bridge1 = getBridge({ forcePlatform: 'android' });
      const bridge2 = getBridge({ forcePlatform: 'ios' });

      expect(bridge1.platform).toBe('android');
      expect(bridge2.platform).toBe('android'); // Still android, not ios
    });

    it('should create new instance after resetBridge', () => {
      const bridge1 = getBridge({ forcePlatform: 'android' });
      resetBridge();
      const bridge2 = getBridge({ forcePlatform: 'ios' });

      expect(bridge1.platform).toBe('android');
      expect(bridge2.platform).toBe('ios');
    });
  });

  describe('resetBridge', () => {
    it('should clear the singleton instance', () => {
      const bridge1 = getBridge({ forcePlatform: 'android' });
      expect(bridge1.platform).toBe('android');

      resetBridge();

      // Now should auto-detect (web fallback)
      const bridge2 = getBridge();
      expect(bridge2.platform).toBe('web');
    });
  });

  describe('isNativeApp', () => {
    it('should return false for web platform', () => {
      expect(isNativeApp()).toBe(false);
    });

    it('should return true for Android WebView', () => {
      (window as unknown as Record<string, unknown>).Android = {
        openCamera: vi.fn(),
      };

      expect(isNativeApp()).toBe(true);
    });

    it('should return true for iOS WKWebView', () => {
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: vi.fn(),
          },
        },
      };

      expect(isNativeApp()).toBe(true);
    });

    it('should return true for Flutter', () => {
      (window as unknown as Record<string, unknown>).flutter_inappwebview = {
        callHandler: vi.fn().mockResolvedValue({}),
      };

      expect(isNativeApp()).toBe(true);
    });

    it('should return false for mobile browser (no native bridge)', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        writable: true,
        configurable: true,
      });

      expect(isNativeApp()).toBe(false);
    });
  });

  describe('isMobile', () => {
    it('should return true for Android user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        writable: true,
        configurable: true,
      });

      expect(isMobile()).toBe(true);
    });

    it('should return true for iPhone user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)',
        writable: true,
        configurable: true,
      });

      expect(isMobile()).toBe(true);
    });

    it('should return true for iPad user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 14_0)',
        writable: true,
        configurable: true,
      });

      expect(isMobile()).toBe(true);
    });

    it('should return true for iPod user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 14_0)',
        writable: true,
        configurable: true,
      });

      expect(isMobile()).toBe(true);
    });

    it('should return true for generic mobile user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Mobile; rv:14.0) Gecko/14.0 Firefox/14.0',
        writable: true,
        configurable: true,
      });

      expect(isMobile()).toBe(true);
    });

    it('should return false for desktop user agent', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
        writable: true,
        configurable: true,
      });

      expect(isMobile()).toBe(false);
    });
  });

  describe('getPlatformName', () => {
    it('should return "Web Browser" for web platform', () => {
      expect(getPlatformName()).toBe('Web Browser');
    });

    it('should return "Android" for Android platform', () => {
      (window as unknown as Record<string, unknown>).Android = {
        openCamera: vi.fn(),
      };

      expect(getPlatformName()).toBe('Android');
    });

    it('should return "iOS" for iOS platform', () => {
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: vi.fn(),
          },
        },
      };

      expect(getPlatformName()).toBe('iOS');
    });

    it('should return "Flutter" for Flutter platform', () => {
      (window as unknown as Record<string, unknown>).flutter_inappwebview = {
        callHandler: vi.fn().mockResolvedValue({}),
      };

      expect(getPlatformName()).toBe('Flutter');
    });
  });
});
