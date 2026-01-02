import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnswerService } from '../AnswerService';
import { createFormStores } from '../../stores/createStores';
import type { FormStores, FormGearConfig, ReferenceDetail } from '../../core/types';
import { ComponentType, ValidationState } from '../../core/constants';

// Mock ReferenceService
const createMockReferenceService = () => ({
  getIndex: vi.fn().mockReturnValue(0),
  getComponent: vi.fn(),
  getValue: vi.fn(),
  resolveDataKey: vi.fn(),
  getRowIndex: vi.fn().mockReturnValue(0),
  rebuildIndexMap: vi.fn(),
  initializeMaps: vi.fn(),
  getEnableDependents: vi.fn().mockReturnValue(new Set()),
  getValidationDependents: vi.fn().mockReturnValue(new Set()),
  getVariableDependents: vi.fn().mockReturnValue(new Set()),
  getSourceOptionDependents: vi.fn().mockReturnValue(new Set()),
  getNestedDependents: vi.fn().mockReturnValue(new Set()),
  updateComponent: vi.fn(),
  updateComponentBatch: vi.fn(),
  registerDynamicComponents: vi.fn(),
});

// Mock ExpressionService
const createMockExpressionService = () => ({
  evaluateEnableCondition: vi.fn().mockReturnValue(true),
  evaluateValidation: vi.fn().mockReturnValue(false),
  evaluateVariable: vi.fn(),
  evaluateExpression: vi.fn(),
  createContext: vi.fn(),
  validateSyntax: vi.fn(),
  extractReferences: vi.fn(),
});

// Mock ValidationService
const createMockValidationService = () => ({
  validateComponent: vi.fn(),
  validateDependents: vi.fn(),
  validateAll: vi.fn(),
  getValidationState: vi.fn(),
});

// Mock EnableService
const createMockEnableService = () => ({
  evaluateEnable: vi.fn(),
  evaluateDependents: vi.fn(),
  initializeEnableStates: vi.fn(),
  disableComponent: vi.fn(),
  enableComponent: vi.fn(),
  getDisabledSectionIndices: vi.fn().mockReturnValue([]),
  isEnabled: vi.fn().mockReturnValue(true),
  updateDisabledSectionsCache: vi.fn(),
});

// Mock NestedService
const createMockNestedService = () => ({
  insertFromNumber: vi.fn(),
  deleteFromNumber: vi.fn(),
  insertFromArray: vi.fn(),
  deleteFromArray: vi.fn(),
  createNestedRow: vi.fn(),
  deleteNestedRow: vi.fn(),
});

// Mock HistoryService
const createMockHistoryService = () => ({
  addEntry: vi.fn(),
  addSaveAnswerEntry: vi.fn(),
  addInsertEntry: vi.fn(),
  addDeleteEntry: vi.fn(),
  addSidebarEntry: vi.fn(),
  reloadFromHistory: vi.fn(),
  clear: vi.fn(),
  isEnabled: vi.fn().mockReturnValue(true),
  setEnabled: vi.fn(),
  canUndo: vi.fn(),
  getEntryCount: vi.fn(),
});

const defaultConfig: FormGearConfig = {
  clientMode: 1,
  formMode: 1,
  initialMode: 0,
};

const createComponent = (
  dataKey: string,
  overrides: Partial<ReferenceDetail> = {}
): ReferenceDetail => ({
  dataKey,
  name: dataKey,
  label: dataKey,
  type: ComponentType.TEXT,
  index: [0],
  level: 0,
  enable: true,
  validationState: ValidationState.NONE,
  validationMessage: [],
  ...overrides,
});

describe('AnswerService', () => {
  let stores: FormStores;
  let answerService: AnswerService;
  let mockReferenceService: ReturnType<typeof createMockReferenceService>;
  let mockExpressionService: ReturnType<typeof createMockExpressionService>;
  let mockValidationService: ReturnType<typeof createMockValidationService>;
  let mockEnableService: ReturnType<typeof createMockEnableService>;
  let mockNestedService: ReturnType<typeof createMockNestedService>;
  let mockHistoryService: ReturnType<typeof createMockHistoryService>;

  beforeEach(() => {
    stores = createFormStores();
    mockReferenceService = createMockReferenceService();
    mockExpressionService = createMockExpressionService();
    mockValidationService = createMockValidationService();
    mockEnableService = createMockEnableService();
    mockNestedService = createMockNestedService();
    mockHistoryService = createMockHistoryService();

    answerService = new AnswerService(
      stores,
      mockReferenceService as never,
      mockExpressionService as never,
      mockValidationService as never,
      mockEnableService as never,
      mockNestedService as never,
      defaultConfig
    );

    answerService.setHistoryService(mockHistoryService as never);

    vi.clearAllMocks();
  });

  describe('saveAnswer', () => {
    it('should do nothing if component not found', () => {
      mockReferenceService.getComponent.mockReturnValue(null);

      answerService.saveAnswer('nonexistent', 'value');

      expect(mockReferenceService.updateComponent).not.toHaveBeenCalled();
    });

    it('should update component answer', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old' })
      );

      answerService.saveAnswer('Q1', 'new value');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'answer',
        'new value'
      );
    });

    it('should record history entry', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old' })
      );

      answerService.saveAnswer('Q1', 'new');

      expect(mockHistoryService.addEntry).toHaveBeenCalledWith({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'answer',
        value: 'old',
        timestamp: expect.any(Number),
      });
    });

    it('should run validation by default', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old' })
      );

      answerService.saveAnswer('Q1', 'new');

      expect(mockValidationService.validateComponent).toHaveBeenCalledWith('Q1');
    });

    it('should skip validation when skipValidation is true', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old' })
      );

      answerService.saveAnswer('Q1', 'new', { skipValidation: true });

      expect(mockValidationService.validateComponent).not.toHaveBeenCalled();
    });

    it('should skip validation when isInitial is true', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old' })
      );

      answerService.saveAnswer('Q1', 'new', { isInitial: true });

      expect(mockValidationService.validateComponent).not.toHaveBeenCalled();
    });

    it('should run cascading updates when answer changes', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old', enable: true })
      );

      answerService.saveAnswer('Q1', 'new');

      expect(mockEnableService.evaluateDependents).toHaveBeenCalledWith('Q1');
      expect(mockValidationService.validateDependents).toHaveBeenCalledWith('Q1');
    });

    it('should skip cascading updates when skipCascade is true', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old' })
      );

      answerService.saveAnswer('Q1', 'new', { skipCascade: true });

      expect(mockEnableService.evaluateDependents).not.toHaveBeenCalled();
    });

    it('should not run cascading if answer did not change', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'same' })
      );

      answerService.saveAnswer('Q1', 'same');

      expect(mockEnableService.evaluateDependents).not.toHaveBeenCalled();
    });
  });

  describe('saveEnable', () => {
    it('should do nothing if component not found', () => {
      mockReferenceService.getComponent.mockReturnValue(null);

      answerService.saveEnable('nonexistent', true);

      expect(mockReferenceService.updateComponent).not.toHaveBeenCalled();
    });

    it('should do nothing if enable state unchanged', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { enable: true })
      );

      answerService.saveEnable('Q1', true);

      expect(mockReferenceService.updateComponent).not.toHaveBeenCalled();
    });

    it('should update enable state', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { enable: true })
      );

      answerService.saveEnable('Q1', false);

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'enable',
        false
      );
    });

    it('should record history entry', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { enable: true })
      );

      answerService.saveEnable('Q1', false);

      expect(mockHistoryService.addEntry).toHaveBeenCalledWith({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'enable',
        value: true,
        timestamp: expect.any(Number),
      });
    });
  });

  describe('getAnswer', () => {
    it('should return undefined for non-existent component', () => {
      mockReferenceService.getComponent.mockReturnValue(undefined);

      const result = answerService.getAnswer('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return component answer', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'test answer' })
      );

      const result = answerService.getAnswer('Q1');

      expect(result).toBe('test answer');
    });
  });

  describe('clearAnswer', () => {
    it('should do nothing if component not found', () => {
      mockReferenceService.getComponent.mockReturnValue(null);

      answerService.clearAnswer('nonexistent');

      expect(mockReferenceService.updateComponent).not.toHaveBeenCalled();
    });

    it('should set answer to empty string for text components', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { type: ComponentType.TEXT, answer: 'some value' })
      );

      answerService.clearAnswer('Q1');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'answer',
        ''
      );
    });

    it('should set answer to empty array for checkbox components', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', {
          type: ComponentType.CHECKBOX,
          answer: [{ label: 'A', value: 1 }],
        })
      );

      answerService.clearAnswer('Q1');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'answer',
        []
      );
    });

    it('should set answer to empty array for multiple select components', () => {
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', {
          type: ComponentType.MULTIPLE_SELECT,
          answer: [{ label: 'A', value: 1 }],
        })
      );

      answerService.clearAnswer('Q1');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'answer',
        []
      );
    });
  });

  describe('loadAnswers', () => {
    it('should save each answer with initial options', () => {
      const saveSpy = vi.spyOn(answerService, 'saveAnswer');

      mockReferenceService.getComponent.mockReturnValue(createComponent('Q1'));

      answerService.loadAnswers([
        { dataKey: 'Q1', answer: 'value1' },
        { dataKey: 'Q2', answer: 'value2' },
      ]);

      expect(saveSpy).toHaveBeenCalledTimes(2);
      expect(saveSpy).toHaveBeenCalledWith('Q1', 'value1', {
        skipValidation: true,
        skipCascade: true,
        isInitial: true,
      });
      expect(saveSpy).toHaveBeenCalledWith('Q2', 'value2', {
        skipValidation: true,
        skipCascade: true,
        isInitial: true,
      });
    });
  });

  describe('cascading updates', () => {
    describe('variable dependents', () => {
      it('should update variable dependents', () => {
        mockReferenceService.getComponent
          .mockReturnValueOnce(createComponent('Q1', { answer: 'old', enable: true }))
          .mockReturnValueOnce(createComponent('Q1', { answer: 'old', enable: true }))
          .mockReturnValueOnce(
            createComponent('VAR1', {
              type: ComponentType.VARIABLE,
              expression: "getValue('Q1') + ' processed'",
            })
          );

        mockReferenceService.getVariableDependents.mockReturnValue(new Set(['VAR1']));
        mockExpressionService.evaluateVariable.mockReturnValue('new processed');

        answerService.saveAnswer('Q1', 'new');

        expect(mockExpressionService.evaluateVariable).toHaveBeenCalledWith(
          "getValue('Q1') + ' processed'",
          'VAR1'
        );
      });
    });

    describe('source option dependents', () => {
      it('should filter dependent answers when source options change', () => {
        mockReferenceService.getComponent
          .mockReturnValueOnce(
            createComponent('Q1', {
              answer: [
                { label: 'A', value: 1 },
                { label: 'B', value: 2 },
              ],
              enable: true,
            })
          )
          .mockReturnValueOnce(
            createComponent('Q1', {
              answer: [
                { label: 'A', value: 1 },
                { label: 'B', value: 2 },
              ],
              enable: true,
            })
          )
          .mockReturnValueOnce(
            createComponent('Q2', {
              answer: [
                { label: 'A', value: 1 },
                { label: 'B', value: 2 },
              ],
              enable: true,
            })
          );

        mockReferenceService.getSourceOptionDependents.mockReturnValue(
          new Set(['Q2'])
        );

        // Save with only option A remaining
        answerService.saveAnswer('Q1', [{ label: 'A', value: 1 }]);

        // Q2 should be updated to filter out removed option B
        expect(mockReferenceService.updateComponent).toHaveBeenCalled();
      });
    });

    describe('nested updates', () => {
      it('should handle number-based nested insertion', () => {
        mockReferenceService.getComponent
          .mockReturnValueOnce(createComponent('count', { answer: 2, enable: true }))
          .mockReturnValueOnce(createComponent('count', { answer: 2, enable: true }))
          .mockReturnValueOnce(
            createComponent('nested1', {
              type: ComponentType.NESTED,
              sourceQuestion: 'count',
            })
          );

        mockReferenceService.getNestedDependents.mockReturnValue(new Set(['nested1']));

        // Increase count from 2 to 5
        answerService.saveAnswer('count', 5);

        expect(mockNestedService.insertFromNumber).toHaveBeenCalledWith(
          'nested1',
          5,
          2,
          0
        );
      });

      it('should handle number-based nested deletion', () => {
        mockReferenceService.getComponent
          .mockReturnValueOnce(createComponent('count', { answer: 5, enable: true }))
          .mockReturnValueOnce(createComponent('count', { answer: 5, enable: true }))
          .mockReturnValueOnce(
            createComponent('nested1', {
              type: ComponentType.NESTED,
              sourceQuestion: 'count',
            })
          );

        mockReferenceService.getNestedDependents.mockReturnValue(new Set(['nested1']));

        // Decrease count from 5 to 2
        answerService.saveAnswer('count', 2);

        expect(mockNestedService.deleteFromNumber).toHaveBeenCalledWith(
          'nested1',
          2,
          5,
          0
        );
      });

      it('should handle array-based nested insertion', () => {
        stores.sidebar[1]('details', []);

        mockReferenceService.getComponent
          .mockReturnValueOnce(
            createComponent('options', {
              answer: [{ label: 'A', value: 1 }],
              enable: true,
            })
          )
          .mockReturnValueOnce(
            createComponent('options', {
              answer: [{ label: 'A', value: 1 }],
              enable: true,
            })
          )
          .mockReturnValueOnce(
            createComponent('nested1', {
              type: ComponentType.NESTED,
              sourceQuestion: 'options',
            })
          );

        mockReferenceService.getNestedDependents.mockReturnValue(new Set(['nested1']));

        // Add new option B
        answerService.saveAnswer('options', [
          { label: 'A', value: 1 },
          { label: 'B', value: 2 },
        ]);

        expect(mockNestedService.insertFromArray).toHaveBeenCalledWith(
          'nested1',
          { label: 'B', value: 2 },
          0
        );
      });

      it('should handle array-based nested deletion', () => {
        mockReferenceService.getComponent
          .mockReturnValueOnce(
            createComponent('options', {
              answer: [
                { label: 'A', value: 1 },
                { label: 'B', value: 2 },
              ],
              enable: true,
            })
          )
          .mockReturnValueOnce(
            createComponent('options', {
              answer: [
                { label: 'A', value: 1 },
                { label: 'B', value: 2 },
              ],
              enable: true,
            })
          )
          .mockReturnValueOnce(
            createComponent('nested1', {
              type: ComponentType.NESTED,
              sourceQuestion: 'options',
            })
          );

        mockReferenceService.getNestedDependents.mockReturnValue(new Set(['nested1']));

        // Remove option B
        answerService.saveAnswer('options', [{ label: 'A', value: 1 }]);

        expect(mockNestedService.deleteFromArray).toHaveBeenCalledWith(
          'nested1',
          { label: 'B', value: 2 },
          0
        );
      });
    });
  });

  describe('setHistoryService', () => {
    it('should allow setting history service after construction', () => {
      const service = new AnswerService(
        stores,
        mockReferenceService as never,
        mockExpressionService as never,
        mockValidationService as never,
        mockEnableService as never,
        mockNestedService as never,
        defaultConfig
      );

      // No history service yet
      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'old' })
      );

      service.saveAnswer('Q1', 'new');

      // History entry should not be recorded (no history service)
      expect(mockHistoryService.addEntry).not.toHaveBeenCalled();

      // Now set history service
      service.setHistoryService(mockHistoryService as never);

      mockReferenceService.getComponent.mockReturnValue(
        createComponent('Q1', { answer: 'new' })
      );

      service.saveAnswer('Q1', 'newer');

      // History entry should be recorded now
      expect(mockHistoryService.addEntry).toHaveBeenCalled();
    });
  });

  describe('disabled component handling', () => {
    it('should stop cascade when component is disabled', () => {
      mockReferenceService.getComponent
        .mockReturnValueOnce(createComponent('Q1', { answer: 'old', enable: true }))
        .mockReturnValueOnce(createComponent('Q1', { answer: 'new', enable: false })); // Second call returns disabled

      answerService.saveAnswer('Q1', 'new');

      // Enable dependents should still be called
      expect(mockEnableService.evaluateDependents).toHaveBeenCalled();

      // But validation dependents should not be called (component disabled)
      expect(mockValidationService.validateDependents).not.toHaveBeenCalled();
    });
  });
});
