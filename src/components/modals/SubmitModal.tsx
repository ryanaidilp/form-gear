import { Component, Show } from 'solid-js';
import { closeModalWithAnimation } from '../../utils';

export interface SubmitModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  captcha: string;
  onRefreshCaptcha: () => void;
  onCaptchaChange: (value: string) => void;
  onSubmit: (e: MouseEvent) => void;
}

const SubmitModal: Component<SubmitModalProps> = (props) => {
  const handleClose = () => {
    closeModalWithAnimation('modal-confirmation', props.setShow);
  };

  return (
    <Show when={props.show}>
      <div
        class="modal-confirmation fixed z-10 inset-0 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div
            class="fixed inset-0 bg-gray-500/75 transition-opacity"
            aria-hidden="true"
            onClick={handleClose}
          />

          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          <div class="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-teal-200 sm:mx-0 sm:h-10 sm:w-10 text-teal-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-5 w-5"
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
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 class="text-lg leading-6 font-medium text-gray-900" id="titleModalDelete">
                    Confirmation submission
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500" id="contentModalDelete">
                      Thank you for completing the survey. Please provide this final verification to
                      complete the submission!
                    </p>
                  </div>

                  <div class="mt-4 flex space-y-2 space-x-2 items-center justify-center md:items-end md:justify-start">
                    <span class="rounded-lg text-3xl italic font-mono cursor-not-allowed text-slate-600 p-2 bg-gradient-to-r from-teal-500 to-teal-50 text-justify line-through pointer-events-none select-none">
                      {props.captcha}
                    </span>
                    <button
                      class="bg-transparent text-gray-300 rounded-full focus:outline-none h-5 w-5 flex justify-center items-center"
                      onClick={props.onRefreshCaptcha}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                  </div>

                  <div class="mt-4 flex space-y-2 space-x-2 items-center justify-center">
                    <input
                      type="number"
                      class="w-full rounded font-light px-4 py-2.5 text-sm text-gray-700 border border-solid border-gray-300 bg-white bg-clip-padding transition ease-in-out m-0 focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"
                      placeholder=""
                      onChange={(e) => props.onCaptchaChange(e.currentTarget.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-teal-600 text-base font-medium text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={props.onSubmit}
              >
                Submit
              </button>
              <button
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

export default SubmitModal;
