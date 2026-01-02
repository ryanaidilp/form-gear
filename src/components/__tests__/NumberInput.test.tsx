import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@solidjs/testing-library';
import NumberInput from '../NumberInput';
import { ControlType } from '../../FormType';

describe('NumberInput Component', () => {
  const defaultProps = {
    onMobile: false,
    component: {
      dataKey: 'age_field',
      label: 'Age',
      type: ControlType.NumberInput,
      required: false,
      principal: 0,
      columnName: 'age',
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
    it('should render a number input', () => {
      const { container } = render(() => <NumberInput {...defaultProps} />);
      const input = container.querySelector('input[type="number"]');

      expect(input).toBeInTheDocument();
    });

    it('should render with correct name attribute', () => {
      const { container } = render(() => <NumberInput {...defaultProps} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.name).toBe('age_field');
    });

    it('should render with initial numeric value', () => {
      const props = {
        ...defaultProps,
        value: 25,
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.value).toBe('25');
    });

    it('should render label', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '<span>Enter your age</span>',
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      // Find the label text in the component
      const labelSpan = container.querySelector('span');

      expect(labelSpan).toBeInTheDocument();
      expect(labelSpan?.textContent).toBe('Enter your age');
    });

    it('should render required indicator when required', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          required: true,
        },
      };

      const { getByText } = render(() => <NumberInput {...props} />);

      expect(getByText('*')).toBeInTheDocument();
    });
  });

  describe('input behavior', () => {
    it('should call onValueChange with parsed integer when value changes', async () => {
      const onValueChange = vi.fn();
      const props = {
        ...defaultProps,
        onValueChange,
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      await fireEvent.change(input, { target: { value: '42' } });

      expect(onValueChange).toHaveBeenCalledWith(42);
    });

    it('should call onValueChange with NaN for invalid input', async () => {
      const onValueChange = vi.fn();
      const props = {
        ...defaultProps,
        onValueChange,
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      await fireEvent.change(input, { target: { value: 'abc' } });

      expect(onValueChange).toHaveBeenCalledWith(NaN);
    });
  });

  describe('disabled state', () => {
    it('should be enabled in edit mode (formMode = 1)', () => {
      const { container } = render(() => <NumberInput {...defaultProps} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.disabled).toBe(false);
    });

    it('should be disabled when formMode > 1', () => {
      const props = {
        ...defaultProps,
        config: {
          formMode: 2,
          initialMode: 0,
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.disabled).toBe(true);
    });

    it('should be disabled when disableInput is true', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          disableInput: true,
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.disabled).toBe(true);
    });
  });

  describe('range constraints', () => {
    it('should set min and max when rangeInput is provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{}],
          rangeInput: [{ min: 0, max: 100 }],
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.min).toBe('0');
      expect(input.max).toBe('100');
    });

    it('should set only min when provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{}],
          rangeInput: [{ min: 18, max: '' }],
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.min).toBe('18');
    });

    it('should set only max when provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{}],
          rangeInput: [{ min: '', max: 65 }],
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.max).toBe('65');
    });
  });

  describe('length constraints', () => {
    it('should set maxlength when lengthInput provides it', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{ maxlength: 3 }],
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.maxLength).toBe(3);
    });

    it('should set minlength when lengthInput provides it', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          lengthInput: [{ minlength: 2 }],
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.minLength).toBe(2);
    });
  });

  describe('validation styling', () => {
    it('should have default styling when classValidation is 0', () => {
      const { container } = render(() => <NumberInput {...defaultProps} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.className).toContain('border-gray-300');
    });

    it('should have warning styling when classValidation is 1', () => {
      const props = {
        ...defaultProps,
        classValidation: 1,
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.className).toContain('border-orange-500');
    });

    it('should have error styling when classValidation is 2', () => {
      const props = {
        ...defaultProps,
        classValidation: 2,
      };

      const { container } = render(() => <NumberInput {...props} />);
      const input = container.querySelector('input[type="number"]') as HTMLInputElement;

      expect(input.className).toContain('border-pink-600');
    });
  });

  describe('validation messages', () => {
    it('should render validation messages', () => {
      const props = {
        ...defaultProps,
        classValidation: 2,
        validationMessage: ['Value must be positive', 'Maximum is 100'],
      };

      const { container } = render(() => <NumberInput {...props} />);
      const messages = container.querySelectorAll('.text-xs.font-light');

      expect(messages.length).toBe(2);
    });

    it('should show warning icon for warnings', () => {
      const props = {
        ...defaultProps,
        classValidation: 1,
        validationMessage: ['Recommended range is 18-65'],
      };

      const { container } = render(() => <NumberInput {...props} />);
      const warningElement = container.querySelector('.text-orange-500');

      expect(warningElement).toBeInTheDocument();
    });

    it('should show error icon for errors', () => {
      const props = {
        ...defaultProps,
        classValidation: 2,
        validationMessage: ['Value is required'],
      };

      const { container } = render(() => <NumberInput {...props} />);
      const errorElement = container.querySelector('.text-pink-600');

      expect(errorElement).toBeInTheDocument();
    });
  });

  describe('hint functionality', () => {
    it('should render hint button when hint is provided', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          hint: 'Enter a number between 0 and 100',
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      // Find the hint button (small rounded button with svg)
      const hintButton = container.querySelector('button.bg-transparent');

      expect(hintButton).toBeInTheDocument();
    });

    it('should toggle hint visibility on click', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          hint: 'Helpful hint text',
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const hintButton = container.querySelector('button.bg-transparent') as HTMLButtonElement;

      // Initially hidden
      let hintText = container.querySelector('.italic');
      expect(hintText).not.toBeInTheDocument();

      // Show hint
      await fireEvent.click(hintButton);
      hintText = container.querySelector('.italic');
      expect(hintText).toBeInTheDocument();

      // Hide hint
      await fireEvent.click(hintButton);
      hintText = container.querySelector('.italic');
      expect(hintText).not.toBeInTheDocument();
    });
  });

  describe('remark functionality', () => {
    it('should render remark button by default', () => {
      const { container } = render(() => <NumberInput {...defaultProps} />);
      const remarkButton = container.querySelector('button.relative');

      expect(remarkButton).toBeInTheDocument();
    });

    it('should not render remark button when enableRemark is false', () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          enableRemark: false,
        },
      };

      const { container } = render(() => <NumberInput {...props} />);
      const remarkButton = container.querySelector('button.relative');

      expect(remarkButton).not.toBeInTheDocument();
    });

    it('should call openRemark when clicked', async () => {
      const openRemark = vi.fn();
      const props = {
        ...defaultProps,
        openRemark,
      };

      const { container } = render(() => <NumberInput {...props} />);
      const remarkButton = container.querySelector('button.relative') as HTMLButtonElement;

      await fireEvent.click(remarkButton);

      expect(openRemark).toHaveBeenCalledWith('age_field');
    });

    it('should show comment count when comments exist', () => {
      const props = {
        ...defaultProps,
        comments: 5,
      };

      const { getByText } = render(() => <NumberInput {...props} />);

      expect(getByText('5')).toBeInTheDocument();
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

      const { container } = render(() => <NumberInput {...props} />);
      const remarkButton = container.querySelector('button.relative') as HTMLButtonElement;

      expect(remarkButton.disabled).toBe(true);
    });
  });
});
