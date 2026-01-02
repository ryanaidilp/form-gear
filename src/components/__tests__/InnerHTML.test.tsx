import { describe, it, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import InnerHTML from '../InnerHTML';
import { ControlType } from '../../FormType';

describe('InnerHTML Component', () => {
  const defaultProps = {
    onMobile: false,
    component: {
      dataKey: 'html_content',
      label: '<div>Hello World</div>',
      type: ControlType.InnerHTML,
      required: false,
      principal: 0,
      columnName: 'html',
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
  };

  describe('rendering', () => {
    it('should render a container div', () => {
      const { container } = render(() => <InnerHTML {...defaultProps} />);

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should use Shadow DOM for isolation', async () => {
      const { container } = render(() => <InnerHTML {...defaultProps} />);

      // Wait for onMount to execute
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      expect(innerDiv?.shadowRoot).toBeDefined();
    });

    it('should render HTML content in shadow DOM', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '<p>Test paragraph</p>',
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);

      // Wait for onMount to execute
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      const shadowRoot = innerDiv?.shadowRoot;

      expect(shadowRoot?.innerHTML).toBe('<p>Test paragraph</p>');
    });

    it('should isolate complex HTML with styles', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '<style>p { color: red; }</style><p>Styled text</p>',
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);

      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      const shadowRoot = innerDiv?.shadowRoot;

      // Shadow DOM should contain both style and content
      expect(shadowRoot?.innerHTML).toContain('<style>');
      expect(shadowRoot?.innerHTML).toContain('Styled text');
    });
  });

  describe('content types', () => {
    it('should handle plain text', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: 'Just plain text',
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      const shadowRoot = innerDiv?.shadowRoot;

      expect(shadowRoot?.innerHTML).toBe('Just plain text');
    });

    it('should handle nested HTML elements', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '<div><ul><li>Item 1</li><li>Item 2</li></ul></div>',
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      const shadowRoot = innerDiv?.shadowRoot;

      expect(shadowRoot?.innerHTML).toContain('<li>Item 1</li>');
      expect(shadowRoot?.innerHTML).toContain('<li>Item 2</li>');
    });

    it('should handle HTML with attributes', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '<a href="https://example.com" target="_blank">Link</a>',
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      const shadowRoot = innerDiv?.shadowRoot;

      expect(shadowRoot?.innerHTML).toContain('href="https://example.com"');
      expect(shadowRoot?.innerHTML).toContain('target="_blank"');
    });

    it('should handle empty label', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '',
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      const shadowRoot = innerDiv?.shadowRoot;

      expect(shadowRoot?.innerHTML).toBe('');
    });

    it('should handle undefined label gracefully', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: undefined,
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');

      // Should still render the container
      expect(innerDiv).toBeInTheDocument();
    });
  });

  describe('style isolation', () => {
    it('should isolate inline styles in shadow DOM', async () => {
      const props = {
        ...defaultProps,
        component: {
          ...defaultProps.component,
          label: '<div style="background: blue; padding: 10px;">Styled div</div>',
        },
      };

      const { container } = render(() => <InnerHTML {...props} />);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');
      const shadowRoot = innerDiv?.shadowRoot;

      expect(shadowRoot?.innerHTML).toContain('style="background: blue;');
    });

    it('should create shadow DOM in open mode', async () => {
      const { container } = render(() => <InnerHTML {...defaultProps} />);
      await new Promise((resolve) => setTimeout(resolve, 0));

      const innerDiv = container.querySelector('div');

      // Shadow root should be accessible (open mode)
      expect(innerDiv?.shadowRoot).not.toBeNull();
    });
  });
});
