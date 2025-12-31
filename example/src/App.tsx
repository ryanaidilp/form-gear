import { createSignal, onMount } from 'solid-js';
import {
  createFormGear,
  ClientMode,
  FormMode,
  InitialMode,
  LookupMode,
} from 'form-gear';

// Import JSON data
import referenceData from './data/reference.json';
import templateData from './data/template.json';
import presetData from './data/preset.json';
import responseData from './data/response.json';
import validationData from './data/validation.json';
import mediaData from './data/media.json';
import remarkData from './data/remark.json';

function App() {
  const [isLoading, setIsLoading] = createSignal(true);

  // Store form responses
  let responseGear: any = null;
  let mediaGear: any = null;
  let remarkGear: any = null;
  let principalGear: any = null;
  let referenceGear: any = null;

  // =============================================================================
  // HANDLERS
  // =============================================================================

  /**
   * Upload handler - uses HTML5 file input
   */
  const uploadHandler = (setValue: (value: string) => void) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setValue(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };

    input.click();
  };

  /**
   * GPS handler - uses HTML5 Geolocation API
   */
  const gpsHandler = (
    setter: (result: any, remark: string) => void,
    needPhoto = false
  ) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const result = {
            coordinat: {
              lat: position.coords.latitude,
              long: position.coords.longitude,
            },
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            remark: `Accuracy: ${position.coords.accuracy.toFixed(2)}m`,
          };
          setter(result, result.remark);
        },
        (error) => {
          console.error('Geolocation error:', error);
          // Mock data for testing
          const mockResult = {
            coordinat: { long: 106.8924928, lat: -6.2488576 },
            latitude: -6.2488576,
            longitude: 106.8924928,
            accuracy: 17.88,
            remark: 'Mock GPS data (geolocation denied)',
          };
          setter(mockResult, mockResult.remark);
        }
      );
    }
  };

  /**
   * Offline search handler
   */
  const offlineSearch = (
    id: string,
    version: string,
    dataJson: any,
    setter: (data: any) => void
  ) => {
    console.log('Offline search:', id, version, dataJson);
    // In a real app, this would query local SQLite or IndexedDB
    setter([]);
  };

  /**
   * Online search handler
   */
  const onlineSearch = async (url: string) => {
    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        return await res.json();
      }
      return { success: false, data: {}, message: res.status.toString() };
    } catch (error) {
      return { success: false, data: {}, message: '500' };
    }
  };

  /**
   * Exit handler
   */
  const exitHandler = (callback?: () => void) => {
    if (callback) callback();
  };

  /**
   * Open map handler
   */
  const openMap = (koordinat: { lat?: number; long?: number; latitude?: number; longitude?: number }) => {
    const lat = koordinat.lat || koordinat.latitude;
    const lng = koordinat.long || koordinat.longitude;
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  /**
   * Save response handler
   */
  const onSave = (res: any, med: any, rem: any, princ: any, ref: any) => {
    responseGear = res;
    mediaGear = med;
    remarkGear = rem;
    principalGear = princ;
    referenceGear = ref;

    console.log('=== SAVE ===');
    console.log('Response:', responseGear);
    console.log('Media:', mediaGear);
    console.log('Remark:', remarkGear);

    // Save to localStorage
    localStorage.setItem('formGear_response', JSON.stringify(responseGear));
  };

  /**
   * Submit response handler
   */
  const onSubmit = (res: any, med: any, rem: any, princ: any, ref: any) => {
    responseGear = res;
    mediaGear = med;
    remarkGear = rem;
    principalGear = princ;
    referenceGear = ref;

    console.log('=== SUBMIT ===');
    console.log('Response:', responseGear);
    console.log('Media:', mediaGear);
    console.log('Remark:', remarkGear);

    alert('Form submitted! Check console for data.');
  };

  // =============================================================================
  // INITIALIZE FORM
  // =============================================================================

  onMount(() => {
    const form = createFormGear({
      data: {
        reference: referenceData,
        template: templateData,
        preset: presetData,
        response: responseData,
        validation: validationData,
        media: mediaData,
        remark: remarkData,
      },
      config: {
        clientMode: ClientMode.CAWI,
        formMode: FormMode.OPEN,
        initialMode: InitialMode.ASSIGN,
        lookupMode: LookupMode.ONLINE,
        username: 'demo-user',
      },
      mobileHandlers: {
        uploadHandler,
        gpsHandler,
        offlineSearch,
        onlineSearch,
        exitHandler,
        openMap,
      },
      callbacks: {
        onSave,
        onSubmit,
      },
    });

    console.log('FormGear 2.0 initialized');
    setIsLoading(false);

    // Expose for debugging
    (window as any).formGear = form;
  });

  return (
    <>
      {/* Loading Skeleton */}
      <div
        id="FormGear-loader"
        class="bg-gray-200 dark:bg-[#181f30] h-screen"
        style={{ display: isLoading() ? 'block' : 'none' }}
      >
        <div class="overflow-hidden">
          <div class="bg-gray-50 dark:bg-gray-900 dark:text-white h-screen shadow-xl text-gray-600 flex overflow-hidden text-sm font-montserrat rounded-lg dark:shadow-gray-800">
            <div class="flex-grow flex flex-col bg-white dark:bg-gray-900 z-0">
              <div class="relative md:flex max-h-screen">
                <div class="block">
                  <div class="backdrop-blur-sm col-span-12 overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none flex justify-center items-center">
                    <svg
                      class="w-20 h-20 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 94.53 98.372"
                    >
                      <circle cx="23.536" cy="16.331" r="8.646" style={{ fill: '#0a77e8' }} />
                      <circle cx="8.646" cy="36.698" r="8.646" style={{ fill: '#0f9af0' }} />
                      <circle cx="8.646" cy="61.867" r="8.646" style={{ fill: '#0f9af0' }} />
                      <circle cx="23.536" cy="82.233" r="8.646" style={{ fill: '#13bdf7' }} />
                      <circle cx="47.361" cy="89.726" r="8.646" style={{ fill: '#13bdf7' }} />
                      <circle cx="71.282" cy="82.233" r="8.646" style={{ fill: '#18e0ff' }} />
                      <circle cx="85.884" cy="61.867" r="8.646" style={{ fill: '#65eaff' }} />
                      <circle cx="85.884" cy="36.698" r="8.646" style={{ fill: '#b2f5ff' }} />
                      <circle cx="47.361" cy="8.646" r="8.646" style={{ fill: '#1d4970' }} />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FormGear Mount Point */}
      <div id="FormGear-root"></div>
    </>
  );
}

export default App;
