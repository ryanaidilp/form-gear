import { describe, it, expect, vi } from 'vitest';
import { render } from '@solidjs/testing-library';
import { createFormStores } from '../createStores';
import {
  StoreProvider,
  useStores,
  useReference,
  useResponse,
  useTemplate,
  useValidation,
  usePreset,
  useMedia,
  useRemark,
  useSidebar,
  useLocale,
  useSummary,
  useCounter,
  useInput,
  useNested,
  useNote,
  usePrincipal,
  useReferenceMap,
  useSidebarIndexMap,
  useCompEnableMap,
  useCompValidMap,
  useCompSourceOptionMap,
  useCompVarMap,
  useCompSourceQuestionMap,
  useReferenceHistoryEnable,
  useReferenceHistory,
  useSidebarHistory,
  useReferenceEnableFalse,
} from '../StoreContext';

describe('StoreContext', () => {
  describe('StoreProvider', () => {
    it('should render children', () => {
      const stores = createFormStores();

      const { getByText } = render(() => (
        <StoreProvider stores={stores}>
          <div>Child Content</div>
        </StoreProvider>
      ));

      expect(getByText('Child Content')).toBeInTheDocument();
    });

    it('should provide stores to children', () => {
      const stores = createFormStores();
      let capturedStores: unknown = null;

      function Consumer() {
        capturedStores = useStores();
        return <div>Consumer</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(capturedStores).toBe(stores);
    });
  });

  describe('useStores', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        function BadComponent() {
          useStores();
          return <div>Bad</div>;
        }
        render(() => <BadComponent />);
      }).toThrow('useStores must be used within a StoreProvider');

      consoleError.mockRestore();
    });

    it('should return FormStores when used inside provider', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useStores();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBeDefined();
      expect(result).toHaveProperty('reference');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('dispose');
    });
  });

  describe('store hooks', () => {
    it('useReference should return reference store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useReference();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.reference);
      expect(Array.isArray(result)).toBe(true);
    });

    it('useResponse should return response store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useResponse();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.response);
    });

    it('useTemplate should return template store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useTemplate();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.template);
    });

    it('useValidation should return validation store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useValidation();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.validation);
    });

    it('usePreset should return preset store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = usePreset();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.preset);
    });

    it('useMedia should return media store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useMedia();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.media);
    });

    it('useRemark should return remark store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useRemark();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.remark);
    });

    it('useSidebar should return sidebar store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useSidebar();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.sidebar);
    });

    it('useLocale should return locale store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useLocale();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.locale);
    });

    it('useSummary should return summary store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useSummary();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.summary);
    });

    it('useCounter should return counter store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useCounter();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.counter);
    });

    it('useInput should return input store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useInput();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.input);
    });

    it('useNested should return nested store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useNested();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.nested);
    });

    it('useNote should return note store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useNote();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.note);
    });

    it('usePrincipal should return principal store tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = usePrincipal();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.principal);
    });
  });

  describe('signal hooks', () => {
    it('useReferenceMap should return referenceMap signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useReferenceMap();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.referenceMap);
    });

    it('useSidebarIndexMap should return sidebarIndexMap signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useSidebarIndexMap();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.sidebarIndexMap);
    });

    it('useCompEnableMap should return compEnableMap signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useCompEnableMap();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.compEnableMap);
    });

    it('useCompValidMap should return compValidMap signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useCompValidMap();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.compValidMap);
    });

    it('useCompSourceOptionMap should return compSourceOptionMap signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useCompSourceOptionMap();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.compSourceOptionMap);
    });

    it('useCompVarMap should return compVarMap signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useCompVarMap();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.compVarMap);
    });

    it('useCompSourceQuestionMap should return compSourceQuestionMap signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useCompSourceQuestionMap();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.compSourceQuestionMap);
    });

    it('useReferenceHistoryEnable should return referenceHistoryEnable signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useReferenceHistoryEnable();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.referenceHistoryEnable);
    });

    it('useReferenceHistory should return referenceHistory signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useReferenceHistory();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.referenceHistory);
    });

    it('useSidebarHistory should return sidebarHistory signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useSidebarHistory();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.sidebarHistory);
    });

    it('useReferenceEnableFalse should return referenceEnableFalse signal tuple', () => {
      const stores = createFormStores();
      let result: unknown = null;

      function Consumer() {
        result = useReferenceEnableFalse();
        return <div>OK</div>;
      }

      render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(result).toBe(stores.referenceEnableFalse);
    });
  });

  describe('nested providers', () => {
    it('should use the nearest provider', () => {
      const outerStores = createFormStores();
      const innerStores = createFormStores();

      outerStores.summary[1]('answer', 10);
      innerStores.summary[1]('answer', 20);

      let outerResult: number = 0;
      let innerResult: number = 0;

      function OuterConsumer() {
        const [summary] = useSummary();
        outerResult = summary.answer;
        return <div>Outer</div>;
      }

      function InnerConsumer() {
        const [summary] = useSummary();
        innerResult = summary.answer;
        return <div>Inner</div>;
      }

      render(() => (
        <StoreProvider stores={outerStores}>
          <OuterConsumer />
          <StoreProvider stores={innerStores}>
            <InnerConsumer />
          </StoreProvider>
        </StoreProvider>
      ));

      expect(outerResult).toBe(10);
      expect(innerResult).toBe(20);
    });
  });

  describe('reactivity', () => {
    it('should update component when store changes', async () => {
      const stores = createFormStores();
      let renderCount = 0;

      function Consumer() {
        const [summary] = useSummary();
        renderCount++;
        return <div data-testid="answer">{summary.answer}</div>;
      }

      const { getByTestId } = render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(getByTestId('answer').textContent).toBe('0');

      // Update store
      stores.summary[1]('answer', 5);

      // Wait for reactivity
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(getByTestId('answer').textContent).toBe('5');
    });

    it('should update component when signal changes', async () => {
      const stores = createFormStores();

      function Consumer() {
        const [getHistoryEnable] = useReferenceHistoryEnable();
        return <div data-testid="enabled">{getHistoryEnable() ? 'yes' : 'no'}</div>;
      }

      const { getByTestId } = render(() => (
        <StoreProvider stores={stores}>
          <Consumer />
        </StoreProvider>
      ));

      expect(getByTestId('enabled').textContent).toBe('no');

      // Update signal
      stores.referenceHistoryEnable[1](true);

      // Wait for reactivity
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(getByTestId('enabled').textContent).toBe('yes');
    });
  });
});
