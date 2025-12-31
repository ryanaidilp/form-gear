/**
 * ValidationService
 *
 * Handles all validation logic for form components.
 * Replaces runValidation from GlobalFunction.tsx.
 */

import type {
  FormStores,
  ReferenceDetail,
  ValidationRule,
  Language,
  FormGearConfig,
} from '../core/types';
import {
  ComponentType,
  ValidationState,
  ValidationType,
  ClientMode,
  PATTERNS,
} from '../core/constants';
import type { ReferenceService } from './ReferenceService';
import type { ExpressionService } from './ExpressionService';
import { templating, validateDateString, formatDate } from '../utils/formatting';

/**
 * Result of a validation check
 */
export interface ValidationResult {
  state: ValidationState;
  messages: string[];
}

/**
 * Service for validating form components.
 * Each FormGear instance gets its own ValidationService.
 */
export class ValidationService {
  private stores: FormStores;
  private referenceService: ReferenceService;
  private expressionService: ExpressionService;
  private config: FormGearConfig;

  constructor(
    stores: FormStores,
    referenceService: ReferenceService,
    expressionService: ExpressionService,
    config: FormGearConfig
  ) {
    this.stores = stores;
    this.referenceService = referenceService;
    this.expressionService = expressionService;
    this.config = config;
  }

  // ===========================================================================
  // Public Validation Methods
  // ===========================================================================

  /**
   * Run all validations for a component.
   *
   * @param dataKey - The component's dataKey
   * @returns ValidationResult with state and messages
   */
  validateComponent(dataKey: string): ValidationResult {
    const component = this.referenceService.getComponent(dataKey);
    if (!component) {
      return { state: ValidationState.VALID, messages: [] };
    }

    // Skip validation if component has remark
    if (component.hasRemark) {
      return { state: ValidationState.VALID, messages: [] };
    }

    const result: ValidationResult = {
      state: ValidationState.VALID,
      messages: [],
    };

    // Run expression-based validations
    this.runExpressionValidations(component, result);

    // Run length validations
    this.runLengthValidations(component, result);

    // Run range validations
    this.runRangeValidations(component, result);

    // Run pattern validations (email, URL)
    this.runPatternValidations(component, result);

    // Run PAPI-specific validations
    if (this.config.clientMode === ClientMode.PAPI) {
      this.runPapiValidations(component, result);
    }

    // Update component validation state
    this.updateValidationState(dataKey, result);

    return result;
  }

  /**
   * Run URL-based validation for a component.
   * This is async and updates the component state when complete.
   *
   * @param dataKey - The component's dataKey
   */
  async validateUrl(dataKey: string): Promise<void> {
    const component = this.referenceService.getComponent(dataKey);
    if (!component || !component.urlValidation) {
      return;
    }

    // Check if this component type supports URL validation
    const urlValidationTypes = [
      ComponentType.BUTTON,
      ComponentType.URL_BUTTON,
      ComponentType.DATE_RANGE,
      ComponentType.TEXTAREA,
      ComponentType.URL,
    ];

    if (!urlValidationTypes.includes(component.type)) {
      return;
    }

    try {
      const response = await fetch(component.urlValidation, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: component.answer }),
      });

      if (response.status !== 200) {
        this.addUrlValidationError(dataKey);
        return;
      }

      const result = await response.json();

      if (!result.result) {
        const message = result.message || this.getLocaleString('validationApi');
        this.addValidationMessage(dataKey, message, ValidationState.ERROR);
      }
    } catch {
      this.addUrlValidationError(dataKey);
    }
  }

  /**
   * Clear validation state for a component.
   *
   * @param dataKey - The component's dataKey
   */
  clearValidation(dataKey: string): void {
    this.referenceService.updateComponentBatch(dataKey, {
      validationState: ValidationState.VALID,
      validationMessage: [],
    });
  }

  /**
   * Validate all components and return summary.
   *
   * @returns Object with counts of valid, warning, and error components
   */
  validateAll(): { valid: number; warnings: number; errors: number } {
    const [reference] = this.stores.reference;
    let valid = 0;
    let warnings = 0;
    let errors = 0;

    for (const component of reference.details) {
      if (!component.enable) continue;

      const result = this.validateComponent(component.dataKey);

      switch (result.state) {
        case ValidationState.VALID:
          valid++;
          break;
        case ValidationState.WARNING:
          warnings++;
          break;
        case ValidationState.ERROR:
          errors++;
          break;
      }
    }

    return { valid, warnings, errors };
  }

  // ===========================================================================
  // Private Validation Methods
  // ===========================================================================

  /**
   * Run expression-based validations from validation rules.
   */
  private runExpressionValidations(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    if (!component.validations || component.validations.length === 0) {
      return;
    }

    for (const validation of component.validations) {
      const hasError = this.expressionService.evaluateValidation(
        validation.test,
        component.dataKey,
        component.answer
      );

      if (hasError) {
        result.messages.push(validation.message);
        result.state = Math.max(result.state, validation.type) as ValidationState;
      }
    }
  }

  /**
   * Run length validations (minlength, maxlength).
   */
  private runLengthValidations(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    if (!component.lengthInput) return;
    if (component.answer === undefined || component.answer === null) return;
    if (typeof component.answer === 'object') return;

    const answerStr = String(component.answer);
    const length = component.lengthInput;

    if (length.max !== undefined && answerStr.length > length.max) {
      result.messages.push(
        `${this.getLocaleString('validationMaxLength')} ${length.max}`
      );
      result.state = ValidationState.ERROR;
    }

    if (length.min !== undefined && answerStr.length < length.min) {
      result.messages.push(
        `${this.getLocaleString('validationMinLength')} ${length.min}`
      );
      result.state = ValidationState.ERROR;
    }
  }

  /**
   * Run range validations (min, max).
   */
  private runRangeValidations(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    if (!component.rangeInput) return;
    if (component.answer === undefined || component.answer === null) return;
    if (typeof component.answer === 'object') return;

    const value = Number(component.answer);
    const range = component.rangeInput;

    if (range.max !== undefined && value > range.max) {
      result.messages.push(
        `${this.getLocaleString('validationMax')} ${range.max}`
      );
      result.state = ValidationState.ERROR;
    }

    if (range.min !== undefined && value < range.min) {
      result.messages.push(
        `${this.getLocaleString('validationMin')} ${range.min}`
      );
      result.state = ValidationState.ERROR;
    }
  }

  /**
   * Run pattern validations (email, URL).
   */
  private runPatternValidations(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    if (component.answer === undefined || component.answer === null) return;
    if (typeof component.answer === 'object') return;

    const answerStr = String(component.answer);

    // Email validation (type 31 is URL in legacy, but used for email)
    if (component.type === ComponentType.URL && answerStr) {
      if (!PATTERNS.EMAIL.test(answerStr)) {
        result.messages.push(this.getLocaleString('validationEmail'));
        result.state = ValidationState.ERROR;
      }
    }

    // URL validation (type 19 is RANGE_SLIDER in legacy mapping - checking actual URL type)
    if (component.type === ComponentType.EMAIL && answerStr) {
      // Note: The legacy code has type 19 for URL but that maps to RANGE_SLIDER
      // Email type (32) should use email pattern
      // This appears to be a legacy bug - keeping behavior for now
    }
  }

  /**
   * Run PAPI-specific validations.
   */
  private runPapiValidations(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    if (component.answer === undefined) return;

    // Radio input validation
    if (component.type === ComponentType.RADIO) {
      this.validateRadioInput(component, result);
    }

    // Date/DateTime validation
    if (
      component.type === ComponentType.DATE ||
      component.type === ComponentType.DATETIME
    ) {
      this.validateDateInput(component, result);
    }

    // Range slider validation
    if (component.type === ComponentType.RANGE_SLIDER) {
      this.validateRangeSlider(component, result);
    }
  }

  /**
   * Validate radio input for PAPI mode.
   */
  private validateRadioInput(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    if (!component.options || !Array.isArray(component.answer)) return;

    const allowedValues = component.options.map((opt) => opt.value);
    const answer = component.answer as Array<{ value: unknown }>;

    if (answer[0] && !allowedValues.includes(answer[0].value as string | number)) {
      const message = templating(this.getLocaleString('validationInclude'), {
        values: allowedValues.join(','),
      });
      result.messages.push(message);
      result.state = ValidationState.ERROR;
    }
  }

  /**
   * Validate date input for PAPI mode.
   */
  private validateDateInput(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    const answerStr = String(component.answer);

    if (!validateDateString(answerStr)) {
      result.messages.push(this.getLocaleString('validationDate'));
      result.state = ValidationState.ERROR;
      return;
    }

    const date = new Date(answerStr);
    const range = component.rangeInput;

    if (range?.max !== undefined) {
      const maxDate =
        range.max === 'today' ? new Date() : new Date(range.max as string | number);
      if (date.getTime() > maxDate.getTime()) {
        result.messages.push(
          `${this.getLocaleString('validationMax')} ${formatDate(maxDate)}`
        );
        result.state = ValidationState.ERROR;
      }
    }

    if (range?.min !== undefined) {
      const minDate =
        range.min === 'today' ? new Date() : new Date(range.min as string | number);
      if (date.getTime() < minDate.getTime()) {
        result.messages.push(
          `${this.getLocaleString('validationMin')} ${formatDate(minDate)}`
        );
        result.state = ValidationState.ERROR;
      }
    }
  }

  /**
   * Validate range slider for PAPI mode.
   */
  private validateRangeSlider(
    component: ReferenceDetail,
    result: ValidationResult
  ): void {
    const step = component.rangeInput?.step;
    if (step === undefined) return;

    const value = Number(component.answer);
    if (value % step !== 0) {
      result.messages.push(
        `${this.getLocaleString('validationStep')} ${step}`
      );
      result.state = ValidationState.ERROR;
    }
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Add a URL validation error to the component.
   */
  private addUrlValidationError(dataKey: string): void {
    this.addValidationMessage(
      dataKey,
      this.getLocaleString('validationApi'),
      ValidationState.ERROR
    );
  }

  /**
   * Add a validation message to a component.
   */
  private addValidationMessage(
    dataKey: string,
    message: string,
    state: ValidationState
  ): void {
    const component = this.referenceService.getComponent(dataKey);
    if (!component) return;

    const messages = [...(component.validationMessage || []), message];
    const newState = Math.max(component.validationState, state) as ValidationState;

    this.referenceService.updateComponentBatch(dataKey, {
      validationMessage: messages,
      validationState: newState,
    });
  }

  /**
   * Update the validation state in the store.
   */
  private updateValidationState(
    dataKey: string,
    result: ValidationResult
  ): void {
    this.referenceService.updateComponentBatch(dataKey, {
      validationState: result.state,
      validationMessage: result.messages,
    });
  }

  /**
   * Get a locale string by key.
   */
  private getLocaleString(key: keyof Language): string {
    const [locale] = this.stores.locale;
    const language = locale.details?.language?.[0];
    if (!language) return key;
    return language[key] || key;
  }

  // ===========================================================================
  // Dependency Validation
  // ===========================================================================

  /**
   * Validate all components that depend on a given dataKey.
   *
   * @param sourceDataKey - The dataKey that was updated
   */
  validateDependents(sourceDataKey: string): void {
    const dependents = this.referenceService.getValidationDependents(sourceDataKey);

    for (const dependentKey of dependents) {
      this.validateComponent(dependentKey);
    }
  }
}
