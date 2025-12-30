/**
 * Reference Utilities
 *
 * Provides helper functions for working with FormGear reference data,
 * component lookup, and dataKey manipulation.
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Reference map structure for fast component lookup.
 * Maps dataKey to [indices, fullDataKeys]
 */
export type ReferenceMap = Record<string, [number[], string[]]>;

/**
 * Row indicator types used in dataKey expressions
 */
export type RowIndicator = '$ROW$' | '$ROW1$' | '$ROW2$';

/**
 * Parsed dataKey structure
 */
export interface ParsedDataKey {
  /** Base dataKey without row numbers */
  base: string;
  /** Full dataKey without row indicator */
  full: string;
  /** Row numbers extracted from nested keys */
  rows: number[];
  /** Row indicator if present ($ROW$, $ROW1$, $ROW2$) */
  rowIndicator?: RowIndicator;
}

// =============================================================================
// DataKey Parsing
// =============================================================================

/**
 * Parses a dataKey into its components.
 *
 * @param dataKey - Full dataKey string
 * @returns Parsed dataKey object
 *
 * @example
 * ```typescript
 * parseDataKey('Q1#2@$ROW$')
 * // { base: 'Q1', full: 'Q1#2', rows: [2], rowIndicator: '$ROW$' }
 *
 * parseDataKey('Section#1#Q2#3')
 * // { base: 'Section', full: 'Section#1#Q2#3', rows: [1, 3], rowIndicator: undefined }
 * ```
 */
export function parseDataKey(dataKey: string): ParsedDataKey {
  const [keyPart, rowIndicator] = dataKey.split('@') as [
    string,
    RowIndicator | undefined,
  ];
  const parts = keyPart.split('#');
  const base = parts[0];
  const rows = parts.slice(1).map(Number).filter((n) => !isNaN(n));

  return {
    base,
    full: keyPart,
    rows,
    rowIndicator,
  };
}

/**
 * Resolves a dataKey with row indicator to its actual key.
 *
 * @param dataKey - DataKey with potential row indicator
 * @returns Resolved dataKey
 *
 * @example
 * ```typescript
 * resolveDataKeyWithRow('Q1#2@$ROW$') // 'Q1#2'
 * resolveDataKeyWithRow('Q1#2#3@$ROW1$') // 'Q1#2'
 * resolveDataKeyWithRow('Q1#2#3#4@$ROW2$') // 'Q1#2'
 * resolveDataKeyWithRow('Q1') // 'Q1'
 * ```
 */
export function resolveDataKeyWithRow(dataKey: string): string {
  const [keyPart, rowIndicator] = dataKey.split('@');
  const parts = keyPart.split('#');
  const length = parts.length;

  switch (rowIndicator) {
    case '$ROW$':
      return keyPart;
    case '$ROW1$':
      if (length > 2) parts.length = length - 1;
      return parts.join('#');
    case '$ROW2$':
      if (length > 3) parts.length = length - 2;
      return parts.join('#');
    default:
      return dataKey;
  }
}

/**
 * Gets the row index from a nested dataKey.
 *
 * @param dataKey - DataKey with row numbers
 * @param positionOffset - Offset from the last row (0 = current, 1 = parent, etc.)
 * @returns Row index number
 *
 * @example
 * ```typescript
 * getRowIndex('Q1#5', 0) // 5
 * getRowIndex('Section#2#Q1#5', 0) // 5
 * getRowIndex('Section#2#Q1#5', 1) // 2
 * ```
 */
export function getRowIndex(dataKey: string, positionOffset = 0): number {
  const parts = dataKey.split('@')[0].split('#');
  const length = parts.length;
  const reducer = positionOffset + 1;

  if (length - reducer < 1) {
    return Number(parts[1]) || 0;
  }
  return Number(parts[length - reducer]) || 0;
}

/**
 * Creates a getRowIndex function bound to a specific dataKey.
 *
 * @param dataKey - The dataKey to bind
 * @returns Function that returns row index at given offset
 */
export function createGetRowIndex(dataKey: string): (offset: number) => number {
  return (positionOffset: number) => getRowIndex(dataKey, positionOffset);
}

/**
 * Appends a row number to a dataKey.
 *
 * @param dataKey - Base dataKey
 * @param rowNumber - Row number to append
 * @returns New dataKey with row number
 *
 * @example
 * ```typescript
 * appendRowToDataKey('Q1', 3) // 'Q1#3'
 * appendRowToDataKey('Section#2#Q1', 5) // 'Section#2#Q1#5'
 * ```
 */
export function appendRowToDataKey(dataKey: string, rowNumber: number): string {
  return `${dataKey}#${rowNumber}`;
}

/**
 * Gets the base dataKey without any row numbers.
 *
 * @param dataKey - Full dataKey
 * @returns Base dataKey
 *
 * @example
 * ```typescript
 * getBaseDataKey('Q1#2#3') // 'Q1'
 * getBaseDataKey('Q1@$ROW$') // 'Q1'
 * ```
 */
export function getBaseDataKey(dataKey: string): string {
  return dataKey.split('@')[0].split('#')[0];
}

// =============================================================================
// Reference Map Operations
// =============================================================================

/**
 * Builds a reference map from reference details.
 *
 * @param details - Array of reference detail objects
 * @returns Reference map for fast lookup
 */
export function buildReferenceMap(
  details: Array<{ dataKey: string }>
): ReferenceMap {
  const map: ReferenceMap = {};

  for (let index = 0; index < details.length; index++) {
    const fullDataKey = details[index].dataKey;

    // Add full key mapping
    if (!(fullDataKey in map)) {
      map[fullDataKey] = [[], []];
    }
    map[fullDataKey][0].push(index);
    map[fullDataKey][1].push(fullDataKey);

    // Add base key mapping for nested components
    const parts = fullDataKey.split('#');
    if (parts.length > 1) {
      const baseKey = parts[0];
      if (!(baseKey in map)) {
        map[baseKey] = [[], []];
      }
      map[baseKey][1].push(fullDataKey);
    }
  }

  return map;
}

/**
 * Looks up a component index in the reference map.
 *
 * @param dataKey - DataKey to look up
 * @param referenceMap - Reference map to search
 * @param returnAllKeys - If true, returns all matching dataKeys; if false, returns index
 * @returns Component index, array of dataKeys, or -1 if not found
 */
export function lookupInReferenceMap(
  dataKey: string,
  referenceMap: ReferenceMap,
  returnAllKeys = false
): number | string[] {
  if (dataKey in referenceMap) {
    if (returnAllKeys) {
      return referenceMap[dataKey][1];
    }
    return referenceMap[dataKey][0][0];
  }
  return returnAllKeys ? [] : -1;
}

// =============================================================================
// Dependency Map Building
// =============================================================================

/**
 * Component dependency maps for efficient relationship tracking
 */
export interface ComponentDependencyMaps {
  /** Maps dataKey to components that depend on it for enabling */
  enableMap: Record<string, Record<string, string[]>>;
  /** Maps dataKey to components that depend on it for validation */
  validMap: Record<string, string[]>;
  /** Maps dataKey to components that use it as sourceOption */
  sourceOptionMap: Record<string, string[]>;
  /** Maps dataKey to variable components that use it */
  varMap: Record<string, string[]>;
  /** Maps dataKey to components that use it as sourceQuestion */
  sourceQuestionMap: Record<string, string[]>;
}

/**
 * Builds dependency maps from template and validation data.
 *
 * @param templateComponents - Template component tree
 * @param validationTestFunctions - Validation test functions
 * @returns Component dependency maps
 */
export function buildDependencyMaps(
  templateComponents: unknown[],
  validationTestFunctions: Array<{
    dataKey: string;
    componentValidation?: string[];
  }>
): ComponentDependencyMaps {
  const enableMap: Record<string, Record<string, string[]>> = {};
  const validMap: Record<string, string[]> = {};
  const sourceOptionMap: Record<string, string[]> = {};
  const varMap: Record<string, string[]> = {};
  const sourceQuestionMap: Record<string, string[]> = {};

  // Recursive function to process template tree
  const processComponent = (component: {
    dataKey: string;
    type?: number;
    componentEnable?: string[];
    sourceOption?: string;
    componentVar?: string[];
    sourceQuestion?: string;
    components?: unknown[][];
  }) => {
    const { dataKey, type, componentEnable, sourceOption, componentVar, sourceQuestion, components } = component;

    // Process enable dependencies
    if (componentEnable) {
      componentEnable.forEach((item) => {
        const baseKey = item.split('@')[0].split('#')[0];
        if (!(baseKey in enableMap)) {
          enableMap[baseKey] = {};
        }
        if (!(item in enableMap[baseKey])) {
          enableMap[baseKey][item] = [];
        }
        if (!enableMap[baseKey][item].includes(dataKey)) {
          enableMap[baseKey][item].push(dataKey);
        }
      });
    }

    // Process sourceOption dependencies
    if (sourceOption) {
      const optionKey = sourceOption.split('@')[0];
      if (!(optionKey in sourceOptionMap)) {
        sourceOptionMap[optionKey] = [];
      }
      if (!sourceOptionMap[optionKey].includes(dataKey)) {
        sourceOptionMap[optionKey].push(dataKey);
      }
    }

    // Process variable dependencies (type 4 = Variable)
    if (componentVar && type === 4) {
      componentVar.forEach((item) => {
        if (!(item in varMap)) {
          varMap[item] = [];
        }
        if (!varMap[item].includes(dataKey)) {
          varMap[item].push(dataKey);
        }
      });
    }

    // Process sourceQuestion dependencies (type 2 = nested with source question)
    if (sourceQuestion && type === 2) {
      if (!(sourceQuestion in sourceQuestionMap)) {
        sourceQuestionMap[sourceQuestion] = [];
      }
      if (!sourceQuestionMap[sourceQuestion].includes(dataKey)) {
        sourceQuestionMap[sourceQuestion].push(dataKey);
      }
    }

    // Recursively process child components
    if (components) {
      components.forEach((componentArray) => {
        if (Array.isArray(componentArray)) {
          componentArray.forEach((child) => processComponent(child as typeof component));
        }
      });
    }
  };

  // Process all template components
  templateComponents.forEach((componentArray) => {
    if (Array.isArray(componentArray)) {
      componentArray.forEach((component) => processComponent(component as Parameters<typeof processComponent>[0]));
    }
  });

  // Process validation test functions
  validationTestFunctions.forEach((testFn) => {
    if (testFn.componentValidation) {
      testFn.componentValidation.forEach((item) => {
        if (!(item in validMap)) {
          validMap[item] = [];
        }
        validMap[item].push(testFn.dataKey);
      });
    }
  });

  return {
    enableMap,
    validMap,
    sourceOptionMap,
    varMap,
    sourceQuestionMap,
  };
}

// =============================================================================
// Index Comparison
// =============================================================================

/**
 * Compares two component indices for ordering.
 *
 * @param index1 - First index array
 * @param index2 - Second index array
 * @returns -1 if index1 < index2, 0 if equal, 1 if index1 > index2
 */
export function compareIndices(
  index1: number[],
  index2: number[]
): -1 | 0 | 1 {
  const minLength = Math.min(index1.length, index2.length);

  for (let i = 0; i < minLength; i++) {
    if (index1[i] < index2[i]) return -1;
    if (index1[i] > index2[i]) return 1;
  }

  // If all compared elements are equal, shorter array comes first
  if (index1.length < index2.length) return -1;
  if (index1.length > index2.length) return 1;

  return 0;
}

/**
 * Checks if an index is a child of a parent index.
 *
 * @param childIndex - Potential child index
 * @param parentIndex - Parent index
 * @returns True if childIndex is a descendant of parentIndex
 */
export function isChildIndex(
  childIndex: number[],
  parentIndex: number[]
): boolean {
  if (childIndex.length <= parentIndex.length) {
    return false;
  }

  for (let i = 0; i < parentIndex.length; i++) {
    if (childIndex[i] !== parentIndex[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Finds the insertion position for a new component based on its index.
 *
 * @param newIndex - Index of the new component
 * @param existingDetails - Existing reference details with indices
 * @returns Position to insert the new component
 */
export function findInsertPosition(
  newIndex: number[],
  existingDetails: Array<{ index: number[] }>
): number {
  const indexLength = newIndex.length;

  for (let looping = indexLength; looping > 1; looping--) {
    const searchIndex = newIndex.slice(0, looping);

    for (let i = existingDetails.length - 1; i >= 0; i--) {
      const existingIndex = existingDetails[i].index.slice(0, looping);

      if (JSON.stringify(existingIndex) === JSON.stringify(searchIndex)) {
        return i + 1;
      }
    }
  }

  return existingDetails.length;
}
