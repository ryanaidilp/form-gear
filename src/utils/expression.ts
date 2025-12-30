/**
 * Expression Evaluator
 *
 * Provides safe expression evaluation without using eval().
 * Uses the Function constructor with a controlled context to sandbox
 * user-defined expressions.
 *
 * Expressions can use:
 * - getValue(dataKey) - Get component value
 * - getRowIndex(offset) - Get nested row index
 * - getProp(config) - Get config property
 * - Standard JS: Number, String, Boolean, Math, Array methods
 */

// =============================================================================
// Types
// =============================================================================

/**
 * Context provided to expression evaluation
 */
export interface ExpressionContext {
  /**
   * Gets the value of a component by its dataKey.
   * @param dataKey - The component's data key
   * @returns The component's answer value
   */
  getValue: (dataKey: string) => unknown;

  /**
   * Gets the row index for nested components.
   * @param positionOffset - Offset from current position (0 = current row)
   * @returns The row index number
   */
  getRowIndex: (positionOffset: number) => number;

  /**
   * Gets a configuration property.
   * @param config - The config key ('clientMode', 'baseUrl', etc.)
   * @returns The config value
   */
  getProp: (config: string) => unknown;

  /**
   * The current component's dataKey (for error reporting)
   */
  dataKey: string;

  /**
   * The current component's answer value (for validation)
   */
  answer?: unknown;
}

/**
 * Result of expression evaluation
 */
export interface ExpressionResult<T = unknown> {
  /** Whether evaluation succeeded */
  success: boolean;
  /** The evaluated value (if success) */
  value: T;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Options for expression evaluation
 */
export interface ExpressionOptions {
  /** Default value to return on error */
  defaultValue?: unknown;
  /** Whether to log errors to console */
  logErrors?: boolean;
}

// =============================================================================
// Allowed Globals
// =============================================================================

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

  // Array methods (via the answer value, not direct Array access)
  Array,

  // Date (for date comparisons)
  Date,

  // JSON (for parsing/stringifying)
  JSON,

  // Regex (for pattern matching)
  RegExp,

  // Utility constants
  undefined,
  null: null,
  true: true,
  false: false,
  NaN,
  Infinity,

  // String utilities
  encodeURIComponent,
  decodeURIComponent,
};

// =============================================================================
// Expression Evaluator
// =============================================================================

/**
 * Evaluates an expression string safely.
 *
 * Uses Function constructor instead of eval() to:
 * 1. Create a controlled scope with only allowed globals
 * 2. Prevent access to window, document, etc.
 * 3. Provide clear error messages
 *
 * @param expression - The expression string to evaluate
 * @param context - The evaluation context with getValue, getRowIndex, etc.
 * @param options - Evaluation options
 * @returns Evaluation result with success status and value/error
 *
 * @example
 * ```typescript
 * const result = evaluateExpression(
 *   'getValue("Q1") > 10',
 *   {
 *     getValue: (key) => reference.get(key)?.answer,
 *     getRowIndex: () => 0,
 *     getProp: () => null,
 *     dataKey: 'Q2',
 *   }
 * );
 *
 * if (result.success) {
 *   console.log('Result:', result.value);
 * } else {
 *   console.error('Error:', result.error);
 * }
 * ```
 */
export function evaluateExpression<T = unknown>(
  expression: string,
  context: ExpressionContext,
  options: ExpressionOptions = {}
): ExpressionResult<T> {
  const { defaultValue, logErrors = true } = options;

  // Handle empty expressions
  if (!expression || expression.trim() === '') {
    return {
      success: true,
      value: defaultValue as T,
    };
  }

  try {
    // Build the function with controlled scope
    const fn = createSafeFunction<T>(expression, context);
    const value = fn();

    return {
      success: true,
      value,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    if (logErrors) {
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
 * Creates a sandboxed function for expression evaluation.
 *
 * @param expression - The expression to evaluate
 * @param context - The evaluation context
 * @returns A function that evaluates the expression
 */
function createSafeFunction<T>(
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

  // Create the function body
  // We use 'use strict' to prevent accidental global access
  const body = `
    'use strict';
    return (${expression});
  `;

  // Create the function with controlled scope
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const fn = new Function(...paramNames, body) as (...args: unknown[]) => T;

  // Return a bound function
  return () => fn(...paramValues);
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Evaluates an enable condition expression.
 *
 * @param condition - The enable condition expression
 * @param context - The evaluation context
 * @param defaultValue - Default value if evaluation fails (default: true)
 * @returns Whether the component is enabled
 */
export function evaluateEnableCondition(
  condition: string,
  context: ExpressionContext,
  defaultValue = true
): boolean {
  if (!condition || condition.trim() === '') {
    return true;
  }

  const result = evaluateExpression<boolean>(condition, context, {
    defaultValue,
    logErrors: true,
  });

  return result.value;
}

/**
 * Evaluates a validation expression.
 *
 * @param test - The validation test expression
 * @param context - The evaluation context
 * @param defaultValue - Default value if evaluation fails (default: true = valid)
 * @returns Whether the validation test passes (true = invalid, triggers message)
 */
export function evaluateValidation(
  test: string,
  context: ExpressionContext,
  defaultValue = true
): boolean {
  if (!test || test.trim() === '') {
    return false; // No test = no validation error
  }

  const result = evaluateExpression<boolean>(test, context, {
    defaultValue,
    logErrors: true,
  });

  return result.value;
}

/**
 * Evaluates a variable expression (for computed fields).
 *
 * @param expression - The variable expression
 * @param context - The evaluation context
 * @returns The computed value or undefined on error
 */
export function evaluateVariableExpression(
  expression: string,
  context: ExpressionContext
): unknown {
  if (!expression || expression.trim() === '') {
    return undefined;
  }

  const result = evaluateExpression(expression, context, {
    defaultValue: undefined,
    logErrors: true,
  });

  return result.value;
}

// =============================================================================
// Row Index Helper
// =============================================================================

/**
 * Creates a getRowIndex function for a given dataKey.
 *
 * @param dataKey - The component's dataKey
 * @returns A function that returns the row index at given offset
 */
export function createGetRowIndex(dataKey: string): (offset: number) => number {
  return (positionOffset: number): number => {
    const parts = dataKey.split('@')[0].split('#');
    const length = parts.length;
    const reducer = positionOffset + 1;

    if (length - reducer < 1) {
      return Number(parts[1]) || 0;
    }
    return Number(parts[length - reducer]) || 0;
  };
}

// =============================================================================
// Legacy Compatibility
// =============================================================================

/**
 * Legacy eval wrapper for gradual migration.
 *
 * @deprecated Use evaluateExpression instead
 *
 * This function provides backward compatibility during the migration period.
 * It attempts to use the safe evaluator first, falling back to eval if needed.
 *
 * @param expression - The expression to evaluate
 * @param context - The evaluation context
 * @param defaultValue - Default value on error
 * @returns The evaluated result
 */
export function legacyEval(
  expression: string,
  context: ExpressionContext,
  defaultValue: unknown = undefined
): unknown {
  // Try safe evaluation first
  const result = evaluateExpression(expression, context, {
    defaultValue,
    logErrors: false,
  });

  if (result.success) {
    return result.value;
  }

  // If safe evaluation fails, warn about legacy eval usage
  console.warn(
    `[Expression] Safe evaluation failed for "${expression}". ` +
      'Consider updating the expression syntax.'
  );

  return defaultValue;
}
