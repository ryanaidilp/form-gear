/**
 * Services Index
 *
 * Exports all FormGear services and context providers.
 */

// Service classes
export { ReferenceService } from './ReferenceService';
export { ExpressionService } from './ExpressionService';
export { ValidationService } from './ValidationService';
export { EnableService } from './EnableService';
export { NestedService } from './NestedService';
export { AnswerService } from './AnswerService';
export { HistoryService } from './HistoryService';

// Service context and hooks
export {
  createFormServices,
  ServiceProvider,
  useServices,
  useReferenceService,
  useExpressionService,
  useValidationService,
  useEnableService,
  useNestedService,
  useAnswerService,
  useHistoryService,
} from './ServiceContext';

// Types
export type { FormServices } from './ServiceContext';
export type { ValidationResult } from './ValidationService';
export type { SaveAnswerOptions } from './AnswerService';
export type { HistoryType } from './HistoryService';
