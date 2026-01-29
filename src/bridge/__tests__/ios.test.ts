import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createIOSBridge, isIOSAvailable } from '../ios';

describe('iOS Bridge', () => {
  const originalWebkit = window.webkit;
  const originalCallbacks = window.__formgear_callbacks__;

  beforeEach(() => {
    // Clean up webkit interface before each test
    delete (window as unknown as Record<string, unknown>).webkit;
    // Reset callback registry
    window.__formgear_callbacks__ = {};
  });

  afterEach(() => {
    // Restore original webkit interface
    if (originalWebkit) {
      (window as unknown as Record<string, unknown>).webkit = originalWebkit;
    }
    if (originalCallbacks) {
      window.__formgear_callbacks__ = originalCallbacks;
    }
    vi.restoreAllMocks();
  });

  describe('isIOSAvailable', () => {
    it('should return false when webkit is not present', () => {
      expect(isIOSAvailable()).toBe(false);
    });

    it('should return false when webkit exists but no messageHandlers', () => {
      (window as unknown as Record<string, unknown>).webkit = {};

      expect(isIOSAvailable()).toBe(false);
    });

    it('should return false when messageHandlers exist but no FormGearHandler', () => {
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {},
      };

      expect(isIOSAvailable()).toBe(false);
    });

    it('should return true when FormGearHandler is present', () => {
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: vi.fn(),
          },
        },
      };

      expect(isIOSAvailable()).toBe(true);
    });
  });

  describe('createIOSBridge', () => {
    it('should create a bridge with platform "ios"', () => {
      const bridge = createIOSBridge();

      expect(bridge.platform).toBe('ios');
    });

    it('should report isAvailable as false when FormGearHandler is not present', () => {
      const bridge = createIOSBridge();

      expect(bridge.isAvailable).toBe(false);
    });

    it('should report isAvailable as true when FormGearHandler is present', () => {
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: vi.fn(),
          },
        },
      };

      const bridge = createIOSBridge();

      expect(bridge.isAvailable).toBe(true);
    });
  });

  describe('bridge methods with async callbacks', () => {
    let mockPostMessage: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockPostMessage = vi.fn();
      (window as unknown as Record<string, unknown>).webkit = {
        messageHandlers: {
          FormGearHandler: {
            postMessage: mockPostMessage,
          },
        },
      };
    });

    /**
     * Helper to simulate iOS callback response
     */
    const simulateIOSCallback = (result: unknown, delay = 0) => {
      mockPostMessage.mockImplementation((message: { callbackId: string }) => {
        setTimeout(() => {
          const callback = window.__formgear_callbacks__?.[message.callbackId];
          if (callback) {
            callback(result);
          }
        }, delay);
      });
    };

    describe('openCamera', () => {
      it('should send message to iOS and return result', async () => {
        simulateIOSCallback('photo_url.jpg');

        const bridge = createIOSBridge();
        const resultPromise = bridge.openCamera();

        // Wait for callback
        const result = await resultPromise;

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'openCamera',
            callbackId: expect.any(String),
          })
        );
        expect(result).toBe('photo_url.jpg');
      });

      it('should return empty string when handler is not available', async () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        const result = await bridge.openCamera();

        expect(result).toBe('');
      });

      it('should timeout and return empty string on no response', async () => {
        const bridge = createIOSBridge({ timeout: 50 });
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
        simulateIOSCallback(gpsResult);

        const bridge = createIOSBridge();
        const result = await bridge.openCameraWithGps(true);

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'openCameraWithGps',
            data: { needPhoto: true },
          })
        );
        expect(result).toEqual(gpsResult);
      });

      it('should return default GPS result on error', async () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        const result = await bridge.openCameraWithGps(false);

        expect(result).toEqual({
          latitude: 0,
          longitude: 0,
          accuracy: 0,
        });
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
        simulateIOSCallback(uploadResult);

        const bridge = createIOSBridge();
        const result = await bridge.uploadFile('application/pdf');

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'uploadFile',
            data: { accept: 'application/pdf' },
          })
        );
        expect(result).toEqual(uploadResult);
      });

      it('should return default upload result on error', async () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        const result = await bridge.uploadFile('image/*');

        expect(result).toEqual({
          path: '',
          name: '',
          mimeType: '',
          size: 0,
        });
      });
    });

    describe('scanBarcode', () => {
      it('should send message and return scan result', async () => {
        const scanResult = {
          value: '1234567890',
          format: 'QR_CODE',
        };
        simulateIOSCallback(scanResult);

        const bridge = createIOSBridge();
        const result = await bridge.scanBarcode();

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'scanBarcode',
          })
        );
        expect(result).toEqual(scanResult);
      });

      it('should return default scan result on error', async () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        const result = await bridge.scanBarcode();

        expect(result).toEqual({
          value: '',
          format: '',
        });
      });
    });

    describe('getCurrentLocation', () => {
      it('should send message and return coordinates', async () => {
        const coords = {
          latitude: -6.2,
          longitude: 106.8,
        };
        simulateIOSCallback(coords);

        const bridge = createIOSBridge();
        const result = await bridge.getCurrentLocation();

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'getCurrentLocation',
          })
        );
        expect(result).toEqual(coords);
      });

      it('should return default coordinates on error', async () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        const result = await bridge.getCurrentLocation();

        expect(result).toEqual({
          latitude: 0,
          longitude: 0,
        });
      });
    });

    describe('openMap', () => {
      it('should send message with coordinates (no response expected)', () => {
        const bridge = createIOSBridge();
        bridge.openMap({ latitude: -6.2, longitude: 106.8 });

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'openMap',
            callbackId: '', // Empty for no-response messages
            data: { latitude: -6.2, longitude: 106.8 },
          })
        );
      });

      it('should not throw when handler is not available', () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        expect(() =>
          bridge.openMap({ latitude: -6.2, longitude: 106.8 })
        ).not.toThrow();
      });
    });

    describe('saveResponse', () => {
      it('should send message with form data', async () => {
        simulateIOSCallback(undefined);

        const data = {
          response: { field1: 'value1' },
          media: {},
          remark: 'test',
          principal: {},
          reference: {},
        };

        const bridge = createIOSBridge();
        await bridge.saveResponse(data);

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'saveResponse',
            data,
          })
        );
      });
    });

    describe('submitResponse', () => {
      it('should send message with form data', async () => {
        simulateIOSCallback(undefined);

        const data = {
          response: { field1: 'value1' },
          media: {},
          remark: 'test',
          principal: {},
          reference: {},
        };

        const bridge = createIOSBridge();
        await bridge.submitResponse(data);

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'submitResponse',
            data,
          })
        );
      });
    });

    describe('searchOffline', () => {
      it('should send message with search parameters', async () => {
        const searchResult = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ];
        simulateIOSCallback(searchResult);

        const bridge = createIOSBridge();
        const result = await bridge.searchOffline('lookup1', 'v1', [
          { field: 'name', op: 'like', value: '%test%' },
        ]);

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'searchOffline',
            data: {
              lookupId: 'lookup1',
              version: 'v1',
              conditions: [{ field: 'name', op: 'like', value: '%test%' }],
            },
          })
        );
        expect(result).toEqual(searchResult);
      });

      it('should return empty array on error', async () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        const result = await bridge.searchOffline('lookup1', 'v1', []);

        expect(result).toEqual([]);
      });
    });

    describe('exit', () => {
      it('should send exit message (no response expected)', () => {
        const bridge = createIOSBridge();
        bridge.exit();

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'exit',
            callbackId: '',
          })
        );
      });

      it('should call callback before exit if provided', () => {
        const callback = vi.fn();

        const bridge = createIOSBridge();
        bridge.exit(callback);

        expect(callback).toHaveBeenCalled();
        expect(mockPostMessage).toHaveBeenCalled();
      });
    });

    describe('showToast', () => {
      it('should send toast message with message and duration', () => {
        const bridge = createIOSBridge();
        bridge.showToast('Hello', 5000);

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'showToast',
            data: { message: 'Hello', duration: 5000 },
          })
        );
      });

      it('should use default duration of 3000ms', () => {
        const bridge = createIOSBridge();
        bridge.showToast('Hello');

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'showToast',
            data: { message: 'Hello', duration: 3000 },
          })
        );
      });
    });

    describe('showConfirmDialog', () => {
      it('should send message and return boolean result', async () => {
        simulateIOSCallback(true);

        const bridge = createIOSBridge();
        const result = await bridge.showConfirmDialog('Confirm', 'Are you sure?');

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'showConfirmDialog',
            data: { title: 'Confirm', message: 'Are you sure?' },
          })
        );
        expect(result).toBe(true);
      });

      it('should return false on error', async () => {
        delete (window as unknown as Record<string, unknown>).webkit;

        const bridge = createIOSBridge();
        const result = await bridge.showConfirmDialog('Confirm', 'Are you sure?');

        expect(result).toBe(false);
      });
    });

    describe('log', () => {
      it('should send log message (no response expected)', () => {
        const bridge = createIOSBridge();
        bridge.log('info', 'Test message', { key: 'value' });

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'log',
            data: { level: 'info', message: 'Test message', data: { key: 'value' } },
          })
        );
      });

      it('should send log message without data', () => {
        const bridge = createIOSBridge();
        bridge.log('error', 'Error message');

        expect(mockPostMessage).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'log',
            data: { level: 'error', message: 'Error message', data: undefined },
          })
        );
      });
    });

    describe('debug mode', () => {
      it('should log when debug is enabled', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        simulateIOSCallback('photo.jpg');

        const bridge = createIOSBridge({ debug: true });
        await bridge.openCamera();

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[iOS Bridge]'),
          expect.anything()
        );

        consoleSpy.mockRestore();
      });
    });

    describe('callback cleanup', () => {
      it('should clean up callback after response', async () => {
        simulateIOSCallback('photo.jpg');

        const bridge = createIOSBridge();
        await bridge.openCamera();

        // All callbacks should be cleaned up
        expect(Object.keys(window.__formgear_callbacks__ || {})).toHaveLength(0);
      });

      it('should clean up callback on timeout', async () => {
        // Don't simulate callback - let it timeout
        const bridge = createIOSBridge({ timeout: 50 });
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
          throw new Error('iOS error');
        });

        const bridge = createIOSBridge();
        const result = await bridge.openCamera();

        expect(result).toBe('');
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('__formgear_resolve_callback__', () => {
    it('should be available on window', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(typeof (window as any).__formgear_resolve_callback__).toBe(
        'function'
      );
    });

    it('should resolve registered callbacks', () => {
      const callback = vi.fn();
      window.__formgear_callbacks__ = {
        test_callback: callback,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).__formgear_resolve_callback__('test_callback', 'result');

      expect(callback).toHaveBeenCalledWith('result');
    });

    it('should not throw for unknown callback', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() =>
        (window as any).__formgear_resolve_callback__('unknown', 'result')
      ).not.toThrow();
    });
  });
});
