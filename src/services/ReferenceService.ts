/**
 * ReferenceService
 *
 * Manages component reference lookups and dependency maps.
 * Replaces the global referenceMap and lookup functions from GlobalFunction.tsx.
 */

import type {
  FormStores,
  ReferenceDetail,
} from '../core/types';
import { ComponentType, PATTERNS } from '../core/constants';

/**
 * Service for managing component references and lookups.
 * Each FormGear instance gets its own ReferenceService.
 */
export class ReferenceService {
  private stores: FormStores;

  constructor(stores: FormStores) {
    this.stores = stores;
  }

  // ===========================================================================
  // Index Lookup Methods
  // ===========================================================================

  /**
   * Look up a component's index by dataKey.
   *
   * @param dataKey - The component's dataKey
   * @returns The index in reference.details, or -1 if not found
   */
  getIndex(dataKey: string): number {
    const [indexMap] = this.stores.referenceMap;
    const map = indexMap();

    // Check if we have cached index
    const cachedIndex = map[dataKey];
    if (cachedIndex !== undefined) {
      // Verify the cached index is still valid
      const [reference] = this.stores.reference;
      if (
        reference.details[cachedIndex] &&
        (reference.details[cachedIndex] as ReferenceDetail).dataKey === dataKey
      ) {
        return cachedIndex;
      }
    }

    // Cache miss or invalid - rebuild and retry
    this.rebuildIndexMap();
    const newMap = indexMap();
    return newMap[dataKey] ?? -1;
  }

  /**
   * Get a component by dataKey.
   *
   * @param dataKey - The component's dataKey
   * @returns The component detail or undefined if not found
   */
  getComponent(dataKey: string): ReferenceDetail | undefined {
    const index = this.getIndex(dataKey);
    if (index === -1) return undefined;

    const [reference] = this.stores.reference;
    return reference.details[index] as ReferenceDetail;
  }

  /**
   * Get a component's answer by dataKey.
   * Handles nested dataKey resolution with @$ROW$ markers.
   *
   * @param dataKey - The component's dataKey (may include row markers)
   * @param currentDataKey - The current context's dataKey for row resolution
   * @returns The answer value or empty string if not found/disabled
   */
  getValue(dataKey: string, currentDataKey?: string): unknown {
    // Resolve row markers if present
    const resolvedDataKey = this.resolveDataKey(dataKey, currentDataKey);

    const component = this.getComponent(resolvedDataKey);
    if (!component) return '';

    // Return empty string if component is disabled
    if (!component.enable) return '';

    // Return answer or empty string (handle both null and undefined)
    return component.answer !== undefined && component.answer !== null
      ? component.answer
      : '';
  }

  /**
   * Resolve a dataKey that may contain row index markers.
   *
   * @param dataKey - The dataKey with potential @$ROW$ markers
   * @param currentDataKey - The current context's dataKey
   * @returns Resolved dataKey with actual row indices
   */
  resolveDataKey(dataKey: string, currentDataKey?: string): string {
    if (!currentDataKey || !dataKey.includes('@$ROW')) {
      return dataKey;
    }

    // Extract row indices from current dataKey
    const currentParts = currentDataKey.split(PATTERNS.NESTED_SEPARATOR);
    const rowIndices: number[] = [];

    for (let i = 1; i < currentParts.length; i++) {
      const match = currentParts[i].match(/@(\d+)/);
      if (match) {
        rowIndices.push(parseInt(match[1], 10));
      }
    }

    // Replace markers with actual indices
    let resolved = dataKey;

    // @$ROW$ - current row (last index)
    if (resolved.includes('@$ROW$') && rowIndices.length > 0) {
      resolved = resolved.replace('@$ROW$', `@${rowIndices[rowIndices.length - 1]}`);
    }

    // @$ROW1$ - parent row (second to last)
    if (resolved.includes('@$ROW1$') && rowIndices.length > 1) {
      resolved = resolved.replace('@$ROW1$', `@${rowIndices[rowIndices.length - 2]}`);
    }

    // @$ROW2$ - grandparent row (third to last)
    if (resolved.includes('@$ROW2$') && rowIndices.length > 2) {
      resolved = resolved.replace('@$ROW2$', `@${rowIndices[rowIndices.length - 3]}`);
    }

    return resolved;
  }

  /**
   * Extract row index from a nested dataKey.
   *
   * @param dataKey - The nested dataKey
   * @param level - Which level of nesting (0 = current, 1 = parent, etc.)
   * @returns The row index at that level, or 0 if not found
   */
  getRowIndex(dataKey: string, level: number = 0): number {
    const parts = dataKey.split(PATTERNS.NESTED_SEPARATOR);
    const rowIndices: number[] = [];

    for (let i = 1; i < parts.length; i++) {
      const match = parts[i].match(/@(\d+)/);
      if (match) {
        rowIndices.push(parseInt(match[1], 10));
      }
    }

    const targetIndex = rowIndices.length - 1 - level;
    return targetIndex >= 0 ? rowIndices[targetIndex] : 0;
  }

  // ===========================================================================
  // Index Map Management
  // ===========================================================================

  /**
   * Rebuild the index map from current reference data.
   * Called when cache is invalid or after reference changes.
   */
  rebuildIndexMap(): void {
    const [reference] = this.stores.reference;
    const [, setIndexMap] = this.stores.referenceMap;

    const newMap: Record<string, number> = {};

    for (let i = 0; i < reference.details.length; i++) {
      const detail = reference.details[i] as ReferenceDetail;
      if (detail && detail.dataKey) {
        newMap[detail.dataKey] = i;
      }
    }

    setIndexMap(newMap);
  }

  /**
   * Initialize or reinitialize the reference map.
   * Also builds component dependency maps.
   *
   * @param referenceList - The reference details array (optional, uses store if not provided)
   */
  initializeMaps(referenceList?: ReferenceDetail[]): void {
    const [reference] = this.stores.reference;
    const details = referenceList ?? (reference.details as ReferenceDetail[]);

    // Build index map
    this.rebuildIndexMap();

    // Build dependency maps
    this.buildComponentMaps(details);
  }

  // ===========================================================================
  // Component Dependency Maps
  // ===========================================================================

  /**
   * Build all component dependency maps.
   *
   * @param details - The reference details to process
   */
  private buildComponentMaps(details: ReferenceDetail[]): void {
    const [, setEnableMap] = this.stores.compEnableMap;
    const [, setValidMap] = this.stores.compValidMap;
    const [, setVarMap] = this.stores.compVarMap;
    const [, setSourceOptionMap] = this.stores.compSourceOptionMap;
    const [, setSourceQuestionMap] = this.stores.compSourceQuestionMap;

    const enableMap: Record<string, string[]> = {};
    const validationMap: Record<string, string[]> = {};
    const variableMap: Record<string, string[]> = {};
    const sourceOptionMap: Record<string, string[]> = {};
    const sourceQuestionMap: Record<string, string[]> = {};

    for (const component of details) {
      // Build enable dependency map
      if (component.componentEnable) {
        for (const enableKey of component.componentEnable) {
          const baseKey = this.getBaseDataKey(enableKey);
          if (!enableMap[baseKey]) {
            enableMap[baseKey] = [];
          }
          if (!enableMap[baseKey].includes(component.dataKey)) {
            enableMap[baseKey].push(component.dataKey);
          }
        }
      }

      // Build validation dependency map
      if (component.componentValidation) {
        for (const validKey of component.componentValidation) {
          const baseKey = this.getBaseDataKey(validKey);
          if (!validationMap[baseKey]) {
            validationMap[baseKey] = [];
          }
          if (!validationMap[baseKey].includes(component.dataKey)) {
            validationMap[baseKey].push(component.dataKey);
          }
        }
      }

      // Build variable dependency map
      if (component.componentVar && component.type === ComponentType.VARIABLE) {
        for (const varKey of component.componentVar) {
          if (!variableMap[varKey]) {
            variableMap[varKey] = [];
          }
          if (!variableMap[varKey].includes(component.dataKey)) {
            variableMap[varKey].push(component.dataKey);
          }
        }
      }

      // Build sourceOption dependency map
      if (component.sourceOption) {
        const baseKey = this.getBaseDataKey(component.sourceOption);
        if (!sourceOptionMap[baseKey]) {
          sourceOptionMap[baseKey] = [];
        }
        if (!sourceOptionMap[baseKey].includes(component.dataKey)) {
          sourceOptionMap[baseKey].push(component.dataKey);
        }
      }

      // Build sourceQuestion dependency map (for nested components)
      if (component.sourceQuestion && component.type === ComponentType.NESTED) {
        if (!sourceQuestionMap[component.sourceQuestion]) {
          sourceQuestionMap[component.sourceQuestion] = [];
        }
        if (!sourceQuestionMap[component.sourceQuestion].includes(component.dataKey)) {
          sourceQuestionMap[component.sourceQuestion].push(component.dataKey);
        }
      }
    }

    setEnableMap(enableMap);
    setValidMap(validationMap);
    setVarMap(variableMap);
    setSourceOptionMap(sourceOptionMap);
    setSourceQuestionMap(sourceQuestionMap);
  }

  /**
   * Get base dataKey without row markers.
   *
   * @param dataKey - The dataKey possibly with @$ROW$ markers
   * @returns The base dataKey
   */
  private getBaseDataKey(dataKey: string): string {
    return dataKey.split('@')[0].split(PATTERNS.NESTED_SEPARATOR)[0];
  }

  // ===========================================================================
  // Dependency Lookup Methods
  // ===========================================================================

  /**
   * Get components that have enable conditions depending on this dataKey.
   *
   * @param dataKey - The dataKey to check dependencies for
   * @returns Set of dependent component dataKeys
   */
  getEnableDependents(dataKey: string): Set<string> {
    const [maps] = this.stores.compEnableMap;
    const allMaps = maps();
    const dependents = allMaps[dataKey];
    return new Set(dependents ?? []);
  }

  /**
   * Get components that have validation depending on this dataKey.
   *
   * @param dataKey - The dataKey to check dependencies for
   * @returns Set of dependent component dataKeys
   */
  getValidationDependents(dataKey: string): Set<string> {
    const [maps] = this.stores.compValidMap;
    const dependents = maps()[dataKey];
    return new Set(dependents ?? []);
  }

  /**
   * Get variable components that depend on this dataKey.
   *
   * @param dataKey - The dataKey to check dependencies for
   * @returns Set of dependent variable component dataKeys
   */
  getVariableDependents(dataKey: string): Set<string> {
    const [maps] = this.stores.compVarMap;
    const dependents = maps()[dataKey];
    return new Set(dependents ?? []);
  }

  /**
   * Get components with sourceOption from this dataKey.
   *
   * @param dataKey - The dataKey to check dependencies for
   * @returns Set of dependent component dataKeys
   */
  getSourceOptionDependents(dataKey: string): Set<string> {
    const [maps] = this.stores.compSourceOptionMap;
    const dependents = maps()[dataKey];
    return new Set(dependents ?? []);
  }

  /**
   * Get nested components using this dataKey as sourceQuestion.
   *
   * @param dataKey - The dataKey to check dependencies for
   * @returns Set of nested component dataKeys
   */
  getNestedDependents(dataKey: string): Set<string> {
    const [maps] = this.stores.compSourceQuestionMap;
    const dependents = maps()[dataKey];
    return new Set(dependents ?? []);
  }

  // ===========================================================================
  // Store Update Helpers
  // ===========================================================================

  /**
   * Update a component's property in the reference store.
   *
   * @param dataKey - The component's dataKey
   * @param property - The property to update
   * @param value - The new value
   */
  updateComponent<K extends keyof ReferenceDetail>(
    dataKey: string,
    property: K,
    value: ReferenceDetail[K]
  ): void {
    const index = this.getIndex(dataKey);
    if (index === -1) {
      return;
    }

    const [, setReference] = this.stores.reference;
    setReference('details', index, property, value);
  }

  /**
   * Batch update multiple properties of a component.
   *
   * @param dataKey - The component's dataKey
   * @param updates - Object with properties to update
   */
  updateComponentBatch(
    dataKey: string,
    updates: Partial<ReferenceDetail>
  ): void {
    const index = this.getIndex(dataKey);
    if (index === -1) return;

    const [, setReference] = this.stores.reference;

    for (const [property, value] of Object.entries(updates)) {
      setReference('details', index, property as keyof ReferenceDetail, value);
    }
  }
}
