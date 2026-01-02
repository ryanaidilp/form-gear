import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@solidjs/testing-library';
import { createSignal, createEffect } from 'solid-js';
import {
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
} from '../ServiceContext';
import { createFormStores } from '../../stores/createStores';
import type { FormStores, FormGearConfig } from '../../core/types';
import { ReferenceService } from '../ReferenceService';
import { ExpressionService } from '../ExpressionService';
import { ValidationService } from '../ValidationService';
import { EnableService } from '../EnableService';
import { NestedService } from '../NestedService';
import { AnswerService } from '../AnswerService';
import { HistoryService } from '../HistoryService';

const defaultConfig: FormGearConfig = {
  clientMode: 1,
  formMode: 1,
  initialMode: 0,
};

describe('ServiceContext', () => {
  let stores: FormStores;

  beforeEach(() => {
    stores = createFormStores();
  });

  describe('createFormServices', () => {
    it('should create all services', () => {
      const services = createFormServices(stores, defaultConfig);

      expect(services.reference).toBeInstanceOf(ReferenceService);
      expect(services.expression).toBeInstanceOf(ExpressionService);
      expect(services.validation).toBeInstanceOf(ValidationService);
      expect(services.enable).toBeInstanceOf(EnableService);
      expect(services.nested).toBeInstanceOf(NestedService);
      expect(services.answer).toBeInstanceOf(AnswerService);
      expect(services.history).toBeInstanceOf(HistoryService);
    });

    it('should wire up history service to answer service', () => {
      const services = createFormServices(stores, defaultConfig);

      // Add a component to test the wiring
      stores.reference[1]('details', [
        {
          dataKey: 'Q1',
          name: 'Q1',
          label: 'Question 1',
          type: 1,
          index: [0],
          level: 0,
          enable: true,
          answer: 'old',
          validationState: 0,
          validationMessage: [],
        },
      ]);

      services.reference.rebuildIndexMap();

      // Save an answer - this should record history
      services.answer.saveAnswer('Q1', 'new');

      // History should have an entry
      expect(services.history.getEntryCount()).toBe(1);
    });

    it('should create isolated services for each call', () => {
      const services1 = createFormServices(stores, defaultConfig);
      const services2 = createFormServices(stores, defaultConfig);

      // Each call creates new instances
      expect(services1.reference).not.toBe(services2.reference);
      expect(services1.expression).not.toBe(services2.expression);
      expect(services1.answer).not.toBe(services2.answer);
    });

    it('should pass config to services', () => {
      const customConfig: FormGearConfig = {
        clientMode: 2,
        formMode: 3,
        initialMode: 1,
        baseUrl: 'https://custom.api.com',
        username: 'testuser',
        token: 'secret-token',
      };

      const services = createFormServices(stores, customConfig);

      // Test that expression service has access to config via getProp
      const context = services.expression.createContext('test');
      expect(context.getProp('clientMode')).toBe(2);
      expect(context.getProp('formMode')).toBe(3);
      expect(context.getProp('baseUrl')).toBe('https://custom.api.com');
    });
  });

  describe('ServiceProvider', () => {
    it('should provide services to children', () => {
      const services = createFormServices(stores, defaultConfig);
      let capturedServices: ReturnType<typeof useServices> | null = null;

      const TestComponent = () => {
        capturedServices = useServices();
        return <div>Test</div>;
      };

      render(() => (
        <ServiceProvider services={services}>
          <TestComponent />
        </ServiceProvider>
      ));

      expect(capturedServices).toBe(services);
    });

    it('should render children correctly', () => {
      const services = createFormServices(stores, defaultConfig);

      const { getByText } = render(() => (
        <ServiceProvider services={services}>
          <div>Child Content</div>
        </ServiceProvider>
      ));

      expect(getByText('Child Content')).toBeInTheDocument();
    });
  });

  describe('useServices', () => {
    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useServices();
        return <div>Test</div>;
      };

      expect(() => {
        render(() => <TestComponent />);
      }).toThrow(
        'useServices must be used within a ServiceProvider'
      );
    });

    it('should return services when used inside provider', () => {
      const services = createFormServices(stores, defaultConfig);
      let result: ReturnType<typeof useServices> | null = null;

      const TestComponent = () => {
        result = useServices();
        return <div>Test</div>;
      };

      render(() => (
        <ServiceProvider services={services}>
          <TestComponent />
        </ServiceProvider>
      ));

      expect(result).toBe(services);
    });
  });

  describe('individual service hooks', () => {
    const renderWithProvider = (Component: () => any) => {
      const services = createFormServices(stores, defaultConfig);
      let result: any = null;

      const Wrapper = () => {
        result = Component();
        return <div>Test</div>;
      };

      render(() => (
        <ServiceProvider services={services}>
          <Wrapper />
        </ServiceProvider>
      ));

      return { result, services };
    };

    it('useReferenceService should return reference service', () => {
      const { result, services } = renderWithProvider(useReferenceService);
      expect(result).toBe(services.reference);
    });

    it('useExpressionService should return expression service', () => {
      const { result, services } = renderWithProvider(useExpressionService);
      expect(result).toBe(services.expression);
    });

    it('useValidationService should return validation service', () => {
      const { result, services } = renderWithProvider(useValidationService);
      expect(result).toBe(services.validation);
    });

    it('useEnableService should return enable service', () => {
      const { result, services } = renderWithProvider(useEnableService);
      expect(result).toBe(services.enable);
    });

    it('useNestedService should return nested service', () => {
      const { result, services } = renderWithProvider(useNestedService);
      expect(result).toBe(services.nested);
    });

    it('useAnswerService should return answer service', () => {
      const { result, services } = renderWithProvider(useAnswerService);
      expect(result).toBe(services.answer);
    });

    it('useHistoryService should return history service', () => {
      const { result, services } = renderWithProvider(useHistoryService);
      expect(result).toBe(services.history);
    });
  });

  describe('service integration', () => {
    it('should allow services to work together', () => {
      const services = createFormServices(stores, defaultConfig);

      // Set up a component with enable condition
      stores.reference[1]('details', [
        {
          dataKey: 'Q1',
          name: 'Q1',
          label: 'Question 1',
          type: 1,
          index: [0],
          level: 0,
          enable: true,
          answer: '',
          validationState: 0,
          validationMessage: [],
        },
        {
          dataKey: 'Q2',
          name: 'Q2',
          label: 'Question 2',
          type: 1,
          index: [1],
          level: 0,
          enable: true,
          enableCondition: "getValue('Q1') === 'yes'",
          componentEnable: ['Q1'],
          validationState: 0,
          validationMessage: [],
        },
      ]);

      services.reference.initializeMaps();

      // Initially Q2 should be disabled because Q1 is empty
      services.enable.evaluateEnable('Q2');

      const q2Before = services.reference.getComponent('Q2');
      expect(q2Before?.enable).toBe(false);

      // Now answer Q1 with 'yes'
      services.answer.saveAnswer('Q1', 'yes');

      const q2After = services.reference.getComponent('Q2');
      expect(q2After?.enable).toBe(true);
    });

    it('should track history across multiple operations', () => {
      const services = createFormServices(stores, defaultConfig);

      stores.reference[1]('details', [
        {
          dataKey: 'Q1',
          name: 'Q1',
          label: 'Question 1',
          type: 1,
          index: [0],
          level: 0,
          enable: true,
          answer: '',
          validationState: 0,
          validationMessage: [],
        },
      ]);

      services.reference.rebuildIndexMap();

      // Make multiple changes
      services.answer.saveAnswer('Q1', 'first');
      services.answer.saveAnswer('Q1', 'second');
      services.answer.saveAnswer('Q1', 'third');

      // History should have 3 entries
      expect(services.history.getEntryCount()).toBe(3);

      // Undo should restore previous state
      services.history.reloadFromHistory();

      const [reference] = stores.reference;
      // After reload, should have the first answer
      expect(reference.details[0].answer).toBe('');
    });
  });

  describe('nested provider scenarios', () => {
    it('should use closest provider', () => {
      const outerServices = createFormServices(stores, defaultConfig);
      const innerServices = createFormServices(createFormStores(), defaultConfig);

      let capturedServices: ReturnType<typeof useServices> | null = null;

      const InnerComponent = () => {
        capturedServices = useServices();
        return <div>Inner</div>;
      };

      render(() => (
        <ServiceProvider services={outerServices}>
          <div>Outer</div>
          <ServiceProvider services={innerServices}>
            <InnerComponent />
          </ServiceProvider>
        </ServiceProvider>
      ));

      expect(capturedServices).toBe(innerServices);
    });
  });
});
