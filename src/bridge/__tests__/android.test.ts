import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAndroidBridge, isAndroidAvailable } from '../android';

describe('Android Bridge', () => {
  const originalAndroid = window.Android;

  beforeEach(() => {
    // Clean up Android interface before each test
    delete (window as unknown as Record<string, unknown>).Android;
  });

  afterEach(() => {
    // Restore original Android interface
    if (originalAndroid) {
      (window as unknown as Record<string, unknown>).Android = originalAndroid;
    }
    vi.restoreAllMocks();
  });

  describe('isAndroidAvailable', () => {
    it('should return false when Android interface is not present', () => {
      expect(isAndroidAvailable()).toBe(false);
    });

    it('should return true when Android interface is present', () => {
      (window as unknown as Record<string, unknown>).Android = {};

      expect(isAndroidAvailable()).toBe(true);
    });
  });

  describe('createAndroidBridge', () => {
    it('should create a bridge with platform "android"', () => {
      const bridge = createAndroidBridge();

      expect(bridge.platform).toBe('android');
    });

    it('should report isAvailable as false when Android is not present', () => {
      const bridge = createAndroidBridge();

      expect(bridge.isAvailable).toBe(false);
    });

    it('should report isAvailable as true when Android is present', () => {
      (window as unknown as Record<string, unknown>).Android = {};

      const bridge = createAndroidBridge();

      expect(bridge.isAvailable).toBe(true);
    });
  });

  describe('bridge methods', () => {
    let mockAndroid: Record<string, ReturnType<typeof vi.fn>>;

    beforeEach(() => {
      mockAndroid = {
        openCamera: vi.fn(),
        openCameraWithGps: vi.fn(),
        uploadFile: vi.fn(),
        scanBarcode: vi.fn(),
        getCurrentLocation: vi.fn(),
        openMap: vi.fn(),
        saveResponse: vi.fn(),
        submitResponse: vi.fn(),
        searchOffline: vi.fn(),
        exit: vi.fn(),
        showToast: vi.fn(),
        showConfirmDialog: vi.fn(),
        log: vi.fn(),
      };
      (window as unknown as Record<string, unknown>).Android = mockAndroid;
    });

    describe('openCamera', () => {
      it('should call Android.openCamera and return result', async () => {
        mockAndroid.openCamera.mockReturnValue('photo_url.jpg');

        const bridge = createAndroidBridge();
        const result = await bridge.openCamera();

        expect(mockAndroid.openCamera).toHaveBeenCalled();
        expect(result).toBe('photo_url.jpg');
      });

      it('should return empty string when Android is not available', async () => {
        delete (window as unknown as Record<string, unknown>).Android;

        const bridge = createAndroidBridge();
        const result = await bridge.openCamera();

        expect(result).toBe('');
      });

      it('should return empty string when method throws', async () => {
        mockAndroid.openCamera.mockImplementation(() => {
          throw new Error('Camera error');
        });

        const bridge = createAndroidBridge();
        const result = await bridge.openCamera();

        expect(result).toBe('');
      });
    });

    describe('openCameraWithGps', () => {
      it('should call Android.openCameraWithGps with needPhoto parameter', async () => {
        mockAndroid.openCameraWithGps.mockReturnValue(
          JSON.stringify({
            latitude: 1.23,
            longitude: 4.56,
            accuracy: 10,
            photo: 'base64data',
          })
        );

        const bridge = createAndroidBridge();
        const result = await bridge.openCameraWithGps(true);

        expect(mockAndroid.openCameraWithGps).toHaveBeenCalledWith(true);
        expect(result).toEqual({
          latitude: 1.23,
          longitude: 4.56,
          accuracy: 10,
          photo: 'base64data',
        });
      });

      it('should return default GPS result on error', async () => {
        mockAndroid.openCameraWithGps.mockReturnValue('invalid json');

        const bridge = createAndroidBridge();
        const result = await bridge.openCameraWithGps(false);

        expect(result).toEqual({
          latitude: 0,
          longitude: 0,
          accuracy: 0,
        });
      });
    });

    describe('uploadFile', () => {
      it('should call Android.uploadFile with accept parameter', async () => {
        mockAndroid.uploadFile.mockReturnValue(
          JSON.stringify({
            path: '/path/to/file.pdf',
            name: 'file.pdf',
            mimeType: 'application/pdf',
            size: 1024,
          })
        );

        const bridge = createAndroidBridge();
        const result = await bridge.uploadFile('application/pdf');

        expect(mockAndroid.uploadFile).toHaveBeenCalledWith('application/pdf');
        expect(result).toEqual({
          path: '/path/to/file.pdf',
          name: 'file.pdf',
          mimeType: 'application/pdf',
          size: 1024,
        });
      });

      it('should return default upload result on error', async () => {
        mockAndroid.uploadFile.mockReturnValue('');

        const bridge = createAndroidBridge();
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
      it('should call Android.scanBarcode and parse result', async () => {
        mockAndroid.scanBarcode.mockReturnValue(
          JSON.stringify({
            value: '1234567890',
            format: 'QR_CODE',
          })
        );

        const bridge = createAndroidBridge();
        const result = await bridge.scanBarcode();

        expect(mockAndroid.scanBarcode).toHaveBeenCalled();
        expect(result).toEqual({
          value: '1234567890',
          format: 'QR_CODE',
        });
      });

      it('should return default scan result on error', async () => {
        mockAndroid.scanBarcode.mockReturnValue(null);

        const bridge = createAndroidBridge();
        const result = await bridge.scanBarcode();

        expect(result).toEqual({
          value: '',
          format: '',
        });
      });
    });

    describe('getCurrentLocation', () => {
      it('should call Android.getCurrentLocation and parse result', async () => {
        mockAndroid.getCurrentLocation.mockReturnValue(
          JSON.stringify({
            latitude: -6.2,
            longitude: 106.8,
          })
        );

        const bridge = createAndroidBridge();
        const result = await bridge.getCurrentLocation();

        expect(mockAndroid.getCurrentLocation).toHaveBeenCalled();
        expect(result).toEqual({
          latitude: -6.2,
          longitude: 106.8,
        });
      });

      it('should return default coordinates on error', async () => {
        mockAndroid.getCurrentLocation.mockReturnValue('');

        const bridge = createAndroidBridge();
        const result = await bridge.getCurrentLocation();

        expect(result).toEqual({
          latitude: 0,
          longitude: 0,
        });
      });
    });

    describe('openMap', () => {
      it('should call Android.openMap with coordinates', () => {
        const bridge = createAndroidBridge();
        bridge.openMap({ latitude: -6.2, longitude: 106.8 });

        expect(mockAndroid.openMap).toHaveBeenCalledWith(-6.2, 106.8);
      });
    });

    describe('saveResponse', () => {
      it('should call Android.saveResponse with JSON data', async () => {
        const data = {
          response: { field1: 'value1' },
          media: {},
          remark: 'test',
          principal: {},
          reference: {},
        };

        const bridge = createAndroidBridge();
        await bridge.saveResponse(data);

        expect(mockAndroid.saveResponse).toHaveBeenCalledWith(
          JSON.stringify(data)
        );
      });
    });

    describe('submitResponse', () => {
      it('should call Android.submitResponse with JSON data', async () => {
        const data = {
          response: { field1: 'value1' },
          media: {},
          remark: 'test',
          principal: {},
          reference: {},
        };

        const bridge = createAndroidBridge();
        await bridge.submitResponse(data);

        expect(mockAndroid.submitResponse).toHaveBeenCalledWith(
          JSON.stringify(data)
        );
      });
    });

    describe('searchOffline', () => {
      it('should call Android.searchOffline with parameters', async () => {
        mockAndroid.searchOffline.mockReturnValue(
          JSON.stringify([
            { id: 1, name: 'Item 1' },
            { id: 2, name: 'Item 2' },
          ])
        );

        const bridge = createAndroidBridge();
        const result = await bridge.searchOffline('lookup1', 'v1', [
          { field: 'name', op: 'like', value: '%test%' },
        ]);

        expect(mockAndroid.searchOffline).toHaveBeenCalledWith(
          'lookup1',
          'v1',
          JSON.stringify([{ field: 'name', op: 'like', value: '%test%' }])
        );
        expect(result).toEqual([
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ]);
      });

      it('should return empty array on error', async () => {
        mockAndroid.searchOffline.mockReturnValue('invalid');

        const bridge = createAndroidBridge();
        const result = await bridge.searchOffline('lookup1', 'v1', []);

        expect(result).toEqual([]);
      });
    });

    describe('exit', () => {
      it('should call Android.exit', () => {
        const bridge = createAndroidBridge();
        bridge.exit();

        expect(mockAndroid.exit).toHaveBeenCalled();
      });

      it('should call callback before exit if provided', () => {
        const callback = vi.fn();

        const bridge = createAndroidBridge();
        bridge.exit(callback);

        expect(callback).toHaveBeenCalled();
        expect(mockAndroid.exit).toHaveBeenCalled();
      });
    });

    describe('showToast', () => {
      it('should call Android.showToast with message and duration', () => {
        const bridge = createAndroidBridge();
        bridge.showToast('Hello', 5000);

        expect(mockAndroid.showToast).toHaveBeenCalledWith('Hello', 5000);
      });

      it('should use default duration of 3000ms', () => {
        const bridge = createAndroidBridge();
        bridge.showToast('Hello');

        expect(mockAndroid.showToast).toHaveBeenCalledWith('Hello', 3000);
      });
    });

    describe('showConfirmDialog', () => {
      it('should call Android.showConfirmDialog and return result', async () => {
        mockAndroid.showConfirmDialog.mockReturnValue(true);

        const bridge = createAndroidBridge();
        const result = await bridge.showConfirmDialog('Confirm', 'Are you sure?');

        expect(mockAndroid.showConfirmDialog).toHaveBeenCalledWith(
          'Confirm',
          'Are you sure?'
        );
        expect(result).toBe(true);
      });

      it('should return false when dialog is cancelled', async () => {
        mockAndroid.showConfirmDialog.mockReturnValue(false);

        const bridge = createAndroidBridge();
        const result = await bridge.showConfirmDialog('Confirm', 'Are you sure?');

        expect(result).toBe(false);
      });
    });

    describe('log', () => {
      it('should call Android.log with level, message, and data', () => {
        const bridge = createAndroidBridge();
        bridge.log('info', 'Test message', { key: 'value' });

        expect(mockAndroid.log).toHaveBeenCalledWith(
          'info',
          'Test message',
          JSON.stringify({ key: 'value' })
        );
      });

      it('should pass empty string when data is undefined', () => {
        const bridge = createAndroidBridge();
        bridge.log('error', 'Error message');

        expect(mockAndroid.log).toHaveBeenCalledWith(
          'error',
          'Error message',
          ''
        );
      });
    });

    describe('debug mode', () => {
      it('should log when debug is enabled', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        mockAndroid.openCamera.mockReturnValue('photo.jpg');

        const bridge = createAndroidBridge({ debug: true });
        await bridge.openCamera();

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Android Bridge]'),
          expect.anything()
        );

        consoleSpy.mockRestore();
      });

      it('should not log when debug is disabled', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
        mockAndroid.openCamera.mockReturnValue('photo.jpg');

        const bridge = createAndroidBridge({ debug: false });
        await bridge.openCamera();

        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('[Android Bridge]'),
          expect.anything()
        );

        consoleSpy.mockRestore();
      });
    });

    describe('error handling', () => {
      it('should handle missing method gracefully', async () => {
        (window as unknown as Record<string, unknown>).Android = {};

        const bridge = createAndroidBridge();
        const result = await bridge.openCamera();

        expect(result).toBe('');
      });

      it('should handle method throwing error', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        mockAndroid.openCamera.mockImplementation(() => {
          throw new Error('Native error');
        });

        const bridge = createAndroidBridge();
        const result = await bridge.openCamera();

        expect(result).toBe('');
        expect(consoleErrorSpy).toHaveBeenCalled();

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
