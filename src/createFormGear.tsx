/**
 * FormGear Modern API
 *
 * This module provides a modern, type-safe API for creating FormGear instances.
 * It directly manages isolated stores and renders the form without relying on legacy code.
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

import { render } from 'solid-js/web';
import {
  FormGearOptions,
  FormGearInstance,
  FormGearConfig,
  DEFAULT_CONFIG,
} from './types';

import Form from './Form';
import { FormProvider } from './FormProvider';
import FormLoaderProvider from './loader/FormLoaderProvider';
import Loader from './loader/Loader';
import { StoreProvider } from './stores/StoreContext';
import { createFormStores, FormStores } from './stores/createStores';
import { toastError } from './utils/toast';
import { ServiceProvider, createFormServices } from './services';
import type { FormGearConfig as ServiceConfig } from './core/types';

// Default JSON data
import mediaJSON from './data/default/media.json';
import presetJSON from './data/default/preset.json';
import referenceJSON from './data/default/reference.json';
import remarkJSON from './data/default/remark.json';
import responseJSON from './data/default/response.json';

declare const __FORM_GEAR_VERSION__: string;
export const gearVersion = __FORM_GEAR_VERSION__;
export let templateVersion = '0.0.0';
export let validationVersion = '0.0.0';

/**
 * Builds the reference and sidebar from template data
 */
function buildReferenceFromTemplate(
  stores: FormStores,
  templateData: any,
  validationData: any,
  remarkData: any,
  presetData: any
): {
  referenceList: any[];
  sidebarList: any[];
  nestedList: any[];
  tmpVarComp: any[];
  tmpEnableComp: any[];
} {
  const referenceList: any[] = [];
  const sidebarList: any[] = [];
  const nestedList: any[] = [];
  const tmpVarComp: any[] = [];
  const tmpEnableComp: any[] = [];
  const dataKeyCollections: string[] = [];

  const [noteStore, setNoteStore] = stores.note;

  // Process each section in the template
  const components = templateData.components;
  if (!components || !Array.isArray(components) || components.length === 0) {
    console.error('Template has no components array');
    return { referenceList, sidebarList, nestedList, tmpVarComp, tmpEnableComp };
  }

  const sections = components[0];
  if (!Array.isArray(sections) || sections.length === 0) {
    console.error('Template has no sections');
    return { referenceList, sidebarList, nestedList, tmpVarComp, tmpEnableComp };
  }

  // Helper to get validation for a component
  const getValidation = (dataKey: string) => {
    if (!validationData?.testFunctions) return { vals: undefined, compVal: undefined };
    const valPosition = validationData.testFunctions.findIndex(
      (obj: any) => obj.dataKey === dataKey
    );
    if (valPosition !== -1) {
      return {
        vals: validationData.testFunctions[valPosition].validations,
        compVal: validationData.testFunctions[valPosition].componentValidation,
      };
    }
    return { vals: undefined, compVal: undefined };
  };

  // Helper to check and add remark
  const checkRemark = (element: any) => {
    if (element.enableRemark === undefined || element.enableRemark) {
      if (remarkData?.notes) {
        const remarkPosition = remarkData.notes.findIndex(
          (obj: any) => obj.dataKey === element.dataKey
        );
        if (remarkPosition !== -1) {
          const newNote = remarkData.notes[remarkPosition];
          const updatedNotes = [...noteStore.details.notes, newNote];
          setNoteStore('details', 'notes', updatedNotes);
          return true;
        }
      }
    }
    return false;
  };

  // Recursive function to process components
  const processComponents = (
    elements: any[],
    parent: number[],
    level: number,
    sideEnable: boolean
  ) => {
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const elType = element.type;

      // Check for duplicate dataKeys (except for type 1 sections and type 3 labels)
      if (elType !== 1 && elType !== 3) {
        if (dataKeyCollections.includes(element.dataKey)) {
          throw new Error(`Duplicate dataKey on ${element.dataKey}`);
        }
        dataKeyCollections.push(element.dataKey);
      }

      // Handle answer
      let answer = element.answer;
      if (elType === 21 || elType === 22) {
        answer = JSON.parse(JSON.stringify(answer));
      } else if (elType === 4 && level < 2) {
        if (answer === undefined && !sideEnable) {
          tmpVarComp.push(JSON.parse(JSON.stringify(element)));
        }
      }

      // Get components for nested types
      let componentsList = element.components;

      // Add to sidebar for sections (type 1) only
      // Nested components (type 2) are added dynamically when instances are created
      if (elType === 1) {
        let currentSideEnable = sideEnable;
        if (element.enableCondition !== undefined) {
          tmpEnableComp.push(JSON.parse(JSON.stringify(element)));
          currentSideEnable = false;
        } else {
          currentSideEnable = true;
        }

        sidebarList.push({
          dataKey: element.dataKey,
          name: element.name,
          label: element.label,
          description: element.description,
          level: level,
          index: [...parent, i],
          components: componentsList,
          sourceQuestion: element.sourceQuestion || '',
          enable: currentSideEnable,
          enableCondition: element.enableCondition || '',
          componentEnable: element.componentEnable || [],
        });
      }

      // Track nested components (type 2) for the nested store
      if (elType === 2) {
        nestedList.push({
          dataKey: element.dataKey,
          name: element.name,
          label: element.label,
          description: element.description,
          level: level,
          index: [...parent, i],
          components: componentsList,
          sourceQuestion: element.sourceQuestion || '',
          enable: sideEnable,
          enableCondition: element.enableCondition || '',
          componentEnable: element.componentEnable || [],
        });
      }

      // Add enable condition components
      if (elType > 2 && element.enableCondition !== undefined && !sideEnable) {
        tmpEnableComp.push(JSON.parse(JSON.stringify(element)));
      }

      // Get validation
      const { vals, compVal } = getValidation(element.dataKey);

      // Check remark
      const hasRemark = checkRemark(element);

      // Add to reference list
      referenceList.push({
        dataKey: element.dataKey,
        name: element.name,
        label: element.label,
        hint: element.hint || '',
        description: element.description,
        type: elType,
        answer: answer,
        index: [...parent, i],
        level: level,
        options: element.options,
        sourceQuestion: element.sourceQuestion,
        urlValidation: element.urlValidation,
        currency: element.currency,
        source: element.source,
        urlPath: element.path,
        parent: element.parent,
        separatorFormat: element.separatorFormat,
        isDecimal: element.isDecimal,
        maskingFormat: element.maskingFormat,
        expression: element.expression,
        componentVar: element.componentVar,
        render: element.render,
        renderType: element.renderType,
        enable: true,
        enableCondition: element.enableCondition || '',
        componentEnable: element.componentEnable || [],
        enableRemark: element.enableRemark !== undefined ? element.enableRemark : true,
        client: element.client,
        titleModalDelete: element.titleModalDelete,
        sourceOption: element.sourceOption,
        sourceAPI: element.sourceAPI,
        typeOption: element.typeOption,
        contentModalDelete: element.contentModalDelete,
        validationState: element.validationState || 0,
        validationMessage: element.validationMessage || [],
        validations: vals,
        componentValidation: compVal,
        hasRemark: hasRemark,
        rows: element.rows,
        cols: element.cols,
        rangeInput: element.rangeInput,
        lengthInput: element.lengthInput,
        principal: element.principal,
        columnName: element.columnName || '',
        titleModalConfirmation: element.titleModalConfirmation,
        contentModalConfirmation: element.contentModalConfirmation,
        required: element.required,
        presetMaster: element.presetMaster,
        disableInput: element.disableInput,
        decimalLength: element.decimalLength,
        disableInitial: element.disableInitial,
        sizeInput: element.sizeInput,
      });

      // Process nested components recursively
      if (componentsList && Array.isArray(componentsList)) {
        for (let j = 0; j < componentsList.length; j++) {
          if (Array.isArray(componentsList[j])) {
            processComponents(
              componentsList[j],
              [...parent, i, j],
              level + 1,
              sideEnable
            );
          }
        }
      }
    }
  };

  // Process each section
  for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
    const section = sections[sectionIndex];

    // Check for section enable condition
    let hasSideEnable = false;
    if (section.enableCondition !== undefined) {
      tmpEnableComp.push(JSON.parse(JSON.stringify(section)));
      hasSideEnable = true;
    }

    // Add section to sidebar
    sidebarList.push({
      dataKey: section.dataKey,
      name: section.name,
      label: section.label,
      description: section.description,
      level: 0,
      index: [0, sectionIndex],
      components: section.components,
      sourceQuestion: section.sourceQuestion || '',
      enable: !hasSideEnable,
      enableCondition: section.enableCondition || '',
      componentEnable: section.componentEnable || [],
    });

    // Add section to reference
    referenceList.push({
      dataKey: section.dataKey,
      name: section.name,
      label: section.label,
      hint: section.hint || '',
      description: section.description,
      type: section.type,
      index: [0, sectionIndex],
      level: 0,
      options: section.options,
      sourceQuestion: section.sourceQuestion,
      enable: true,
      enableCondition: section.enableCondition || '',
      componentEnable: section.componentEnable || [],
      enableRemark: section.enableRemark !== undefined ? section.enableRemark : true,
      validationState: 0,
      validationMessage: [],
    });

    // Process section's inner components
    if (section.components && section.components[0]) {
      processComponents(
        section.components[0],
        [0, sectionIndex, 0],
        1,
        hasSideEnable
      );
    }
  }

  return { referenceList, sidebarList, nestedList, tmpVarComp, tmpEnableComp };
}

/**
 * Creates a new FormGear instance with the modern options-based API.
 *
 * @param options - Configuration options for the form
 * @returns FormGear instance with programmatic methods
 */
export function createFormGear(options: FormGearOptions): FormGearInstance {
  const { data, config, mobileHandlers = {}, callbacks = {} } = options;

  // Merge with defaults
  const mergedConfig: FormGearConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Extract data with defaults
  const referenceData = data.reference || {};
  const templateData = data.template || {};
  const presetData = data.preset || presetJSON;
  const responseData = data.response || responseJSON;
  const validationData = data.validation || {};
  const mediaData = data.media || mediaJSON;
  const remarkData = data.remark || remarkJSON;

  // Update version variables from loaded data
  templateVersion = (templateData as any).version || '0.0.0';
  validationVersion = (validationData as any).version || '0.0.0';

  // Extract handlers with defaults
  const uploadHandler = mobileHandlers.uploadHandler || (() => {});
  const gpsHandler = mobileHandlers.gpsHandler || (() => {});
  const offlineSearch = mobileHandlers.offlineSearch || (() => {});
  const onlineSearch = mobileHandlers.onlineSearch || (async () => ({}));
  const exitHandler = mobileHandlers.exitHandler || ((cb?: () => void) => cb && cb());
  const openMap = mobileHandlers.openMap || (() => {});

  // Create response callbacks
  const onSaveCallback = callbacks.onSave || (() => {});
  const onSubmitCallback = callbacks.onSubmit || (() => {});

  // Validate template structure
  const template = templateData as any;
  if (!template.components || !Array.isArray(template.components) || template.components.length === 0) {
    console.error('FormGear Error: Template components is empty or invalid');
    toastError('Template configuration error: No components found', 5000);
    throw new Error('Template configuration error: No components found');
  }

  if (!Array.isArray(template.components[0]) || template.components[0].length === 0) {
    console.error('FormGear Error: Template has no sections');
    toastError('Template configuration error: No sections defined', 5000);
    throw new Error('Template configuration error: No sections defined');
  }

  // Create isolated stores
  const stores = createFormStores({
    template: templateData,
    validation: validationData,
    preset: presetData,
    response: responseData,
    media: mediaData,
    remark: remarkData,
  });

  // Build reference and sidebar from template
  const { referenceList, sidebarList, nestedList, tmpVarComp, tmpEnableComp } = buildReferenceFromTemplate(
    stores,
    templateData,
    validationData,
    remarkData,
    presetData
  );

  console.log('createFormGear: nestedList built with', nestedList.length, 'items:', nestedList);

  // Update stores with built data
  stores.reference[1]('details', referenceList);
  stores.sidebar[1]('details', sidebarList);
  stores.nested[1]('details', nestedList);

  console.log('FormGear: Reference built with', referenceList.length, 'items');
  console.log('FormGear: Sidebar built with', sidebarList.length, 'sections');

  // Create services configuration
  const serviceConfig: ServiceConfig = {
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

  // Create services with isolated stores
  const services = createFormServices(stores, serviceConfig);

  // Initialize reference map and dependency maps via service
  services.reference.initializeMaps();

  // Initialize enable states for all components with enableConditions
  services.enable.initializeEnableStates();

  // Prepare props for Form component
  const formConfig = {
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

  const timeStart = new Date();

  // Render the form
  const rootElement = document.getElementById('FormGear-root');
  if (!rootElement) {
    console.error('FormGear Error: No element with id "FormGear-root" found');
    toastError('Mount point not found: FormGear-root', 5000);
    throw new Error('Mount point not found: FormGear-root');
  }

  // Create the form component tree
  render(
    () => (
      <StoreProvider stores={stores}>
        <ServiceProvider services={services}>
          <FormProvider>
            <FormLoaderProvider>
              <Form
                config={formConfig}
                timeStart={timeStart}
                runAll={0}
                tmpEnableComp={tmpEnableComp}
                tmpVarComp={tmpVarComp}
                template={{ details: templateData }}
                preset={{ details: presetData }}
                response={{ details: responseData }}
                validation={{ details: validationData }}
                remark={{ details: remarkData }}
                uploadHandler={uploadHandler}
                GpsHandler={gpsHandler}
                offlineSearch={offlineSearch}
                onlineSearch={onlineSearch}
                mobileExit={exitHandler}
                setResponseMobile={onSaveCallback}
                setSubmitMobile={onSubmitCallback}
                openMap={openMap}
              />
              <Loader />
            </FormLoaderProvider>
          </FormProvider>
        </ServiceProvider>
      </StoreProvider>
    ),
    rootElement
  );

  console.log(`FormGear ${gearVersion} initialized`);

  // Create instance with programmatic methods
  const instance: FormGearInstance = {
    getResponse() {
      return stores.response[0].details;
    },

    getMedia() {
      return stores.media[0].details;
    },

    getRemarks() {
      return stores.remark[0].details;
    },

    getPrincipal() {
      const refDetails = stores.reference[0].details as any[];
      const principalItems = refDetails
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
      return stores.reference[0];
    },

    getSummary() {
      const summaryStore = stores.summary[0];
      return {
        answer: summaryStore.answer,
        blank: summaryStore.blank,
        error: summaryStore.error,
        remark: summaryStore.remark,
      };
    },

    validate() {
      const refDetails = stores.reference[0].details as any[];
      const hasErrors = refDetails.some((item) => item.validationState === 2);
      return !hasErrors;
    },

    setValue(dataKey: string, value: unknown) {
      const refDetails = stores.reference[0].details as any[];
      const index = refDetails.findIndex((item) => item.dataKey === dataKey);
      if (index !== -1) {
        stores.reference[1]('details', index, 'answer', value);
      }
    },

    getValue(dataKey: string) {
      const refDetails = stores.reference[0].details as any[];
      const item = refDetails.find((item) => item.dataKey === dataKey);
      return item?.answer;
    },

    save() {
      onSaveCallback(
        stores.response[0].details,
        stores.media[0].details,
        stores.remark[0].details,
        this.getPrincipal(),
        stores.reference[0]
      );
    },

    submit() {
      onSubmitCallback(
        stores.response[0].details,
        stores.media[0].details,
        stores.remark[0].details,
        this.getPrincipal(),
        stores.reference[0]
      );
    },

    destroy() {
      if (rootElement) {
        rootElement.innerHTML = '';
      }
      stores.dispose();
      console.log('FormGear instance destroyed');
    },
  };

  return instance;
}
