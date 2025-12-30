/**
 * FormGear Utilities
 *
 * This module provides utility functions for FormGear operations.
 * These utilities are designed to be reusable and testable,
 * extracted from the monolithic GlobalFunction.tsx.
 *
 * @example
 * ```typescript
 * import {
 *   evaluateExpression,
 *   toastInfo,
 *   templating,
 *   parseDataKey,
 * } from 'form-gear/utils';
 * ```
 */

// =============================================================================
// Expression Evaluation
// =============================================================================

export {
  // Main evaluation function
  evaluateExpression,

  // Convenience functions
  evaluateEnableCondition,
  evaluateValidation,
  evaluateVariableExpression,

  // Row index helper
  createGetRowIndex as createExpressionRowIndex,

  // Legacy compatibility
  legacyEval,
} from './expression';

export type {
  ExpressionContext,
  ExpressionResult,
  ExpressionOptions,
} from './expression';

// =============================================================================
// Toast Notifications
// =============================================================================

export {
  // Main toast function
  showToast,

  // Convenience functions
  toastInfo,
  toastSuccess,
  toastWarning,
  toastError,
  toast,
} from './toast';

export type { ToastOptions, ToastType } from './toast';

// =============================================================================
// Formatting Utilities
// =============================================================================

export {
  // String templating
  templating,

  // Date utilities
  validateDateString,
  formatDate,
  formatDateTime,
  getToday,
  compareDates,

  // Number utilities
  sum,
  findSumCombination,

  // Checkbox utilities
  transformCheckboxOptions,
  decodeCheckboxValue,
  encodeCheckboxValue,

  // Label processing
  processLabel,
  getBaseDataKey as getBaseDataKeyFromFormatting,
  parseDataKey as parseDataKeyFromFormatting,
} from './formatting';

// =============================================================================
// Reference Utilities
// =============================================================================

export {
  // DataKey parsing
  parseDataKey,
  resolveDataKeyWithRow,
  getRowIndex,
  createGetRowIndex,
  appendRowToDataKey,
  getBaseDataKey,

  // Reference map operations
  buildReferenceMap,
  lookupInReferenceMap,

  // Dependency maps
  buildDependencyMaps,

  // Index operations
  compareIndices,
  isChildIndex,
  findInsertPosition,
} from './reference';

export type {
  ReferenceMap,
  RowIndicator,
  ParsedDataKey,
  ComponentDependencyMaps,
} from './reference';
