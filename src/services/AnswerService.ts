/**
 * AnswerService
 *
 * Manages answer persistence and cascading updates.
 * Replaces the saveAnswer function from GlobalFunction.tsx.
 */

import type {
  FormStores,
  ReferenceDetail,
  FormGearConfig,
  Option,
} from '../core/types';
import { ComponentType, ClientMode, OPTION_TYPES } from '../core/constants';
import type { ReferenceService } from './ReferenceService';
import type { ExpressionService } from './ExpressionService';
import type { ValidationService } from './ValidationService';
import type { EnableService } from './EnableService';
import type { NestedService } from './NestedService';
import type { HistoryService } from './HistoryService';

/**
 * Options for saving an answer
 */
export interface SaveAnswerOptions {
  /** Skip validation after save */
  skipValidation?: boolean;
  /** Skip cascading updates (enable, variable, nested) */
  skipCascade?: boolean;
  /** Is this an initial value (from preset/response) */
  isInitial?: boolean;
  /** Active component position for history */
  activePosition?: number;
}

/**
 * Service for managing component answers.
 * Each FormGear instance gets its own AnswerService.
 */
export class AnswerService {
  private stores: FormStores;
  private referenceService: ReferenceService;
  private expressionService: ExpressionService;
  private validationService: ValidationService;
  private enableService: EnableService;
  private nestedService: NestedService;
  private historyService: HistoryService | null = null;
  private config: FormGearConfig;

  constructor(
    stores: FormStores,
    referenceService: ReferenceService,
    expressionService: ExpressionService,
    validationService: ValidationService,
    enableService: EnableService,
    nestedService: NestedService,
    config: FormGearConfig
  ) {
    this.stores = stores;
    this.referenceService = referenceService;
    this.expressionService = expressionService;
    this.validationService = validationService;
    this.enableService = enableService;
    this.nestedService = nestedService;
    this.config = config;
  }

  /**
   * Set the history service (to avoid circular dependency).
   */
  setHistoryService(historyService: HistoryService): void {
    this.historyService = historyService;
  }

  // ===========================================================================
  // Public Answer Methods
  // ===========================================================================

  /**
   * Save an answer for a component and trigger cascading updates.
   *
   * @param dataKey - The component's dataKey
   * @param value - The new answer value
   * @param options - Save options
   */
  saveAnswer(
    dataKey: string,
    value: unknown,
    options: SaveAnswerOptions = {}
  ): void {
    const {
      skipValidation = false,
      skipCascade = false,
      isInitial = false,
      activePosition = 0,
    } = options;

    const component = this.referenceService.getComponent(dataKey);
    if (!component) {
      return;
    }

    // Get previous answer for change detection
    const beforeAnswer = this.getPreviousAnswer(component, value);

    // Record history
    if (this.historyService) {
      this.historyService.addEntry({
        type: 'saveAnswer',
        dataKey,
        position: this.referenceService.getIndex(dataKey),
        attribute: 'answer',
        value: component.answer,
        timestamp: Date.now(),
      });
    }

    // Update the answer
    this.referenceService.updateComponent(dataKey, 'answer', value);

    // Run validation if not skipped and not initial
    if (!skipValidation && !isInitial) {
      this.validationService.validateComponent(dataKey);
    }

    // Check if answer actually changed
    if (!this.hasAnswerChanged(beforeAnswer, value)) {
      return;
    }

    // Run cascading updates if not skipped
    if (!skipCascade) {
      this.runCascadingUpdates(dataKey, value, beforeAnswer, activePosition);
    }
  }

  /**
   * Update the enable state for a component.
   *
   * @param dataKey - The component's dataKey
   * @param enable - The new enable state
   */
  saveEnable(dataKey: string, enable: boolean): void {
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    // Check if enable state changed
    if (component.enable === enable) {
      return;
    }

    // Record history
    if (this.historyService) {
      this.historyService.addEntry({
        type: 'saveAnswer',
        dataKey,
        position: this.referenceService.getIndex(dataKey),
        attribute: 'enable',
        value: component.enable,
        timestamp: Date.now(),
      });
    }

    // Update enable state
    this.referenceService.updateComponent(dataKey, 'enable', enable);
  }

  /**
   * Get the current answer for a component.
   *
   * @param dataKey - The component's dataKey
   * @returns The answer value or undefined
   */
  getAnswer(dataKey: string): unknown {
    const component = this.referenceService.getComponent(dataKey);
    return component?.answer;
  }

  /**
   * Clear the answer for a component.
   *
   * @param dataKey - The component's dataKey
   */
  clearAnswer(dataKey: string): void {
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    const defaultValue = this.getDefaultValue(component.type);
    this.saveAnswer(dataKey, defaultValue);
  }

  /**
   * Set answers from a response object.
   *
   * @param answers - Array of { dataKey, answer } objects
   */
  loadAnswers(answers: Array<{ dataKey: string; answer: unknown }>): void {
    for (const { dataKey, answer } of answers) {
      this.saveAnswer(dataKey, answer, {
        skipValidation: true,
        skipCascade: true,
        isInitial: true,
      });
    }
  }

  // ===========================================================================
  // Private Cascading Methods
  // ===========================================================================

  /**
   * Run all cascading updates after an answer change.
   */
  private runCascadingUpdates(
    dataKey: string,
    value: unknown,
    beforeAnswer: unknown,
    activePosition: number
  ): void {
    console.log('[AnswerService] runCascadingUpdates called:', { dataKey, value, beforeAnswer, activePosition });

    const component = this.referenceService.getComponent(dataKey);
    if (!component) {
      console.log('[AnswerService] No component found for dataKey:', dataKey);
      return;
    }

    // 1. Update enable states for dependents
    this.enableService.evaluateDependents(dataKey);

    // Only continue if component is enabled
    if (!component.enable) {
      console.log('[AnswerService] Component is disabled, stopping cascade');
      return;
    }

    // 2. Validate dependents
    this.validationService.validateDependents(dataKey);

    // 3. Update source option dependents
    this.updateSourceOptionDependents(dataKey, value);

    // 4. Update variable dependents
    this.updateVariableDependents(dataKey);

    // 5. Handle nested component updates
    console.log('[AnswerService] About to call handleNestedUpdates');
    this.handleNestedUpdates(dataKey, value, beforeAnswer, activePosition);

    // 6. Update disabled sections cache
    this.updateDisabledSections();
  }

  /**
   * Update components that use this dataKey as sourceOption.
   */
  private updateSourceOptionDependents(dataKey: string, value: unknown): void {
    if (!Array.isArray(value)) return;

    const dependents = this.referenceService.getSourceOptionDependents(dataKey);

    for (const dependentKey of dependents) {
      const dependent = this.referenceService.getComponent(dependentKey);
      if (!dependent || !dependent.enable || !dependent.answer) continue;

      // Filter dependent's answer to only include values still in source
      const filteredAnswer = (dependent.answer as Option[]).filter((item) =>
        (value as Option[]).some((opt) => opt.value === item.value)
      );

      if (filteredAnswer.length !== (dependent.answer as Option[]).length) {
        this.saveAnswer(dependentKey, filteredAnswer);
      }
    }
  }

  /**
   * Update variable components that depend on this dataKey.
   */
  private updateVariableDependents(dataKey: string): void {
    const dependents = this.referenceService.getVariableDependents(dataKey);

    for (const dependentKey of dependents) {
      this.evaluateVariableComponent(dependentKey);
    }
  }

  /**
   * Evaluate and update a variable component.
   */
  private evaluateVariableComponent(dataKey: string): void {
    const component = this.referenceService.getComponent(dataKey);
    if (!component || component.type !== ComponentType.VARIABLE) return;
    if (!component.expression) return;

    try {
      const value = this.expressionService.evaluateVariable(
        component.expression,
        dataKey
      );
      this.saveAnswer(dataKey, value, { skipCascade: false });
    } catch (error) {
      console.error(`Error evaluating variable ${dataKey}:`, error);
      this.saveAnswer(dataKey, undefined, { isInitial: true });
    }
  }

  /**
   * Handle updates for nested components.
   */
  private handleNestedUpdates(
    dataKey: string,
    value: unknown,
    beforeAnswer: unknown,
    activePosition: number
  ): void {
    // Find nested components that use this dataKey as source
    const nestedDependents = this.referenceService.getNestedDependents(dataKey);

    console.log('[AnswerService] handleNestedUpdates:', {
      dataKey,
      value,
      beforeAnswer,
      nestedDependents: Array.from(nestedDependents),
    });

    for (const nestedKey of nestedDependents) {
      const nested = this.referenceService.getComponent(nestedKey);
      console.log('[AnswerService] Processing nested:', { nestedKey, nested, type: nested?.type });
      if (!nested || nested.type !== ComponentType.NESTED) continue;

      // Handle based on value type
      if (typeof value === 'number' || typeof value === 'string') {
        console.log('[AnswerService] Handling number-based nested');
        this.handleNumberBasedNested(
          nestedKey,
          Number(value),
          Number(beforeAnswer) || 0,
          activePosition
        );
      } else if (Array.isArray(value)) {
        console.log('[AnswerService] Handling array-based nested');
        this.handleArrayBasedNested(
          nestedKey,
          value as Option[],
          (beforeAnswer as Option[]) || [],
          activePosition
        );
      }
    }
  }

  /**
   * Handle number-based nested component updates.
   */
  private handleNumberBasedNested(
    nestedKey: string,
    current: number,
    previous: number,
    activePosition: number
  ): void {
    if (current > previous) {
      this.nestedService.insertFromNumber(
        nestedKey,
        current,
        previous,
        activePosition
      );
    } else if (current < previous) {
      this.nestedService.deleteFromNumber(
        nestedKey,
        current,
        previous,
        activePosition
      );
    }
  }

  /**
   * Handle array-based nested component updates.
   */
  private handleArrayBasedNested(
    nestedKey: string,
    current: Option[],
    previous: Option[],
    activePosition: number
  ): void {
    // Filter out invalid entries (value 0 with special label)
    const cleanCurrent = this.cleanNestedOptions(current);
    const cleanPrevious = this.cleanNestedOptions(previous);

    console.log('[AnswerService] handleArrayBasedNested:', {
      nestedKey,
      cleanCurrent,
      cleanPrevious,
      currentLength: cleanCurrent.length,
      previousLength: cleanPrevious.length,
    });

    // Check for items that exist in current but not in previous (need to add)
    for (const item of cleanCurrent) {
      const existsInPrevious = cleanPrevious.some((p) => p.value === item.value);
      if (!existsInPrevious) {
        const [sidebar] = this.stores.sidebar;
        const existsInSidebar = sidebar.details.some(
          (s) => s.dataKey === `${nestedKey}#${item.value}`
        );
        console.log('[AnswerService] Checking item to add:', { item, existsInPrevious, existsInSidebar });
        if (!existsInSidebar) {
          console.log('[AnswerService] Calling insertFromArray for:', item);
          this.nestedService.insertFromArray(nestedKey, item, activePosition);
        }
      }
    }

    // Check for items that exist in previous but not in current (need to remove)
    for (const item of cleanPrevious) {
      const existsInCurrent = cleanCurrent.some((c) => c.value === item.value);
      if (!existsInCurrent) {
        console.log('[AnswerService] Removing item:', item);
        this.nestedService.deleteFromArray(nestedKey, item, activePosition);
      }
    }
  }

  /**
   * Clean nested options by removing invalid entries.
   */
  private cleanNestedOptions(options: Option[]): Option[] {
    return options.filter((opt) => {
      if (Number(opt.value) === 0) {
        const labelParts = String(opt.label).split('#');
        return !labelParts[1]; // Keep if no # in label
      }
      return true;
    });
  }

  /**
   * Update the disabled sections cache.
   */
  private updateDisabledSections(): void {
    // This updates the referenceEnableFalse equivalent
    const disabledIndices = this.enableService.getDisabledSectionIndices();
    // Store in appropriate location if needed
  }

  // ===========================================================================
  // Private Helper Methods
  // ===========================================================================

  /**
   * Get the previous answer value for change detection.
   */
  private getPreviousAnswer(
    component: ReferenceDetail,
    newValue: unknown
  ): unknown {
    if (component.answer !== undefined && component.answer !== '') {
      return component.answer;
    }

    // Return appropriate default based on new value type
    if (typeof newValue === 'number' || typeof newValue === 'string') {
      return 0;
    }

    return [];
  }

  /**
   * Check if the answer has changed.
   */
  private hasAnswerChanged(before: unknown, after: unknown): boolean {
    return JSON.stringify(before) !== JSON.stringify(after);
  }

  /**
   * Get the default value for a component type.
   */
  private getDefaultValue(type: ComponentType): unknown {
    if (
      type === ComponentType.CHECKBOX ||
      type === ComponentType.MULTIPLE_SELECT ||
      type === ComponentType.CSV
    ) {
      return [];
    }

    return '';
  }
}
