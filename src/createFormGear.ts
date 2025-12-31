/**
 * FormGear Modern API
 *
 * This module provides a modern, type-safe API for creating FormGear instances.
 * It wraps the legacy FormGear constructor while providing:
 * - Options object pattern instead of 16 positional parameters
 * - Full TypeScript support with enums
 * - Cleaner lifecycle management
 * - Instance methods for programmatic control
 *
 * @example
 * ```typescript
 * import { createFormGear, ClientMode, FormMode } from 'form-gear';
 *
 * const form = createFormGear({
 *   data: {
 *     template: templateJson,
 *     validation: validationJson,
 *   },
 *   config: {
 *     clientMode: ClientMode.CAWI,
 *     formMode: FormMode.OPEN,
 *   },
 *   callbacks: {
 *     onSave: (response) => console.log('Saved:', response),
 *   },
 * });
 *
 * // Later, programmatically interact
 * form.validate();
 * form.save();
 * form.destroy();
 * ```
 */

import {
  FormGearOptions,
  FormGearInstance,
  FormGearConfig,
  DEFAULT_CONFIG,
} from './types';

// Import the legacy FormGear
// eslint-disable-next-line @typescript-eslint/no-deprecated
import { FormGear as LegacyFormGear, gearVersion } from './FormGear';

// Store factory is available for future isolated store usage
// When components are migrated to context-based stores, use:
// import { createFormStores } from './stores/createStores';

// Import legacy stores for backward compatibility (used by LegacyFormGear)
import { response } from './stores/ResponseStore';
import { media } from './stores/MediaStore';
import { remark } from './stores/RemarkStore';
import { reference } from './stores/ReferenceStore';
import { summary } from './stores/SummaryStore';

/**
 * Version of the FormGear library
 */
export { gearVersion } from './FormGear';

/**
 * Creates a new FormGear instance with the modern options-based API.
 *
 * @param options - Configuration options for the form
 * @returns FormGear instance with programmatic methods
 *
 * @example
 * ```typescript
 * const form = createFormGear({
 *   data: {
 *     template: templateJson,
 *     response: existingResponse, // optional
 *   },
 *   config: {
 *     clientMode: ClientMode.CAWI,
 *     formMode: FormMode.OPEN,
 *     username: 'user123',
 *   },
 *   callbacks: {
 *     onSave: (response, media, remark, principal, ref) => {
 *       // Handle save
 *     },
 *   },
 * });
 * ```
 */
export function createFormGear(options: FormGearOptions): FormGearInstance {
  const { data, config, mobileHandlers = {}, callbacks = {} } = options;

  // Merge with defaults
  const mergedConfig: FormGearConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Convert to legacy config format (using numeric values from enums)
  const legacyConfig = {
    clientMode: mergedConfig.clientMode,
    formMode: mergedConfig.formMode,
    initialMode: mergedConfig.initialMode,
    lookupMode: mergedConfig.lookupMode,
    username: mergedConfig.username || '',
    token: mergedConfig.token || '',
    baseUrl: mergedConfig.baseUrl || '',
    lookupKey: mergedConfig.lookupKey || 'keys',
    lookupValue: mergedConfig.lookupValue || 'values',
  };

  // Extract data with defaults
  const referenceData = data.reference || {};
  const templateData = data.template || {};
  const presetData = data.preset || {};
  const responseData = data.response || {};
  const validationData = data.validation || {};
  const mediaData = data.media || {};
  const remarkData = data.remark || {};

  // Extract handlers with defaults
  const uploadHandler = mobileHandlers.uploadHandler || (() => {});
  const gpsHandler = mobileHandlers.gpsHandler || (() => {});
  const offlineSearch = mobileHandlers.offlineSearch || (() => {});
  const onlineSearch = mobileHandlers.onlineSearch || (async () => ({}));
  const exitHandler = mobileHandlers.exitHandler || ((cb) => cb());
  const openMap = mobileHandlers.openMap || (() => {});

  // Create response callbacks
  const onSaveCallback = callbacks.onSave || (() => {});
  const onSubmitCallback = callbacks.onSubmit || (() => {});

  // Call the legacy FormGear constructor
  LegacyFormGear(
    referenceData,
    templateData,
    presetData,
    responseData,
    validationData,
    mediaData,
    remarkData,
    legacyConfig,
    uploadHandler,
    gpsHandler,
    offlineSearch,
    onlineSearch,
    exitHandler,
    onSaveCallback,
    onSubmitCallback,
    openMap
  );

  // Create instance with programmatic methods
  const instance: FormGearInstance = {
    getResponse() {
      return response.details;
    },

    getMedia() {
      return media.details;
    },

    getRemarks() {
      return remark.details;
    },

    getPrincipal() {
      // Extract principal data from reference
      const principalItems = reference.details
        .filter((item) => item.principal !== undefined && item.principal > 0)
        .sort((a, b) => (a.principal || 0) - (b.principal || 0))
        .map((item) => ({
          dataKey: item.dataKey,
          name: item.name,
          answer: item.answer,
          principal: item.principal,
          columnName: item.columnName,
        }));
      return principalItems;
    },

    getReference() {
      return reference;
    },

    getSummary() {
      return {
        answer: summary.answer,
        blank: summary.blank,
        error: summary.error,
        remark: summary.remark,
      };
    },

    validate() {
      // Check if any component has validation errors
      const hasErrors = reference.details.some(
        (item) => item.validationState === 2
      );
      return !hasErrors;
    },

    setValue(dataKey: string, value: unknown) {
      // Find component and update
      const index = reference.details.findIndex(
        (item) => item.dataKey === dataKey
      );
      if (index !== -1) {
        // Note: This is a simplified implementation
        // The actual implementation would need to trigger reactive updates
        console.warn(
          'setValue is not fully implemented yet. Use the form UI for now.'
        );
      }
    },

    getValue(dataKey: string) {
      const item = reference.details.find((item) => item.dataKey === dataKey);
      return item?.answer;
    },

    save() {
      // Trigger save callback with current state
      onSaveCallback(
        response.details,
        media.details,
        remark.details,
        this.getPrincipal(),
        reference
      );
    },

    submit() {
      // Trigger submit callback with current state
      onSubmitCallback(
        response.details,
        media.details,
        remark.details,
        this.getPrincipal(),
        reference
      );
    },

    destroy() {
      // Clean up - unmount from DOM
      const rootElement = document.getElementById('FormGear-root');
      if (rootElement) {
        rootElement.innerHTML = '';
      }
      // Note: Full cleanup would need store reset functionality
      // which will be added in Phase 2 (Store Isolation)
      console.log('FormGear instance destroyed');
    },
  };

  return instance;
}

