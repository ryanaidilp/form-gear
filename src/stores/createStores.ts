/**
 * Store Factory
 *
 * Creates isolated store instances to prevent global state pollution.
 * Each FormGear instance gets its own set of stores.
 */

import { createStore, SetStoreFunction, Store } from 'solid-js/store';
import { createSignal, Accessor, Setter } from 'solid-js';

import type {
  Summary,
  Counter,
  ValidationStoreState as ValidationState,
  ResponseState,
  PresetState,
  MediaState,
  RemarkState,
  TemplateState,
  ReferenceState,
  SidebarState,
  LocaleState,
} from '../core/types';

// =============================================================================
// Store Types
// =============================================================================

/** Input store for tracking current component */
interface InputState {
  currentDataKey: string;
}

/** Nested store for nested components */
interface NestedState {
  details: unknown[];
}

/** Note store for remarks/comments */
interface NoteState {
  status: number;
  details: {
    dataKey: string;
    notes: Array<{
      dataKey: string;
      name: string;
      comments: unknown[];
    }>;
  };
}

/** Principal store for key data points */
interface PrincipalState {
  status: number;
  details: {
    principals: Array<{
      dataKey: string;
      name: string;
      answer: unknown;
      principal: number;
      columnName: string;
    }>;
    templateDataKey?: string;
    gearVersion?: string;
    templateVersion?: string;
    validationVersion?: string;
    createdBy?: string;
    updatedBy?: string;
    createdAt?: string;
    updatedAt?: string;
    createdAtTimezone?: string;
    createdAtGMT?: number | string;
    updatedAtTimezone?: string;
    updatedAtGMT?: number | string;
  };
}

// =============================================================================
// Store Tuple Types
// =============================================================================

type StoreInstance<T> = [Store<T>, SetStoreFunction<T>];
type SignalInstance<T> = [Accessor<T>, Setter<T>];

// =============================================================================
// FormStores Interface
// =============================================================================

/**
 * All stores for a single FormGear instance
 */
export interface FormStores {
  // Main stores
  reference: StoreInstance<ReferenceState>;
  response: StoreInstance<ResponseState>;
  template: StoreInstance<TemplateState>;
  validation: StoreInstance<ValidationState>;
  preset: StoreInstance<PresetState>;
  media: StoreInstance<MediaState>;
  remark: StoreInstance<RemarkState>;
  sidebar: StoreInstance<SidebarState>;
  locale: StoreInstance<LocaleState>;

  // Helper stores
  summary: StoreInstance<Summary>;
  counter: StoreInstance<Counter>;
  input: StoreInstance<InputState>;
  nested: StoreInstance<NestedState>;
  note: StoreInstance<NoteState>;
  principal: StoreInstance<PrincipalState>;

  // Signals (maps and history)
  referenceMap: SignalInstance<Record<string, number>>;
  sidebarIndexMap: SignalInstance<Record<string, number>>;
  compEnableMap: SignalInstance<Record<string, string[]>>;
  compValidMap: SignalInstance<Record<string, string[]>>;
  compSourceOptionMap: SignalInstance<Record<string, string[]>>;
  compVarMap: SignalInstance<Record<string, string[]>>;
  compSourceQuestionMap: SignalInstance<Record<string, string[]>>;
  referenceHistoryEnable: SignalInstance<boolean>;
  referenceHistory: SignalInstance<unknown[]>;
  sidebarHistory: SignalInstance<unknown[]>;
  referenceEnableFalse: SignalInstance<Array<{ parentIndex: number[] }>>;

  // Cleanup
  dispose: () => void;
}

// =============================================================================
// Default Values
// =============================================================================

const defaultLocale: LocaleState = {
  status: 1,
  details: {
    language: [
      {
        componentAdded: 'The component was successfully added!',
        componentDeleted: 'The component was successfully deleted!',
        componentEdited: 'The component was successfully edited!',
        componentEmpty: 'The component can not be empty',
        componentNotAllowed: 'Only 1 component is allowed to edit',
        componentRendered: 'Related components is rendering, please wait.',
        componentSelected: 'This component has already being selected',
        fetchFailed: 'Failed to fetch the data.',
        fileInvalidFormat: 'Please submit the appropriate format!',
        fileInvalidMaxSize: 'The maximum of allowed size is ',
        fileInvalidMinSize: 'The minimum of allowed size is ',
        fileUploaded: 'File uploaded successfully!',
        locationAcquired: 'Location successfully acquired!',
        remarkAdded: 'The remark was successfully added!',
        remarkEmpty: 'The remark can not be empty!',
        submitEmpty: 'Please make sure your submission is fully filled',
        submitInvalid: 'Please make sure your submission is valid',
        submitWarning:
          'The submission you are about to submit still contains a warning',
        summaryAnswer: 'Answer',
        summaryBlank: 'Blank',
        summaryError: 'Error',
        summaryRemark: 'Remark',
        uploadCsv: 'Upload CSV file',
        uploadImage: 'Upload image file',
        validationDate: 'Invalid date format',
        validationInclude: 'Allowed values are $values',
        validationMax: 'The biggest value is',
        validationMaxLength: 'The maximum of allowed character is',
        validationMin: 'The smallest value is',
        validationMinLength: 'The minimum of allowed character is',
        validationRequired: 'Required',
        validationStep: 'The value must be a multiple of',
        verificationInvalid: 'Please provide verification correctly',
        verificationSubmitted: 'The data is now being submitted. Thank you!',
        validationUrl: 'Invalid URL address, please provide with https://',
        validationEmail: 'Invalid email address',
        validationApi: 'Invalid input from api response',
        errorSaving: 'Something went wrong while saving on component ',
        errorExpression:
          'Something went wrong while evaluating expression on component ',
        errorEnableExpression:
          'Something went wrong while evaluating enable on component ',
        errorValidationExpression:
          'Something went wrong while evaluating validation expression on component ',
      },
    ],
  },
};

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Creates a new set of isolated stores for a FormGear instance.
 *
 * @param initialData - Optional initial data for stores
 * @returns FormStores object with all stores and dispose function
 *
 * @example
 * ```typescript
 * const stores = createFormStores({
 *   template: templateData,
 *   response: responseData,
 * });
 *
 * // Use stores
 * const [reference, setReference] = stores.reference;
 *
 * // Cleanup when done
 * stores.dispose();
 * ```
 */
export function createFormStores(initialData?: {
  reference?: unknown;
  template?: unknown;
  preset?: unknown;
  response?: unknown;
  validation?: unknown;
  media?: unknown;
  remark?: unknown;
  locale?: LocaleState;
}): FormStores {
  // Track all cleanup functions
  const cleanupFns: Array<() => void> = [];

  // Helper to create store with cleanup tracking
  function createTrackedStore<T extends object>(
    initialValue: T
  ): StoreInstance<T> {
    const [store, setStore] = createStore<T>(initialValue);
    // Note: SolidJS stores don't need explicit cleanup for memory
    // but we track them for potential future cleanup needs
    return [store, setStore];
  }

  // Helper to create signal with cleanup tracking
  function createTrackedSignal<T>(initialValue: T): SignalInstance<T> {
    const [get, set] = createSignal<T>(initialValue);
    return [get, set];
  }

  // ==========================================================================
  // Create all stores
  // ==========================================================================

  // Main stores
  const reference = createTrackedStore<ReferenceState>({
    details: [],
    sidebar: [],
  });

  const response = createTrackedStore<ResponseState>({
    status: 1,
    details: {
      dataKey: '',
      answers: [],
      summary: [],
      counter: [],
      ...(initialData?.response as object),
    },
  });

  const template = createTrackedStore<TemplateState>({
    status: 1,
    details: {
      description: '',
      dataKey: '',
      acronym: '',
      title: '',
      version: '',
      components: [],
      ...(initialData?.template as object),
    },
  });

  const validation = createTrackedStore<ValidationState>({
    status: 1,
    details: {
      description: '',
      dataKey: '',
      version: '',
      testFunctions: [],
      ...(initialData?.validation as object),
    },
  });

  const preset = createTrackedStore<PresetState>({
    status: 1,
    details: {
      description: '',
      dataKey: '',
      predata: [],
      ...(initialData?.preset as object),
    },
  });

  const media = createTrackedStore<MediaState>({
    status: 1,
    details: {
      dataKey: '',
      media: [],
      ...(initialData?.media as object),
    },
  });

  const remark = createTrackedStore<RemarkState>({
    status: 1,
    details: {
      dataKey: '',
      notes: [],
      ...(initialData?.remark as object),
    },
  });

  const sidebar = createTrackedStore<SidebarState>({
    details: [],
  });

  const locale = createTrackedStore<LocaleState>(
    initialData?.locale || defaultLocale
  );

  // Helper stores
  const summary = createTrackedStore<Summary>({
    answer: 0,
    blank: 0,
    error: 0,
    remark: 0,
    clean: 0,
  });

  const counter = createTrackedStore<Counter>({
    render: 0,
    validate: 0,
  });

  const input = createTrackedStore<InputState>({
    currentDataKey: '',
  });

  const nested = createTrackedStore<NestedState>({
    details: [],
  });

  const note = createTrackedStore<NoteState>({
    status: 1,
    details: {
      dataKey: '',
      notes: [],
    },
  });

  const principal = createTrackedStore<PrincipalState>({
    status: 1,
    details: {
      principals: [],
    },
  });

  // ==========================================================================
  // Create all signals (maps and history)
  // ==========================================================================

  const referenceMap = createTrackedSignal<Record<string, number>>({});
  const sidebarIndexMap = createTrackedSignal<Record<string, number>>({});
  const compEnableMap = createTrackedSignal<Record<string, string[]>>({});
  const compValidMap = createTrackedSignal<Record<string, string[]>>({});
  const compSourceOptionMap = createTrackedSignal<Record<string, string[]>>({});
  const compVarMap = createTrackedSignal<Record<string, string[]>>({});
  const compSourceQuestionMap = createTrackedSignal<Record<string, string[]>>(
    {}
  );
  const referenceHistoryEnable = createTrackedSignal<boolean>(false);
  const referenceHistory = createTrackedSignal<unknown[]>([]);
  const sidebarHistory = createTrackedSignal<unknown[]>([]);
  const referenceEnableFalse = createTrackedSignal<Array<{ parentIndex: number[] }>>([]);

  // ==========================================================================
  // Dispose function
  // ==========================================================================

  const dispose = () => {
    // Run all cleanup functions
    cleanupFns.forEach((fn) => fn());
    cleanupFns.length = 0;

    // Reset all stores to initial state
    reference[1]({ details: [], sidebar: [] });
    response[1]({ status: 1, details: { dataKey: '', answers: [], summary: [], counter: [] } });
    template[1]({ status: 1, details: { description: '', dataKey: '', acronym: '', title: '', version: '', components: [] } });
    validation[1]({ status: 1, details: { description: '', dataKey: '', version: '', testFunctions: [] } });
    preset[1]({ status: 1, details: { description: '', dataKey: '', predata: [] } });
    media[1]({ status: 1, details: { dataKey: '', media: [] } });
    remark[1]({ status: 1, details: { dataKey: '', notes: [] } });
    sidebar[1]({ details: [] });
    summary[1]({ answer: 0, blank: 0, error: 0, remark: 0, clean: 0 });
    counter[1]({ render: 0, validate: 0 });
    input[1]({ currentDataKey: '' });
    nested[1]({ details: [] });
    note[1]({ status: 1, details: { dataKey: '', notes: [] } });
    principal[1]({ status: 1, details: { principals: [] } });

    // Reset all signals
    referenceMap[1]({});
    sidebarIndexMap[1]({});
    compEnableMap[1]({});
    compValidMap[1]({});
    compSourceOptionMap[1]({});
    compVarMap[1]({});
    compSourceQuestionMap[1]({});
    referenceHistoryEnable[1](false);
    referenceHistory[1]([]);
    sidebarHistory[1]([]);
    referenceEnableFalse[1]([]);

    
  };

  return {
    // Main stores
    reference,
    response,
    template,
    validation,
    preset,
    media,
    remark,
    sidebar,
    locale,

    // Helper stores
    summary,
    counter,
    input,
    nested,
    note,
    principal,

    // Signals
    referenceMap,
    sidebarIndexMap,
    compEnableMap,
    compValidMap,
    compSourceOptionMap,
    compVarMap,
    compSourceQuestionMap,
    referenceHistoryEnable,
    referenceHistory,
    sidebarHistory,
    referenceEnableFalse,

    // Cleanup
    dispose,
  };
}
