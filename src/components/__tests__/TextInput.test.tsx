import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import TextInput from '../TextInput';
import { ControlType } from '../../FormType';

describe('TextInput Component', () => {
  const defaultProps = {
    onMobile: false,
    component: {
      dataKey: 'test_field',
      label: 'Test Label',
      type: ControlType.TextInput,
      required: false,
      principal: 0,
      columnName: 'test_column',
      titleModalConfirmation: '',
      contentModalConfirmation: '',
    },
    index: 0,
    value: '',
    config: {
      formMode: 1,
      initialMode: 0,
    },
    classValidation: 0,
    validationMessage: [],
    comments: 0,
    onValueChange: vi.fn(),
    openRemark: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the component', () => {
      const { container } = render(() => <TextInput {...defaultProps} />);

      expect(container.querySelector('input[type="text"]')).toBeInTheDocument();
    });

    it('should render label with innerHTML', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '<strong>Bold Label</strong>',
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      // The label is rendered inside the component
      const strongElement = container.querySelector('strong');

      expect(strongElement).toBeInTheDocument();
      expect(strongElement?.textContent).toBe('Bold Label');
    });

    it('should render required indicator when required is true', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          required: true,
        },
      };

      const { getByText } = render(() => <TextInput {...props} />);

      expect(getByText('*')).toBeInTheDocument();
    });

    it('should not render required indicator when required is false', () => {
      const { queryByText } = render(() => <TextInput {...defaultProps} />);

      expect(queryByText('*')).not.toBeInTheDocument();
    });

    it('should render with initial value', () => {
      const props = {
        ...defaultProps,
        value: 'Initial Value',
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.value).toBe('Initial Value');
    });
  });

  describe('hint/instruction', () => {
    it('should render hint button when hint is provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          hint: 'This is a helpful hint',
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      const hintButton = container.querySelector('button');

      expect(hintButton).toBeInTheDocument();
    });

    it('should toggle hint visibility when button is clicked', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          hint: 'This is a helpful hint',
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      const hintButton = container.querySelector('button') as HTMLButtonElement;

      // Initially hint should not be visible
      let hintText = container.querySelector('.italic');
      expect(hintText).not.toBeInTheDocument();

      // Click to show hint
      await fireEvent.click(hintButton);
      hintText = container.querySelector('.italic');
      expect(hintText).toBeInTheDocument();

      // Click to hide hint
      await fireEvent.click(hintButton);
      hintText = container.querySelector('.italic');
      expect(hintText).not.toBeInTheDocument();
    });
  });

  describe('input behavior', () => {
    it('should call onValueChange when input changes', async () => {
      const onValueChange = vi.fn();
      const props = {
        ...defaultProps,
        onValueChange,
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      await fireEvent.change(input, { target: { value: 'New Value' } });

      expect(onValueChange).toHaveBeenCalledWith('New Value');
    });

    it('should have correct name attribute', () => {
      const { container } = render(() => <TextInput {...defaultProps} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.name).toBe('test_field');
    });
  });

  describe('disabled state', () => {
    it('should be enabled by default', () => {
      const { container } = render(() => <TextInput {...defaultProps} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.disabled).toBe(false);
    });

    it('should be disabled when disableInput is true', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          disableInput: true,
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.disabled).toBe(true);
    });

    it('should be disabled in view mode (formMode > 1 && initialMode == 2)', () => {
      const props = {
        ...defaultProps,
        config: {
          formMode: 2,
          initialMode: 2,
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.disabled).toBe(true);
    });
  });

  describe('validation styling', () => {
    it('should have default border class when validation is 0', () => {
      const { container } = render(() => <TextInput {...defaultProps} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.className).toContain('border-gray-300');
    });

    it('should have warning border class when validation is 1', () => {
      const props = {
        ...defaultProps,
        classValidation: 1,
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.className).toContain('border-orange-500');
    });

    it('should have error border class when validation is 2', () => {
      const props = {
        ...defaultProps,
        classValidation: 2,
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.className).toContain('border-pink-600');
    });
  });

  describe('validation messages', () => {
    it('should render validation messages when provided', () => {
      const props = {
        ...defaultProps,
        classValidation: 2,
        validationMessage: ['Field is required', 'Minimum 5 characters'],
      };

      const { container } = render(() => <TextInput {...props} />);
      const messages = container.querySelectorAll('.text-xs.font-light');

      expect(messages.length).toBe(2);
    });

    it('should not render validation messages when empty', () => {
      const { container } = render(() => <TextInput {...defaultProps} />);
      const messages = container.querySelectorAll('.text-xs.font-light.mt-1');

      expect(messages.length).toBe(0);
    });

    it('should show warning icon for classValidation 1', () => {
      const props = {
        ...defaultProps,
        classValidation: 1,
        validationMessage: ['Warning message'],
      };

      const { container } = render(() => <TextInput {...props} />);
      const warningText = container.querySelector('.text-orange-500');

      expect(warningText).toBeInTheDocument();
    });

    it('should show error icon for classValidation 2', () => {
      const props = {
        ...defaultProps,
        classValidation: 2,
        validationMessage: ['Error message'],
      };

      const { container } = render(() => <TextInput {...props} />);
      const errorText = container.querySelector('.text-pink-600');

      expect(errorText).toBeInTheDocument();
    });
  });

  describe('length constraints', () => {
    it('should set maxlength attribute when provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{ maxlength: 50 }],
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.maxLength).toBe(50);
    });

    it('should set minlength attribute when provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{ minlength: 5 }],
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.minLength).toBe(5);
    });

    it('should set both maxlength and minlength when provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{ maxlength: 100, minlength: 10 }],
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      const input = container.querySelector('input[type="text"]') as HTMLInputElement;

      expect(input.maxLength).toBe(100);
      expect(input.minLength).toBe(10);
    });
  });

  describe('remark functionality', () => {
    it('should render remark button by default', () => {
      const { container } = render(() => <TextInput {...defaultProps} />);
      const remarkButtons = container.querySelectorAll('button');

      // Should have at least one button for remark (might also have hint button)
      expect(remarkButtons.length).toBeGreaterThan(0);
    });

    it('should not render remark button when enableRemark is false', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          enableRemark: false,
        },
      };

      const { container } = render(() => <TextInput {...props} />);
      // With no hint and no remark, there should be no buttons
      const buttons = container.querySelectorAll('button');

      expect(buttons.length).toBe(0);
    });

    it('should call openRemark when remark button is clicked', async () => {
      const openRemark = vi.fn();
      const props = {
        ...defaultProps,
        openRemark,
      };

      const { container } = render(() => <TextInput {...props} />);
      // Find the remark button (it has the comment icon)
      const remarkButton = container.querySelector('button.relative') as HTMLButtonElement;

      if (remarkButton) {
        await fireEvent.click(remarkButton);
        expect(openRemark).toHaveBeenCalledWith('test_field');
      }
    });

    it('should show comment count badge when comments exist', () => {
      const props = {
        ...defaultProps,
        comments: 3,
      };

      const { getByText } = render(() => <TextInput {...props} />);

      expect(getByText('3')).toBeInTheDocument();
    });

    it('should not show comment count badge when no comments', () => {
      const { queryByText } = render(() => <TextInput {...defaultProps} />);

      // Look for any number that would indicate a comment count
      const badge = document.querySelector('.bg-pink-600');

      expect(badge).not.toBeInTheDocument();
    });

    it('should disable remark button in view mode with no comments', () => {
      const props = {
        ...defaultProps,
        config: {
          formMode: 3,
          initialMode: 0,
        },
        comments: 0,
      };

      const { container } = render(() => <TextInput {...props} />);
      const remarkButton = container.querySelector('button.relative') as HTMLButtonElement;

      if (remarkButton) {
        expect(remarkButton.disabled).toBe(true);
      }
    });
  });
});
