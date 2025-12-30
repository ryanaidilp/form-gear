/**
 * Stores Module
 *
 * This module exports the store factory and context hooks for FormGear.
 *
 * For new code, use the context-based hooks instead of direct store imports:
 *
 * @example
 * ```tsx
 * // New approach (recommended)
 * import { useReference, useResponse } from '../stores';
 *
 * function MyComponent() {
 *   const [reference, setReference] = useReference();
 *   const [response, setResponse] = useResponse();
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Creating isolated stores
 * import { createFormStores, StoreProvider } from '../stores';
 *
 * const stores = createFormStores({ template, response });
 *
 * <StoreProvider stores={stores}>
 *   <App />
 * </StoreProvider>
 * ```
 */

// Factory
export { createFormStores } from './createStores';
export type { FormStores } from './createStores';

// Context and hooks
export {
  StoreProvider,
  useStores,
  // Store hooks
  useReference,
  useResponse,
  useTemplate,
  useValidation,
  usePreset,
  useMedia,
  useRemark,
  useSidebar,
  useLocale,
  useSummary,
  useCounter,
  useInput,
  useNested,
  useNote,
  usePrincipal,
  // Signal hooks
  useReferenceMap,
  useSidebarIndexMap,
  useCompEnableMap,
  useCompValidMap,
  useCompSourceOptionMap,
  useCompVarMap,
  useCompSourceQuestionMap,
  useReferenceHistoryEnable,
  useReferenceHistory,
  useSidebarHistory,
  useReferenceEnableFalse,
} from './StoreContext';

// =============================================================================
// Legacy store exports (for backward compatibility during migration)
// =============================================================================

// These exports maintain compatibility with existing code that imports
// directly from individual store files. New code should use hooks instead.

export { reference, setReference } from './ReferenceStore';
export { response, setResponse } from './ResponseStore';
export { template, setTemplate } from './TemplateStore';
export { validation, setValidation } from './ValidationStore';
export { preset, setPreset } from './PresetStore';
export { media, setMedia } from './MediaStore';
export { remark, setRemark } from './RemarkStore';
export { sidebar, setSidebar } from './SidebarStore';
export { locale, setLocale } from './LocaleStore';
export { summary, setSummary } from './SummaryStore';
export { counter, setCounter } from './CounterStore';
export { input, setInput } from './InputStore';
export { nested, setNested } from './NestedStore';
export { note, setNote } from './NoteStore';
export { principal, setPrincipal } from './PrincipalStore';

// Legacy signal exports from ReferenceStore
export {
  referenceMap,
  setReferenceMap,
  sidebarIndexMap,
  setSidebarIndexMap,
  compEnableMap,
  setCompEnableMap,
  compValidMap,
  setCompValidMap,
  compSourceOptionMap,
  setCompSourceOptionMap,
  compVarMap,
  setCompVarMap,
  compSourceQuestionMap,
  setCompSourceQuestionMap,
  referenceHistoryEnable,
  setReferenceHistoryEnable,
  referenceHistory,
  setReferenceHistory,
  sidebarHistory,
  setSidebarHistory,
  referenceEnableFalse,
  setReferenceEnableFalse,
} from './ReferenceStore';
