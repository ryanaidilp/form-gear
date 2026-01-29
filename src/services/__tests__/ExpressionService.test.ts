import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpressionService } from '../ExpressionService';
import { createFormStores, type FormStores } from '../../stores/createStores';
import type { FormGearConfig, ReferenceDetail } from '../../core/types';
import { ComponentType, ValidationState, InitialMode, LookupMode } from '../../core/constants';

// Mock ReferenceService
const createMockReferenceService = () => ({
  getIndex: vi.fn(),
  getComponent: vi.fn(),
  getValue: vi.fn(),
  resolveDataKey: vi.fn(),
  getRowIndex: vi.fn().mockReturnValue(0),
  rebuildIndexMap: vi.fn(),
  initializeMaps: vi.fn(),
  getEnableDependents: vi.fn(),
  getValidationDependents: vi.fn(),
  getVariableDependents: vi.fn(),
  getSourceOptionDependents: vi.fn(),
  getNestedDependents: vi.fn(),
  updateComponent: vi.fn(),
  updateComponentBatch: vi.fn(),
  registerDynamicComponents: vi.fn(),
});

const defaultConfig: FormGearConfig = {
  clientMode: 1,
  formMode: 1,
  baseUrl: 'https://api.example.com',
  username: 'testuser',
  token: 'test-token',
  initialMode: InitialMode.INITIAL,
  lookupMode: LookupMode.ONLINE,
};

describe('ExpressionService', () => {
  let stores: FormStores;
  let expressionService: ExpressionService;
  let mockReferenceService: ReturnType<typeof createMockReferenceService>;

  beforeEach(() => {
    stores = createFormStores();
    mockReferenceService = createMockReferenceService();
    expressionService = new ExpressionService(
      stores,
      mockReferenceService as never,
      defaultConfig
    );
    vi.clearAllMocks();
  });

  describe('evaluateEnableCondition', () => {
    it('should return true for empty condition', () => {
      expect(expressionService.evaluateEnableCondition('', 'Q1')).toBe(true);
    });

    it('should return true for whitespace-only condition', () => {
      expect(expressionService.evaluateEnableCondition('   ', 'Q1')).toBe(true);
    });

    it('should evaluate simple boolean expressions', () => {
      expect(expressionService.evaluateEnableCondition('true', 'Q1')).toBe(true);
      expect(expressionService.evaluateEnableCondition('false', 'Q1')).toBe(false);
    });

    it('should evaluate numeric comparisons', () => {
      expect(expressionService.evaluateEnableCondition('5 > 3', 'Q1')).toBe(true);
      expect(expressionService.evaluateEnableCondition('2 > 10', 'Q1')).toBe(false);
      expect(expressionService.evaluateEnableCondition('10 === 10', 'Q1')).toBe(true);
      expect(expressionService.evaluateEnableCondition('5 >= 5', 'Q1')).toBe(true);
      expect(expressionService.evaluateEnableCondition('3 <= 5', 'Q1')).toBe(true);
    });

    it('should evaluate string comparisons', () => {
      expect(expressionService.evaluateEnableCondition('"test" === "test"', 'Q1')).toBe(true);
      expect(expressionService.evaluateEnableCondition('"abc" !== "xyz"', 'Q1')).toBe(true);
    });

    it('should evaluate expressions with getValue', () => {
      mockReferenceService.getValue.mockReturnValue('yes');

      const result = expressionService.evaluateEnableCondition(
        "getValue('Q1') === 'yes'",
        'Q2'
      );

      expect(result).toBe(true);
      expect(mockReferenceService.getValue).toHaveBeenCalledWith('Q1', 'Q2');
    });

    it('should evaluate complex conditions with AND', () => {
      mockReferenceService.getValue
        .mockReturnValueOnce(25)
        .mockReturnValueOnce('male');

      const result = expressionService.evaluateEnableCondition(
        "getValue('age') >= 18 && getValue('gender') === 'male'",
        'Q3'
      );

      expect(result).toBe(true);
    });

    it('should evaluate complex conditions with OR', () => {
      mockReferenceService.getValue
        .mockReturnValueOnce(15)
        .mockReturnValueOnce('student');

      const result = expressionService.evaluateEnableCondition(
        "getValue('age') >= 18 || getValue('status') === 'student'",
        'Q3'
      );

      expect(result).toBe(true);
    });

    it('should return default value on syntax error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = expressionService.evaluateEnableCondition(
        'invalid syntax !!!',
        'Q1'
      );

      expect(result).toBe(true); // Default value
      consoleSpy.mockRestore();
    });

    it('should use custom default value', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = expressionService.evaluateEnableCondition(
        'invalid syntax !!!',
        'Q1',
        false
      );

      expect(result).toBe(false); // Custom default
      consoleSpy.mockRestore();
    });
  });

  describe('evaluateValidation', () => {
    it('should return false for empty test', () => {
      expect(expressionService.evaluateValidation('', 'Q1')).toBe(false);
    });

    it('should return false for whitespace-only test', () => {
      expect(expressionService.evaluateValidation('   ', 'Q1')).toBe(false);
    });

    it('should evaluate validation with answer context', () => {
      // Test: answer is empty (validation fails = true)
      const result = expressionService.evaluateValidation(
        'answer === "" || answer === undefined',
        'Q1',
        ''
      );

      expect(result).toBe(true); // Validation error
    });

    it('should evaluate required field validation', () => {
      // Test passes (no error) when answer is provided
      const resultWithAnswer = expressionService.evaluateValidation(
        '!answer || answer === ""',
        'Q1',
        'some value'
      );

      expect(resultWithAnswer).toBe(false); // No validation error

      // Test fails (has error) when answer is empty
      const resultEmpty = expressionService.evaluateValidation(
        '!answer || answer === ""',
        'Q1',
        ''
      );

      expect(resultEmpty).toBe(true); // Validation error
    });

    it('should evaluate numeric validation', () => {
      // Test: value must be >= 18
      const resultValid = expressionService.evaluateValidation(
        'answer < 18',
        'Q1',
        25
      );

      expect(resultValid).toBe(false); // No error, 25 >= 18

      const resultInvalid = expressionService.evaluateValidation(
        'answer < 18',
        'Q1',
        15
      );

      expect(resultInvalid).toBe(true); // Error, 15 < 18
    });

    it('should evaluate string length validation', () => {
      const resultValid = expressionService.evaluateValidation(
        'typeof answer === "string" && answer.length < 3',
        'Q1',
        'hello'
      );

      expect(resultValid).toBe(false); // No error

      const resultInvalid = expressionService.evaluateValidation(
        'typeof answer === "string" && answer.length < 3',
        'Q1',
        'ab'
      );

      expect(resultInvalid).toBe(true); // Error, length < 3
    });

    it('should evaluate regex validation', () => {
      const emailRegex = '!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(answer || "")';

      const resultValid = expressionService.evaluateValidation(
        emailRegex,
        'email',
        'test@example.com'
      );

      expect(resultValid).toBe(false); // No error

      const resultInvalid = expressionService.evaluateValidation(
        emailRegex,
        'email',
        'invalid-email'
      );

      expect(resultInvalid).toBe(true); // Error
    });

    it('should validate with getValue for cross-field validation', () => {
      mockReferenceService.getValue.mockReturnValue('password123');

      // Confirm password must match password
      const result = expressionService.evaluateValidation(
        "answer !== getValue('password')",
        'confirmPassword',
        'password123'
      );

      expect(result).toBe(false); // No error, passwords match
    });
  });

  describe('evaluateVariable', () => {
    it('should return undefined for empty expression', () => {
      expect(expressionService.evaluateVariable('', 'Q1')).toBeUndefined();
    });

    it('should evaluate simple arithmetic', () => {
      expect(expressionService.evaluateVariable('5 + 3', 'Q1')).toBe(8);
      expect(expressionService.evaluateVariable('10 * 2', 'Q1')).toBe(20);
      expect(expressionService.evaluateVariable('100 / 4', 'Q1')).toBe(25);
    });

    it('should evaluate string concatenation', () => {
      expect(expressionService.evaluateVariable('"Hello" + " " + "World"', 'Q1')).toBe(
        'Hello World'
      );
    });

    it('should evaluate with getValue', () => {
      mockReferenceService.getValue
        .mockReturnValueOnce(10)
        .mockReturnValueOnce(20);

      const result = expressionService.evaluateVariable(
        "getValue('Q1') + getValue('Q2')",
        'total'
      );

      expect(result).toBe(30);
    });

    it('should evaluate Math functions', () => {
      expect(expressionService.evaluateVariable('Math.round(4.7)', 'Q1')).toBe(5);
      expect(expressionService.evaluateVariable('Math.floor(4.7)', 'Q1')).toBe(4);
      expect(expressionService.evaluateVariable('Math.ceil(4.2)', 'Q1')).toBe(5);
      expect(expressionService.evaluateVariable('Math.max(1, 5, 3)', 'Q1')).toBe(5);
      expect(expressionService.evaluateVariable('Math.min(1, 5, 3)', 'Q1')).toBe(1);
      expect(expressionService.evaluateVariable('Math.abs(-10)', 'Q1')).toBe(10);
    });

    it('should evaluate ternary expressions', () => {
      mockReferenceService.getValue.mockReturnValue(25);

      const result = expressionService.evaluateVariable(
        "getValue('age') >= 18 ? 'Adult' : 'Minor'",
        'status'
      );

      expect(result).toBe('Adult');
    });

    it('should evaluate array operations', () => {
      expect(expressionService.evaluateVariable('[1, 2, 3].length', 'Q1')).toBe(3);
      expect(expressionService.evaluateVariable('[1, 2, 3].includes(2)', 'Q1')).toBe(
        true
      );
      expect(expressionService.evaluateVariable('[1, 2, 3].indexOf(2)', 'Q1')).toBe(1);
    });
  });

  describe('evaluateExpression', () => {
    it('should return full result object', () => {
      const result = expressionService.evaluateExpression<number>('5 + 5', 'Q1');

      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
      expect(result.error).toBeUndefined();
    });

    it('should return error info on failure', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = expressionService.evaluateExpression<boolean>(
        'invalid syntax {{{}}}',
        'Q1',
        { defaultValue: false }
      );

      expect(result.success).toBe(false);
      expect(result.value).toBe(false);
      expect(result.error).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should support silent mode', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expressionService.evaluateExpression('invalid', 'Q1', { silent: true });

      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('createContext', () => {
    it('should create context with getValue function', () => {
      mockReferenceService.getValue.mockReturnValue('test value');

      const context = expressionService.createContext('Q1');

      expect(context.getValue('Q2')).toBe('test value');
      expect(mockReferenceService.getValue).toHaveBeenCalledWith('Q2', 'Q1');
    });

    it('should create context with getRowIndex function', () => {
      mockReferenceService.getRowIndex.mockReturnValue(5);

      const context = expressionService.createContext('Q1#1');

      expect(context.getRowIndex(0)).toBe(5);
      expect(mockReferenceService.getRowIndex).toHaveBeenCalledWith('Q1#1', 0);
    });

    it('should create context with getProp function', () => {
      const context = expressionService.createContext('Q1');

      expect(context.getProp('clientMode')).toBe(1);
      expect(context.getProp('formMode')).toBe(1);
      expect(context.getProp('baseUrl')).toBe('https://api.example.com');
      expect(context.getProp('username')).toBe('testuser');
      expect(context.getProp('token')).toBe('test-token');
      expect(context.getProp('unknown')).toBeUndefined();
    });

    it('should include answer in context', () => {
      const context = expressionService.createContext('Q1', 'my answer');

      expect(context.answer).toBe('my answer');
    });

    it('should include dataKey in context', () => {
      const context = expressionService.createContext('Q1');

      expect(context.dataKey).toBe('Q1');
    });
  });

  describe('validateSyntax', () => {
    it('should return valid for empty expression', () => {
      const result = expressionService.validateSyntax('');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for correct expressions', () => {
      expect(expressionService.validateSyntax('true').isValid).toBe(true);
      expect(expressionService.validateSyntax('5 + 3').isValid).toBe(true);
      expect(expressionService.validateSyntax('"test" === "test"').isValid).toBe(true);
      expect(expressionService.validateSyntax('a > b && c < d').isValid).toBe(true);
      expect(expressionService.validateSyntax('x ? y : z').isValid).toBe(true);
    });

    it('should return invalid for syntax errors', () => {
      const result1 = expressionService.validateSyntax('5 +++ 3');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBeDefined();

      const result2 = expressionService.validateSyntax('if (true) { }');
      expect(result2.isValid).toBe(false);

      const result3 = expressionService.validateSyntax('{{invalid}}');
      expect(result3.isValid).toBe(false);
    });
  });

  describe('extractReferences', () => {
    it('should return empty array for empty expression', () => {
      expect(expressionService.extractReferences('')).toEqual([]);
    });

    it('should return empty array for null/undefined', () => {
      expect(expressionService.extractReferences(null as never)).toEqual([]);
      expect(expressionService.extractReferences(undefined as never)).toEqual([]);
    });

    it('should extract single reference', () => {
      const refs = expressionService.extractReferences("getValue('Q1') === 'yes'");

      expect(refs).toEqual(['Q1']);
    });

    it('should extract multiple references', () => {
      const refs = expressionService.extractReferences(
        "getValue('Q1') + getValue('Q2') + getValue('Q3')"
      );

      expect(refs).toEqual(['Q1', 'Q2', 'Q3']);
    });

    it('should remove duplicate references', () => {
      const refs = expressionService.extractReferences(
        "getValue('Q1') + getValue('Q1') + getValue('Q2')"
      );

      expect(refs).toEqual(['Q1', 'Q2']);
    });

    it('should handle double quotes', () => {
      const refs = expressionService.extractReferences('getValue("Q1") === "test"');

      expect(refs).toEqual(['Q1']);
    });

    it('should handle nested component dataKeys', () => {
      const refs = expressionService.extractReferences(
        "getValue('Q1#1.field1') + getValue('Q2#2.field2')"
      );

      expect(refs).toEqual(['Q1#1.field1', 'Q2#2.field2']);
    });

    it('should handle expressions without getValue', () => {
      const refs = expressionService.extractReferences('5 + 3 > 2');

      expect(refs).toEqual([]);
    });
  });

  describe('allowed globals', () => {
    it('should allow Number conversion', () => {
      expect(expressionService.evaluateVariable('Number("42")', 'Q1')).toBe(42);
    });

    it('should allow String conversion', () => {
      expect(expressionService.evaluateVariable('String(123)', 'Q1')).toBe('123');
    });

    it('should allow Boolean conversion', () => {
      expect(expressionService.evaluateVariable('Boolean(1)', 'Q1')).toBe(true);
      expect(expressionService.evaluateVariable('Boolean(0)', 'Q1')).toBe(false);
    });

    it('should allow parseInt and parseFloat', () => {
      expect(expressionService.evaluateVariable('parseInt("42")', 'Q1')).toBe(42);
      expect(expressionService.evaluateVariable('parseFloat("3.14")', 'Q1')).toBe(3.14);
    });

    it('should allow isNaN and isFinite', () => {
      expect(expressionService.evaluateVariable('isNaN(NaN)', 'Q1')).toBe(true);
      expect(expressionService.evaluateVariable('isFinite(100)', 'Q1')).toBe(true);
      expect(expressionService.evaluateVariable('isFinite(Infinity)', 'Q1')).toBe(false);
    });

    it('should allow Date operations', () => {
      const result = expressionService.evaluateVariable(
        'new Date("2024-01-01").getFullYear()',
        'Q1'
      );
      expect(result).toBe(2024);
    });

    it('should allow JSON operations', () => {
      expect(expressionService.evaluateVariable('JSON.stringify({a: 1})', 'Q1')).toBe(
        '{"a":1}'
      );
      expect(
        expressionService.evaluateVariable('JSON.parse(\'{"a": 1}\').a', 'Q1')
      ).toBe(1);
    });

    it('should allow RegExp operations', () => {
      expect(
        expressionService.evaluateVariable('new RegExp("test").test("testing")', 'Q1')
      ).toBe(true);
    });

    it('should allow encodeURIComponent and decodeURIComponent', () => {
      expect(
        expressionService.evaluateVariable('encodeURIComponent("hello world")', 'Q1')
      ).toBe('hello%20world');
      expect(
        expressionService.evaluateVariable('decodeURIComponent("hello%20world")', 'Q1')
      ).toBe('hello world');
    });

    it('should have access to undefined, NaN, and Infinity', () => {
      expect(expressionService.evaluateVariable('undefined', 'Q1')).toBeUndefined();
      expect(expressionService.evaluateVariable('NaN', 'Q1')).toBeNaN();
      expect(expressionService.evaluateVariable('Infinity', 'Q1')).toBe(Infinity);
    });
  });

  describe('rowIndex in expressions', () => {
    it('should provide rowIndex shorthand', () => {
      mockReferenceService.getRowIndex.mockReturnValue(3);

      const result = expressionService.evaluateVariable('rowIndex', 'Q1#3');

      expect(result).toBe(3);
    });

    it('should allow getRowIndex with level parameter', () => {
      mockReferenceService.getRowIndex
        .mockReturnValueOnce(0) // For rowIndex shorthand
        .mockReturnValueOnce(2); // For getRowIndex(1)

      const result = expressionService.evaluateVariable('getRowIndex(1)', 'Q1#2.Q2#3');

      expect(result).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should handle getValue errors gracefully', () => {
      mockReferenceService.getValue.mockImplementation(() => {
        throw new Error('Component not found');
      });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should return empty string on error
      const context = expressionService.createContext('Q1');
      const value = context.getValue('nonexistent');

      expect(value).toBe('');
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it('should handle runtime errors in expressions', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = expressionService.evaluateExpression<number>(
        'nonexistentVariable.property',
        'Q1',
        { defaultValue: -1 }
      );

      expect(result.success).toBe(false);
      expect(result.value).toBe(-1);
      expect(result.error).toBeDefined();

      errorSpy.mockRestore();
    });
  });

  describe('getProp in expressions', () => {
    it('should access config properties via getProp', () => {
      expect(
        expressionService.evaluateVariable("getProp('clientMode')", 'Q1')
      ).toBe(1);
      expect(expressionService.evaluateVariable("getProp('formMode')", 'Q1')).toBe(
        1
      );
      expect(expressionService.evaluateVariable("getProp('baseUrl')", 'Q1')).toBe(
        'https://api.example.com'
      );
    });

    it('should handle missing config properties', () => {
      const serviceWithMinimalConfig = new ExpressionService(
        stores,
        mockReferenceService as never,
        { clientMode: 1, formMode: 1, initialMode: InitialMode.INITIAL, lookupMode: LookupMode.ONLINE }
      );

      expect(
        serviceWithMinimalConfig.evaluateVariable("getProp('baseUrl')", 'Q1')
      ).toBe('');
      expect(
        serviceWithMinimalConfig.evaluateVariable("getProp('username')", 'Q1')
      ).toBe('');
      expect(
        serviceWithMinimalConfig.evaluateVariable("getProp('token')", 'Q1')
      ).toBe('');
    });
  });
});
