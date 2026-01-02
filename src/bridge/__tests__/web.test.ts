import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createWebBridge, isWebAvailable } from '../web';

describe('Web Bridge', () => {
  // Mock geolocation
  const mockGeolocation = {
    getCurrentPosition: vi.fn(),
    watchPosition: vi.fn(),
    clearWatch: vi.fn(),
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    // Clear localStorage
    localStorage.clear();

    // Setup geolocation mock
    Object.defineProperty(navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('isWebAvailable', () => {
    it('should return true when window is defined', () => {
      expect(isWebAvailable()).toBe(true);
    });
  });

  describe('createWebBridge', () => {
    it('should create a bridge with platform "web"', () => {
      const bridge = createWebBridge();

      expect(bridge.platform).toBe('web');
    });

    it('should always report isAvailable as true', () => {
      const bridge = createWebBridge();

      expect(bridge.isAvailable).toBe(true);
    });
  });

  describe('bridge methods', () => {
    describe('openCamera', () => {
      it('should create file input with camera capture', async () => {
        const createElementSpy = vi.spyOn(document, 'createElement');

        const bridge = createWebBridge();

        // Start the promise but don't await yet
        const resultPromise = bridge.openCamera();

        // Check that input was created
        expect(createElementSpy).toHaveBeenCalledWith('input');

        // Get the created input
        const input = createElementSpy.mock.results[0].value as HTMLInputElement;
        expect(input.type).toBe('file');
        expect(input.accept).toBe('image/*');
        expect(input.capture).toBe('environment');

        // Simulate cancel
        input.oncancel?.({} as Event);

        const result = await resultPromise;
        expect(result).toBe('');
      });

      it('should return base64 data URL when file is selected', async () => {
        const createElementSpy = vi.spyOn(document, 'createElement');

        // Mock FileReader using a class
        const mockResult = 'data:image/png;base64,abc123';
        class MockFileReader {
          result: string | null = null;
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;

          readAsDataURL() {
            this.result = mockResult;
            setTimeout(() => this.onload?.(), 0);
          }
        }
        vi.stubGlobal('FileReader', MockFileReader);

        const bridge = createWebBridge();
        const resultPromise = bridge.openCamera();

        // Get the created input
        const input = createElementSpy.mock.results[0].value as HTMLInputElement;

        // Simulate file selection
        const mockFile = new File(['content'], 'photo.png', {
          type: 'image/png',
        });
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });

        // Trigger onchange
        input.onchange?.({} as Event);

        const result = await resultPromise;
        expect(result).toBe(mockResult);

        vi.unstubAllGlobals();
      });

      it('should return empty string when no file is selected', async () => {
        const createElementSpy = vi.spyOn(document, 'createElement');

        const bridge = createWebBridge();
        const resultPromise = bridge.openCamera();

        // Get the created input
        const input = createElementSpy.mock.results[0].value as HTMLInputElement;

        // Simulate no file selection
        Object.defineProperty(input, 'files', {
          value: [],
          writable: false,
        });

        // Trigger onchange
        input.onchange?.({} as Event);

        const result = await resultPromise;
        expect(result).toBe('');
      });
    });

    describe('openCameraWithGps', () => {
      it('should get GPS coordinates using Geolocation API', async () => {
        const mockPosition = {
          coords: {
            latitude: -6.2,
            longitude: 106.8,
            accuracy: 10,
          },
          timestamp: 1234567890,
        };

        mockGeolocation.getCurrentPosition.mockImplementation((success) =>
          success(mockPosition)
        );

        const bridge = createWebBridge();
        const result = await bridge.openCameraWithGps(false);

        expect(result.latitude).toBe(-6.2);
        expect(result.longitude).toBe(106.8);
        expect(result.accuracy).toBe(10);
        expect(result.timestamp).toBe(1234567890);
      });

      it('should return zero coordinates when geolocation fails', async () => {
        mockGeolocation.getCurrentPosition.mockImplementation((_, error) =>
          error?.({ code: 1, message: 'Permission denied' })
        );

        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        const result = await bridge.openCameraWithGps(false);

        expect(result.latitude).toBe(0);
        expect(result.longitude).toBe(0);
        expect(result.accuracy).toBe(0);

        consoleWarnSpy.mockRestore();
      });

      it('should capture photo when needPhoto is true', async () => {
        const mockPosition = {
          coords: {
            latitude: -6.2,
            longitude: 106.8,
            accuracy: 10,
          },
          timestamp: 1234567890,
        };

        mockGeolocation.getCurrentPosition.mockImplementation((success) =>
          success(mockPosition)
        );

        const createElementSpy = vi.spyOn(document, 'createElement');

        const bridge = createWebBridge();
        const resultPromise = bridge.openCameraWithGps(true);

        // Wait a tick for the GPS promise to resolve
        await new Promise((resolve) => setTimeout(resolve, 10));

        // Then handle the file input
        const input = createElementSpy.mock.results.find(
          (r) => (r.value as HTMLElement).tagName === 'INPUT'
        )?.value as HTMLInputElement;

        if (input) {
          // Simulate cancel for quicker test
          input.oncancel?.({} as Event);
        }

        const result = await resultPromise;
        expect(result.latitude).toBe(-6.2);
        expect(result.photo).toBeDefined();
      });
    });

    describe('uploadFile', () => {
      it('should create file input with specified accept type', async () => {
        const createElementSpy = vi.spyOn(document, 'createElement');

        const bridge = createWebBridge();
        const resultPromise = bridge.uploadFile('application/pdf');

        // Get the created input
        const input = createElementSpy.mock.results[0].value as HTMLInputElement;
        expect(input.type).toBe('file');
        expect(input.accept).toBe('application/pdf');

        // Simulate cancel
        input.oncancel?.({} as Event);

        const result = await resultPromise;
        expect(result.path).toBe('');
      });

      it('should return file details when file is selected', async () => {
        const createElementSpy = vi.spyOn(document, 'createElement');

        // Mock URL.createObjectURL
        const mockObjectURL = 'blob:http://localhost/abc123';
        vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockObjectURL);

        // Mock FileReader using a class
        const mockResult = 'data:application/pdf;base64,abc123';
        class MockFileReader {
          result: string | null = null;
          onload: (() => void) | null = null;
          onerror: (() => void) | null = null;

          readAsDataURL() {
            this.result = mockResult;
            setTimeout(() => this.onload?.(), 0);
          }
        }
        vi.stubGlobal('FileReader', MockFileReader);

        const bridge = createWebBridge();
        const resultPromise = bridge.uploadFile('application/pdf');

        // Get the created input
        const input = createElementSpy.mock.results[0].value as HTMLInputElement;

        // Simulate file selection
        const mockFile = new File(['content'], 'document.pdf', {
          type: 'application/pdf',
        });
        Object.defineProperty(mockFile, 'size', { value: 1024 });
        Object.defineProperty(input, 'files', {
          value: [mockFile],
          writable: false,
        });

        // Trigger onchange
        input.onchange?.({} as Event);

        const result = await resultPromise;
        expect(result.path).toBe(mockObjectURL);
        expect(result.name).toBe('document.pdf');
        expect(result.mimeType).toBe('application/pdf');
        expect(result.base64).toBe(mockResult);

        vi.unstubAllGlobals();
      });
    });

    describe('scanBarcode', () => {
      it('should return empty result (not supported in web)', async () => {
        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        const result = await bridge.scanBarcode();

        expect(result.value).toBe('');
        expect(result.format).toBe('');
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('not supported')
        );
      });
    });

    describe('getCurrentLocation', () => {
      it('should get coordinates using Geolocation API', async () => {
        const mockPosition = {
          coords: {
            latitude: -6.2,
            longitude: 106.8,
          },
        };

        mockGeolocation.getCurrentPosition.mockImplementation((success) =>
          success(mockPosition)
        );

        const bridge = createWebBridge();
        const result = await bridge.getCurrentLocation();

        expect(result.latitude).toBe(-6.2);
        expect(result.longitude).toBe(106.8);
      });

      it('should return zero coordinates on error', async () => {
        mockGeolocation.getCurrentPosition.mockImplementation((_, error) =>
          error?.({ code: 1, message: 'Permission denied' })
        );

        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        const result = await bridge.getCurrentLocation();

        expect(result.latitude).toBe(0);
        expect(result.longitude).toBe(0);

        consoleWarnSpy.mockRestore();
      });
    });

    describe('openMap', () => {
      it('should open Google Maps in new tab', () => {
        const windowOpenSpy = vi
          .spyOn(window, 'open')
          .mockImplementation(() => null);

        const bridge = createWebBridge();
        bridge.openMap({ latitude: -6.2, longitude: 106.8 });

        expect(windowOpenSpy).toHaveBeenCalledWith(
          'https://www.google.com/maps?q=-6.2,106.8',
          '_blank'
        );
      });
    });

    describe('saveResponse', () => {
      it('should save data to localStorage', async () => {
        const data = {
          response: { field1: 'value1' },
          media: {},
          remark: 'test',
          principal: {},
          reference: {},
        };

        const bridge = createWebBridge();
        await bridge.saveResponse(data);

        const saved = localStorage.getItem('formgear_draft');
        expect(saved).toBe(JSON.stringify(data));
      });

      it('should handle localStorage errors gracefully', async () => {
        const consoleErrorSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

        const data = {
          response: {},
          media: {},
          remark: '',
          principal: {},
          reference: {},
        };

        const bridge = createWebBridge();
        await bridge.saveResponse(data);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          expect.stringContaining('Failed to save'),
          expect.any(Error)
        );
      });
    });

    describe('submitResponse', () => {
      it('should warn about web mode submission', async () => {
        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const data = {
          response: {},
          media: {},
          remark: '',
          principal: {},
          reference: {},
        };

        const bridge = createWebBridge();
        await bridge.submitResponse(data);

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('web mode')
        );
      });
    });

    describe('searchOffline', () => {
      it('should return data from localStorage if available', async () => {
        const testData = [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ];
        localStorage.setItem(
          'formgear_lookup_lookup1_v1',
          JSON.stringify(testData)
        );

        const bridge = createWebBridge();
        const result = await bridge.searchOffline('lookup1', 'v1', []);

        expect(result).toEqual(testData);
      });

      it('should return empty array when data not found', async () => {
        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        const result = await bridge.searchOffline('unknown', 'v1', []);

        expect(result).toEqual([]);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('not available')
        );
      });

      it('should return empty array when data is not an array', async () => {
        localStorage.setItem(
          'formgear_lookup_lookup1_v1',
          JSON.stringify({ notAnArray: true })
        );

        const bridge = createWebBridge();
        const result = await bridge.searchOffline('lookup1', 'v1', []);

        expect(result).toEqual([]);
      });
    });

    describe('exit', () => {
      it('should warn about web mode exit', () => {
        const consoleWarnSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        bridge.exit();

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('web mode')
        );
      });

      it('should call callback if provided', () => {
        const callback = vi.fn();

        const bridge = createWebBridge();
        bridge.exit(callback);

        expect(callback).toHaveBeenCalled();
      });
    });

    describe('showToast', () => {
      it('should use Toastify if available', () => {
        const mockToastify = vi.fn().mockReturnValue({
          showToast: vi.fn(),
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).Toastify = mockToastify;

        const bridge = createWebBridge();
        bridge.showToast('Hello', 5000);

        expect(mockToastify).toHaveBeenCalledWith({
          text: 'Hello',
          duration: 5000,
          gravity: 'bottom',
          position: 'center',
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (window as any).Toastify;
      });

      it('should fallback to console.log when Toastify is not available', () => {
        const consoleLogSpy = vi
          .spyOn(console, 'log')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        bridge.showToast('Hello');

        expect(consoleLogSpy).toHaveBeenCalledWith('[Toast] Hello');
      });
    });

    describe('showConfirmDialog', () => {
      it('should use window.confirm', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(true);

        const bridge = createWebBridge();
        const result = await bridge.showConfirmDialog('Title', 'Message');

        expect(window.confirm).toHaveBeenCalledWith('Title\n\nMessage');
        expect(result).toBe(true);
      });

      it('should return false when cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValue(false);

        const bridge = createWebBridge();
        const result = await bridge.showConfirmDialog('Title', 'Message');

        expect(result).toBe(false);
      });
    });

    describe('log', () => {
      it('should log to console.debug for debug level', () => {
        const consoleSpy = vi
          .spyOn(console, 'debug')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        bridge.log('debug', 'Debug message', { data: 'value' });

        expect(consoleSpy).toHaveBeenCalledWith(
          '[FormGear]',
          'Debug message',
          { data: 'value' }
        );
      });

      it('should log to console.info for info level', () => {
        const consoleSpy = vi
          .spyOn(console, 'info')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        bridge.log('info', 'Info message');

        expect(consoleSpy).toHaveBeenCalledWith('[FormGear]', 'Info message', '');
      });

      it('should log to console.warn for warn level', () => {
        const consoleSpy = vi
          .spyOn(console, 'warn')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        bridge.log('warn', 'Warning message');

        expect(consoleSpy).toHaveBeenCalledWith('[FormGear]', 'Warning message', '');
      });

      it('should log to console.error for error level', () => {
        const consoleSpy = vi
          .spyOn(console, 'error')
          .mockImplementation(() => {});

        const bridge = createWebBridge();
        bridge.log('error', 'Error message');

        expect(consoleSpy).toHaveBeenCalledWith('[FormGear]', 'Error message', '');
      });
    });

    describe('debug mode', () => {
      it('should log operations when debug is enabled', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const bridge = createWebBridge({ debug: true });
        bridge.openMap({ latitude: 0, longitude: 0 });

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('[Web Bridge]'),
          expect.anything()
        );
      });

      it('should not log operations when debug is disabled', () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        const bridge = createWebBridge({ debug: false });
        bridge.openMap({ latitude: 0, longitude: 0 });

        expect(consoleSpy).not.toHaveBeenCalledWith(
          expect.stringContaining('[Web Bridge]'),
          expect.anything()
        );
      });
    });
  });
});
