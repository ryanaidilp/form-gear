/**
 * Web Browser Bridge
 *
 * Fallback implementation of NativeBridge for standard web browsers.
 * Uses Web APIs where available, or provides no-op implementations.
 *
 * This bridge is used when FormGear runs in a regular browser without
 * a native app wrapper (Android/iOS/Flutter).
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
 * Creates a web browser fallback bridge.
 *
 * @param config - Optional bridge configuration
 * @returns NativeBridge implementation for web browsers
 */
export function createWebBridge(config: BridgeConfig = {}): NativeBridge {
  const { debug = false } = config;

  const log = (message: string, data?: unknown) => {
    if (debug) {
      console.log(`[Web Bridge] ${message}`, data ?? '');
    }
  };

  const bridge: NativeBridge = {
    platform: 'web',

    get isAvailable(): boolean {
      return true; // Web bridge is always available as fallback
    },

    // =========================================================================
    // Camera & Media
    // =========================================================================

    async openCamera(): Promise<string> {
      log('openCamera called');

      // Try to use file input with camera capture
      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Use back camera

        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result as string);
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          } else {
            resolve('');
          }
        };

        input.oncancel = () => resolve('');
        input.click();
      });
    },

    async openCameraWithGps(needPhoto: boolean): Promise<GpsPhotoResult> {
      log('openCameraWithGps called', { needPhoto });

      const result: GpsPhotoResult = {
        latitude: 0,
        longitude: 0,
        accuracy: 0,
        timestamp: Date.now(),
      };

      // Get GPS coordinates using Geolocation API
      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocation not supported'));
              return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 30000,
              maximumAge: 0,
            });
          }
        );

        result.latitude = position.coords.latitude;
        result.longitude = position.coords.longitude;
        result.accuracy = position.coords.accuracy;
        result.timestamp = position.timestamp;
      } catch (error) {
        console.warn('[Web Bridge] Geolocation error:', error);
      }

      // Capture photo if needed
      if (needPhoto) {
        const photo = await this.openCamera();
        result.photo = photo;
      }

      return result;
    },

    async uploadFile(accept: string): Promise<UploadResult> {
      log('uploadFile called', { accept });

      return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;

        input.onchange = () => {
          const file = input.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                path: URL.createObjectURL(file),
                name: file.name,
                mimeType: file.type,
                size: file.size,
                base64: reader.result as string,
              });
            };
            reader.onerror = () => {
              resolve({
                path: '',
                name: '',
                mimeType: '',
                size: 0,
              });
            };
            reader.readAsDataURL(file);
          } else {
            resolve({
              path: '',
              name: '',
              mimeType: '',
              size: 0,
            });
          }
        };

        input.oncancel = () => {
          resolve({
            path: '',
            name: '',
            mimeType: '',
            size: 0,
          });
        };

        input.click();
      });
    },

    async scanBarcode(): Promise<ScanResult> {
      log('scanBarcode called');

      // BarcodeDetector API (experimental, limited browser support)
      if ('BarcodeDetector' in window) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const BarcodeDetector = (window as any).BarcodeDetector;
          const detector = new BarcodeDetector();

          // Would need video stream setup for real implementation
          console.warn(
            '[Web Bridge] BarcodeDetector available but video stream not implemented'
          );
        } catch {
          // Ignore errors
        }
      }

      // Fallback: not supported
      console.warn('[Web Bridge] Barcode scanning not supported in web browser');
      return { value: '', format: '' };
    },

    // =========================================================================
    // Location
    // =========================================================================

    async getCurrentLocation(): Promise<Coordinates> {
      log('getCurrentLocation called');

      try {
        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error('Geolocation not supported'));
              return;
            }
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 30000,
              maximumAge: 0,
            });
          }
        );

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (error) {
        console.warn('[Web Bridge] Geolocation error:', error);
        return { latitude: 0, longitude: 0 };
      }
    },

    openMap(coordinates: Coordinates): void {
      log('openMap called', coordinates);

      // Open Google Maps in new tab
      const url = `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`;
      window.open(url, '_blank');
    },

    // =========================================================================
    // Data Persistence
    // =========================================================================

    async saveResponse(data: FormGearOutput): Promise<void> {
      log('saveResponse called', data);

      // Store in localStorage as fallback
      try {
        localStorage.setItem('formgear_draft', JSON.stringify(data));
        log('Response saved to localStorage');
      } catch (error) {
        console.error('[Web Bridge] Failed to save to localStorage:', error);
      }
    },

    async submitResponse(data: FormGearOutput): Promise<void> {
      log('submitResponse called', data);

      // In web mode, submission typically goes through the callbacks
      // provided to createFormGear(). This is a no-op placeholder.
      console.warn(
        '[Web Bridge] submitResponse called in web mode. Use callbacks for submission.'
      );
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

      // Try to load from localStorage
      try {
        const key = `formgear_lookup_${lookupId}_${version}`;
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          // Basic filtering - would need proper implementation
          return Array.isArray(parsed) ? parsed : [];
        }
      } catch {
        // Ignore errors
      }

      console.warn('[Web Bridge] Offline search not available in web mode');
      return [];
    },

    // =========================================================================
    // Lifecycle
    // =========================================================================

    exit(callback?: () => void): void {
      log('exit called');

      if (callback) {
        callback();
      }

      // In web mode, we can't really "exit" - just warn
      console.warn('[Web Bridge] exit() called in web mode - no action taken');
    },

    showToast(message: string, duration = 3000): void {
      log('showToast called', { message, duration });

      // Try to use Toastify if available (FormGear includes it)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Toastify = (window as any).Toastify;
      if (Toastify) {
        Toastify({
          text: message,
          duration,
          gravity: 'bottom',
          position: 'center',
        }).showToast();
        return;
      }

      // Fallback to console
      console.log(`[Toast] ${message}`);
    },

    async showConfirmDialog(title: string, message: string): Promise<boolean> {
      log('showConfirmDialog called', { title, message });

      // Use native browser confirm
      return window.confirm(`${title}\n\n${message}`);
    },

    // =========================================================================
    // Logging
    // =========================================================================

    log(
      level: 'debug' | 'info' | 'warn' | 'error',
      message: string,
      data?: unknown
    ): void {
      const prefix = '[FormGear]';
      switch (level) {
        case 'debug':
          console.debug(prefix, message, data ?? '');
          break;
        case 'info':
          console.info(prefix, message, data ?? '');
          break;
        case 'warn':
          console.warn(prefix, message, data ?? '');
          break;
        case 'error':
          console.error(prefix, message, data ?? '');
          break;
      }
    },
  };

  return bridge;
}

/**
 * Web bridge is always available.
 */
export function isWebAvailable(): boolean {
  return typeof window !== 'undefined';
}
