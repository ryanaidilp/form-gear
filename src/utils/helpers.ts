/**
 * FormGear Utility Functions
 *
 * Pure utility functions that don't depend on stores or services.
 * Extracted from GlobalFunction.tsx during the refactoring.
 */

/**
 * Scroll an element to the center of its container.
 * Used for focusing inputs in PAPI mode.
 *
 * @param elem - The element to scroll to
 * @param container - Optional container element (defaults to component-div)
 */
export const scrollCenterInput = (
  elem: HTMLElement,
  container?: HTMLElement | null
): void => {
  if (container == null) {
    if (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    ) {
      container = document.querySelector('.mobile-component-div');
    } else {
      container = document.querySelector('.component-div');
    }
  }

  if (!container) return;

  const center = container.clientHeight / 2;
  const top = elem.offsetTop;

  const middle = container.clientWidth / 2;
  const left = elem.offsetLeft;

  if (left > middle || top > center) {
    container.scrollTo({
      top: top - center,
      left: left - middle,
      behavior: 'smooth',
    });
  }
};

/**
 * Find combination of numbers from a list that sum to a target number.
 * Used for checkbox bit-masking calculations.
 *
 * @param number - Target sum
 * @param listNumbers - Available numbers to combine
 * @returns Array of numbers that sum to target, or empty if not possible
 */
export const findSumCombination = (
  number: number,
  listNumbers: number[]
): number[] => {
  let sumCombination: number[] = [];
  const sortedNumbers = [...listNumbers].sort((a, b) => b - a);

  if (listNumbers.includes(number)) {
    sumCombination.push(number);
  } else {
    let remaining = number;
    for (let i = 0; i < sortedNumbers.length; i++) {
      if (sortedNumbers[i] <= remaining) {
        sumCombination.push(sortedNumbers[i]);
        remaining -= sortedNumbers[i];
      }
    }
    if (remaining !== 0) {
      sumCombination = [];
    }
  }
  return sumCombination;
};

/**
 * Sum an array of numbers.
 *
 * @param arr - Array of numbers
 * @returns Sum of all numbers
 */
export const sum = (arr: (number | string)[]): number => {
  return arr.reduce((total: number, it) => total + Number(it), 0);
};

/**
 * Transform checkbox options by adding power-of-2 values.
 * Used for checkbox bit-masking.
 *
 * @param options - Array of options
 * @returns Options with checkboxValue added
 */
export const transformCheckboxOptions = <T extends Record<string, unknown>>(
  options: T[]
): (T & { checkboxValue: number })[] => {
  return options.map((option, index) => ({
    ...option,
    checkboxValue: Math.pow(2, index),
  }));
};
