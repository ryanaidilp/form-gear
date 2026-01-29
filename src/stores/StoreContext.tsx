/**
 * Store Context
 *
 * Provides React-like context for accessing stores in components.
 * This enables store isolation - each FormGear instance has its own context.
 */

import { createContext, useContext, ParentComponent } from 'solid-js';
import { FormStores } from './createStores';

// =============================================================================
// Context
// =============================================================================

/**
 * Context for accessing FormGear stores
 */
const StoreContext = createContext<FormStores>();

// =============================================================================
// Provider
// =============================================================================

interface StoreProviderProps {
  stores: FormStores;
}

/**
 * Provider component that makes stores available to child components.
 *
 * @example
 * ```tsx
 * const stores = createFormStores(initialData);
 *
 * <StoreProvider stores={stores}>
 *   <Form />
 * </StoreProvider>
 * ```
 */
export const StoreProvider: ParentComponent<StoreProviderProps> = (props) => {
  return (
    <StoreContext.Provider value={props.stores}>
      {props.children}
    </StoreContext.Provider>
  );
};

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to access all stores.
 *
 * @throws Error if used outside of StoreProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const stores = useStores();
 *   const [reference, setReference] = stores.reference;
 *   // ...
 * }
 * ```
 */
export function useStores(): FormStores {
  const stores = useContext(StoreContext);
  if (!stores) {
    throw new Error(
      'useStores must be used within a StoreProvider. ' +
        'Make sure your component is wrapped with <StoreProvider stores={...}>.'
    );
  }
  return stores;
}

// =============================================================================
// Convenience Hooks
// =============================================================================

/**
 * Hook to access the reference store.
 *
 * @example
 * ```tsx
 * const [reference, setReference] = useReference();
 * const component = reference.details.find(d => d.dataKey === 'Q1');
 * ```
 */
export function useReference() {
  return useStores().reference;
}

/**
 * Hook to access the response store.
 */
export function useResponse() {
  return useStores().response;
}

/**
 * Hook to access the template store.
 */
export function useTemplate() {
  return useStores().template;
}

/**
 * Hook to access the validation store.
 */
export function useValidation() {
  return useStores().validation;
}

/**
 * Hook to access the preset store.
 */
export function usePreset() {
  return useStores().preset;
}

/**
 * Hook to access the media store.
 */
export function useMedia() {
  return useStores().media;
}

/**
 * Hook to access the remark store.
 */
export function useRemark() {
  return useStores().remark;
}

/**
 * Hook to access the sidebar store.
 */
export function useSidebar() {
  return useStores().sidebar;
}

/**
 * Hook to access the locale store.
 */
export function useLocale() {
  return useStores().locale;
}

/**
 * Hook to access the summary store.
 */
export function useSummary() {
  return useStores().summary;
}

/**
 * Hook to access the counter store.
 */
export function useCounter() {
  return useStores().counter;
}

/**
 * Hook to access the input store.
 */
export function useInput() {
  return useStores().input;
}

/**
 * Hook to access the nested store.
 */
export function useNested() {
  return useStores().nested;
}

/**
 * Hook to access the note store.
 */
export function useNote() {
  return useStores().note;
}

/**
 * Hook to access the principal store.
 */
export function usePrincipal() {
  return useStores().principal;
}

// =============================================================================
// Signal Hooks
// =============================================================================

/**
 * Hook to access the reference map signal.
 */
export function useReferenceMap() {
  return useStores().referenceMap;
}

/**
 * Hook to access the sidebar index map signal.
 */
export function useSidebarIndexMap() {
  return useStores().sidebarIndexMap;
}

/**
 * Hook to access the component enable map signal.
 */
export function useCompEnableMap() {
  return useStores().compEnableMap;
}

/**
 * Hook to access the component validation map signal.
 */
export function useCompValidMap() {
  return useStores().compValidMap;
}

/**
 * Hook to access the component source option map signal.
 */
export function useCompSourceOptionMap() {
  return useStores().compSourceOptionMap;
}

/**
 * Hook to access the component variable map signal.
 */
export function useCompVarMap() {
  return useStores().compVarMap;
}

/**
 * Hook to access the component source question map signal.
 */
export function useCompSourceQuestionMap() {
  return useStores().compSourceQuestionMap;
}

/**
 * Hook to access the reference history enable signal.
 */
export function useReferenceHistoryEnable() {
  return useStores().referenceHistoryEnable;
}

/**
 * Hook to access the reference history signal.
 */
export function useReferenceHistory() {
  return useStores().referenceHistory;
}

/**
 * Hook to access the sidebar history signal.
 */
export function useSidebarHistory() {
  return useStores().sidebarHistory;
}

/**
 * Hook to access the reference enable false signal.
 * Returns the full signal tuple [getter, setter].
 */
export function useReferenceEnableFalse() {
  return useStores().referenceEnableFalse;
}
