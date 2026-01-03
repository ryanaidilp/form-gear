import { Component, For, Show, JSX } from 'solid-js';
import { closeModalWithAnimation } from '../../utils';

export interface ListItem {
  label: string;
  message?: string[];
  sideIndex: number[];
  dataKey: string;
}

export interface ListModalProps {
  show: boolean;
  setShow: (show: boolean) => void;
  modalClass: string;
  title: string;
  icon: JSX.Element;
  iconBgClass: string;
  items: ListItem[];
  totalItems: number;
  currentPage: number;
  maxPage: number;
  onPageChange: (page: number) => void;
  onItemClick: (e: MouseEvent, sideIndex: number[], dataKey: string) => void;
  showMessages?: boolean;
  messageColumnTitle?: string;
}

const PAGE_SIZE = 3;

const ListModal: Component<ListModalProps> = (props) => {
  const handleClose = () => {
    closeModalWithAnimation(props.modalClass, props.setShow);
  };

  const getRowNumber = (index: number) => index + 1 + (props.currentPage * PAGE_SIZE - PAGE_SIZE);
  const total = () => props.totalItems || 0;
  const getStartItem = () => total() > 0 ? (props.currentPage - 1) * PAGE_SIZE + 1 : 0;
  const getEndItem = () => total() > 0 ? Math.min(props.currentPage * PAGE_SIZE, total()) : 0;

  return (
    <Show when={props.show}>
      <div
        class={`${props.modalClass} fixed z-10 inset-0 overflow-y-auto`}
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

          <div class="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6">
              <div class="sm:flex sm:items-start mt-6">
                <div
                  class={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${props.iconBgClass}`}
                >
                  {props.icon}
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    {props.title}
                    <span class="text-sm font-normal text-gray-500 ml-2">
                      ({getStartItem()}-{getEndItem()} of {props.totalItems})
                    </span>
                  </h3>
                  <div class="relative overflow-auto">
                    <div class="shadow-sm overflow-auto my-6">
                      <table class="border-collapse table-fixed w-full text-sm">
                        <thead class="text-sm font-semibold text-gray-600 bg-gray-50">
                          <tr>
                            <th class="p-2 whitespace-nowrap font-semibold text-left w-1/12">No</th>
                            <th class={`p-2 whitespace-nowrap font-semibold text-left ${props.showMessages ? 'w-4/12' : 'w-5/12'}`}>
                              Field
                            </th>
                            <Show when={props.showMessages}>
                              <th class="p-2 whitespace-nowrap font-semibold text-left w-5/12">
                                {props.messageColumnTitle || 'Messages'}
                              </th>
                            </Show>
                            <th class={`p-2 whitespace-nowrap font-semibold text-left ${props.showMessages ? 'w-2/12' : 'w-1/12'}`} />
                          </tr>
                        </thead>
                        <tbody class="text-sm divide-y divide-gray-100">
                          <For each={props.items}>
                            {(item, index) => (
                              <tr class="text-gray-600">
                                <td class="border-b border-slate-100 p-2 align-top">
                                  <div class="text-left text-sm font-light">
                                    &nbsp;&nbsp;{getRowNumber(index())}
                                  </div>
                                </td>
                                <td class="border-b border-slate-100 p-2 align-top">
                                  <div class="text-left text-sm font-light" innerHTML={item.label} />
                                </td>
                                <Show when={props.showMessages && item.message}>
                                  <td class="border-b border-slate-100 align-top pb-2">
                                    <For each={item.message}>
                                      {(msg) => (
                                        <div class="grid grid-cols-12 text-sm font-light mt-1">
                                          <div class="col-span-1 flex justify-center items-start">-</div>
                                          <div class="col-span-11 text-justify mr-1">{msg}</div>
                                        </div>
                                      )}
                                    </For>
                                  </td>
                                </Show>
                                <td class="border-b border-slate-100 align-top p-2">
                                  <button
                                    class="bg-transparent text-gray-500 rounded-full focus:outline-none h-5 w-5 hover:bg-gray-400 hover:text-white flex justify-center items-center"
                                    onClick={(e) => props.onItemClick(e, item.sideIndex, item.dataKey)}
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      class="h-4 w-4"
                                      viewBox="0 0 20 20"
                                      fill="currentColor"
                                      stroke-width="2"
                                    >
                                      <path
                                        fill-rule="evenodd"
                                        d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z"
                                        clip-rule="evenodd"
                                      />
                                    </svg>
                                  </button>
                                </td>
                              </tr>
                            )}
                          </For>
                        </tbody>
                      </table>
                    </div>
                    <Pagination
                      currentPage={props.currentPage}
                      maxPage={props.maxPage}
                      onPageChange={props.onPageChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                onClick={handleClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </Show>
  );
};

const Pagination: Component<{
  currentPage: number;
  maxPage: number;
  onPageChange: (page: number) => void;
}> = (props) => {
  const isFirstPage = () => props.currentPage === 1;
  const isLastPage = () => props.currentPage >= props.maxPage;
  const hasMultiplePages = () => props.maxPage > 1;

  return (
    <Show when={hasMultiplePages()}>
      <div class="flex justify-center items-center gap-2 py-3 border-t border-gray-100">
        {/* Prev Button */}
        <button
          type="button"
          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
          onClick={() => props.onPageChange(props.currentPage - 1)}
          disabled={isFirstPage()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>

        {/* Page Indicator */}
        <div class="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 font-medium">
          <span class="text-gray-900">{props.currentPage}</span>
          <span class="text-gray-400">/</span>
          <span class="text-gray-500">{props.maxPage}</span>
        </div>

        {/* Next Button */}
        <button
          type="button"
          class="inline-flex items-center justify-center w-8 h-8 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
          onClick={() => props.onPageChange(props.currentPage + 1)}
          disabled={isLastPage()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </Show>
  );
};

export default ListModal;
