import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnableService } from '../EnableService';
import { createFormStores, type FormStores } from '../../stores/createStores';
import type { FormGearConfig, ReferenceDetail, SidebarDetail } from '../../core/types';
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
  getEnableDependents: vi.fn().mockReturnValue([]),
  getValidationDependents: vi.fn(),
  getVariableDependents: vi.fn(),
  getSourceOptionDependents: vi.fn(),
  getNestedDependents: vi.fn(),
  updateComponent: vi.fn(),
  updateComponentBatch: vi.fn(),
  registerDynamicComponents: vi.fn(),
});

// Mock ExpressionService
const createMockExpressionService = () => ({
  evaluateEnableCondition: vi.fn().mockReturnValue(true),
  evaluateValidation: vi.fn(),
  evaluateVariable: vi.fn(),
  evaluateExpression: vi.fn(),
  createContext: vi.fn(),
  validateSyntax: vi.fn(),
  extractReferences: vi.fn(),
});

const defaultConfig: FormGearConfig = {
  clientMode: 1,
  formMode: 1,
  initialMode: InitialMode.INITIAL,
  lookupMode: LookupMode.ONLINE,
};

describe('EnableService', () => {
  let stores: FormStores;
  let enableService: EnableService;
  let mockReferenceService: ReturnType<typeof createMockReferenceService>;
  let mockExpressionService: ReturnType<typeof createMockExpressionService>;

  beforeEach(() => {
    stores = createFormStores();
    mockReferenceService = createMockReferenceService();
    mockExpressionService = createMockExpressionService();
    enableService = new EnableService(
      stores,
      mockReferenceService as never,
      mockExpressionService as never,
      defaultConfig
    );
    vi.clearAllMocks();
  });

  describe('evaluateEnable', () => {
    it('should return true if component not found', () => {
      mockReferenceService.getComponent.mockReturnValue(null);

      const result = enableService.evaluateEnable('Q1');

      expect(result).toBe(true);
    });

    it('should return true if component has no enableCondition', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        enableCondition: '',
      });

      const result = enableService.evaluateEnable('Q1');

      expect(result).toBe(true);
      expect(mockExpressionService.evaluateEnableCondition).not.toHaveBeenCalled();
    });

    it('should return true if enableCondition is only whitespace', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        enableCondition: '   ',
      });

      const result = enableService.evaluateEnable('Q1');

      expect(result).toBe(true);
    });

    it('should evaluate enable condition and update component', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        enableCondition: "getValue('Q0') === 'yes'",
      });
      mockExpressionService.evaluateEnableCondition.mockReturnValue(true);

      const result = enableService.evaluateEnable('Q1');

      expect(result).toBe(true);
      expect(mockExpressionService.evaluateEnableCondition).toHaveBeenCalledWith(
        "getValue('Q0') === 'yes'",
        'Q1'
      );
      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'enable',
        true
      );
    });

    it('should return false when condition evaluates to false', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        enableCondition: "getValue('Q0') === 'yes'",
      });
      mockExpressionService.evaluateEnableCondition.mockReturnValue(false);

      const result = enableService.evaluateEnable('Q1');

      expect(result).toBe(false);
      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'enable',
        false
      );
    });
  });

  describe('evaluateDependents', () => {
    it('should evaluate component dependents', () => {
      mockReferenceService.getEnableDependents.mockReturnValue(['Q2', 'Q3']);
      mockReferenceService.getComponent
        .mockReturnValueOnce({
          dataKey: 'Q2',
          enableCondition: "getValue('Q1') === 'yes'",
        })
        .mockReturnValueOnce({
          dataKey: 'Q3',
          enableCondition: "getValue('Q1') > 10",
        });

      enableService.evaluateDependents('Q1');

      expect(mockReferenceService.getEnableDependents).toHaveBeenCalledWith('Q1');
      expect(mockExpressionService.evaluateEnableCondition).toHaveBeenCalledTimes(2);
    });

    it('should evaluate sidebar dependents', () => {
      // Set up sidebar with sections that depend on Q1
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
          componentEnable: ['Q1'],
          enableCondition: "getValue('Q1') === 'yes'",
        } as SidebarDetail,
      ]);

      mockExpressionService.evaluateEnableCondition.mockReturnValue(false);

      enableService.evaluateDependents('Q1');

      expect(mockExpressionService.evaluateEnableCondition).toHaveBeenCalledWith(
        "getValue('Q1') === 'yes'",
        'section1'
      );
    });
  });

  describe('initializeEnableStates', () => {
    it('should evaluate enable for all components with enableCondition', () => {
      const details: ReferenceDetail[] = [
        {
          dataKey: 'Q1',
          name: 'Q1',
          label: 'Question 1',
          type: ComponentType.TEXT,
          index: [0],
          level: 0,
          enable: true,
          enableCondition: "getValue('Q0') === 'yes'",
          validationState: ValidationState.VALID,
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
          // No enableCondition
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
        {
          dataKey: 'Q3',
          name: 'Q3',
          label: 'Question 3',
          type: ComponentType.TEXT,
          index: [2],
          level: 0,
          enable: true,
          enableCondition: "getValue('Q1') > 5",
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
      ];

      stores.reference[1]('details', details);

      mockReferenceService.getComponent
        .mockImplementation((dataKey: string) =>
          details.find((d) => d.dataKey === dataKey) ?? null
        );

      enableService.initializeEnableStates();

      // Should only evaluate Q1 and Q3 (components with enableCondition)
      expect(mockExpressionService.evaluateEnableCondition).toHaveBeenCalledTimes(2);
    });
  });

  describe('disableComponent', () => {
    it('should disable a simple component', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        type: ComponentType.TEXT,
      });

      enableService.disableComponent('Q1');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'enable',
        false
      );
    });

    it('should disable section and all its children', () => {
      const details: ReferenceDetail[] = [
        {
          dataKey: 'section1',
          name: 'section1',
          label: 'Section 1',
          type: ComponentType.SECTION,
          index: [0],
          level: 0,
          enable: true,
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
        {
          dataKey: 'section1.Q1',
          name: 'Q1',
          label: 'Question 1',
          type: ComponentType.TEXT,
          index: [0, 0],
          level: 1,
          enable: true,
          parent: 'section1',
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
        {
          dataKey: 'section1.Q2',
          name: 'Q2',
          label: 'Question 2',
          type: ComponentType.NUMBER,
          index: [0, 1],
          level: 1,
          enable: true,
          parent: 'section1',
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
      ];

      stores.reference[1]('details', details);

      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'section1',
        type: ComponentType.SECTION,
      });

      enableService.disableComponent('section1');

      // Should disable section
      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'section1',
        'enable',
        false
      );
      // Should disable children
      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'section1.Q1',
        'enable',
        false
      );
      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'section1.Q2',
        'enable',
        false
      );
    });

    it('should disable nested and all its children', () => {
      const details: ReferenceDetail[] = [
        {
          dataKey: 'nested1',
          name: 'nested1',
          label: 'Nested 1',
          type: ComponentType.NESTED,
          index: [0],
          level: 0,
          enable: true,
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
        {
          dataKey: 'nested1.field1',
          name: 'field1',
          label: 'Field 1',
          type: ComponentType.TEXT,
          index: [0, 0],
          level: 1,
          enable: true,
          parent: 'nested1',
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
      ];

      stores.reference[1]('details', details);

      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'nested1',
        type: ComponentType.NESTED,
      });

      enableService.disableComponent('nested1');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'nested1',
        'enable',
        false
      );
      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'nested1.field1',
        'enable',
        false
      );
    });

    it('should handle component not found gracefully', () => {
      mockReferenceService.getComponent.mockReturnValue(null);

      // Should not throw
      enableService.disableComponent('nonexistent');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'nonexistent',
        'enable',
        false
      );
    });
  });

  describe('enableComponent', () => {
    it('should enable a simple component', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        type: ComponentType.TEXT,
      });

      enableService.enableComponent('Q1');

      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'Q1',
        'enable',
        true
      );
    });

    it('should enable section and re-evaluate children', () => {
      const details: ReferenceDetail[] = [
        {
          dataKey: 'section1',
          name: 'section1',
          label: 'Section 1',
          type: ComponentType.SECTION,
          index: [0],
          level: 0,
          enable: false,
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
        {
          dataKey: 'section1.Q1',
          name: 'Q1',
          label: 'Question 1',
          type: ComponentType.TEXT,
          index: [0, 0],
          level: 1,
          enable: false,
          parent: 'section1',
          enableCondition: "getValue('Q0') === 'yes'",
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
        {
          dataKey: 'section1.Q2',
          name: 'Q2',
          label: 'Question 2',
          type: ComponentType.NUMBER,
          index: [0, 1],
          level: 1,
          enable: false,
          parent: 'section1',
          // No enableCondition
          validationState: ValidationState.VALID,
          validationMessage: [],
        },
      ];

      stores.reference[1]('details', details);

      mockReferenceService.getComponent
        .mockReturnValueOnce({
          dataKey: 'section1',
          type: ComponentType.SECTION,
        })
        .mockReturnValueOnce(details[1]); // Q1 with enableCondition

      enableService.enableComponent('section1');

      // Should enable section
      expect(mockReferenceService.updateComponent).toHaveBeenCalledWith(
        'section1',
        'enable',
        true
      );
    });
  });

  describe('getDisabledSectionIndices', () => {
    it('should return empty array when no sections are disabled', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
        } as SidebarDetail,
        {
          dataKey: 'section2',
          name: 'Section 2',
          label: 'Section 2',
          level: 0,
          index: [1],
          enable: true,
        } as SidebarDetail,
      ]);

      const result = enableService.getDisabledSectionIndices();

      expect(result).toEqual([]);
    });

    it('should return indices of disabled sections', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
        } as SidebarDetail,
        {
          dataKey: 'section2',
          name: 'Section 2',
          label: 'Section 2',
          level: 0,
          index: [1],
          enable: false,
        } as SidebarDetail,
        {
          dataKey: 'section3',
          name: 'Section 3',
          label: 'Section 3',
          level: 0,
          index: [2],
          enable: false,
        } as SidebarDetail,
      ]);

      const result = enableService.getDisabledSectionIndices();

      expect(result).toEqual([{ parentIndex: [1] }, { parentIndex: [2] }]);
    });
  });

  describe('isEnabled', () => {
    it('should return true for enabled component', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        enable: true,
      });

      expect(enableService.isEnabled('Q1')).toBe(true);
    });

    it('should return false for disabled component', () => {
      mockReferenceService.getComponent.mockReturnValue({
        dataKey: 'Q1',
        enable: false,
      });

      expect(enableService.isEnabled('Q1')).toBe(false);
    });

    it('should return true if component not found', () => {
      mockReferenceService.getComponent.mockReturnValue(null);

      expect(enableService.isEnabled('nonexistent')).toBe(true);
    });
  });

  describe('updateDisabledSectionsCache', () => {
    it('should update referenceEnableFalse store with disabled sections', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
        } as SidebarDetail,
        {
          dataKey: 'section2',
          name: 'Section 2',
          label: 'Section 2',
          level: 0,
          index: [1],
          enable: false,
        } as SidebarDetail,
      ]);

      enableService.updateDisabledSectionsCache();

      const [referenceEnableFalse] = stores.referenceEnableFalse;
      expect(referenceEnableFalse()).toEqual([{ parentIndex: [1] }]);
    });

    it('should handle nested section indices', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1.subsection1',
          name: 'Subsection 1',
          label: 'Subsection 1',
          level: 1,
          index: [0, 0],
          enable: false,
        } as SidebarDetail,
      ]);

      enableService.updateDisabledSectionsCache();

      const [referenceEnableFalse] = stores.referenceEnableFalse;
      expect(referenceEnableFalse()).toEqual([{ parentIndex: [0, 0] }]);
    });
  });

  describe('sidebar dependent evaluation', () => {
    it('should update sidebar section when dependent changes', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
          componentEnable: ['Q1'],
          enableCondition: "getValue('Q1') === 'yes'",
          components: [[]] as never,
        } as SidebarDetail,
      ]);

      mockExpressionService.evaluateEnableCondition.mockReturnValue(false);

      enableService.evaluateDependents('Q1');

      // The sidebar should have been updated
      const [sidebar] = stores.sidebar;
      expect(sidebar.details[0].enable).toBe(false);
    });

    it('should not update sidebar section when not dependent', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
          componentEnable: ['Q2'], // Depends on Q2, not Q1
          enableCondition: "getValue('Q2') === 'yes'",
        } as SidebarDetail,
      ]);

      enableService.evaluateDependents('Q1');

      // Expression service should not be called for sidebar
      expect(mockExpressionService.evaluateEnableCondition).not.toHaveBeenCalledWith(
        "getValue('Q2') === 'yes'",
        'section1'
      );
    });

    it('should handle section without componentEnable', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
          // No componentEnable
        } as SidebarDetail,
      ]);

      // Should not throw
      enableService.evaluateDependents('Q1');
    });
  });

  describe('normalizeDataKey with row markers', () => {
    it('should handle $ROW$ marker', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
          componentEnable: ['nested1#1.field1@$ROW$'],
          enableCondition: "getValue('nested1#1.field1') === 'yes'",
        } as SidebarDetail,
      ]);

      mockExpressionService.evaluateEnableCondition.mockReturnValue(true);

      enableService.evaluateDependents('nested1#1.field1');

      expect(mockExpressionService.evaluateEnableCondition).toHaveBeenCalled();
    });

    it('should handle $ROW1$ marker', () => {
      // $ROW1$ strips one nesting level from the key using # separator
      // nested1#1#nested2#2#field1@$ROW1$ becomes nested1#1#nested2#2 (removing #field1)
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
          componentEnable: ['nested1#1#nested2#2#field1@$ROW1$'],
          enableCondition: "getValue('nested1#1#nested2#2#field1') === 'yes'",
        } as SidebarDetail,
      ]);

      mockExpressionService.evaluateEnableCondition.mockReturnValue(true);

      // The normalized key for nested1#1#nested2#2#field1@$ROW1$
      // with 5 segments and $ROW1$ removing 1 level -> 4 segments: nested1#1#nested2#2
      enableService.evaluateDependents('nested1#1#nested2#2');

      expect(mockExpressionService.evaluateEnableCondition).toHaveBeenCalled();
    });

    it('should not match when $ROW1$ normalization does not match', () => {
      stores.sidebar[1]('details', [
        {
          dataKey: 'section1',
          name: 'Section 1',
          label: 'Section 1',
          level: 0,
          index: [0],
          enable: true,
          componentEnable: ['nested1#1#nested2#2#field1@$ROW1$'],
          enableCondition: "getValue('nested1#1#nested2#2#field1') === 'yes'",
        } as SidebarDetail,
      ]);

      // This should not match because normalization produces nested1#1#nested2#2
      enableService.evaluateDependents('nested1#1#field1');

      // Should not have been called for this sidebar section
      expect(mockExpressionService.evaluateEnableCondition).not.toHaveBeenCalledWith(
        "getValue('nested1#1#nested2#2#field1') === 'yes'",
        'section1'
      );
    });
  });
});
