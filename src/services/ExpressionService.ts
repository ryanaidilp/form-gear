/**
 * ExpressionService
 *
 * Safe expression evaluation service for FormGear.
 * Provides sandboxed execution of enable conditions, validations, and variable expressions.
 */

import type {
  FormStores,
  ExpressionContext,
  ExpressionResult,
  FormGearConfig,
} from '../core/types';
import { DEFAULTS } from '../core/constants';
import type { ReferenceService } from './ReferenceService';

/**
 * Options for expression evaluation
 */
interface ExpressionOptions<T = unknown> {
  /** Default value if evaluation fails */
  defaultValue?: T;
  /** Whether to log errors to console */
  logErrors?: boolean;
  /** Suppress all console output */
  silent?: boolean;
}

/**
 * Safe global functions and objects available in expressions.
 * This whitelist prevents access to dangerous APIs.
 */
const ALLOWED_GLOBALS: Record<string, unknown> = {
  // Type conversion
  Number,
  String,
  Boolean,
  parseInt,
  parseFloat,
  isNaN,
  isFinite,

  // Math
  Math,

  // Array (for array methods on answers)
  Array,

  // Date (for date comparisons)
  Date,

  // JSON (for parsing/stringifying)
  JSON,

  // Regex (for pattern matching)
  RegExp,

  // Utility constants
  // Note: null, true, false are reserved keywords and available by default
  // They cannot be used as function parameter names
  undefined,
  NaN,
  Infinity,

  // String utilities
  encodeURIComponent,
  decodeURIComponent,
};

/**
 * Service for safe expression evaluation.
 * Each FormGear instance gets its own ExpressionService.
 */
export class ExpressionService {
  private stores: FormStores;
  private referenceService: ReferenceService;
  private config: FormGearConfig;

  constructor(
    stores: FormStores,
    referenceService: ReferenceService,
    config: FormGearConfig
  ) {
    this.stores = stores;
    this.referenceService = referenceService;
    this.config = config;
  }

  // ===========================================================================
  // Public Evaluation Methods
  // ===========================================================================

  /**
   * Evaluate an enable condition expression.
   *
   * @param condition - The enable condition expression
   * @param dataKey - The component's dataKey for context
   * @param defaultValue - Value to return if evaluation fails (default: true)
   * @returns Boolean result of the condition
   */
  evaluateEnableCondition(
    condition: string,
    dataKey: string,
    defaultValue: boolean = DEFAULTS.ENABLE_CONDITION
  ): boolean {
    if (!condition || condition.trim() === '') {
      return true;
    }

    const context = this.createContext(dataKey);
    const result = this.evaluate<boolean>(condition, context, {
      defaultValue,
      logErrors: true,
    });

    return result.value;
  }

  /**
   * Evaluate a validation expression.
   * Returns true if the validation TEST FAILS (i.e., there is an error).
   *
   * @param test - The validation test expression
   * @param dataKey - The component's dataKey for context
   * @param answer - The current answer value
   * @returns Boolean - true means validation error, false means valid
   */
  evaluateValidation(
    test: string,
    dataKey: string,
    answer?: unknown
  ): boolean {
    if (!test || test.trim() === '') {
      return false; // No error if no test
    }

    const context = this.createContext(dataKey, answer);
    const result = this.evaluate<boolean>(test, context, {
      defaultValue: false, // Default to no error
      logErrors: true,
    });

    return result.value;
  }

  /**
   * Evaluate a variable expression.
   *
   * @param expression - The variable expression
   * @param dataKey - The component's dataKey for context
   * @returns The evaluated value or undefined
   */
  evaluateVariable(expression: string, dataKey: string): unknown {
    if (!expression || expression.trim() === '') {
      return undefined;
    }

    const context = this.createContext(dataKey);
    const result = this.evaluate(expression, context, {
      defaultValue: undefined,
      logErrors: true,
    });

    return result.value;
  }

  /**
   * Evaluate a generic expression and return the full result.
   *
   * @param expression - The expression to evaluate
   * @param dataKey - The component's dataKey for context
   * @param options - Evaluation options
   * @returns Full evaluation result with success status
   */
  evaluateExpression<T = unknown>(
    expression: string,
    dataKey: string,
    options: ExpressionOptions<T> = {}
  ): ExpressionResult<T> {
    const context = this.createContext(dataKey);
    return this.evaluate<T>(expression, context, options);
  }

  // ===========================================================================
  // Context Creation
  // ===========================================================================

  /**
   * Create an expression evaluation context.
   *
   * @param dataKey - The component's dataKey
   * @param answer - The current answer (for validation context)
   * @returns ExpressionContext object
   */
  createContext(dataKey: string, answer?: unknown): ExpressionContext {
    return {
      getValue: (key: string) => this.safeGetValue(key, dataKey),
      getRowIndex: (level?: number) => this.referenceService.getRowIndex(dataKey, level ?? 0),
      getProp: (prop: string) => this.getProp(prop),
      dataKey,
      answer,
    };
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Safe getValue that handles errors gracefully.
   */
  private safeGetValue(targetDataKey: string, currentDataKey: string): unknown {
    try {
      return this.referenceService.getValue(targetDataKey, currentDataKey);
    } catch (error) {
      console.warn(`[Expression] Error getting value for ${targetDataKey}:`, error);
      return '';
    }
  }

  /**
   * Get a configuration property.
   */
  private getProp(prop: string): unknown {
    switch (prop) {
      case 'clientMode':
        return this.config.clientMode;
      case 'formMode':
        return this.config.formMode;
      case 'baseUrl':
        return this.config.baseUrl ?? '';
      case 'username':
        return this.config.username ?? '';
      case 'token':
        return this.config.token ?? '';
      default:
        return undefined;
    }
  }

  /**
   * Core expression evaluation using sandboxed Function constructor.
   */
  private evaluate<T = unknown>(
    expression: string,
    context: ExpressionContext,
    options: ExpressionOptions<T> = {}
  ): ExpressionResult<T> {
    const { defaultValue, logErrors = true, silent = false } = options;

    // Handle empty expressions
    if (!expression || expression.trim() === '') {
      return {
        success: true,
        value: defaultValue as T,
      };
    }

    try {
      // Build the sandboxed function
      const fn = this.createSafeFunction<T>(expression, context);
      const value = fn();

      return {
        success: true,
        value,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (logErrors && !silent) {
        console.error(
          `[Expression] Error evaluating "${expression}" for ${context.dataKey}:`,
          errorMessage
        );
      }

      return {
        success: false,
        value: defaultValue as T,
        error: errorMessage,
      };
    }
  }

  /**
   * Create a sandboxed function for expression evaluation.
   *
   * Uses Function constructor instead of eval() to:
   * 1. Create a controlled scope with only allowed globals
   * 2. Prevent access to window, document, etc.
   * 3. Provide clear error messages
   */
  private createSafeFunction<T>(
    expression: string,
    context: ExpressionContext
  ): () => T {
    // Build parameter names and values
    const paramNames = [
      'getValue',
      'getRowIndex',
      'getProp',
      'answer',
      'rowIndex',
      ...Object.keys(ALLOWED_GLOBALS),
    ];

    const paramValues = [
      context.getValue,
      context.getRowIndex,
      context.getProp,
      context.answer,
      context.getRowIndex(0), // rowIndex shorthand
      ...Object.values(ALLOWED_GLOBALS),
    ];

    // Create the function body with strict mode
    const body = `
      'use strict';
      return (${expression});
    `;

    try {
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function(...paramNames, body) as (...args: unknown[]) => T;
      return () => fn(...paramValues);
    } catch (syntaxError) {
      // Re-throw with more context
      throw new Error(
        `Syntax error in expression "${expression}": ${
          syntaxError instanceof Error ? syntaxError.message : String(syntaxError)
        }`
      );
    }
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  /**
   * Validate that an expression is syntactically correct without executing it.
   *
   * @param expression - The expression to validate
   * @returns Object with isValid and optional error message
   */
  validateSyntax(expression: string): { isValid: boolean; error?: string } {
    if (!expression || expression.trim() === '') {
      return { isValid: true };
    }

    try {
      // Try to parse the expression as a function body
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(`return (${expression})`);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Extract variable references from an expression.
   * Useful for building dependency maps.
   *
   * @param expression - The expression to analyze
   * @returns Array of dataKeys referenced in the expression
   */
  extractReferences(expression: string): string[] {
    if (!expression) return [];

    const references: string[] = [];

    // Match getValue('dataKey') or getValue("dataKey")
    const getValuePattern = /getValue\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;

    while ((match = getValuePattern.exec(expression)) !== null) {
      references.push(match[1]);
    }

    return [...new Set(references)]; // Remove duplicates
  }
}
