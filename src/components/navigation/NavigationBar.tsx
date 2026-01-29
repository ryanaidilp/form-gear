import { Component, Show } from 'solid-js';

export interface NavigationBarProps {
  activeLabel: string;
  hasPrevious: boolean;
  hasNext: boolean;
  hasErrors: boolean;
  canSubmit: boolean;
  isMobile: boolean;
  showScrollTop: boolean;
  formMode: number;
  onPrevious: (e: MouseEvent) => void;
  onNext: (e: MouseEvent) => void;
  onShowError: (e: MouseEvent) => void;
  onSubmit: (e: MouseEvent) => void;
  onScrollTop: (e: MouseEvent) => void;
  onSave?: (e: MouseEvent) => void;
}

/**
 * Unified navigation bar component for both mobile and desktop views.
 */
const NavigationBar: Component<NavigationBarProps> = (props) => {
  const isLastSection = () => !props.hasNext;
  const showErrorButton = () => isLastSection() && props.hasErrors;
  const showSubmitButton = () => isLastSection() && !props.hasErrors && props.formMode === 1;
  const showNextButton = () => props.hasNext;

  const buttonSize = props.isMobile ? 'h-8 w-8' : 'h-10 w-10';
  const iconSize = props.isMobile ? 'h-4 w-4' : 'h-5 w-5';
  const scrollButtonSize = props.isMobile ? 'h-10 w-10' : 'h-12 w-12';
  const scrollIconSize = props.isMobile ? 'h-6 w-6' : 'h-8 w-8';

  return (
    <div
      class="grid grid-cols-6 w-full justify-end items-end"
      classList={{
        'bottom-4 right-0 sticky': !props.isMobile,
        'pb-4 pt-2 bottom-0 mt-10 bg-gray-100/10 dark:bg-gray-900/70 backdrop-blur-md sticky':
          props.isMobile,
      }}
    >
      <div
        class="flex justify-center items-center py-2 rounded-full bg-gray-200/80 dark:bg-gray-800/90"
        classList={{
          'space-x-10 mx-10 col-start-2 col-end-6': !props.isMobile,
          'space-x-4 col-start-1 col-end-5 ml-4 mr-4': props.isMobile,
        }}
      >
        {/* Previous Button */}
        <button
          class={`bg-blue-700 text-white p-2 rounded-full focus:outline-none items-center hover:bg-blue-600 group inline-flex justify-center text-xs transition-all duration-300 ease-in-out overflow-hidden ${buttonSize}`}
          classList={{
            'opacity-100': props.hasPrevious,
            'opacity-0 w-0 p-0': !props.hasPrevious,
          }}
          onClick={props.onPrevious}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class={`${iconSize} shrink-0`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        {/* Active Section Label */}
        <div
          class="flex justify-center items-center text-center"
          classList={{ 'text-xs': props.isMobile }}
        >
          {props.activeLabel}
        </div>

        {/* Action Buttons Container */}
        <div class={`relative ${buttonSize}`}>
          {/* Error Button */}
          <button
            class="absolute inset-0 bg-red-200 text-red-500 rounded-full focus:outline-none flex justify-center items-center transition-all duration-300 ease-in-out"
            classList={{
              'opacity-100 scale-100': showErrorButton(),
              'opacity-0 scale-0 pointer-events-none': !showErrorButton(),
            }}
            onClick={props.onShowError}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class={iconSize}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          {/* Submit Button */}
          <button
            class="absolute inset-0 bg-teal-200 text-teal-500 rounded-full focus:outline-none flex justify-center items-center transition-all duration-300 ease-in-out"
            classList={{
              'opacity-100 scale-100': showSubmitButton(),
              'opacity-0 scale-0 pointer-events-none': !showSubmitButton(),
            }}
            onClick={props.onSubmit}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class={iconSize}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>

          {/* Next Button */}
          <button
            class="absolute inset-0 bg-blue-700 text-white p-2 rounded-full focus:outline-none hover:bg-blue-600 flex justify-center items-center transition-all duration-300 ease-in-out"
            classList={{
              'opacity-100 scale-100': showNextButton(),
              'opacity-0 scale-0 pointer-events-none': !showNextButton(),
            }}
            onClick={props.onNext}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class={iconSize}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Scroll to Top Button */}
      <div
        class="flex justify-end items-center transition-all duration-300 ease-in-out"
        classList={{
          'pr-8': !props.isMobile,
          'pr-2': props.isMobile,
          'opacity-100 translate-y-0': props.showScrollTop,
          'opacity-0 translate-y-4 pointer-events-none': !props.showScrollTop,
        }}
      >
        <button
          class={`scrolltotop-div bg-yellow-400 text-white p-2 rounded-full focus:outline-none items-center hover:bg-yellow-300 transition-transform hover:scale-110 ${scrollButtonSize}`}
          onClick={props.onScrollTop}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class={scrollIconSize}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Save Button */}
      <Show when={props.isMobile && props.onSave && props.formMode < 3}>
        <div class="flex justify-end items-center col-start-6 pr-5 transition">
          <button
            class="bg-teal-500 text-white p-2 rounded-full focus:outline-none items-center h-10 w-10 hover:bg-teal-400"
            onClick={props.onSave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>
      </Show>
    </div>
  );
};

export default NavigationBar;
