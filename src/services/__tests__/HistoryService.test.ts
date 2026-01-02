import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HistoryService } from '../HistoryService';
import { createFormStores } from '../../stores/createStores';
import type { FormStores, ReferenceDetail } from '../../core/types';
import { ComponentType, ValidationState } from '../../core/constants';

// Mock ReferenceService
const createMockReferenceService = () => ({
  getIndex: vi.fn(),
  getComponent: vi.fn(),
  getValue: vi.fn(),
  resolveDataKey: vi.fn(),
  getRowIndex: vi.fn(),
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

describe('HistoryService', () => {
  let stores: FormStores;
  let historyService: HistoryService;
  let mockReferenceService: ReturnType<typeof createMockReferenceService>;

  beforeEach(() => {
    stores = createFormStores();
    mockReferenceService = createMockReferenceService();
    historyService = new HistoryService(stores, mockReferenceService as never);
  });

  describe('initialization', () => {
    it('should be enabled by default', () => {
      expect(historyService.isEnabled()).toBe(true);
    });

    it('should have no entries initially', () => {
      expect(historyService.getEntryCount()).toBe(0);
    });

    it('should not be able to undo initially', () => {
      expect(historyService.canUndo()).toBe(false);
    });
  });

  describe('setEnabled', () => {
    it('should enable history tracking', () => {
      historyService.setEnabled(false);
      expect(historyService.isEnabled()).toBe(false);

      historyService.setEnabled(true);
      expect(historyService.isEnabled()).toBe(true);
    });

    it('should not add entries when disabled', () => {
      historyService.setEnabled(false);

      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'test',
        position: 0,
        attribute: 'answer',
        value: 'old',
        timestamp: Date.now(),
      });

      expect(historyService.getEntryCount()).toBe(0);
    });
  });

  describe('addEntry', () => {
    it('should add a history entry', () => {
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'answer',
        value: 'old value',
        timestamp: Date.now(),
      });

      expect(historyService.getEntryCount()).toBe(1);
      expect(historyService.canUndo()).toBe(true);
    });

    it('should add multiple entries', () => {
      for (let i = 0; i < 5; i++) {
        historyService.addEntry({
          type: 'saveAnswer',
          dataKey: `Q${i}`,
          position: i,
          attribute: 'answer',
          value: i,
          timestamp: Date.now(),
        });
      }

      expect(historyService.getEntryCount()).toBe(5);
    });

    it('should store sidebar history on first update_sidebar entry', () => {
      // Set up sidebar data
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
        },
      ]);

      historyService.addEntry({
        type: 'update_sidebar',
        dataKey: null,
        position: null,
        attribute: null,
        value: null,
        timestamp: Date.now(),
      });

      // The sidebar history is stored internally
      expect(historyService.getEntryCount()).toBe(0); // sidebar entries are stored separately
    });
  });

  describe('addSaveAnswerEntry', () => {
    it('should add a save answer entry with correct data', () => {
      historyService.addSaveAnswerEntry('Q1', 0, 'answer', 'previous value');

      expect(historyService.getEntryCount()).toBe(1);
    });

    it('should not add entry when disabled', () => {
      historyService.setEnabled(false);
      historyService.addSaveAnswerEntry('Q1', 0, 'answer', 'previous value');

      expect(historyService.getEntryCount()).toBe(0);
    });
  });

  describe('addInsertEntry', () => {
    it('should add an insert entry', () => {
      historyService.addInsertEntry(0, [
        { pos: 1, data: 'Q1#1' },
        { pos: 2, data: 'Q1#1.field1' },
      ]);

      expect(historyService.getEntryCount()).toBe(1);
    });
  });

  describe('addDeleteEntry', () => {
    it('should add a delete entry with full component data', () => {
      const deletedComponent: ReferenceDetail = {
        dataKey: 'Q1#1',
        name: 'Q1#1',
        label: 'Item 1',
        type: ComponentType.TEXT,
        index: [0, 0],
        level: 1,
        enable: true,
        validationState: ValidationState.NONE,
        validationMessage: [],
      };

      historyService.addDeleteEntry(0, [{ pos: 1, data: deletedComponent }]);

      expect(historyService.getEntryCount()).toBe(1);
    });
  });

  describe('addSidebarEntry', () => {
    it('should add a sidebar entry', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
        },
      ]);

      historyService.addSidebarEntry();

      // Sidebar entries don't count in getEntryCount
      expect(historyService.getEntryCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all history entries', () => {
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'answer',
        value: 'old',
        timestamp: Date.now(),
      });

      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q2',
        position: 1,
        attribute: 'answer',
        value: 'old2',
        timestamp: Date.now(),
      });

      expect(historyService.getEntryCount()).toBe(2);

      historyService.clear();

      expect(historyService.getEntryCount()).toBe(0);
      expect(historyService.canUndo()).toBe(false);
    });
  });

  describe('reloadFromHistory', () => {
    beforeEach(() => {
      // Set up initial reference data
      const details: ReferenceDetail[] = [
        {
          dataKey: 'Q1',
          name: 'Q1',
          label: 'Question 1',
          type: ComponentType.TEXT,
          index: [0],
          level: 0,
          enable: true,
          answer: 'new value',
          validationState: ValidationState.NONE,
          validationMessage: [],
        },
        {
          dataKey: 'Q2',
          name: 'Q2',
          label: 'Question 2',
          type: ComponentType.NUMBER,
          index: [1],
          level: 0,
          enable: true,
          answer: 42,
          validationState: ValidationState.NONE,
          validationMessage: [],
        },
      ];

      stores.reference[1]('details', details);
    });

    it('should undo saveAnswer entries', () => {
      // Record the change
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'answer',
        value: 'old value', // Previous value
        timestamp: Date.now(),
      });

      // Reload from history
      historyService.reloadFromHistory();

      // Check that rebuildIndexMap was called
      expect(mockReferenceService.rebuildIndexMap).toHaveBeenCalled();

      // Check that reference was updated
      const [reference] = stores.reference;
      expect(reference.details[0].answer).toBe('old value');
    });

    it('should undo enable changes', () => {
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'enable',
        value: false, // Was false before
        timestamp: Date.now(),
      });

      historyService.reloadFromHistory();

      const [reference] = stores.reference;
      expect(reference.details[0].enable).toBe(false);
    });

    it('should undo validation changes', () => {
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'validate',
        value: {
          validationState: ValidationState.ERROR,
          validationMessage: ['Required'],
        },
        timestamp: Date.now(),
      });

      historyService.reloadFromHistory();

      const [reference] = stores.reference;
      expect(reference.details[0].validationState).toBe(ValidationState.ERROR);
      expect(reference.details[0].validationMessage).toEqual(['Required']);
    });

    it('should undo insert operations', () => {
      // First add the component that was inserted
      const insertedComponent: ReferenceDetail = {
        dataKey: 'Q3',
        name: 'Q3',
        label: 'Question 3',
        type: ComponentType.TEXT,
        index: [2],
        level: 0,
        enable: true,
        validationState: ValidationState.NONE,
        validationMessage: [],
      };

      stores.reference[1]('details', (details: ReferenceDetail[]) => [
        ...details,
        insertedComponent,
      ]);

      // Record the insert
      historyService.addEntry({
        type: 'insert_ref_detail',
        dataKey: null,
        position: 1,
        attribute: null,
        value: [{ pos: 2, data: 'Q3' }],
        timestamp: Date.now(),
      });

      // Undo should remove the inserted component
      historyService.reloadFromHistory();

      const [reference] = stores.reference;
      expect(reference.details.length).toBe(2);
      expect(reference.details.find((d) => d.dataKey === 'Q3')).toBeUndefined();
    });

    it('should undo delete operations', () => {
      const deletedComponent: ReferenceDetail = {
        dataKey: 'Q3',
        name: 'Q3',
        label: 'Question 3',
        type: ComponentType.TEXT,
        index: [2],
        level: 0,
        enable: true,
        validationState: ValidationState.NONE,
        validationMessage: [],
      };

      // Record the delete with full component data
      historyService.addEntry({
        type: 'delete_ref_detail',
        dataKey: null,
        position: 1,
        attribute: null,
        value: [{ pos: 2, data: deletedComponent }],
        timestamp: Date.now(),
      });

      // Undo should re-insert the deleted component
      historyService.reloadFromHistory();

      const [reference] = stores.reference;
      expect(reference.details.length).toBe(3);
      expect(reference.details[2].dataKey).toBe('Q3');
    });

    it('should handle multiple undo operations in reverse order', () => {
      // First change
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'answer',
        value: 'initial',
        timestamp: Date.now(),
      });

      // Update reference to simulate the change
      stores.reference[1]('details', 0, 'answer', 'after first change');

      // Second change
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q1',
        position: 0,
        attribute: 'answer',
        value: 'after first change',
        timestamp: Date.now(),
      });

      // Reload should apply all in reverse order
      historyService.reloadFromHistory();

      const [reference] = stores.reference;
      expect(reference.details[0].answer).toBe('initial');
    });

    it('should find component by dataKey if position is wrong', () => {
      // Simulate position mismatch
      historyService.addEntry({
        type: 'saveAnswer',
        dataKey: 'Q2',
        position: 999, // Wrong position
        attribute: 'answer',
        value: 100,
        timestamp: Date.now(),
      });

      historyService.reloadFromHistory();

      const [reference] = stores.reference;
      // Should still find Q2 and update it
      expect(reference.details[1].answer).toBe(100);
    });
  });
});
