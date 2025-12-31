/**
 * Toast Notifications
 *
 * Provides toast notification utilities using Toastify.
 */

import Toastify from 'toastify-js';

// =============================================================================
// Types
// =============================================================================

/**
 * Toast notification options
 */
export interface ToastOptions {
  /** Message to display */
  message: string;
  /** Duration in milliseconds (default: 3000) */
  duration?: number;
  /** CSS class for styling (default: 'bg-blue-600/80') */
  className?: string;
  /** Additional text content */
  text?: string;
  /** Position: 'left', 'center', 'right' (default: 'right') */
  position?: 'left' | 'center' | 'right';
  /** Gravity: 'top', 'bottom' (default: 'bottom') */
  gravity?: 'top' | 'bottom';
  /** Whether to close on click (default: true) */
  closeOnClick?: boolean;
  /** Custom styles */
  style?: Record<string, string>;
}

/**
 * Toast type presets
 */
export type ToastType = 'info' | 'success' | 'warning' | 'error';

// =============================================================================
// Toast Presets
// =============================================================================

const TOAST_PRESETS: Record<ToastType, Partial<ToastOptions>> = {
  info: {
    className: 'bg-blue-600/80',
    duration: 3000,
    style: { background: 'rgba(37, 99, 235, 0.8)' }, // blue-600/80
  },
  success: {
    className: 'bg-green-600/80',
    duration: 3000,
    style: { background: 'rgba(22, 163, 74, 0.8)' }, // green-600/80
  },
  warning: {
    className: 'bg-yellow-600/80',
    duration: 4000,
    style: { background: 'rgba(202, 138, 4, 0.8)' }, // yellow-600/80
  },
  error: {
    className: 'bg-pink-600/80',
    duration: 5000,
    style: { background: 'rgba(219, 39, 119, 0.8)' }, // pink-600/80
  },
};

// =============================================================================
// Toast Functions
// =============================================================================

/**
 * Shows a toast notification.
 *
 * @param options - Toast options
 *
 * @example
 * ```typescript
 * showToast({
 *   message: 'Saved successfully!',
 *   className: 'bg-green-600/80',
 *   duration: 3000,
 * });
 * ```
 */
export function showToast(options: ToastOptions): void {
  const {
    message,
    duration = 3000,
    className = 'bg-blue-600/80',
    text = '',
    position = 'right',
    gravity = 'bottom',
    closeOnClick = true,
    style,
  } = options;

  Toastify({
    text: message + text,
    duration,
    gravity,
    position,
    close: closeOnClick,
    className,
    style: {
      ...style,
    },
  }).showToast();
}

/**
 * Shows an info toast (blue).
 *
 * @param message - Message to display
 * @param duration - Duration in milliseconds (default: 3000)
 * @param text - Additional text content
 * @param className - Override CSS class
 *
 * @example
 * ```typescript
 * toastInfo('Processing your request...');
 * ```
 */
export function toastInfo(
  message: string,
  duration = 3000,
  text = '',
  className = 'bg-blue-600/80'
): void {
  showToast({
    message,
    duration,
    text,
    className,
    ...TOAST_PRESETS.info,
  });
}

/**
 * Shows a success toast (green).
 *
 * @param message - Message to display
 * @param duration - Duration in milliseconds (default: 3000)
 *
 * @example
 * ```typescript
 * toastSuccess('Component added successfully!');
 * ```
 */
export function toastSuccess(message: string, duration = 3000): void {
  showToast({
    message,
    duration,
    ...TOAST_PRESETS.success,
  });
}

/**
 * Shows a warning toast (yellow).
 *
 * @param message - Message to display
 * @param duration - Duration in milliseconds (default: 4000)
 *
 * @example
 * ```typescript
 * toastWarning('Please review before submitting');
 * ```
 */
export function toastWarning(message: string, duration = 4000): void {
  showToast({
    message,
    duration,
    ...TOAST_PRESETS.warning,
  });
}

/**
 * Shows an error toast (red/pink).
 *
 * @param message - Message to display
 * @param duration - Duration in milliseconds (default: 5000)
 *
 * @example
 * ```typescript
 * toastError('Failed to save data');
 * ```
 */
export function toastError(message: string, duration = 5000): void {
  showToast({
    message,
    duration,
    ...TOAST_PRESETS.error,
  });
}

/**
 * Shows a toast by type.
 *
 * @param type - Toast type ('info', 'success', 'warning', 'error')
 * @param message - Message to display
 * @param duration - Optional duration override
 *
 * @example
 * ```typescript
 * toast('success', 'File uploaded!');
 * toast('error', 'Upload failed');
 * ```
 */
export function toast(
  type: ToastType,
  message: string,
  duration?: number
): void {
  const preset = TOAST_PRESETS[type];
  showToast({
    message,
    duration: duration ?? preset.duration,
    ...preset,
  });
}
