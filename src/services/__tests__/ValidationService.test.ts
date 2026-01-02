import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidationService, type ValidationResult } from '../ValidationService';
import {
  ComponentType,
  ValidationState,
  ValidationType,
  ClientMode,
} from '../../core/constants';
import type { ReferenceDetail, FormGearConfig } from '../../core/types';

// =============================================================================
// Mock Types
// =============================================================================

interface MockReferenceService {
  getComponent: ReturnType<typeof vi.fn>;
  updateComponentBatch: ReturnType<typeof vi.fn>;
  getValidationDependents: ReturnType<typeof vi.fn>;
}

interface MockExpressionService {
  evaluateValidation: ReturnType<typeof vi.fn>;
}

interface MockFormStores {
  reference: [{ details: ReferenceDetail[] }, unknown];
  locale: [{ details: { language: [Record<string, string>] } }, unknown];
}

// =============================================================================
// Test Helpers
// =============================================================================

function createMockComponent(overrides: Partial<ReferenceDetail> = {}): ReferenceDetail {
  return {
    dataKey: 'test_component',
    type: ComponentType.TEXT,
    answer: undefined,
    enable: true,
    validationState: ValidationState.VALID,
    validationMessage: [],
    hasRemark: false,
    validations: [],
    lengthInput: undefined,
    rangeInput: undefined,
    options: [],
    ...overrides,
  } as ReferenceDetail;
}

function createMockServices() {
  const referenceService: MockReferenceService = {
    getComponent: vi.fn(),
    updateComponentBatch: vi.fn(),
    getValidationDependents: vi.fn().mockReturnValue([]),
  };

  const expressionService: MockExpressionService = {
    evaluateValidation: vi.fn().mockReturnValue(false),
  };

  const stores: MockFormStores = {
    reference: [{ details: [] }, vi.fn()],
    locale: [
      {
        details: {
          language: [
            {
              validationMaxLength: 'Maximum length is',
              validationMinLength: 'Minimum length is',
              validationMax: 'Maximum value is',
              validationMin: 'Minimum value is',
              validationEmail: 'Invalid email format',
              validationApi: 'API validation failed',
              validationDate: 'Invalid date format',
              validationStep: 'Value must be a multiple of',
              validationInclude: 'Value must be one of: {values}',
            },
          ],
        },
      },
      vi.fn(),
    ],
  };

  const config: FormGearConfig = {
    clientMode: ClientMode.CAWI,
  } as FormGearConfig;

  return { referenceService, expressionService, stores, config };
}

function createValidationService(
  mocks = createMockServices()
): { service: ValidationService; mocks: ReturnType<typeof createMockServices> } {
  const service = new ValidationService(
    mocks.stores as unknown as Parameters<typeof ValidationService['prototype']['validateComponent']> extends never ? never : never,
    mocks.referenceService as unknown as Parameters<typeof ValidationService['prototype']['validateComponent']> extends never ? never : never,
    mocks.expressionService as unknown as Parameters<typeof ValidationService['prototype']['validateComponent']> extends never ? never : never,
    mocks.config
  );
  return { service: service as unknown as ValidationService, mocks };
}

// =============================================================================
// validateComponent Tests
// =============================================================================

describe('ValidationService', () => {
  describe('validateComponent', () => {
    it('should return valid state for non-existent component', () => {
      const { service, mocks } = createValidationService();
      mocks.referenceService.getComponent.mockReturnValue(null);

      const result = service.validateComponent('non_existent');

      expect(result.state).toBe(ValidationState.VALID);
      expect(result.messages).toHaveLength(0);
    });

    it('should return valid state for component with remark', () => {
      const { service, mocks } = createValidationService();
      mocks.referenceService.getComponent.mockReturnValue(
        createMockComponent({ hasRemark: true })
      );

      const result = service.validateComponent('test');

      expect(result.state).toBe(ValidationState.VALID);
      expect(result.messages).toHaveLength(0);
    });

    it('should call updateComponentBatch with validation result', () => {
      const { service, mocks } = createValidationService();
      mocks.referenceService.getComponent.mockReturnValue(createMockComponent());

      service.validateComponent('test_component');

      expect(mocks.referenceService.updateComponentBatch).toHaveBeenCalledWith(
        'test_component',
        expect.objectContaining({
          validationState: expect.any(Number),
          validationMessage: expect.any(Array),
        })
      );
    });
  });

  describe('expression validations', () => {
    it('should run expression-based validations', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        validations: [
          { test: 'answer === null', message: 'Field is required', type: ValidationType.ERROR },
        ],
      });
      mocks.referenceService.getComponent.mockReturnValue(component);
      mocks.expressionService.evaluateValidation.mockReturnValue(true);

      const result = service.validateComponent('test');

      expect(mocks.expressionService.evaluateValidation).toHaveBeenCalledWith(
        'answer === null',
        'test_component',
        undefined
      );
      expect(result.messages).toContain('Field is required');
      expect(result.state).toBe(ValidationState.ERROR);
    });

    it('should not add message when validation passes', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        validations: [
          { test: 'answer === null', message: 'Field is required', type: ValidationType.ERROR },
        ],
        answer: 'some value',
      });
      mocks.referenceService.getComponent.mockReturnValue(component);
      mocks.expressionService.evaluateValidation.mockReturnValue(false);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
      expect(result.state).toBe(ValidationState.VALID);
    });

    it('should handle multiple validation rules', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        validations: [
          { test: 'check1', message: 'Error 1', type: ValidationType.ERROR },
          { test: 'check2', message: 'Warning 1', type: ValidationType.WARNING },
        ],
      });
      mocks.referenceService.getComponent.mockReturnValue(component);
      mocks.expressionService.evaluateValidation.mockReturnValue(true);

      const result = service.validateComponent('test');

      expect(result.messages).toContain('Error 1');
      expect(result.messages).toContain('Warning 1');
      // ValidationType.WARNING = 3, which is higher than ValidationType.ERROR = 2
      // So Math.max returns 3 (WARNING is treated as highest severity numerically)
      expect(result.state).toBe(ValidationType.WARNING);
    });
  });

  describe('length validations', () => {
    it('should validate maxlength', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: 'hello world',
        lengthInput: { max: 5 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages[0]).toContain('Maximum length is');
      expect(result.messages[0]).toContain('5');
      expect(result.state).toBe(ValidationState.ERROR);
    });

    it('should validate minlength', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: 'hi',
        lengthInput: { min: 5 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages[0]).toContain('Minimum length is');
      expect(result.messages[0]).toContain('5');
      expect(result.state).toBe(ValidationState.ERROR);
    });

    it('should pass when length is within bounds', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: 'hello',
        lengthInput: { min: 3, max: 10 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
      expect(result.state).toBe(ValidationState.VALID);
    });

    it('should skip length validation for null/undefined answer', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: null,
        lengthInput: { min: 5 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
    });

    it('should skip length validation for object answers', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: { value: 'test' },
        lengthInput: { min: 5 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
    });
  });

  describe('range validations', () => {
    it('should validate max value', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: 100,
        rangeInput: { max: 50 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages[0]).toContain('Maximum value is');
      expect(result.messages[0]).toContain('50');
      expect(result.state).toBe(ValidationState.ERROR);
    });

    it('should validate min value', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: 5,
        rangeInput: { min: 10 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages[0]).toContain('Minimum value is');
      expect(result.messages[0]).toContain('10');
      expect(result.state).toBe(ValidationState.ERROR);
    });

    it('should pass when value is within range', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: 25,
        rangeInput: { min: 10, max: 50 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
      expect(result.state).toBe(ValidationState.VALID);
    });

    it('should handle string numeric answers', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        answer: '100',
        rangeInput: { max: 50 },
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.state).toBe(ValidationState.ERROR);
    });
  });

  describe('pattern validations', () => {
    it('should validate email format for URL type', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        type: ComponentType.URL,
        answer: 'invalid-email',
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages[0]).toContain('Invalid email format');
      expect(result.state).toBe(ValidationState.ERROR);
    });

    it('should pass for valid email', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        type: ComponentType.URL,
        answer: 'test@example.com',
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
      expect(result.state).toBe(ValidationState.VALID);
    });

    it('should skip pattern validation for empty answer', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        type: ComponentType.URL,
        answer: '',
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
    });
  });

  describe('PAPI validations', () => {
    it('should run PAPI validations when in PAPI mode', () => {
      const mocks = createMockServices();
      mocks.config.clientMode = ClientMode.PAPI;
      const { service } = createValidationService(mocks);

      const component = createMockComponent({
        type: ComponentType.RADIO,
        answer: [{ label: 'Invalid', value: 'invalid' }],
        options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages[0]).toContain('Value must be one of');
    });

    it('should not run PAPI validations when not in PAPI mode', () => {
      const { service, mocks } = createValidationService();
      const component = createMockComponent({
        type: ComponentType.RADIO,
        answer: [{ label: 'Invalid', value: 'invalid' }],
        options: [{ label: 'A', value: 'a' }, { label: 'B', value: 'b' }],
      });
      mocks.referenceService.getComponent.mockReturnValue(component);

      const result = service.validateComponent('test');

      expect(result.messages).toHaveLength(0);
    });
  });

  describe('clearValidation', () => {
    it('should clear validation state', () => {
      const { service, mocks } = createValidationService();

      service.clearValidation('test_component');

      expect(mocks.referenceService.updateComponentBatch).toHaveBeenCalledWith(
        'test_component',
        {
          validationState: ValidationState.VALID,
          validationMessage: [],
        }
      );
    });
  });

  describe('validateAll', () => {
    it('should validate all enabled components', () => {
      const { service, mocks } = createValidationService();
      const components = [
        createMockComponent({ dataKey: 'comp1', enable: true }),
        createMockComponent({ dataKey: 'comp2', enable: true }),
        createMockComponent({ dataKey: 'comp3', enable: false }),
      ];
      mocks.stores.reference[0].details = components;
      mocks.referenceService.getComponent.mockImplementation((key: string) =>
        components.find((c) => c.dataKey === key)
      );

      const result = service.validateAll();

      expect(result.valid).toBe(2);
      expect(result.warnings).toBe(0);
      expect(result.errors).toBe(0);
    });

    it('should count errors and warnings correctly', () => {
      const { service, mocks } = createValidationService();
      const components = [
        createMockComponent({
          dataKey: 'comp1',
          enable: true,
          answer: 'toolong',
          lengthInput: { max: 3 },
        }),
        createMockComponent({ dataKey: 'comp2', enable: true }),
      ];
      mocks.stores.reference[0].details = components;
      mocks.referenceService.getComponent.mockImplementation((key: string) =>
        components.find((c) => c.dataKey === key)
      );

      const result = service.validateAll();

      expect(result.errors).toBe(1);
      expect(result.valid).toBe(1);
    });
  });

  describe('validateDependents', () => {
    it('should validate all dependent components', () => {
      const { service, mocks } = createValidationService();
      mocks.referenceService.getValidationDependents.mockReturnValue(['dep1', 'dep2']);
      mocks.referenceService.getComponent.mockReturnValue(createMockComponent());

      service.validateDependents('source_component');

      expect(mocks.referenceService.getValidationDependents).toHaveBeenCalledWith(
        'source_component'
      );
      // Should validate each dependent
      expect(mocks.referenceService.getComponent).toHaveBeenCalledWith('dep1');
      expect(mocks.referenceService.getComponent).toHaveBeenCalledWith('dep2');
    });
  });
});
