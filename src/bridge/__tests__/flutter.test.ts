import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createFlutterInAppWebViewBridge,
  createFlutterChannelBridge,
  isFlutterInAppWebViewAvailable,
  isFlutterChannelAvailable,
  isFlutterAvailable,
} from '../flutter';

describe('Flutter Bridge', () => {
  const originalFlutterInAppWebView = window.flutter_inappwebview;
  const originalFormGearChannel = window.FormGearChannel;
  const originalCallbacks = window.__formgear_callbacks__;

  beforeEach(() => {
    // Clean up Flutter interfaces before each test
    delete (window as unknown as Record<string, unknown>).flutter_inappwebview;
    delete (window as unknown as Record<string, unknown>).FormGearChannel;
    // Reset callback registry
    window.__formgear_callbacks__ = {};
  });

  afterEach(() => {
    // Restore original Flutter interfaces
    if (originalFlutterInAppWebView) {
      (window as unknown as Record<string, unknown>).flutter_inappwebview =
        originalFlutterInAppWebView;
    }
    if (originalFormGearChannel) {
      (window as unknown as Record<string, unknown>).FormGearChannel =
        originalFormGearChannel;
    }
    if (originalCallbacks) {
      window.__formgear_callbacks__ = originalCallbacks;
    }
    vi.restoreAllMocks();
  });

  describe('availability checks', () => {
    describe('isFlutterInAppWebViewAvailable', () => {
      it('should return false when flutter_inappwebview is not present', () => {
        expect(isFlutterInAppWebViewAvailable()).toBe(false);
      });

      it('should return true when flutter_inappwebview is present', () => {
        (window as unknown as Record<string, unknown>).flutter_inappwebview = {
          callHandler: vi.fn(),
        };

        expect(isFlutterInAppWebViewAvailable()).toBe(true);
      });
    });

    describe('isFlutterChannelAvailable', () => {
      it('should return false when FormGearChannel is not present', () => {
        expect(isFlutterChannelAvailable()).toBe(false);
      });

      it('should return true when FormGearChannel is present', () => {
        (window as unknown as Record<string, unknown>).FormGearChannel = {
          postMessage: vi.fn(),
        };

        expect(isFlutterChannelAvailable()).toBe(true);
      });
    });

    describe('isFlutterAvailable', () => {
      it('should return false when neither Flutter interface is present', () => {
        expect(isFlutterAvailable()).toBe(false);
      });

      it('should return true when InAppWebView is present', () => {
        (window as unknown as Record<string, unknown>).flutter_inappwebview = {
          callHandler: vi.fn(),
        };

        expect(isFlutterAvailable()).toBe(true);
      });

      it('should return true when Channel is present', () => {
        (window as unknown as Record<string, unknown>).FormGearChannel = {
          postMessage: vi.fn(),
        };

        expect(isFlutterAvailable()).toBe(true);
      });

      it('should return true when both are present', () => {
        (window as unknown as Record<string, unknown>).flutter_inappwebview = {
          callHandler: vi.fn(),
        };
        (window as unknown as Record<string, unknown>).FormGearChannel = {
          postMessage: vi.fn(),
        };

        expect(isFlutterAvailable()).toBe(true);
      });
    });
  });

  describe('Flutter InAppWebView Bridge', () => {
    let mockCallHandler: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockCallHandler = vi.fn();
      (window as unknown as Record<string, unknown>).flutter_inappwebview = {
        callHandler: mockCallHandler,
      };
    });

    describe('createFlutterInAppWebViewBridge', () => {
      it('should create a bridge with platform "flutter"', () => {
        const bridge = createFlutterInAppWebViewBridge();

        expect(bridge.platform).toBe('flutter');
      });

      it('should report isAvailable as true when InAppWebView is present', () => {
        const bridge = createFlutterInAppWebViewBridge();

        expect(bridge.isAvailable).toBe(true);
      });

      it('should report isAvailable as false when InAppWebView is not present', () => {
        delete (window as unknown as Record<string, unknown>).flutter_inappwebview;

        const bridge = createFlutterInAppWebViewBridge();

        expect(bridge.isAvailable).toBe(false);
      });
    });

    describe('bridge methods', () => {
      describe('openCamera', () => {
        it('should call handler and return result', async () => {
          mockCallHandler.mockResolvedValue('photo_url.jpg');

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.openCamera();

          expect(mockCallHandler).toHaveBeenCalledWith('openCamera', undefined);
          expect(result).toBe('photo_url.jpg');
        });

        it('should return empty string on error', async () => {
          mockCallHandler.mockRejectedValue(new Error('Handler not found'));

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.openCamera();

          expect(result).toBe('');
        });

        it('should return empty string when InAppWebView not available', async () => {
          delete (window as unknown as Record<string, unknown>).flutter_inappwebview;

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.openCamera();

          expect(result).toBe('');
        });
      });

      describe('openCameraWithGps', () => {
        it('should call handler with needPhoto parameter', async () => {
          const gpsResult = {
            latitude: 1.23,
            longitude: 4.56,
            accuracy: 10,
            photo: 'base64data',
          };
          mockCallHandler.mockResolvedValue(gpsResult);

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.openCameraWithGps(true);

          expect(mockCallHandler).toHaveBeenCalledWith('openCameraWithGps', true);
          expect(result).toEqual(gpsResult);
        });

        it('should return default GPS result on error', async () => {
          mockCallHandler.mockRejectedValue(new Error('Error'));

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.openCameraWithGps(false);

          expect(result).toEqual({
            latitude: 0,
            longitude: 0,
            accuracy: 0,
          });
        });
      });

      describe('uploadFile', () => {
        it('should call handler with accept parameter', async () => {
          const uploadResult = {
            path: '/path/to/file.pdf',
            name: 'file.pdf',
            mimeType: 'application/pdf',
            size: 1024,
          };
          mockCallHandler.mockResolvedValue(uploadResult);

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.uploadFile('application/pdf');

          expect(mockCallHandler).toHaveBeenCalledWith(
            'uploadFile',
            'application/pdf'
          );
          expect(result).toEqual(uploadResult);
        });
      });

      describe('scanBarcode', () => {
        it('should call handler and return result', async () => {
          const scanResult = {
            value: '1234567890',
            format: 'QR_CODE',
          };
          mockCallHandler.mockResolvedValue(scanResult);

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.scanBarcode();

          expect(mockCallHandler).toHaveBeenCalledWith('scanBarcode', undefined);
          expect(result).toEqual(scanResult);
        });
      });

      describe('getCurrentLocation', () => {
        it('should call handler and return coordinates', async () => {
          const coords = {
            latitude: -6.2,
            longitude: 106.8,
          };
          mockCallHandler.mockResolvedValue(coords);

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.getCurrentLocation();

          expect(mockCallHandler).toHaveBeenCalledWith(
            'getCurrentLocation',
            undefined
          );
          expect(result).toEqual(coords);
        });
      });

      describe('openMap', () => {
        it('should call handler with coordinates', () => {
          mockCallHandler.mockResolvedValue(undefined);

          const bridge = createFlutterInAppWebViewBridge();
          bridge.openMap({ latitude: -6.2, longitude: 106.8 });

          expect(mockCallHandler).toHaveBeenCalledWith('openMap', {
            latitude: -6.2,
            longitude: 106.8,
          });
        });
      });

      describe('saveResponse', () => {
        it('should call handler with form data', async () => {
          mockCallHandler.mockResolvedValue(undefined);

          const data = {
            response: { field1: 'value1' },
            media: {},
            remark: 'test',
            principal: {},
            reference: {},
          };

          const bridge = createFlutterInAppWebViewBridge();
          await bridge.saveResponse(data);

          expect(mockCallHandler).toHaveBeenCalledWith('saveResponse', data);
        });
      });

      describe('submitResponse', () => {
        it('should call handler with form data', async () => {
          mockCallHandler.mockResolvedValue(undefined);

          const data = {
            response: { field1: 'value1' },
            media: {},
            remark: 'test',
            principal: {},
            reference: {},
          };

          const bridge = createFlutterInAppWebViewBridge();
          await bridge.submitResponse(data);

          expect(mockCallHandler).toHaveBeenCalledWith('submitResponse', data);
        });
      });

      describe('searchOffline', () => {
        it('should call handler with search parameters', async () => {
          const searchResult = [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ];
          mockCallHandler.mockResolvedValue(searchResult);

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.searchOffline('lookup1', 'v1', [
            { field: 'name', op: 'like', value: '%test%' },
          ]);

          expect(mockCallHandler).toHaveBeenCalledWith('searchOffline', {
            lookupId: 'lookup1',
            version: 'v1',
            conditions: [{ field: 'name', op: 'like', value: '%test%' }],
          });
          expect(result).toEqual(searchResult);
        });
      });

      describe('exit', () => {
        it('should call handler', () => {
          mockCallHandler.mockResolvedValue(undefined);

          const bridge = createFlutterInAppWebViewBridge();
          bridge.exit();

          expect(mockCallHandler).toHaveBeenCalledWith('exit', undefined);
        });

        it('should call callback before exit if provided', () => {
          const callback = vi.fn();

          const bridge = createFlutterInAppWebViewBridge();
          bridge.exit(callback);

          expect(callback).toHaveBeenCalled();
        });
      });

      describe('showToast', () => {
        it('should call handler with message and duration', () => {
          mockCallHandler.mockResolvedValue(undefined);

          const bridge = createFlutterInAppWebViewBridge();
          bridge.showToast('Hello', 5000);

          expect(mockCallHandler).toHaveBeenCalledWith('showToast', {
            message: 'Hello',
            duration: 5000,
          });
        });

        it('should use default duration of 3000ms', () => {
          mockCallHandler.mockResolvedValue(undefined);

          const bridge = createFlutterInAppWebViewBridge();
          bridge.showToast('Hello');

          expect(mockCallHandler).toHaveBeenCalledWith('showToast', {
            message: 'Hello',
            duration: 3000,
          });
        });
      });

      describe('showConfirmDialog', () => {
        it('should call handler and return result', async () => {
          mockCallHandler.mockResolvedValue(true);

          const bridge = createFlutterInAppWebViewBridge();
          const result = await bridge.showConfirmDialog('Confirm', 'Are you sure?');

          expect(mockCallHandler).toHaveBeenCalledWith('showConfirmDialog', {
            title: 'Confirm',
            message: 'Are you sure?',
          });
          expect(result).toBe(true);
        });
      });

      describe('log', () => {
        it('should call handler with log data', () => {
          mockCallHandler.mockResolvedValue(undefined);

          const bridge = createFlutterInAppWebViewBridge();
          bridge.log('info', 'Test message', { key: 'value' });

          expect(mockCallHandler).toHaveBeenCalledWith('log', {
            level: 'info',
            message: 'Test message',
            data: { key: 'value' },
          });
        });
      });

      describe('timeout', () => {
        it('should timeout and return fallback', async () => {
          mockCallHandler.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 1000))
          );

          const bridge = createFlutterInAppWebViewBridge({ timeout: 50 });
          const result = await bridge.openCamera();

          expect(result).toBe('');
        }, 2000);
      });

      describe('debug mode', () => {
        it('should log when debug is enabled', async () => {
          const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
          mockCallHandler.mockResolvedValue('photo.jpg');

          const bridge = createFlutterInAppWebViewBridge({ debug: true });
          await bridge.openCamera();

          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('[Flutter InAppWebView Bridge]'),
            expect.anything()
          );

          consoleSpy.mockRestore();
        });
      });
    });
  });

  describe('Flutter Channel Bridge', () => {
    let mockPostMessage: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockPostMessage = vi.fn();
      (window as unknown as Record<string, unknown>).FormGearChannel = {
        postMessage: mockPostMessage,
      };
    });

    /**
     * Helper to simulate Flutter callback response
     */
    const simulateFlutterCallback = (result: unknown, delay = 0) => {
      mockPostMessage.mockImplementation((messageJson: string) => {
        const message = JSON.parse(messageJson);
        setTimeout(() => {
          const callback = window.__formgear_callbacks__?.[message.callbackId];
          if (callback) {
            callback(result);
          }
        }, delay);
      });
    };

    describe('createFlutterChannelBridge', () => {
      it('should create a bridge with platform "flutter"', () => {
        const bridge = createFlutterChannelBridge();

        expect(bridge.platform).toBe('flutter');
      });

      it('should report isAvailable as true when Channel is present', () => {
        const bridge = createFlutterChannelBridge();

        expect(bridge.isAvailable).toBe(true);
      });

      it('should report isAvailable as false when Channel is not present', () => {
        delete (window as unknown as Record<string, unknown>).FormGearChannel;

        const bridge = createFlutterChannelBridge();

        expect(bridge.isAvailable).toBe(false);
      });
    });

    describe('bridge methods', () => {
      describe('openCamera', () => {
        it('should send message and return result', async () => {
          simulateFlutterCallback('photo_url.jpg');

          const bridge = createFlutterChannelBridge();
          const result = await bridge.openCamera();

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"openCamera"')
          );
          expect(result).toBe('photo_url.jpg');
        });

        it('should return empty string when channel not available', async () => {
          delete (window as unknown as Record<string, unknown>).FormGearChannel;

          const bridge = createFlutterChannelBridge();
          const result = await bridge.openCamera();

          expect(result).toBe('');
        });

        it('should timeout and return fallback', async () => {
          // Don't simulate callback - let it timeout

          const bridge = createFlutterChannelBridge({ timeout: 50 });
          const result = await bridge.openCamera();

          expect(result).toBe('');
        }, 1000);
      });

      describe('openCameraWithGps', () => {
        it('should send message with needPhoto parameter', async () => {
          const gpsResult = {
            latitude: 1.23,
            longitude: 4.56,
            accuracy: 10,
            photo: 'base64data',
          };
          simulateFlutterCallback(gpsResult);

          const bridge = createFlutterChannelBridge();
          const result = await bridge.openCameraWithGps(true);

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"args":{"needPhoto":true}')
          );
          expect(result).toEqual(gpsResult);
        });
      });

      describe('uploadFile', () => {
        it('should send message with accept parameter', async () => {
          const uploadResult = {
            path: '/path/to/file.pdf',
            name: 'file.pdf',
            mimeType: 'application/pdf',
            size: 1024,
          };
          simulateFlutterCallback(uploadResult);

          const bridge = createFlutterChannelBridge();
          const result = await bridge.uploadFile('application/pdf');

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"accept":"application/pdf"')
          );
          expect(result).toEqual(uploadResult);
        });
      });

      describe('scanBarcode', () => {
        it('should send message and return result', async () => {
          const scanResult = {
            value: '1234567890',
            format: 'QR_CODE',
          };
          simulateFlutterCallback(scanResult);

          const bridge = createFlutterChannelBridge();
          const result = await bridge.scanBarcode();

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"scanBarcode"')
          );
          expect(result).toEqual(scanResult);
        });
      });

      describe('getCurrentLocation', () => {
        it('should send message and return coordinates', async () => {
          const coords = {
            latitude: -6.2,
            longitude: 106.8,
          };
          simulateFlutterCallback(coords);

          const bridge = createFlutterChannelBridge();
          const result = await bridge.getCurrentLocation();

          expect(result).toEqual(coords);
        });
      });

      describe('openMap', () => {
        it('should send message with coordinates (no response expected)', () => {
          const bridge = createFlutterChannelBridge();
          bridge.openMap({ latitude: -6.2, longitude: 106.8 });

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"openMap"')
          );
        });

        it('should not throw when channel is not available', () => {
          delete (window as unknown as Record<string, unknown>).FormGearChannel;

          const bridge = createFlutterChannelBridge();
          expect(() =>
            bridge.openMap({ latitude: -6.2, longitude: 106.8 })
          ).not.toThrow();
        });
      });

      describe('saveResponse', () => {
        it('should send message with form data', async () => {
          simulateFlutterCallback(undefined);

          const data = {
            response: { field1: 'value1' },
            media: {},
            remark: 'test',
            principal: {},
            reference: {},
          };

          const bridge = createFlutterChannelBridge();
          await bridge.saveResponse(data);

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"saveResponse"')
          );
        });
      });

      describe('submitResponse', () => {
        it('should send message with form data', async () => {
          simulateFlutterCallback(undefined);

          const data = {
            response: { field1: 'value1' },
            media: {},
            remark: 'test',
            principal: {},
            reference: {},
          };

          const bridge = createFlutterChannelBridge();
          await bridge.submitResponse(data);

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"submitResponse"')
          );
        });
      });

      describe('searchOffline', () => {
        it('should send message with search parameters', async () => {
          const searchResult = [
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ];
          simulateFlutterCallback(searchResult);

          const bridge = createFlutterChannelBridge();
          const result = await bridge.searchOffline('lookup1', 'v1', [
            { field: 'name', op: 'like', value: '%test%' },
          ]);

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"searchOffline"')
          );
          expect(result).toEqual(searchResult);
        });
      });

      describe('exit', () => {
        it('should send exit message (no response expected)', () => {
          const bridge = createFlutterChannelBridge();
          bridge.exit();

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"exit"')
          );
        });

        it('should call callback before exit if provided', () => {
          const callback = vi.fn();

          const bridge = createFlutterChannelBridge();
          bridge.exit(callback);

          expect(callback).toHaveBeenCalled();
        });
      });

      describe('showToast', () => {
        it('should send toast message (no response expected)', () => {
          const bridge = createFlutterChannelBridge();
          bridge.showToast('Hello', 5000);

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"showToast"')
          );
        });
      });

      describe('showConfirmDialog', () => {
        it('should send message and return boolean result', async () => {
          simulateFlutterCallback(true);

          const bridge = createFlutterChannelBridge();
          const result = await bridge.showConfirmDialog('Confirm', 'Are you sure?');

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"showConfirmDialog"')
          );
          expect(result).toBe(true);
        });
      });

      describe('log', () => {
        it('should send log message (no response expected)', () => {
          const bridge = createFlutterChannelBridge();
          bridge.log('info', 'Test message', { key: 'value' });

          expect(mockPostMessage).toHaveBeenCalledWith(
            expect.stringContaining('"method":"log"')
          );
        });
      });

      describe('callback cleanup', () => {
        it('should clean up callback after response', async () => {
          simulateFlutterCallback('photo.jpg');

          const bridge = createFlutterChannelBridge();
          await bridge.openCamera();

          // All callbacks should be cleaned up
          expect(Object.keys(window.__formgear_callbacks__ || {})).toHaveLength(0);
        });

        it('should clean up callback on timeout', async () => {
          // Don't simulate callback - let it timeout
          const bridge = createFlutterChannelBridge({ timeout: 50 });
          await bridge.openCamera();

          // All callbacks should be cleaned up
          expect(Object.keys(window.__formgear_callbacks__ || {})).toHaveLength(0);
        }, 1000);
      });

      describe('error handling', () => {
        it('should handle postMessage throwing error', async () => {
          const consoleErrorSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});
          mockPostMessage.mockImplementation(() => {
            throw new Error('Channel error');
          });

          const bridge = createFlutterChannelBridge();
          const result = await bridge.openCamera();

          expect(result).toBe('');
          expect(consoleErrorSpy).toHaveBeenCalled();

          consoleErrorSpy.mockRestore();
        });
      });

      describe('debug mode', () => {
        it('should log when debug is enabled', async () => {
          const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
          simulateFlutterCallback('photo.jpg');

          const bridge = createFlutterChannelBridge({ debug: true });
          await bridge.openCamera();

          expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('[Flutter Channel Bridge]'),
            expect.anything()
          );

          consoleSpy.mockRestore();
        });
      });
    });
  });

  describe('__formgear_flutter_callback__', () => {
    it('should be available on window', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(typeof (window as any).__formgear_flutter_callback__).toBe(
        'function'
      );
    });

    it('should resolve registered callbacks', () => {
      const callback = vi.fn();
      window.__formgear_callbacks__ = {
        test_callback: callback,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__formgear_flutter_callback__('test_callback', 'result');

      expect(callback).toHaveBeenCalledWith('result');
    });

    it('should not throw for unknown callback', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() =>
        (window as any).__formgear_flutter_callback__('unknown', 'result')
      ).not.toThrow();
    });
  });
});
