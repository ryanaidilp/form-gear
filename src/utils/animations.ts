/**
 * Animation Utilities
 *
 * Provides consistent animation helpers for modals and UI transitions.
 */

/** Default animation duration in milliseconds */
const DEFAULT_ANIMATION_DURATION = 200;

/**
 * Closes a modal with a closing animation.
 *
 * @param modalClass - CSS class of the modal (without the leading dot)
 * @param setShowFn - State setter function to hide the modal
 * @param duration - Animation duration in milliseconds (default: 200)
 */
export const closeModalWithAnimation = (
  modalClass: string,
  setShowFn: (visible: boolean) => void,
  duration: number = DEFAULT_ANIMATION_DURATION
): void => {
  // Handle multiple classes by converting "class1 class2" to ".class1.class2"
  const selector = modalClass
    .split(' ')
    .filter(Boolean)
    .map((c) => `.${c}`)
    .join('');
  const modal = document.querySelector(selector);

  if (modal) {
    modal.classList.add('closing');
    setTimeout(() => {
      setShowFn(false);
      modal.classList.remove('closing');
    }, duration);
  } else {
    setShowFn(false);
  }
};

/**
 * Closes multiple modals with animation.
 * Useful when switching context and need to close all open modals.
 *
 * @param modals - Array of modal class names to close
 * @param duration - Animation duration in milliseconds
 */
export const closeAllModalsWithAnimation = (
  modals: Array<{ className: string; setShowFn: (visible: boolean) => void }>,
  duration: number = DEFAULT_ANIMATION_DURATION
): void => {
  // Helper to convert "class1 class2" to ".class1.class2"
  const toSelector = (className: string) =>
    className
      .split(' ')
      .filter(Boolean)
      .map((c) => `.${c}`)
      .join('');

  // Add closing class to all modals
  modals.forEach(({ className }) => {
    const modal = document.querySelector(toSelector(className));
    if (modal) {
      modal.classList.add('closing');
    }
  });

  // After animation, hide all modals
  setTimeout(() => {
    modals.forEach(({ className, setShowFn }) => {
      const modal = document.querySelector(toSelector(className));
      if (modal) {
        modal.classList.remove('closing');
      }
      setShowFn(false);
    });
  }, duration);
};

/**
 * Modal class constants for consistent usage.
 */
export const ModalClasses = {
  ERROR: 'modal-error',
  REMARK: 'modal-remark',
  BLANK: 'modal-blank',
  CONFIRMATION: 'modal-confirmation',
  LOADING: 'modal-loading',
  DELETE: 'modal-delete',
} as const;
