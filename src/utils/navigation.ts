/**
 * Navigation Utilities
 *
 * Handles scroll behavior, component focusing, and navigation helpers.
 * Extracted from Form.tsx to centralize navigation logic.
 */

/** Default delay for DOM to update after section switch (ms) */
const DOM_UPDATE_DELAY = 300;

/** Default delay before switching active component (ms) */
const SECTION_SWITCH_DELAY = 250;

/**
 * Scroll configuration for smooth scrolling behavior.
 */
export interface ScrollConfig {
  behavior?: ScrollBehavior;
  block?: ScrollLogicalPosition;
  delay?: number;
}

const DEFAULT_SCROLL_CONFIG: ScrollConfig = {
  behavior: 'smooth',
  block: 'start',
  delay: DOM_UPDATE_DELAY,
};

/**
 * Gets the main scroll container element for the form.
 */
export const getScrollContainer = (): HTMLElement | null => {
  return document.querySelector('.component-div') as HTMLElement | null;
};

/**
 * Resets scroll position of the main container to top.
 */
export const resetScrollPosition = (): void => {
  const container = getScrollContainer();
  if (container) {
    container.scrollTop = 0;
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Scrolls to a specific component by its dataKey.
 *
 * @param dataKey - The data key of the component to scroll to
 * @param config - Optional scroll configuration
 */
export const scrollToComponent = (
  dataKey: string,
  config: ScrollConfig = {}
): void => {
  const { behavior, block, delay } = { ...DEFAULT_SCROLL_CONFIG, ...config };

  setTimeout(() => {
    const scrollViewElement = document.getElementById(`${dataKey}___scrollView`);
    if (scrollViewElement) {
      scrollViewElement.scrollIntoView({ behavior, block });
    }
  }, delay);
};

/**
 * Navigates to a component with optional section switch.
 * Handles the timing for section switching and scrolling.
 *
 * @param dataKey - The data key of the target component
 * @param setActiveComponent - Function to set the active component
 * @param componentData - Data for the new active component
 * @param onBeforeSwitch - Optional callback before switching (e.g., close modals)
 */
export const navigateToComponent = (
  dataKey: string,
  setActiveComponent: (data: ActiveComponentData) => void,
  componentData: ActiveComponentData,
  onBeforeSwitch?: () => void
): void => {
  // Execute any pre-switch actions (like closing modals)
  onBeforeSwitch?.();

  // Reset scroll position before switching section
  resetScrollPosition();

  // Switch section after a short delay
  setTimeout(() => {
    setActiveComponent(componentData);

    // Scroll to the component after DOM updates
    scrollToComponent(dataKey, { delay: DOM_UPDATE_DELAY });
  }, SECTION_SWITCH_DELAY);
};

/**
 * Data structure for active component.
 */
export interface ActiveComponentData {
  dataKey: string;
  label: string;
  index: number[];
  position: number;
}

/**
 * Finds the index of a sidebar item by its index array.
 *
 * @param sidebarDetails - Array of sidebar details
 * @param sidebarIndex - The index array to find
 */
export const findSidebarIndex = (
  sidebarDetails: SidebarDetailLike[],
  sidebarIndex: number[]
): number => {
  return sidebarDetails.findIndex(
    (obj) => obj.index.toString() === sidebarIndex.toString()
  );
};

/**
 * Minimal sidebar detail interface for navigation purposes.
 */
interface SidebarDetailLike {
  index: number[];
  dataKey: string;
  label: string;
  enable?: boolean;
}

/**
 * Gets enabled sections before a given position.
 */
export const getEnabledSectionsBefore = (
  sidebarDetails: SidebarDetailLike[],
  position: number
): SidebarDetailLike[] => {
  return sidebarDetails.filter((obj, i) => obj.enable && i < position);
};

/**
 * Gets enabled sections after a given position.
 */
export const getEnabledSectionsAfter = (
  sidebarDetails: SidebarDetailLike[],
  position: number
): SidebarDetailLike[] => {
  return sidebarDetails.filter((obj, i) => obj.enable && i > position);
};

/**
 * Checks if there are enabled sections before the current position.
 */
export const hasPreviousSection = (
  sidebarDetails: SidebarDetailLike[],
  position: number
): boolean => {
  return getEnabledSectionsBefore(sidebarDetails, position).length > 0;
};

/**
 * Checks if there are enabled sections after the current position.
 */
export const hasNextSection = (
  sidebarDetails: SidebarDetailLike[],
  position: number
): boolean => {
  return getEnabledSectionsAfter(sidebarDetails, position).length > 0;
};
