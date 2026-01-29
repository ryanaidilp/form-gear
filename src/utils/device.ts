/**
 * Device Detection Utilities
 *
 * Provides consistent mobile/device detection across the application.
 * Centralizes the mobile detection regex that was previously duplicated 12+ times.
 */

const MOBILE_USER_AGENT_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

/**
 * Checks if the current device is a mobile device based on user agent.
 */
export const isMobileDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);
};

/**
 * Checks if the current viewport is mobile-sized (< 768px).
 */
export const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Checks if either mobile device or small viewport.
 * Useful for responsive behavior that should apply to both.
 */
export const isMobileOrSmallScreen = (): boolean => {
  return isMobileDevice() || isMobileViewport();
};

/**
 * Checks if touch events are supported.
 */
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};
