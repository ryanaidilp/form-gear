/**
 * Service Context
 *
 * Provides all FormGear services via SolidJS context.
 * This enables service isolation - each FormGear instance has its own services.
 */

import { createContext, useContext, ParentComponent } from 'solid-js';
import type { FormStores, FormGearConfig } from '../core/types';
import { ReferenceService } from './ReferenceService';
import { ExpressionService } from './ExpressionService';
import { ValidationService } from './ValidationService';
import { EnableService } from './EnableService';
import { NestedService } from './NestedService';
import { AnswerService } from './AnswerService';
import { HistoryService } from './HistoryService';

// =============================================================================
// Service Container
// =============================================================================

/**
 * Container holding all service instances
 */
export interface FormServices {
  reference: ReferenceService;
  expression: ExpressionService;
  validation: ValidationService;
  enable: EnableService;
  nested: NestedService;
  answer: AnswerService;
  history: HistoryService;
}

// =============================================================================
// Service Factory
// =============================================================================

/**
 * Create all services for a FormGear instance.
 *
 * @param stores - The FormStores instance
 * @param config - FormGear configuration
 * @returns FormServices container with all services
 */
export function createFormServices(
  stores: FormStores,
  config: FormGearConfig
): FormServices {
  // Create services in dependency order
  const referenceService = new ReferenceService(stores);

  const expressionService = new ExpressionService(
    stores,
    referenceService,
    config
  );

  const validationService = new ValidationService(
    stores,
    referenceService,
    expressionService,
    config
  );

  const enableService = new EnableService(
    stores,
    referenceService,
    expressionService,
    config
  );

  const nestedService = new NestedService(
    stores,
    referenceService,
    expressionService,
    config
  );

  const historyService = new HistoryService(stores, referenceService);

  const answerService = new AnswerService(
    stores,
    referenceService,
    expressionService,
    validationService,
    enableService,
    nestedService,
    config
  );

  // Wire up circular dependency
  answerService.setHistoryService(historyService);

  return {
    reference: referenceService,
    expression: expressionService,
    validation: validationService,
    enable: enableService,
    nested: nestedService,
    answer: answerService,
    history: historyService,
  };
}

// =============================================================================
// Context
// =============================================================================

/**
 * Context for accessing FormGear services
 */
const ServiceContext = createContext<FormServices>();

// =============================================================================
// Provider
// =============================================================================

interface ServiceProviderProps {
  services: FormServices;
}

/**
 * Provider component that makes services available to child components.
 *
 * @example
 * ```tsx
 * const services = createFormServices(stores, config);
 *
 * <ServiceProvider services={services}>
 *   <Form />
 * </ServiceProvider>
 * ```
 */
export const ServiceProvider: ParentComponent<ServiceProviderProps> = (props) => {
  return (
    <ServiceContext.Provider value={props.services}>
      {props.children}
    </ServiceContext.Provider>
  );
};

// =============================================================================
// Main Hook
// =============================================================================

/**
 * Hook to access all services.
 *
 * @throws Error if used outside of ServiceProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const services = useServices();
 *   services.answer.saveAnswer('Q1', 'value');
 * }
 * ```
 */
export function useServices(): FormServices {
  const services = useContext(ServiceContext);
  if (!services) {
    throw new Error(
      'useServices must be used within a ServiceProvider. ' +
        'Make sure your component is wrapped with <ServiceProvider services={...}>.'
    );
  }
  return services;
}

// =============================================================================
// Individual Service Hooks
// =============================================================================

/**
 * Hook to access the ReferenceService.
 */
export function useReferenceService(): ReferenceService {
  return useServices().reference;
}

/**
 * Hook to access the ExpressionService.
 */
export function useExpressionService(): ExpressionService {
  return useServices().expression;
}

/**
 * Hook to access the ValidationService.
 */
export function useValidationService(): ValidationService {
  return useServices().validation;
}

/**
 * Hook to access the EnableService.
 */
export function useEnableService(): EnableService {
  return useServices().enable;
}

/**
 * Hook to access the NestedService.
 */
export function useNestedService(): NestedService {
  return useServices().nested;
}

/**
 * Hook to access the AnswerService.
 */
export function useAnswerService(): AnswerService {
  return useServices().answer;
}

/**
 * Hook to access the HistoryService.
 */
export function useHistoryService(): HistoryService {
  return useServices().history;
}
