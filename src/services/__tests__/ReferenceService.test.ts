import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReferenceService } from '../ReferenceService';
import { createFormStores, type FormStores } from '../../stores/createStores';
import type { ReferenceDetail } from '../../core/types';
import { ComponentType, ValidationState } from '../../core/constants';

describe('ReferenceService', () => {
  let stores: FormStores;
  let referenceService: ReferenceService;

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
    validationState: ValidationState.VALID,
    validationMessage: [],
    ...overrides,
  });

  beforeEach(() => {
    stores = createFormStores();
    referenceService = new ReferenceService(stores);
    vi.clearAllMocks();
  });

  describe('getIndex', () => {
    it('should return -1 when component not found', () => {
      const result = referenceService.getIndex('nonexistent');

      expect(result).toBe(-1);
    });

    it('should return correct index for existing component', () => {
      stores.reference[1]('details', [
        createComponent('Q1'),
        createComponent('Q2'),
        createComponent('Q3'),
      ]);

      referenceService.rebuildIndexMap();

      expect(referenceService.getIndex('Q1')).toBe(0);
      expect(referenceService.getIndex('Q2')).toBe(1);
      expect(referenceService.getIndex('Q3')).toBe(2);
    });

    it('should use cached index when valid', () => {
      stores.reference[1]('details', [createComponent('Q1')]);
      referenceService.rebuildIndexMap();

      // First call should cache
      referenceService.getIndex('Q1');

      // Second call should use cache
      const index = referenceService.getIndex('Q1');

      expect(index).toBe(0);
    });

    it('should rebuild index map when cache is invalid', () => {
      stores.reference[1]('details', [createComponent('Q1')]);
      referenceService.rebuildIndexMap();

      // Modify store to make cache invalid
      stores.reference[1]('details', [createComponent('Q2'), createComponent('Q1')]);

      const index = referenceService.getIndex('Q1');

      expect(index).toBe(1);
    });
  });

  describe('getComponent', () => {
    it('should return undefined for non-existent component', () => {
      const result = referenceService.getComponent('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should return component for existing dataKey', () => {
      const component = createComponent('Q1', { label: 'Question 1' });
      stores.reference[1]('details', [component]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getComponent('Q1');

      expect(result).toEqual(component);
    });
  });

  describe('getValue', () => {
    it('should return empty string for non-existent component', () => {
      const result = referenceService.getValue('nonexistent');

      expect(result).toBe('');
    });

    it('should return empty string for disabled component', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: false, answer: 'test' }),
      ]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getValue('Q1');

      expect(result).toBe('');
    });

    it('should return answer for enabled component', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: true, answer: 'test answer' }),
      ]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getValue('Q1');

      expect(result).toBe('test answer');
    });

    it('should return empty string for null answer', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: true, answer: null }),
      ]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getValue('Q1');

      expect(result).toBe('');
    });

    it('should return empty string for undefined answer', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: true, answer: undefined }),
      ]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getValue('Q1');

      expect(result).toBe('');
    });

    it('should return numeric answer correctly', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: true, answer: 42 }),
      ]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getValue('Q1');

      expect(result).toBe(42);
    });

    it('should return zero as valid answer', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: true, answer: 0 }),
      ]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getValue('Q1');

      expect(result).toBe(0);
    });

    it('should return array answer correctly', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: true, answer: [1, 2, 3] }),
      ]);
      referenceService.rebuildIndexMap();

      const result = referenceService.getValue('Q1');

      expect(result).toEqual([1, 2, 3]);
    });
  });

  describe('resolveDataKey', () => {
    it('should return dataKey unchanged if no currentDataKey', () => {
      const result = referenceService.resolveDataKey('Q1@$ROW$');

      expect(result).toBe('Q1@$ROW$');
    });

    it('should return dataKey unchanged if no markers', () => {
      const result = referenceService.resolveDataKey('Q1', 'nested#1#field');

      expect(result).toBe('Q1');
    });

    it('should resolve @$ROW$ marker', () => {
      const result = referenceService.resolveDataKey('Q1@$ROW$', 'nested#1#field@5');

      expect(result).toBe('Q1@5');
    });

    it('should resolve @$ROW1$ marker', () => {
      const result = referenceService.resolveDataKey(
        'Q1@$ROW1$',
        'nested#1#field@3#subfield@7'
      );

      expect(result).toBe('Q1@3');
    });

    it('should resolve @$ROW2$ marker', () => {
      const result = referenceService.resolveDataKey(
        'Q1@$ROW2$',
        'nested#1#field@2#subfield@5#item@8'
      );

      expect(result).toBe('Q1@2');
    });

    it('should return unchanged if not enough row indices for marker', () => {
      // Only one row index, but asking for $ROW1$ (needs 2)
      const result = referenceService.resolveDataKey('Q1@$ROW1$', 'nested#1#field@3');

      expect(result).toBe('Q1@$ROW1$');
    });
  });

  describe('getRowIndex', () => {
    it('should return 0 for non-nested dataKey', () => {
      const result = referenceService.getRowIndex('Q1');

      expect(result).toBe(0);
    });

    it('should return row index at level 0 (current)', () => {
      const result = referenceService.getRowIndex('nested#1#field@5');

      expect(result).toBe(5);
    });

    it('should return row index at level 1 (parent)', () => {
      const result = referenceService.getRowIndex('nested#1#field@3#subfield@7', 1);

      expect(result).toBe(3);
    });

    it('should return 0 for invalid level', () => {
      const result = referenceService.getRowIndex('nested#1#field@5', 5);

      expect(result).toBe(0);
    });
  });

  describe('rebuildIndexMap', () => {
    it('should build index map from reference details', () => {
      stores.reference[1]('details', [
        createComponent('Q1'),
        createComponent('Q2'),
        createComponent('Q3'),
      ]);

      referenceService.rebuildIndexMap();

      const [indexMap] = stores.referenceMap;
      expect(indexMap()).toEqual({
        Q1: 0,
        Q2: 1,
        Q3: 2,
      });
    });

    it('should handle empty reference', () => {
      stores.reference[1]('details', []);

      referenceService.rebuildIndexMap();

      const [indexMap] = stores.referenceMap;
      expect(indexMap()).toEqual({});
    });
  });

  describe('initializeMaps', () => {
    it('should rebuild index map and build component maps', () => {
      const details: ReferenceDetail[] = [
        createComponent('Q1', {
          componentEnable: ['Q0'],
          componentValidation: ['Q0'],
        }),
        createComponent('Q2', {
          componentEnable: ['Q1'],
          sourceOption: 'Q1',
        }),
        createComponent('VAR1', {
          type: ComponentType.VARIABLE,
          componentVar: ['Q1', 'Q2'],
        }),
        createComponent('NESTED1', {
          type: ComponentType.NESTED,
          sourceQuestion: 'Q1',
        }),
      ];

      stores.reference[1]('details', details);

      referenceService.initializeMaps(details);

      // Check enable map
      const [enableMap] = stores.compEnableMap;
      expect(enableMap()).toEqual({
        Q0: ['Q1'],
        Q1: ['Q2'],
      });

      // Check validation map
      const [validMap] = stores.compValidMap;
      expect(validMap()).toEqual({
        Q0: ['Q1'],
      });

      // Check variable map
      const [varMap] = stores.compVarMap;
      expect(varMap()).toEqual({
        Q1: ['VAR1'],
        Q2: ['VAR1'],
      });

      // Check source option map
      const [sourceOptionMap] = stores.compSourceOptionMap;
      expect(sourceOptionMap()).toEqual({
        Q1: ['Q2'],
      });

      // Check source question map
      const [sourceQuestionMap] = stores.compSourceQuestionMap;
      expect(sourceQuestionMap()).toEqual({
        Q1: ['NESTED1'],
      });
    });

    it('should use store reference if referenceList not provided', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { componentEnable: ['Q0'] }),
      ]);

      referenceService.initializeMaps();

      const [enableMap] = stores.compEnableMap;
      expect(enableMap()).toEqual({ Q0: ['Q1'] });
    });
  });

  describe('getEnableDependents', () => {
    it('should return empty set for no dependents', () => {
      referenceService.initializeMaps([]);

      const result = referenceService.getEnableDependents('Q1');

      expect(result.size).toBe(0);
    });

    it('should return dependent components', () => {
      referenceService.initializeMaps([
        createComponent('Q1'),
        createComponent('Q2', { componentEnable: ['Q1'] }),
        createComponent('Q3', { componentEnable: ['Q1', 'Q2'] }),
      ]);

      const result = referenceService.getEnableDependents('Q1');

      expect(result).toEqual(new Set(['Q2', 'Q3']));
    });
  });

  describe('getValidationDependents', () => {
    it('should return empty set for no dependents', () => {
      referenceService.initializeMaps([]);

      const result = referenceService.getValidationDependents('Q1');

      expect(result.size).toBe(0);
    });

    it('should return dependent components', () => {
      referenceService.initializeMaps([
        createComponent('Q1'),
        createComponent('Q2', { componentValidation: ['Q1'] }),
      ]);

      const result = referenceService.getValidationDependents('Q1');

      expect(result).toEqual(new Set(['Q2']));
    });
  });

  describe('getVariableDependents', () => {
    it('should return empty set for no dependents', () => {
      referenceService.initializeMaps([]);

      const result = referenceService.getVariableDependents('Q1');

      expect(result.size).toBe(0);
    });

    it('should return dependent variable components', () => {
      referenceService.initializeMaps([
        createComponent('Q1'),
        createComponent('VAR1', {
          type: ComponentType.VARIABLE,
          componentVar: ['Q1'],
        }),
      ]);

      const result = referenceService.getVariableDependents('Q1');

      expect(result).toEqual(new Set(['VAR1']));
    });

    it('should not include non-variable components with componentVar', () => {
      referenceService.initializeMaps([
        createComponent('Q1'),
        createComponent('Q2', {
          type: ComponentType.TEXT,
          componentVar: ['Q1'],
        }),
      ]);

      const result = referenceService.getVariableDependents('Q1');

      expect(result.size).toBe(0);
    });
  });

  describe('getSourceOptionDependents', () => {
    it('should return dependent components', () => {
      referenceService.initializeMaps([
        createComponent('Q1'),
        createComponent('Q2', { sourceOption: 'Q1' }),
      ]);

      const result = referenceService.getSourceOptionDependents('Q1');

      expect(result).toEqual(new Set(['Q2']));
    });
  });

  describe('getNestedDependents', () => {
    it('should return nested components using this sourceQuestion', () => {
      stores.reference[1]('details', [
        createComponent('Q1'),
        createComponent('NESTED1', {
          type: ComponentType.NESTED,
          sourceQuestion: 'Q1',
        }),
        createComponent('NESTED2', {
          type: ComponentType.NESTED,
          sourceQuestion: 'Q1',
        }),
        createComponent('NESTED3', {
          type: ComponentType.NESTED,
          sourceQuestion: 'Q2', // Different source
        }),
      ]);

      const result = referenceService.getNestedDependents('Q1');

      expect(result).toEqual(new Set(['NESTED1', 'NESTED2']));
    });

    it('should return empty set if no nested dependents', () => {
      stores.reference[1]('details', [createComponent('Q1')]);

      const result = referenceService.getNestedDependents('Q1');

      expect(result.size).toBe(0);
    });
  });

  describe('updateComponent', () => {
    it('should update component property', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { answer: 'old' }),
      ]);
      referenceService.rebuildIndexMap();

      referenceService.updateComponent('Q1', 'answer', 'new');

      const [reference] = stores.reference;
      expect(reference.details[0].answer).toBe('new');
    });

    it('should handle non-existent component gracefully', () => {
      referenceService.rebuildIndexMap();

      // Should not throw
      referenceService.updateComponent('nonexistent', 'answer', 'value');
    });

    it('should update enable property', () => {
      stores.reference[1]('details', [
        createComponent('Q1', { enable: true }),
      ]);
      referenceService.rebuildIndexMap();

      referenceService.updateComponent('Q1', 'enable', false);

      const [reference] = stores.reference;
      expect(reference.details[0].enable).toBe(false);
    });
  });

  describe('updateComponentBatch', () => {
    it('should update multiple properties at once', () => {
      stores.reference[1]('details', [
        createComponent('Q1', {
          answer: 'old',
          enable: true,
          validationState: ValidationState.VALID,
        }),
      ]);
      referenceService.rebuildIndexMap();

      referenceService.updateComponentBatch('Q1', {
        answer: 'new',
        enable: false,
        validationState: ValidationState.ERROR,
      });

      const [reference] = stores.reference;
      expect(reference.details[0].answer).toBe('new');
      expect(reference.details[0].enable).toBe(false);
      expect(reference.details[0].validationState).toBe(ValidationState.ERROR);
    });

    it('should handle non-existent component gracefully', () => {
      referenceService.rebuildIndexMap();

      // Should not throw
      referenceService.updateComponentBatch('nonexistent', { answer: 'value' });
    });
  });

  describe('registerDynamicComponents', () => {
    it('should add new components to dependency maps', () => {
      // Initialize with some existing components
      referenceService.initializeMaps([createComponent('Q1')]);

      // Register new dynamic components
      referenceService.registerDynamicComponents([
        createComponent('Q2', { componentEnable: ['Q1'] }),
        createComponent('VAR1', {
          type: ComponentType.VARIABLE,
          componentVar: ['Q1'],
        }),
      ]);

      const [enableMap] = stores.compEnableMap;
      expect(enableMap()['Q1']).toContain('Q2');

      const [varMap] = stores.compVarMap;
      expect(varMap()['Q1']).toContain('VAR1');
    });

    it('should not add duplicate entries', () => {
      referenceService.initializeMaps([
        createComponent('Q1'),
        createComponent('Q2', { componentEnable: ['Q1'] }),
      ]);

      // Try to register same component again
      referenceService.registerDynamicComponents([
        createComponent('Q2', { componentEnable: ['Q1'] }),
      ]);

      const [enableMap] = stores.compEnableMap;
      // Should still only have one entry
      expect(enableMap()['Q1']).toEqual(['Q2']);
    });

    it('should register all dependency types', () => {
      referenceService.initializeMaps([createComponent('Q1')]);

      referenceService.registerDynamicComponents([
        createComponent('DYNAMIC1', {
          componentEnable: ['Q1'],
          componentValidation: ['Q1'],
          sourceOption: 'Q1',
        }),
        createComponent('NESTED_DYNAMIC', {
          type: ComponentType.NESTED,
          sourceQuestion: 'Q1',
        }),
      ]);

      const [enableMap] = stores.compEnableMap;
      expect(enableMap()['Q1']).toContain('DYNAMIC1');

      const [validMap] = stores.compValidMap;
      expect(validMap()['Q1']).toContain('DYNAMIC1');

      const [sourceOptionMap] = stores.compSourceOptionMap;
      expect(sourceOptionMap()['Q1']).toContain('DYNAMIC1');

      const [sourceQuestionMap] = stores.compSourceQuestionMap;
      expect(sourceQuestionMap()['Q1']).toContain('NESTED_DYNAMIC');
    });
  });

  describe('getValue with row marker resolution', () => {
    it('should resolve getValue with @$ROW$ marker', () => {
      stores.reference[1]('details', [
        createComponent('nested#1#field@5', { enable: true, answer: 'row answer' }),
      ]);
      referenceService.rebuildIndexMap();

      // Current context: nested#1#field@5, requesting field@$ROW$
      const result = referenceService.getValue(
        'nested#1#field@$ROW$',
        'nested#1#field@5'
      );

      // After resolution, should find nested#1#field@5
      expect(result).toBe('row answer');
    });
  });
});
