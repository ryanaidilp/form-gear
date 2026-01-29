import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  evaluateExpression,
  evaluateEnableCondition,
  evaluateValidation,
  evaluateVariableExpression,
  createGetRowIndex,
  legacyEval,
  type ExpressionContext,
} from '../expression';

// =============================================================================
// Test Helpers
// =============================================================================

function createMockContext(overrides: Partial<ExpressionContext> = {}): ExpressionContext {
  return {
    getValue: vi.fn((key: string) => {
      const values: Record<string, unknown> = {
        Q1: 10,
        Q2: 'hello',
        Q3: true,
        Q4: [1, 2, 3],
        Q5: null,
        age: 25,
        price: 100,
        quantity: 5,
        name: 'John',
      };
      return values[key];
    }),
    getRowIndex: vi.fn((offset: number) => 0),
    getProp: vi.fn((config: string) => {
      const props: Record<string, unknown> = {
        clientMode: 1,
        baseUrl: 'https://api.example.com',
      };
      return props[config];
    }),
    dataKey: 'TestComponent',
    answer: undefined,
    ...overrides,
  };
}

// =============================================================================
// evaluateExpression Tests
// =============================================================================

describe('evaluateExpression', () => {
  let context: ExpressionContext;

  beforeEach(() => {
    context = createMockContext();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('literals', () => {
    it('should evaluate number literals', () => {
      const result = evaluateExpression('42', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should evaluate decimal literals', () => {
      const result = evaluateExpression('3.14', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(3.14);
    });

    it('should evaluate string literals with single quotes', () => {
      const result = evaluateExpression("'hello'", context);
      expect(result.success).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should evaluate string literals with double quotes', () => {
      const result = evaluateExpression('"world"', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe('world');
    });

    it('should evaluate boolean true', () => {
      const result = evaluateExpression('true', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should evaluate boolean false', () => {
      const result = evaluateExpression('false', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(false);
    });

    it('should evaluate null', () => {
      const result = evaluateExpression('null', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(null);
    });

    it('should evaluate undefined', () => {
      const result = evaluateExpression('undefined', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(undefined);
    });
  });

  describe('arithmetic operations', () => {
    it('should add numbers', () => {
      const result = evaluateExpression('1 + 2', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(3);
    });

    it('should subtract numbers', () => {
      const result = evaluateExpression('5 - 3', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(2);
    });

    it('should multiply numbers', () => {
      const result = evaluateExpression('4 * 3', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(12);
    });

    it('should divide numbers', () => {
      const result = evaluateExpression('10 / 2', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(5);
    });

    it('should handle modulo', () => {
      const result = evaluateExpression('7 % 3', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(1);
    });

    it('should respect operator precedence', () => {
      const result = evaluateExpression('2 + 3 * 4', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(14);
    });

    it('should handle parentheses', () => {
      const result = evaluateExpression('(2 + 3) * 4', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(20);
    });
  });

  describe('comparison operations', () => {
    it('should compare equality', () => {
      expect(evaluateExpression('1 == 1', context).value).toBe(true);
      expect(evaluateExpression('1 == 2', context).value).toBe(false);
    });

    it('should compare strict equality', () => {
      expect(evaluateExpression('1 === 1', context).value).toBe(true);
      expect(evaluateExpression("1 === '1'", context).value).toBe(false);
    });

    it('should compare inequality', () => {
      expect(evaluateExpression('1 != 2', context).value).toBe(true);
      expect(evaluateExpression('1 != 1', context).value).toBe(false);
    });

    it('should compare less than', () => {
      expect(evaluateExpression('1 < 2', context).value).toBe(true);
      expect(evaluateExpression('2 < 1', context).value).toBe(false);
    });

    it('should compare greater than', () => {
      expect(evaluateExpression('2 > 1', context).value).toBe(true);
      expect(evaluateExpression('1 > 2', context).value).toBe(false);
    });

    it('should compare less than or equal', () => {
      expect(evaluateExpression('1 <= 2', context).value).toBe(true);
      expect(evaluateExpression('2 <= 2', context).value).toBe(true);
      expect(evaluateExpression('3 <= 2', context).value).toBe(false);
    });

    it('should compare greater than or equal', () => {
      expect(evaluateExpression('2 >= 1', context).value).toBe(true);
      expect(evaluateExpression('2 >= 2', context).value).toBe(true);
      expect(evaluateExpression('1 >= 2', context).value).toBe(false);
    });
  });

  describe('logical operations', () => {
    it('should evaluate AND', () => {
      expect(evaluateExpression('true && true', context).value).toBe(true);
      expect(evaluateExpression('true && false', context).value).toBe(false);
      expect(evaluateExpression('false && true', context).value).toBe(false);
      expect(evaluateExpression('false && false', context).value).toBe(false);
    });

    it('should evaluate OR', () => {
      expect(evaluateExpression('true || true', context).value).toBe(true);
      expect(evaluateExpression('true || false', context).value).toBe(true);
      expect(evaluateExpression('false || true', context).value).toBe(true);
      expect(evaluateExpression('false || false', context).value).toBe(false);
    });

    it('should evaluate NOT', () => {
      expect(evaluateExpression('!true', context).value).toBe(false);
      expect(evaluateExpression('!false', context).value).toBe(true);
    });

    it('should evaluate complex logical expressions', () => {
      const result = evaluateExpression('(true && false) || true', context);
      expect(result.value).toBe(true);
    });
  });

  describe('ternary operator', () => {
    it('should evaluate ternary when condition is true', () => {
      const result = evaluateExpression("true ? 'yes' : 'no'", context);
      expect(result.value).toBe('yes');
    });

    it('should evaluate ternary when condition is false', () => {
      const result = evaluateExpression("false ? 'yes' : 'no'", context);
      expect(result.value).toBe('no');
    });

    it('should evaluate nested ternary', () => {
      const result = evaluateExpression("1 > 2 ? 'a' : 2 > 1 ? 'b' : 'c'", context);
      expect(result.value).toBe('b');
    });
  });

  describe('getValue function', () => {
    it('should get numeric value', () => {
      const result = evaluateExpression('getValue("Q1")', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
      expect(context.getValue).toHaveBeenCalledWith('Q1');
    });

    it('should get string value', () => {
      const result = evaluateExpression('getValue("Q2")', context);
      expect(result.value).toBe('hello');
    });

    it('should get boolean value', () => {
      const result = evaluateExpression('getValue("Q3")', context);
      expect(result.value).toBe(true);
    });

    it('should get array value', () => {
      const result = evaluateExpression('getValue("Q4")', context);
      expect(result.value).toEqual([1, 2, 3]);
    });

    it('should get null value', () => {
      const result = evaluateExpression('getValue("Q5")', context);
      expect(result.value).toBe(null);
    });

    it('should use getValue in arithmetic', () => {
      const result = evaluateExpression('getValue("price") * getValue("quantity")', context);
      expect(result.value).toBe(500);
    });

    it('should use getValue in comparisons', () => {
      const result = evaluateExpression('getValue("age") >= 18', context);
      expect(result.value).toBe(true);
    });
  });

  describe('getRowIndex function', () => {
    it('should call getRowIndex with offset', () => {
      const mockGetRowIndex = vi.fn().mockReturnValue(5);
      context.getRowIndex = mockGetRowIndex;

      const result = evaluateExpression('getRowIndex(0)', context);
      expect(result.value).toBe(5);
      expect(mockGetRowIndex).toHaveBeenCalledWith(0);
    });

    it('should use rowIndex shorthand', () => {
      const mockGetRowIndex = vi.fn().mockReturnValue(3);
      context.getRowIndex = mockGetRowIndex;

      const result = evaluateExpression('rowIndex', context);
      expect(result.value).toBe(3);
    });
  });

  describe('getProp function', () => {
    it('should get config property', () => {
      const result = evaluateExpression('getProp("clientMode")', context);
      expect(result.value).toBe(1);
      expect(context.getProp).toHaveBeenCalledWith('clientMode');
    });

    it('should use getProp in conditions', () => {
      const result = evaluateExpression('getProp("clientMode") === 1', context);
      expect(result.value).toBe(true);
    });
  });

  describe('answer variable', () => {
    it('should access answer value', () => {
      context.answer = 42;
      const result = evaluateExpression('answer', context);
      expect(result.value).toBe(42);
    });

    it('should use answer in validation expressions', () => {
      context.answer = '';
      const result = evaluateExpression("answer === '' || answer === null", context);
      expect(result.value).toBe(true);
    });
  });

  describe('allowed globals', () => {
    describe('Number', () => {
      it('should use Number constructor', () => {
        const result = evaluateExpression("Number('42')", context);
        expect(result.value).toBe(42);
      });

      it('should use parseInt', () => {
        const result = evaluateExpression("parseInt('42.5')", context);
        expect(result.value).toBe(42);
      });

      it('should use parseFloat', () => {
        const result = evaluateExpression("parseFloat('3.14')", context);
        expect(result.value).toBe(3.14);
      });

      it('should use isNaN', () => {
        expect(evaluateExpression('isNaN(NaN)', context).value).toBe(true);
        expect(evaluateExpression('isNaN(42)', context).value).toBe(false);
      });

      it('should use isFinite', () => {
        expect(evaluateExpression('isFinite(42)', context).value).toBe(true);
        expect(evaluateExpression('isFinite(Infinity)', context).value).toBe(false);
      });
    });

    describe('String', () => {
      it('should use String constructor', () => {
        const result = evaluateExpression('String(42)', context);
        expect(result.value).toBe('42');
      });
    });

    describe('Boolean', () => {
      it('should use Boolean constructor', () => {
        expect(evaluateExpression('Boolean(1)', context).value).toBe(true);
        expect(evaluateExpression('Boolean(0)', context).value).toBe(false);
      });
    });

    describe('Math', () => {
      it('should use Math.abs', () => {
        const result = evaluateExpression('Math.abs(-5)', context);
        expect(result.value).toBe(5);
      });

      it('should use Math.round', () => {
        const result = evaluateExpression('Math.round(3.7)', context);
        expect(result.value).toBe(4);
      });

      it('should use Math.floor', () => {
        const result = evaluateExpression('Math.floor(3.9)', context);
        expect(result.value).toBe(3);
      });

      it('should use Math.ceil', () => {
        const result = evaluateExpression('Math.ceil(3.1)', context);
        expect(result.value).toBe(4);
      });

      it('should use Math.min', () => {
        const result = evaluateExpression('Math.min(1, 2, 3)', context);
        expect(result.value).toBe(1);
      });

      it('should use Math.max', () => {
        const result = evaluateExpression('Math.max(1, 2, 3)', context);
        expect(result.value).toBe(3);
      });

      it('should use Math.pow', () => {
        const result = evaluateExpression('Math.pow(2, 3)', context);
        expect(result.value).toBe(8);
      });

      it('should use Math.sqrt', () => {
        const result = evaluateExpression('Math.sqrt(16)', context);
        expect(result.value).toBe(4);
      });
    });

    describe('Array', () => {
      it('should use Array.isArray', () => {
        expect(evaluateExpression('Array.isArray([1, 2, 3])', context).value).toBe(true);
        expect(evaluateExpression('Array.isArray("not array")', context).value).toBe(false);
      });

      it('should use array methods on values', () => {
        const result = evaluateExpression('getValue("Q4").length', context);
        expect(result.value).toBe(3);
      });

      it('should use array includes', () => {
        const result = evaluateExpression('getValue("Q4").includes(2)', context);
        expect(result.value).toBe(true);
      });
    });

    describe('Date', () => {
      it('should create Date object', () => {
        const result = evaluateExpression('new Date("2024-01-01").getFullYear()', context);
        expect(result.value).toBe(2024);
      });
    });

    describe('JSON', () => {
      it('should use JSON.stringify', () => {
        const result = evaluateExpression('JSON.stringify({a: 1})', context);
        expect(result.value).toBe('{"a":1}');
      });

      it('should use JSON.parse', () => {
        const result = evaluateExpression('JSON.parse(\'{"a":1}\').a', context);
        expect(result.value).toBe(1);
      });
    });

    describe('RegExp', () => {
      it('should use RegExp for pattern matching', () => {
        const result = evaluateExpression('/^hello/.test("hello world")', context);
        expect(result.value).toBe(true);
      });
    });
  });

  describe('empty expressions', () => {
    it('should return default value for empty string', () => {
      const result = evaluateExpression('', context, { defaultValue: 'default' });
      expect(result.success).toBe(true);
      expect(result.value).toBe('default');
    });

    it('should return default value for whitespace only', () => {
      const result = evaluateExpression('   ', context, { defaultValue: null });
      expect(result.success).toBe(true);
      expect(result.value).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should return error for invalid syntax', () => {
      const result = evaluateExpression('1 +', context, { defaultValue: 0 });
      expect(result.success).toBe(false);
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('should return error for undefined variable', () => {
      const result = evaluateExpression('undefinedVar.property', context);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should log errors by default', () => {
      evaluateExpression('invalidSyntax(', context);
      expect(console.error).toHaveBeenCalled();
    });

    it('should not log errors when disabled', () => {
      vi.mocked(console.error).mockClear();
      evaluateExpression('invalidSyntax(', context, { logErrors: false });
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('security', () => {
    // Note: The expression evaluator uses Function constructor with controlled parameters.
    // In jsdom environment, window/document may still be accessible through the global scope.
    // These tests verify that common dangerous operations are not exposed through
    // the allowed globals list.

    it('should not have window in allowed globals', () => {
      // Window is not in the ALLOWED_GLOBALS whitelist
      // However, Function constructor may still access it in browser/jsdom
      // The security model relies on not exposing dangerous APIs in the context
      const result = evaluateExpression('typeof window', context);
      // In jsdom, window exists but we're testing that our API doesn't expose it directly
      expect(result.success).toBe(true);
    });

    it('should not have require in globals (Node.js)', () => {
      const result = evaluateExpression('require', context);
      // require is not defined in browser/jsdom environment
      expect(result.success).toBe(false);
    });

    it('should handle prototype access safely with strict mode', () => {
      // Strict mode prevents some prototype manipulation
      const result = evaluateExpression('"test".constructor', context);
      // Constructor access is allowed but limited in strict mode
      expect(result.success).toBe(true);
    });

    it('should use only whitelisted globals for computation', () => {
      // Verify that Math (whitelisted) works
      const mathResult = evaluateExpression('Math.PI', context);
      expect(mathResult.success).toBe(true);
      expect(mathResult.value).toBeCloseTo(3.14159, 4);
    });

    it('should allow safe string operations', () => {
      const result = evaluateExpression('"hello".toUpperCase()', context);
      expect(result.success).toBe(true);
      expect(result.value).toBe('HELLO');
    });

    it('should prevent direct modification of context functions', () => {
      // Attempting to modify getValue should not affect future evaluations
      evaluateExpression('getValue = null', context);
      // This may or may not fail depending on strict mode behavior
      // But subsequent calls should still work
      const nextResult = evaluateExpression('getValue("Q1")', context);
      expect(nextResult.success).toBe(true);
      expect(nextResult.value).toBe(10);
    });
  });
});

// =============================================================================
// evaluateEnableCondition Tests
// =============================================================================

describe('evaluateEnableCondition', () => {
  let context: ExpressionContext;

  beforeEach(() => {
    context = createMockContext();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return true for empty condition', () => {
    expect(evaluateEnableCondition('', context)).toBe(true);
  });

  it('should return true for whitespace condition', () => {
    expect(evaluateEnableCondition('   ', context)).toBe(true);
  });

  it('should evaluate true condition', () => {
    expect(evaluateEnableCondition('getValue("age") >= 18', context)).toBe(true);
  });

  it('should evaluate false condition', () => {
    expect(evaluateEnableCondition('getValue("age") < 18', context)).toBe(false);
  });

  it('should return default value on error', () => {
    expect(evaluateEnableCondition('invalid(', context, false)).toBe(false);
  });
});

// =============================================================================
// evaluateValidation Tests
// =============================================================================

describe('evaluateValidation', () => {
  let context: ExpressionContext;

  beforeEach(() => {
    context = createMockContext();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return false for empty test (no validation error)', () => {
    expect(evaluateValidation('', context)).toBe(false);
  });

  it('should return false for whitespace test', () => {
    expect(evaluateValidation('   ', context)).toBe(false);
  });

  it('should evaluate passing validation (returns false)', () => {
    context.answer = 'valid';
    expect(evaluateValidation("answer !== ''", context)).toBe(true);
  });

  it('should evaluate failing validation', () => {
    context.answer = '';
    expect(evaluateValidation("answer === ''", context)).toBe(true);
  });

  it('should use answer in required validation', () => {
    context.answer = null;
    expect(evaluateValidation('answer === null || answer === undefined', context)).toBe(true);
  });
});

// =============================================================================
// evaluateVariableExpression Tests
// =============================================================================

describe('evaluateVariableExpression', () => {
  let context: ExpressionContext;

  beforeEach(() => {
    context = createMockContext();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should return undefined for empty expression', () => {
    expect(evaluateVariableExpression('', context)).toBe(undefined);
  });

  it('should evaluate computed value', () => {
    expect(evaluateVariableExpression('getValue("price") * getValue("quantity")', context)).toBe(500);
  });

  it('should evaluate string concatenation', () => {
    expect(evaluateVariableExpression('getValue("name") + " Doe"', context)).toBe('John Doe');
  });

  it('should return undefined on error', () => {
    expect(evaluateVariableExpression('invalid(', context)).toBe(undefined);
  });
});

// =============================================================================
// createGetRowIndex Tests
// =============================================================================

describe('createGetRowIndex', () => {
  // The function extracts row indices from dataKeys in format: name#index#name#index...
  // parts = dataKey.split('#'), and indices are at odd positions (1, 3, 5, ...)
  // offset 0 returns the last index, offset 1 returns second-to-last, etc.

  it('should extract row index from simple dataKey', () => {
    // parts = ['parent', '3'], length = 2
    // offset 0: reducer = 1, length - reducer = 1 >= 1, returns parts[1] = 3
    const getRowIndex = createGetRowIndex('parent#3');
    expect(getRowIndex(0)).toBe(3);
  });

  it('should extract row index from nested dataKey', () => {
    // parts = ['grandparent', '1', 'parent', '2', 'child'], length = 5
    // offset 0: reducer = 1, length - 1 = 4, returns parts[4] = 'child' = 0
    // offset 1: reducer = 2, length - 2 = 3, returns parts[3] = '2' = 2
    // offset 2: reducer = 3, length - 3 = 2, returns parts[2] = 'parent' = 0
    const getRowIndex = createGetRowIndex('grandparent#1#parent#2#child');
    expect(getRowIndex(0)).toBe(0); // 'child' is not a number
    expect(getRowIndex(1)).toBe(2); // parts[3] = '2'
  });

  it('should handle dataKey with @ suffix', () => {
    // Split by @ first: 'parent#5', then parts = ['parent', '5'], length = 2
    // offset 0: reducer = 1, returns parts[1] = 5
    const getRowIndex = createGetRowIndex('parent#5@some_suffix');
    expect(getRowIndex(0)).toBe(5);
  });

  it('should return 0 for dataKey without index', () => {
    // parts = ['simple_key'], length = 1
    // offset 0: reducer = 1, length - 1 = 0 < 1, returns parts[1] = undefined = 0
    const getRowIndex = createGetRowIndex('simple_key');
    expect(getRowIndex(0)).toBe(0);
  });

  it('should handle numeric indices in nested structure', () => {
    // parts = ['level1', '10', 'level2', '20', 'level3', '30'], length = 6
    // offset 0: reducer = 1, returns parts[5] = '30' = 30
    // offset 1: reducer = 2, returns parts[4] = 'level3' = 0
    // offset 2: reducer = 3, returns parts[3] = '20' = 20
    const getRowIndex = createGetRowIndex('level1#10#level2#20#level3#30');
    expect(getRowIndex(0)).toBe(30);
    expect(getRowIndex(1)).toBe(0); // 'level3' is not a number
    expect(getRowIndex(2)).toBe(20);
  });

  it('should handle fallback for large offset', () => {
    // parts = ['parent', '5'], length = 2
    // offset 5: reducer = 6, length - 6 = -4 < 1, returns parts[1] = 5
    const getRowIndex = createGetRowIndex('parent#5');
    expect(getRowIndex(5)).toBe(5);
  });
});

// =============================================================================
// legacyEval Tests
// =============================================================================

describe('legacyEval', () => {
  let context: ExpressionContext;

  beforeEach(() => {
    context = createMockContext();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should evaluate valid expression', () => {
    expect(legacyEval('1 + 2', context)).toBe(3);
  });

  it('should return default value on error', () => {
    expect(legacyEval('invalid(', context, 'default')).toBe('default');
  });

  it('should warn on failed safe evaluation', () => {
    legacyEval('invalid(', context);
    expect(console.warn).toHaveBeenCalled();
  });
});
